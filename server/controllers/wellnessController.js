const { User, CheckIn, HabitLog, GratitudeEntry, DiaryEntry, CalmSession, SelfCheck, CounselorReport, CopingPlan, FutureLetter } = require('../config/models');
const { computeWellnessInsights, toDayKey } = require('../utils/insights');
const { getMoodDays } = require('../utils/moodScale');
const { checkRisk } = require('../utils/riskCheck');
const { stripAllTags } = require('../utils/sanitize');
const {
  startOfDay,
  endOfDay,
  dayRange,
  todayKey,
  keyOf,
  getPreviousDateKey,
  resolveTimezone
} = require('../utils/dates');
const crypto = require('crypto');

/**
 * Normalizes any date to UTC day start (midnight)
 */
function getUtcDayStart(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ==================== CHECK-INS ====================

const saveCheckIn = async (req, res, next) => {
  try {
    const {
      moodScore,
      emotions,
      sleepHours,
      energy,
      stress,
      anxiety,
      tags,
      note,
      date,
      dateKey: passedDateKey
    } = req.body;

    const parsedScore = Number(moodScore);
    if (!parsedScore || parsedScore < 1 || parsedScore > 10) {
      return res.status(400).json({
        success: false,
        message: 'Mood score must be a number between 1 and 10'
      });
    }

    if (typeof note === 'string' && [...note].length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Note cannot exceed 500 characters'
      });
    }

    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    let dateKey = passedDateKey;
    if (!dateKey || typeof dateKey !== 'string') {
      dateKey = date ? keyOf(date, tz) : todayKey(tz);
    }
    const { start: dayStart, end: dayEnd } = dayRange(dateKey, tz);

    const updateData = {
      user: req.user.id,
      dateKey,
      date: dayStart,
      moodScore: parsedScore,
      emotions: Array.isArray(emotions) ? emotions.map(String).slice(0, 10) : [],
      sleepHours: sleepHours != null ? Math.min(24, Math.max(0, Number(sleepHours))) : null,
      energy: energy != null ? Math.min(5, Math.max(1, Number(energy))) : null,
      stress: stress != null ? Math.min(5, Math.max(1, Number(stress))) : null,
      anxiety: anxiety != null ? Math.min(5, Math.max(1, Number(anxiety))) : null,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).slice(0, 15) : [],
      note: typeof note === 'string' ? note.slice(0, 500).trim() : ''
    };

    const checkIn = await CheckIn.findOneAndUpdate(
      {
        user: req.user.id,
        $or: [
          { dateKey },
          { date: { $gte: dayStart, $lte: dayEnd } }
        ]
      },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    const risk = checkRisk((typeof note === 'string' ? note : '') + ' ' + (Array.isArray(tags) ? tags.join(' ') : ''));

    res.status(200).json({
      success: true,
      message: 'Daily check-in saved safely',
      data: checkIn,
      safety: { level: risk.level }
    });
  } catch (error) {
    next(error);
  }
};

const getCheckIns = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 60 } = req.query;
    const query = { user: req.user.id };

    if (startDate || endDate) {
      const user = await User.findById(req.user.id).select('timezone');
      const tz = user?.timezone || 'UTC';
      query.date = {};
      if (startDate) query.date.$gte = startOfDay(startDate, tz);
      if (endDate) query.date.$lte = endOfDay(endDate, tz);
    }

    const checkIns = await CheckIn.find(query)
      .sort({ date: -1 })
      .limit(Math.min(100, Number(limit)));

    res.json({
      success: true,
      data: checkIns
    });
  } catch (error) {
    next(error);
  }
};

