/**
 * Migration Script: migrateDateKeys.js
 *
 * Re-derives and populates `dateKey` for existing CheckIn, HabitLog, and GratitudeEntry
 * records based on each user's configured IANA timezone without losing data.
 *
 * Usage:
 *   node server/scripts/migrateDateKeys.js            # Dry-run mode (default, changes nothing)
 *   node server/scripts/migrateDateKeys.js --dry-run  # Explicit dry-run
 *   node server/scripts/migrateDateKeys.js --apply    # Applies updates to database
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User, CheckIn, HabitLog, GratitudeEntry } = require('../config/models');
const { keyOf } = require('../utils/dates');

async function migrateDateKeys(options = {}) {
  const isApply = options.apply || process.argv.includes('--apply');
  const isDryRun = !isApply || process.argv.includes('--dry-run');

  console.log(`[migrateDateKeys] Starting migration in ${isDryRun ? 'DRY-RUN' : 'APPLY'} mode...`);

  // Cache user timezones
  const users = await User.find({}).select('_id timezone');
  const userTzMap = new Map();
  for (const u of users) {
    userTzMap.set(u._id.toString(), u.timezone || 'UTC');
  }

  const collections = [
    { model: CheckIn, name: 'CheckIn' },
    { model: HabitLog, name: 'HabitLog' },
    { model: GratitudeEntry, name: 'GratitudeEntry' }
  ];

  let totalUpdated = 0;
  let totalChecked = 0;

  for (const { model, name } of collections) {
    const records = await model.find({});
    console.log(`[migrateDateKeys] Scanning ${records.length} records in ${name}...`);

    for (const record of records) {
      totalChecked++;
      const userId = record.user ? record.user.toString() : null;
      const tz = (userId && userTzMap.get(userId)) || 'UTC';

      const targetDate = record.date || record.createdAt;
      if (!targetDate || isNaN(new Date(targetDate).getTime())) {
        continue;
      }

      const expectedKey = keyOf(targetDate, tz);

      if (record.dateKey !== expectedKey) {
        if (isDryRun) {
          console.log(`  [DRY-RUN] ${name} ${record._id}: dateKey '${record.dateKey || '(none)'}' -> '${expectedKey}' (tz: ${tz})`);
        } else {
          await model.updateOne({ _id: record._id }, { $set: { dateKey: expectedKey } });
          console.log(`  [APPLIED] ${name} ${record._id}: dateKey updated to '${expectedKey}' (tz: ${tz})`);
        }
        totalUpdated++;
      }
    }
  }

  console.log(`[migrateDateKeys] Completed. Total scanned: ${totalChecked}, Total ${isDryRun ? 'requiring update' : 'updated'}: ${totalUpdated}`);
  return { scanned: totalChecked, updated: totalUpdated, dryRun: isDryRun };
}

if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mydiary';
  mongoose.connect(mongoUri)
    .then(async () => {
      await migrateDateKeys();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[migrateDateKeys] Fatal error:', err);
      process.exit(1);
    });
}

module.exports = migrateDateKeys;
