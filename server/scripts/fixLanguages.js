/**
 * One-off script: Sets language to 'en' for users whose stored value is not 'en' or 'hi'.
 * Supports --dry-run. Logs only counts.
 *
 * Usage:
 *   node server/scripts/fixLanguages.js [--dry-run]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { User } = require('../config/models');

async function fixLanguages() {
  const isDryRun = process.argv.includes('--dry-run');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/minddiary';

  try {
    await mongoose.connect(mongoUri);

    const query = {
      $or: [
        { language: { $nin: ['en', 'hi'] } },
        { language: null },
        { language: { $exists: false } }
      ]
    };

    const count = await User.countDocuments(query);

    if (isDryRun) {
      console.log(`[DRY-RUN] Found ${count} user(s) with invalid language. No changes made.`);
    } else {
      const result = await User.updateMany(query, { $set: { language: 'en' } });
      console.log(`Updated ${result.modifiedCount} user(s) with invalid language to 'en'.`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  fixLanguages();
}

module.exports = { fixLanguages };