const getTodayCheckIn = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const today = todayKey(tz);
    const { start, end } = dayRange(today, tz);

    const checkIn = await CheckIn.findOne({
      user: req.user.id,
      $or: [
        { dateKey: today },
        { date: { $gte: start, $lte: end } }
      ]
    });

    res.json({
      success: true,
      data: checkIn || null
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HABITS ====================

const saveHabitLog = async (req, res, next) => {
  try {
    const {
      sleepHours,
      sleepQuality,
      waterGlasses,
      exerciseMinutes,
      screenTimeHours,
      medicationTaken,
      steps,
      date,
      dateKey: passedDateKey
    } = req.body;

    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    let dateKey = passedDateKey;
    if (!dateKey || typeof dateKey !== 'string') {
      dateKey = date ? keyOf(date, tz) : todayKey(tz);
    }
    const { start: dayStart, end: dayEnd } = dayRange(dateKey, tz);

    const updateData = {
      user: req.user.id,
      dateKey,
      date: dayStart,
      sleepHours: sleepHours != null ? Math.min(24, Math.max(0, Number(sleepHours))) : null,
      sleepQuality: sleepQuality != null ? Math.min(5, Math.max(1, Number(sleepQuality))) : null,
      waterGlasses: waterGlasses != null ? Math.max(0, Number(waterGlasses)) : 0,
      exerciseMinutes: exerciseMinutes != null ? Math.max(0, Number(exerciseMinutes)) : 0,
      screenTimeHours: screenTimeHours != null ? Math.min(24, Math.max(0, Number(screenTimeHours))) : 0,
      medicationTaken: typeof medicationTaken === 'boolean' ? medicationTaken : null,
      steps: steps != null ? Math.max(0, Number(steps)) : null
    };

    const habitLog = await HabitLog.findOneAndUpdate(
      {
        user: req.user.id,
        $or: [
          { dateKey },
          { date: { $gte: dayStart, $lte: dayEnd } }
        ]
      },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Habit log updated',
      data: habitLog
    });
  } catch (error) {
    next(error);
  }
};

const getHabits = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 60 } = req.query;
    const query = { user: req.user.id };

    if (startDate || endDate) {
      const user = await User.findById(req.user.id).select('timezone');
      const tz = user?.timezone || 'UTC';
      query.date = {};
      if (startDate) query.date.$gte = startOfDay(startDate, tz);
      if (endDate) query.date.$lte = endOfDay(endDate, tz);
    }

    const habits = await HabitLog.find(query)
      .sort({ date: -1 })
      .limit(Math.min(100, Number(limit)));

    res.json({
      success: true,
      data: habits
    });
  } catch (error) {
    next(error);
  }
};

const getTodayHabit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const today = todayKey(tz);
    const { start, end } = dayRange(today, tz);

    const habit = await HabitLog.findOne({
      user: req.user.id,
      $or: [
        { dateKey: today },
        { date: { $gte: start, $lte: end } }
      ]
    });

    res.json({
      success: true,
      data: habit || null
    });
  } catch (error) {
    next(error);
  }
};

// ==================== GRATITUDE ====================

