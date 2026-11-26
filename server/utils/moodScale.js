/**
 * Single source of truth for daily mood ("day mood") calculation.
 * Day mood = { date: YYYY-MM-DD, score: 1-10, source: 'checkin' | 'entry', emotions: string[] }
 */

const { CheckIn, DiaryEntry } = require('../config/models');
const { startOfDay, endOfDay, keyOf } = require('./dates');

const MOOD_SCORE_MAP = {
  excited: 9,
  happy: 8,
  peaceful: 7,
  neutral: 5,
  anxious: 4,
  sad: 3,
  angry: 3
};

function entryMoodToScore(entry) {
  if (typeof entry?.moodScore === 'number' && entry.moodScore >= 1 && entry.moodScore <= 10) {
    return entry.moodScore;
  }
  const key = String(entry?.mood || '').trim().toLowerCase();
  return MOOD_SCORE_MAP[key] ?? 5;
}

/**
 * Computes unified daily moods from CheckIn and DiaryEntry records.
 * Rule per day: check-in score wins; otherwise average of that day's entry scores.
 */
function computeMoodDays({ checkIns = [], entries = [], tz = 'UTC' }) {
  const checkInByDate = new Map();
  for (const ci of checkIns) {
    const dateKey = ci.dateKey || (ci.date ? keyOf(ci.date, tz) : null);
    if (!dateKey || typeof ci.moodScore !== 'number') continue;
    checkInByDate.set(dateKey, ci);
  }

  const entriesByDate = new Map();
  for (const entry of entries) {
    const rawDate = entry.entryDate || entry.date;
    const dateKey = entry.dateKey || (rawDate ? keyOf(rawDate, tz) : null);
    if (!dateKey) continue;
    if (!entriesByDate.has(dateKey)) entriesByDate.set(dateKey, []);
    entriesByDate.get(dateKey).push(entry);
  }

  const allDates = Array.from(new Set([...checkInByDate.keys(), ...entriesByDate.keys()])).sort();

  return allDates.map((date) => {
    const ci = checkInByDate.get(date);
    if (ci) {
      return {
        date,
        score: ci.moodScore,
        source: 'checkin',
        emotions: Array.isArray(ci.emotions) ? ci.emotions : []
      };
    }

    const dayEntries = entriesByDate.get(date) || [];
    const scores = dayEntries.map(entryMoodToScore);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const rounded = Math.round(avg * 10) / 10;

    const emotionSet = new Set();
    for (const e of dayEntries) {
      if (Array.isArray(e.emotions)) {
        for (const em of e.emotions) {
          if (em) emotionSet.add(em);
        }
      }
      if (e.mood) emotionSet.add(e.mood);
    }

    return {
      date,
      score: rounded,
      source: 'entry',
      emotions: Array.from(emotionSet)
    };
  });
}

/**
 * Fetches CheckIn and DiaryEntry metadata (no encrypted content) for [fromKey, toKey]
 * in the user's timezone and returns unified day moods.
 */
async function getMoodDays({ userId, tz = 'UTC', fromKey, toKey }) {
  const start = startOfDay(fromKey, tz);
  const end = endOfDay(toKey, tz);

  const [checkIns, entries] = await Promise.all([
    CheckIn.find({
      user: userId,
      $or: [
        { dateKey: { $gte: fromKey, $lte: toKey } },
        { date: { $gte: start, $lte: end } }
      ]
    })
      .select('date dateKey moodScore emotions')
      .lean(),
    DiaryEntry.find({
      user: userId,
      $or: [
        { dateKey: { $gte: fromKey, $lte: toKey } },
        { entryDate: { $gte: start, $lte: end } }
      ]
    })
      .select('entryDate dateKey mood moodScore emotions')
      .lean()
  ]);

  return computeMoodDays({ checkIns, entries, tz }).filter(
    (d) => d.date >= fromKey && d.date <= toKey
  );
}

module.exports = {
  MOOD_SCORE_MAP,
  entryMoodToScore,
  computeMoodDays,
  getMoodDays
};
