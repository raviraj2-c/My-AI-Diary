/**
 * Key Rotation Script: Safely rotates encrypted database fields to a new key identifier (kid).
 * Supports re-encrypting from legacy `enc:v1:` and previous `enc:v2:<old_kid>:` to the active target key.
 *
 * Usage:
 *   node server/scripts/rotateKeys.js [--dry-run] [--target-kid=<kid>]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { encryptText, decryptText, isEncrypted } = require('../utils/encrypt');

async function runKeyRotation(options = {}) {
  const isDryRun = options.dryRun !== undefined ? options.dryRun : process.argv.includes('--dry-run');
  const targetKidArg = options.targetKid || process.argv.find(a => a.startsWith('--target-kid='));
  const targetKid = (targetKidArg ? (targetKidArg.includes('=') ? targetKidArg.split('=')[1] : targetKidArg) : (process.env.ENCRYPTION_KEY_ID || 'k1')).trim();

  const db = options.db || mongoose.connection.db;
  const results = {};

  const targetPrefix = `enc:v2:${targetKid}:`;

  function needsRotation(val) {
    if (!val || typeof val !== 'string') return false;
    // Needs rotation if it is encrypted with v1 or another kid
    return isEncrypted(val) && !val.startsWith(targetPrefix);
  }

  function rotateValue(val) {
    if (!needsRotation(val)) return val;
    const decrypted = decryptText(val);
    return encryptText(decrypted, targetKid);
  }

  // 1. Diary Entries
  {
    const col = db.collection('diaryentries');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      if (needsRotation(doc.content)) {
        updates.content = rotateValue(doc.content);
      }
      if (Array.isArray(doc.media)) {
        let changed = false;
        const updatedMedia = doc.media.map(m => {
          if (m && needsRotation(m.caption)) {
            changed = true;
            return { ...m, caption: rotateValue(m.caption) };
          }
          return m;
        });
        if (changed) updates.media = updatedMedia;
      }

      if (Object.keys(updates).length > 0) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: updates }
          }
        });
      }
    }

    if (bulkOps.length > 0 && !isDryRun) {
      await col.bulkWrite(bulkOps);
    }
    results.diaryentries = count;
  }

  // 2. Check-Ins
  {
    const col = db.collection('checkins');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (needsRotation(doc.note)) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { note: rotateValue(doc.note) } }
          }
        });
      }
    }

    if (bulkOps.length > 0 && !isDryRun) {
      await col.bulkWrite(bulkOps);
    }
    results.checkins = count;
  }

  // 3. Gratitude Entries
  {
    const col = db.collection('gratitudeentries');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (Array.isArray(doc.items)) {
        let changed = false;
        const updated = doc.items.map(item => {
          if (needsRotation(item)) {
            changed = true;
            return rotateValue(item);
          }
          return item;
        });
        if (changed) {
          count++;
          bulkOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { items: updated } }
            }
          });
        }
      }
    }

    if (bulkOps.length > 0 && !isDryRun) {
      await col.bulkWrite(bulkOps);
    }
    results.gratitudeentries = count;
  }

  // 4. Coping Plans
  {
    const col = db.collection('copingplans');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};
      const fields = ['warningSigns', 'copingStrategies', 'safePlaces', 'reasonsToKeepGoing', 'peopleToContact'];
      for (const f of fields) {
        if (needsRotation(doc[f])) {
          updates[f] = rotateValue(doc[f]);
        }
      }
      if (Object.keys(updates).length > 0) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: updates }
          }
        });
      }
    }

    if (bulkOps.length > 0 && !isDryRun) {
      await col.bulkWrite(bulkOps);
    }
    results.copingplans = count;
  }

  return results;
}

if (require.main === module) {
  (async () => {
    try {
      if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI environment variable is required');
        process.exit(1);
      }
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB. Starting key rotation...');
      const results = await runKeyRotation();
      console.log('Key rotation complete:', results);
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Key rotation failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  runKeyRotation
};