const saveGratitude = async (req, res, next) => {
  try {
    const { items, date, dateKey: passedDateKey } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one gratitude item'
      });
    }

    for (const item of items) {
      if (typeof item === 'string' && [...item].length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Gratitude items cannot exceed 200 characters'
        });
      }
    }

    const cleanedItems = items
      .map((i) => (typeof i === 'string' ? i.trim().slice(0, 200) : ''))
      .filter(Boolean)
      .slice(0, 3); // Max 3 items per day

    if (cleanedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items cannot be empty'
      });
    }

    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    let dateKey = passedDateKey;
    if (!dateKey || typeof dateKey !== 'string') {
      dateKey = date ? keyOf(date, tz) : todayKey(tz);
    }
    const { start: dayStart } = dayRange(dateKey, tz);

    const entry = await GratitudeEntry.create({
      user: req.user.id,
      dateKey,
      date: dayStart,
      items: cleanedItems
    });

    res.status(201).json({
      success: true,
      message: 'Gratitude moments recorded',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

const getGratitudeEntries = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const entries = await GratitudeEntry.find({ user: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.min(100, Number(limit)));

    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    next(error);
  }
};

const getRandomGratitude = async (req, res, next) => {
  try {
    const entries = await GratitudeEntry.find({ user: req.user.id });
    if (!entries || entries.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const allItems = [];
    entries.forEach((e) => {
      (e.items || []).forEach((item) => {
        if (item) allItems.push({ item, date: e.date });
      });
    });

    if (allItems.length === 0) {
      return res.json({ success: true, data: null });
    }

    const randomIndex = Math.floor(Math.random() * allItems.length);
    res.json({
      success: true,
      data: allItems[randomIndex]
    });
  } catch (error) {
    next(error);
  }
};

const deleteGratitude = async (req, res, next) => {
  try {
    const entry = await GratitudeEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Gratitude entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Gratitude entry removed'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== FAVORITES & HAPPY BOX ====================

const toggleFavorite = async (req, res, next) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    entry.isFavorite = !entry.isFavorite;
    await entry.save();

    res.json({
      success: true,
      message: entry.isFavorite ? 'Saved to Favorites' : 'Removed from Favorites',
      isFavorite: entry.isFavorite
    });
  } catch (error) {
    next(error);
  }
};

const togglePin = async (req, res, next) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    entry.isPinned = !entry.isPinned;
    await entry.save();

    res.json({
      success: true,
      message: entry.isPinned ? 'Entry pinned to top' : 'Entry unpinned',
      isPinned: entry.isPinned
    });
  } catch (error) {
    next(error);
  }
};

