/**
 * Migration Script: Safely encrypts existing unencrypted database records using AES-256-GCM.
 *
 * ⚠️ WARNING: Take a complete database backup (e.g., mongodump) before running
 * this migration in production!
 *
 * Usage:
 *   node server/scripts/encryptExisting.js [--dry-run] [--collection=<name>]
 *
 * Flags:
 *   --dry-run              Inspects and counts records needing encryption without writing changes.
 *   --collection=<name>    Targets a specific collection (diaryentries, checkins, gratitudeentries,
 *                          storybooks, selfchecks, exams, smallwins, chatmessages, thoughtrecords, copingplans, or all).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { encryptText, decryptText, encryptArray, isEncrypted } = require('../utils/encrypt');

console.log('================================================================================');
console.log('⚠️  WARNING: Take a complete database backup (e.g. mongodump) before running');
console.log('    this migration in production!');
console.log('================================================================================');

async function runMigration(options = {}) {
  const isDryRun = options.dryRun !== undefined ? options.dryRun : process.argv.includes('--dry-run');
  const collectionArg = options.collection || process.argv.find(a => a.startsWith('--collection='));
  const targetCollection = (collectionArg ? (collectionArg.includes('=') ? collectionArg.split('=')[1] : collectionArg) : 'all').toLowerCase().trim();

  const shouldProcess = (name) => targetCollection === 'all' || targetCollection === name;

  const results = {};
  const db = options.db || mongoose.connection.db;

  if (isDryRun) {
    console.log('🔍 Running in DRY-RUN mode. No database records will be modified.');
  }

  // 1. Diary Entries (content & media captions)
  if (shouldProcess('diaryentries')) {
    const col = db.collection('diaryentries');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      if (doc.content && typeof doc.content === 'string' && !isEncrypted(doc.content)) {
        updates.content = encryptText(doc.content);
      }

      if (Array.isArray(doc.media)) {
        let changed = false;
        const updatedMedia = doc.media.map(m => {
          if (m && m.caption && typeof m.caption === 'string' && !isEncrypted(m.caption)) {
            changed = true;
            return { ...m, caption: encryptText(m.caption) };
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

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.diaryentries = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} diary entries.`);
  }

  // 2. Check-Ins (note)
  if (shouldProcess('checkins')) {
    const col = db.collection('checkins');
    const cursor = col.find({
      note: { $exists: true, $ne: '', $not: { $regex: '^enc:(v1|v2):' } }
    });
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.note && typeof doc.note === 'string' && !isEncrypted(doc.note)) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { note: encryptText(doc.note) } }
          }
        });
      }
    }

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.checkins = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} check-in notes.`);
  }

  // 3. Gratitude Entries (items array)
  if (shouldProcess('gratitudeentries')) {
    const col = db.collection('gratitudeentries');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (Array.isArray(doc.items) && doc.items.some(it => typeof it === 'string' && !isEncrypted(it))) {
        count++;
        const encryptedItems = encryptArray(doc.items);
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { items: encryptedItems } }
          }
        });
      }
    }

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.gratitudeentries = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} gratitude entries.`);
  }

  // 4. Storybooks (generatedContent and chapter contents)
  if (shouldProcess('storybooks')) {
    const col = db.collection('storybooks');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      if (doc.generatedContent && typeof doc.generatedContent === 'string' && !isEncrypted(doc.generatedContent)) {
        updates.generatedContent = encryptText(doc.generatedContent);
      }

      if (Array.isArray(doc.chapters)) {
        let changed = false;
        const updatedChapters = doc.chapters.map(ch => {
          if (ch && ch.content && typeof ch.content === 'string' && !isEncrypted(ch.content)) {
            changed = true;
            return { ...ch, content: encryptText(ch.content) };
          }
          return ch;
        });
        if (changed) updates.chapters = updatedChapters;
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

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.storybooks = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} storybooks.`);
  }

  // 5. Self-Checks (answers stored as encrypted JSON string)
  if (shouldProcess('selfchecks')) {
    const col = db.collection('selfchecks');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      let needsUpdate = false;
      let encryptedValue;

      if (Array.isArray(doc.answers)) {
        needsUpdate = true;
        const plainAnswers = doc.answers.map(a => {
          if (isEncrypted(a)) {
            try {
              const d = decryptText(a);
              const n = Number(d);
              return isNaN(n) ? d : n;
            } catch {
              return a;
            }
          }
          const n = Number(a);
          return isNaN(n) ? a : n;
        });
        encryptedValue = encryptText(JSON.stringify(plainAnswers));
      } else if (typeof doc.answers === 'string' && !isEncrypted(doc.answers)) {
        needsUpdate = true;
        try {
          const parsed = JSON.parse(doc.answers);
          encryptedValue = encryptText(JSON.stringify(parsed));
        } catch {
          encryptedValue = encryptText(doc.answers);
        }
      }

      if (needsUpdate) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { answers: encryptedValue } }
          }
        });
      }
    }

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.selfchecks = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} self-checks.`);
  }

  // 6. Exams (notes)
  if (shouldProcess('exams')) {
    const col = db.collection('exams');
    const cursor = col.find({
      notes: { $exists: true, $ne: '', $not: { $regex: '^enc:(v1|v2):' } }
    });
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.notes && typeof doc.notes === 'string' && !isEncrypted(doc.notes)) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { notes: encryptText(doc.notes) } }
          }
        });
      }
    }

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.exams = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} exam notes.`);
  }

  // 7. Small Wins (tasks[].text)
  if (shouldProcess('smallwins')) {
    const col = db.collection('smallwins');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (Array.isArray(doc.tasks) && doc.tasks.some(t => t && t.text && !isEncrypted(t.text))) {
        count++;
        const updatedTasks = doc.tasks.map(t => ({
          ...t,
          text: t.text && !isEncrypted(t.text) ? encryptText(t.text) : t.text
        }));
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { tasks: updatedTasks } }
          }
        });
      }
    }

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.smallwins = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} small wins.`);
  }

  // 8. Chat Messages (content)
  if (shouldProcess('chatmessages')) {
    const col = db.collection('chatmessages');
    const cursor = col.find({
      content: { $exists: true, $ne: '', $not: { $regex: '^enc:(v1|v2):' } }
    });
    const bulkOps = [];
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.content && typeof doc.content === 'string' && !isEncrypted(doc.content)) {
        count++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { content: encryptText(doc.content) } }
          }
        });
      }
    }

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.chatmessages = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} chat messages.`);
  }

  // 9. Thought Records (situation, thought, evidenceFor, evidenceAgainst, balancedThought)
  if (shouldProcess('thoughtrecords')) {
    const col = db.collection('thoughtrecords');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;

    const fieldsToEncrypt = ['situation', 'thought', 'evidenceFor', 'evidenceAgainst', 'balancedThought'];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      for (const f of fieldsToEncrypt) {
        if (doc[f] && typeof doc[f] === 'string' && !isEncrypted(doc[f])) {
          updates[f] = encryptText(doc[f]);
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

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.thoughtrecords = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} thought records.`);
  }

  // 10. Coping Plans (warningSigns, copingStrategies, peopleToContact, safePlaces, reasonsToKeepGoing)
  if (shouldProcess('copingplans')) {
    const col = db.collection('copingplans');
    const cursor = col.find({});
    const bulkOps = [];
    let count = 0;
    const planFields = ['warningSigns', 'copingStrategies', 'peopleToContact', 'safePlaces', 'reasonsToKeepGoing'];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      for (const field of planFields) {
        const val = doc[field];
        if (Array.isArray(val)) {
          updates[field] = encryptText(JSON.stringify(val));
        } else if (typeof val === 'string' && !isEncrypted(val)) {
          try {
            const parsed = JSON.parse(val);
            updates[field] = encryptText(JSON.stringify(parsed));
          } catch {
            updates[field] = encryptText(JSON.stringify([val]));
          }
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

    if (!isDryRun && bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    results.copingplans = count;
    console.log(`${isDryRun ? '[DRY RUN] Would encrypt' : 'Encrypted'} ${count} coping plans.`);
  }

  console.log('--------------------------------------------------------------------------------');
  console.log(`Migration finished ${isDryRun ? '(DRY-RUN completed; no records modified)' : 'successfully'}.`);
  return results;
}

// Standalone CLI execution
if (require.main === module) {
  (async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/minddiary';
      console.log('Connecting to database...');
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB.');

      await runMigration();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { runMigration };