const getHappyBox = async (req, res, next) => {
  try {
    // 1. Favorites first (up to 20)
    const favoriteEntries = await DiaryEntry.find({
      user: req.user.id,
      isFavorite: true
    })
      .sort({ entryDate: -1 })
      .limit(20);

    const favoriteIds = favoriteEntries.map(e => e._id);
    const remainingCount = 20 - favoriteEntries.length;

    let additionalEntries = [];
    if (remainingCount > 0) {
      additionalEntries = await DiaryEntry.find({
        user: req.user.id,
        _id: { $nin: favoriteIds },
        $or: [
          { mood: { $in: ['happy', 'peaceful', 'excited'] } },
          { moodScore: { $gte: 8 } }
        ]
      })
        .sort({ entryDate: -1 })
        .limit(remainingCount);
    }
    const favorites = [...favoriteEntries, ...additionalEntries];

    // 2. Entries with media marked happy/memorable
    const mediaMemories = await DiaryEntry.find({
      user: req.user.id,
      'media.0': { $exists: true }
    })
      .sort({ entryDate: -1 })
      .limit(12);

    // 3. "On This Day" (same month & day in past years, in user timezone)
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    const today = todayKey(tz); // YYYY-MM-DD
    const [currentYearStr, currentMonthStr, currentDayStr] = today.split('-');
    const currentYear = parseInt(currentYearStr, 10);
    const currentMonth = parseInt(currentMonthStr, 10); // 1-based in MongoDB
    const currentDay = parseInt(currentDayStr, 10);

    const onThisDay = await DiaryEntry.find({
      user: req.user.id,
      $expr: {
        $and: [
          { $lt: [{ $year: { date: '$entryDate', timezone: tz } }, currentYear] },
          { $eq: [{ $month: { date: '$entryDate', timezone: tz } }, currentMonth] },
          { $eq: [{ $dayOfMonth: { date: '$entryDate', timezone: tz } }, currentDay] }
        ]
      }
    })
      .select('title content mood moodScore media entryDate createdAt')
      .sort({ entryDate: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        favorites,
        mediaMemories,
        onThisDay
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== INSIGHTS ====================

const getInsights = async (req, res, next) => {
  try {
    const { range = 'month' } = req.query;
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    const daysCount = range === 'week' ? 7 : range === '3months' ? 90 : 30;
    const toKey = todayKey(tz);
    const fromKey = getPreviousDateKey(toKey, daysCount - 1);
    const cutoffDate = startOfDay(fromKey, tz);

    const [checkIns, habits, entries, moodDays] = await Promise.all([
      CheckIn.find({ user: req.user.id, date: { $gte: cutoffDate } }),
      HabitLog.find({ user: req.user.id, date: { $gte: cutoffDate } }),
      DiaryEntry.find({ user: req.user.id, entryDate: { $gte: cutoffDate } }).select('entryDate dateKey mood moodScore emotions'),
      getMoodDays({ userId: req.user.id, tz, fromKey, toKey })
    ]);

    const insights = computeWellnessInsights(checkIns, habits, entries, moodDays, tz);

    res.json({
      success: true,
      range,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CALM SESSIONS & SELF-CHECKS ====================

const logCalmSession = async (req, res, next) => {
  try {
    const { type, durationMinutes, technique } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, message: 'Type is required' });
    }
    const session = await CalmSession.create({
      user: req.user.id,
      type,
      durationMinutes: Math.min(1440, Math.max(1, Math.round(Number(durationMinutes) || 1))),
      technique: technique || null,
      date: new Date()
    });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const saveSelfCheck = async (req, res, next) => {
  try {
    const { type, answers } = req.body;
    if (!type || !['PHQ-9', 'GAD-7'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Valid type (PHQ-9 or GAD-7) is required' });
    }

    const expectedCount = type === 'PHQ-9' ? 9 : 7;
    if (!Array.isArray(answers) || answers.length !== expectedCount) {
      return res.status(400).json({ success: false, message: `Answers array must contain exactly ${expectedCount} items` });
    }

    const parsedAnswers = [];
    for (let i = 0; i < answers.length; i++) {
      const a = Number(answers[i]);
      if (isNaN(a) || a < 0 || a > 3 || !Number.isInteger(a)) {
        return res.status(400).json({ success: false, message: 'Each answer must be an integer between 0 and 3' });
      }
      parsedAnswers.push(a);
    }

    const score = parsedAnswers.reduce((sum, val) => sum + val, 0);

    let severity = 'minimal';
    if (type === 'PHQ-9') {
      if (score <= 4) severity = 'minimal';
      else if (score <= 9) severity = 'mild';
      else if (score <= 14) severity = 'moderate';
      else if (score <= 19) severity = 'moderately_severe';
      else severity = 'severe';
    } else {
      if (score <= 4) severity = 'minimal';
      else if (score <= 9) severity = 'mild';
      else if (score <= 14) severity = 'moderate';
      else severity = 'severe';
    }

    const incomingSeverity = typeof req.body.severity === 'string' ? req.body.severity.trim() : '';
    if (incomingSeverity && incomingSeverity.toLowerCase() === severity.toLowerCase()) {
      severity = incomingSeverity;
    }

    let riskLevel = 'none';
    if (type === 'PHQ-9' && parsedAnswers[8] > 0) {
      riskLevel = 'high';
    }

    const record = await SelfCheck.create({
      user: req.user.id,
      type,
      score,
      severity,
      answers: parsedAnswers,
      date: new Date()
    });

    res.status(201).json({
      success: true,
      data: record,
      safety: { level: riskLevel }
    });
  } catch (error) {
    next(error);
  }
};

const getSelfChecks = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { user: req.user.id };
    if (type) query.type = type;
    const records = await SelfCheck.find(query).sort({ date: -1 }).limit(50);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// ==================== COUNSELOR SUMMARY SHARING (7-DAY EXPIRING) ====================

const createCounselorReportShare = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { range = 'month', includeName = false } = req.body;

    const days = range === 'week' ? 7 : range === '3months' ? 90 : 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [checkIns, habits, selfChecks] = await Promise.all([
      CheckIn.find({ user: userId, date: { $gte: sinceDate } }),
      HabitLog.find({ user: userId, date: { $gte: sinceDate } }),
      SelfCheck.find({ user: userId, date: { $gte: sinceDate } }).sort({ date: -1 })
    ]);

    const insights = computeWellnessInsights(checkIns, habits, []);

    // Build strictly clinical & statistical summary (ONLY numbers/scores; NO diary text, titles, or tags)
    const summary = {
      generatedAt: new Date().toISOString(),
      range,
      userName: includeName && req.user.name ? req.user.name : undefined,
      totalCheckIns: checkIns.length,
      averageMood: insights.averageMood,
      bestDay: insights.bestDay,
      hardestDay: insights.hardestDay,
      moodPerDay: insights.moodPerDay,
      correlations: insights.correlations,
      recentScreenings: selfChecks.map(sc => ({
        type: sc.type,
        score: sc.score,
        severity: sc.severity,
        date: sc.date
      }))
    };

    // 32-byte cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await CounselorReport.create({
      user: userId,
      token: tokenHash, // Store only the SHA-256 hash
      summary,
      expiresAt,
      active: true
    });

    res.status(201).json({
      success: true,
      message: 'Counselor report created. Link expires in 7 days.',
      data: {
        token: rawToken,
        sharePath: `/shared/${rawToken}`,
        expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSharedCounselorReport = async (req, res, next) => {
  try {
    const rawToken = req.params.token || '';
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid share token' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const report = await CounselorReport.findOne({
      token: tokenHash,
      active: true,
      expiresAt: { $gt: new Date() }
    });

    if (!report || new Date(report.expiresAt) <= new Date()) {
      return res.status(404).json({
        success: false,
        message: 'This report link is invalid or has expired.'
      });
    }

    // Set privacy & crawler suppression headers
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Cache-Control', 'no-store');

    res.json({
      success: true,
      data: report.summary,
      expiresAt: report.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

const revokeCounselorReportShare = async (req, res, next) => {
  try {
    const rawToken = req.params.token || '';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const deleted = await CounselorReport.findOneAndDelete({
      token: tokenHash,
      user: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Share link not found or already revoked.' });
    }

    res.json({ success: true, message: 'Share link revoked.' });
  } catch (error) {
    next(error);
  }
};

// ==================== YEAR IN PIXELS ====================

const MOOD_TO_SCORE = {
  happy: 9,
  excited: 8,
  peaceful: 8,
  neutral: 5,
  anxious: 3,
  sad: 2,
  angry: 2
};

const getYearPixels = async (req, res, next) => {
  try {
    const rawYear = req.query.year;
    let year = rawYear ? parseInt(rawYear, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year. Year must be an integer between 2000 and 2100.'
      });
    }

    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    const startOfYear = startOfDay(`${year}-01-01`, tz);
    const endOfYear = endOfDay(`${year}-12-31`, tz);

    const [checkIns, diaryEntries] = await Promise.all([
      CheckIn.find({
        user: req.user.id,
        date: { $gte: startOfYear, $lte: endOfYear }
      }).sort({ date: 1 }),
      DiaryEntry.find({
        user: req.user.id,
        entryDate: { $gte: startOfYear, $lte: endOfYear }
      }).select('_id title mood entryDate').sort({ entryDate: 1 })
    ]);

    const pixels = {};

    // 1. Map Diary Entries by date key
    const entriesByDate = new Map();
    for (const entry of diaryEntries) {
      const key = keyOf(entry.entryDate, tz);
      if (!entriesByDate.has(key)) {
        entriesByDate.set(key, entry);
      }
    }

    // 2. Map Check-ins by date key
    const checkInsByDate = new Map();
    for (const ci of checkIns) {
      const key = ci.dateKey || keyOf(ci.date, tz);
      checkInsByDate.set(key, ci);
    }

    // 3. Fallback logic: CheckIn moodScore preferred; fallback to DiaryEntry mapped mood
    const allDates = new Set([...checkInsByDate.keys(), ...entriesByDate.keys()]);

    for (const dateKey of allDates) {
      const ci = checkInsByDate.get(dateKey);
      const entry = entriesByDate.get(dateKey);

      if (ci) {
        pixels[dateKey] = {
          score: ci.moodScore,
          source: 'checkin',
          mood: ci.emotions?.[0] || 'neutral',
          entryId: entry ? entry._id.toString() : null,
          title: entry ? entry.title : null
        };
      } else if (entry) {
        const mappedScore = MOOD_TO_SCORE[entry.mood] || 5;
        pixels[dateKey] = {
          score: mappedScore,
          source: 'diary',
          mood: entry.mood || 'neutral',
          entryId: entry._id.toString(),
          title: entry.title
        };
      }
    }

    res.json({
      success: true,
      data: {
        year,
        pixels,
        ...pixels
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== UNIFIED MOOD DAYS & HOME SUMMARY ====================

const getMoodDaysEndpoint = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const defaultTo = todayKey(tz);
    const defaultFrom = getPreviousDateKey(defaultTo, 29);

    const isValidKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && !Number.isNaN(Date.parse(`${k}T00:00:00Z`));
    if (req.query.from !== undefined && !isValidKey(req.query.from)) {
      return res.status(400).json({ success: false, message: 'Invalid from date (expected YYYY-MM-DD)' });
    }
    if (req.query.to !== undefined && !isValidKey(req.query.to)) {
      return res.status(400).json({ success: false, message: 'Invalid to date (expected YYYY-MM-DD)' });
    }

    const fromKey = isValidKey(req.query.from) ? req.query.from : defaultFrom;
    const toKey = isValidKey(req.query.to) ? req.query.to : defaultTo;

    if (fromKey > toKey) {
      return res.status(400).json({ success: false, message: 'from date must not be after to date' });
    }

    const moodDays = await getMoodDays({ userId: req.user.id, tz, fromKey, toKey });
    res.json({
      success: true,
      from: fromKey,
      to: toKey,
      data: moodDays
    });
  } catch (error) {
    next(error);
  }
};

const getHomeSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const today = todayKey(tz);
    const weekFrom = getPreviousDateKey(today, 6);

    const [weekMoodDays, todayCheckIn, lastEntryDoc, dueLetters, allCheckIns, allEntries] = await Promise.all([
      getMoodDays({ userId: req.user.id, tz, fromKey: weekFrom, toKey: today }),
      CheckIn.findOne({
        user: req.user.id,
        $or: [
          { dateKey: today },
          { date: { $gte: startOfDay(today, tz), $lte: endOfDay(today, tz) } }
        ]
      }).select('moodScore').lean(),
      DiaryEntry.findOne({ user: req.user.id })
        .sort({ entryDate: -1, createdAt: -1 })
        .select('_id title entryDate mood')
        .lean(),
      FutureLetter.countDocuments({
        user: req.user.id,
        deliverOn: { $lte: new Date() },
        openedAt: null
      }),
      CheckIn.find({ user: req.user.id }).select('date dateKey').lean(),
      DiaryEntry.find({ user: req.user.id }).select('entryDate dateKey').lean()
    ]);

    const moodMap = new Map(weekMoodDays.map((d) => [d.date, d]));
    const weekDays = [];
    for (let offset = 6; offset >= 0; offset--) {
      const date = getPreviousDateKey(today, offset);
      const found = moodMap.get(date);
      weekDays.push({ date, score: found ? found.score : null });
    }

    const activeDates = new Set();
    for (const ci of allCheckIns) {
      const k = ci.dateKey || (ci.date ? keyOf(ci.date, tz) : null);
      if (k) activeDates.add(k);
    }
    for (const e of allEntries) {
      const k = e.dateKey || (e.entryDate ? keyOf(e.entryDate, tz) : null);
      if (k) activeDates.add(k);
    }

    let streakDays = 0;
    let cursor = activeDates.has(today) ? today : getPreviousDateKey(today, 1);
    while (activeDates.has(cursor)) {
      streakDays += 1;
      cursor = getPreviousDateKey(cursor, 1);
    }

    const todayMood = moodMap.get(today) || null;
    res.json({
      success: true,
      data: {
        todayDone: Boolean(todayCheckIn),
        todayScore: todayMood ? todayMood.score : null,
        weekDays,
        streakDays,
        lastEntry: lastEntryDoc
          ? {
              id: lastEntryDoc._id.toString(),
              title: lastEntryDoc.title,
              date: lastEntryDoc.entryDate,
              mood: lastEntryDoc.mood
            }
          : null,
        dueLetters
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== COPING PLAN (SOS) ====================

const sanitizeArrayItems = (arr, maxItems = 10, maxLen = 200) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map(item => {
      if (typeof item === 'string') {
        return stripAllTags(item).trim().slice(0, maxLen);
      }
      if (item && typeof item === 'object') {
        const cleanObj = {};
        for (const [k, v] of Object.entries(item)) {
          cleanObj[k] = stripAllTags(String(v || '')).trim().slice(0, maxLen);
        }
        return cleanObj;
      }
      return '';
    })
    .filter(item => {
      if (typeof item === 'string') return item.length > 0;
      if (item && typeof item === 'object') return Object.values(item).some(v => v.length > 0);
      return false;
    });
};

const getCopingPlan = async (req, res, next) => {
  try {
    const plan = await CopingPlan.findOne({ user: req.user.id });
    if (!plan) {
      return res.json({
        success: true,
        data: {
          warningSigns: [],
          copingStrategies: [],
          peopleToContact: [],
          safePlaces: [],
          reasonsToKeepGoing: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: plan._id,
        warningSigns: plan.warningSigns || [],
        copingStrategies: plan.copingStrategies || [],
        peopleToContact: plan.peopleToContact || [],
        safePlaces: plan.safePlaces || [],
        reasonsToKeepGoing: plan.reasonsToKeepGoing || [],
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const saveCopingPlan = async (req, res, next) => {
  try {
    const {
      warningSigns,
      copingStrategies,
      peopleToContact,
      safePlaces,
      reasonsToKeepGoing
    } = req.body;

    let plan = await CopingPlan.findOne({ user: req.user.id });
    if (!plan) {
      plan = new CopingPlan({ user: req.user.id });
    }

    if (warningSigns !== undefined) plan.warningSigns = sanitizeArrayItems(warningSigns);
    if (copingStrategies !== undefined) plan.copingStrategies = sanitizeArrayItems(copingStrategies);
    if (peopleToContact !== undefined) plan.peopleToContact = sanitizeArrayItems(peopleToContact);
    if (safePlaces !== undefined) plan.safePlaces = sanitizeArrayItems(safePlaces);
    if (reasonsToKeepGoing !== undefined) plan.reasonsToKeepGoing = sanitizeArrayItems(reasonsToKeepGoing);

    await plan.save();

    res.json({
      success: true,
      message: 'Coping plan saved.',
      data: {
        id: plan._id,
        warningSigns: plan.warningSigns,
        copingStrategies: plan.copingStrategies,
        peopleToContact: plan.peopleToContact,
        safePlaces: plan.safePlaces,
        reasonsToKeepGoing: plan.reasonsToKeepGoing,
        updatedAt: plan.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveCheckIn,
  getCheckIns,
  getTodayCheckIn,
  saveHabitLog,
  getHabits,
  getTodayHabit,
  saveGratitude,
  getGratitudeEntries,
  getRandomGratitude,
  deleteGratitude,
  toggleFavorite,
  togglePin,
  getHappyBox,
  getInsights,
  logCalmSession,
  saveSelfCheck,
  getSelfChecks,
  createCounselorReportShare,
  getSharedCounselorReport,
  revokeCounselorReportShare,
  getYearPixels,
  getCopingPlan,
  saveCopingPlan,
  getMoodDaysEndpoint,
  getHomeSummary
};
