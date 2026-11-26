const { User, Exam, StudySession, SmallWin, CheckIn, HabitLog } = require('../config/models');
const { evaluateBurnout } = require('../utils/burnout');
const { dayRange, todayKey, keyOf } = require('../utils/dates');

/**
 * Lists exams for the current user.
 */
const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ user: req.user.id }).sort({ date: 1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

/**
 * Adds an exam date.
 */
const addExam = async (req, res, next) => {
  try {
    const { subject, date, notes } = req.body;
    if (!subject || !date) {
      return res.status(400).json({ success: false, message: 'Subject and date are required' });
    }

    const examDate = new Date(date);
    if (isNaN(examDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid exam date format' });
    }

    if (notes && typeof notes === 'string' && [...notes].length > 1000) {
      return res.status(400).json({ success: false, message: 'Exam notes cannot exceed 1000 characters' });
    }

    const exam = await Exam.create({
      user: req.user.id,
      subject: subject.trim(),
      date: examDate,
      notes: notes ? String(notes).trim().slice(0, 1000) : ''
    });

    res.status(201).json({ success: true, message: 'Exam added', data: exam });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes an exam.
 */
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Logs a completed Pomodoro study session.
 */
const logStudySession = async (req, res, next) => {
  try {
    const { durationMinutes, technique } = req.body;
    const session = await StudySession.create({
      user: req.user.id,
      durationMinutes: Math.min(1440, Math.max(1, Math.round(Number(durationMinutes) || 25))),
      technique: technique || 'Pomodoro 25/5'
    });
    res.status(201).json({ success: true, message: 'Study session recorded', data: session });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns study statistics (minutes today and past 7 days).
 */
const getStudyStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const { start: todayStart } = dayRange(todayKey(tz), tz);
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000);

    const sessions = await StudySession.find({
      user: req.user.id,
      date: { $gte: sevenDaysAgo }
    });

    let minutesToday = 0;
    let minutesWeek = 0;

    sessions.forEach(s => {
      const sDate = new Date(s.date);
      minutesWeek += s.durationMinutes || 0;
      if (sDate >= todayStart) {
        minutesToday += s.durationMinutes || 0;
      }
    });

    res.json({
      success: true,
      data: {
        minutesToday,
        minutesWeek,
        totalSessionsWeek: sessions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Burnout early notice:
 * If stress >= 4 on 5+ of last 7 days AND average sleep is low, gently notify.
 * Never alarming or clinical.
 */
const getBurnoutStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const { start: todayStart } = dayRange(todayKey(tz), tz);
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 86400000);

    const [checkIns, habits] = await Promise.all([
      CheckIn.find({
        user: req.user.id,
        date: { $gte: sevenDaysAgo }
      }).sort({ date: -1 }),
      HabitLog.find({
        user: req.user.id,
        date: { $gte: sevenDaysAgo }
      })
    ]);

    // Build habit sleep map by local dateKey string
    const habitSleepByDate = new Map();
    for (const h of habits) {
      if (h.date && h.sleepHours != null) {
        const key = h.dateKey || keyOf(h.date, tz);
        habitSleepByDate.set(key, h.sleepHours);
      }
    }

    // Fall back to habit sleep if checkin sleepHours is null/0
    const mergedCheckIns = checkIns.map((ci) => {
      let sleep = ci.sleepHours;
      if (sleep == null && ci.date) {
        const key = ci.dateKey || keyOf(ci.date, tz);
        if (habitSleepByDate.has(key)) {
          sleep = habitSleepByDate.get(key);
        }
      }
      return {
        stress: ci.stress,
        sleepHours: sleep
      };
    });

    const result = evaluateBurnout(mergedCheckIns);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Daily Small Wins (max 3 tiny tasks per day).
 */
const getSmallWins = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const dateKey = req.query.date || todayKey(tz);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Expected YYYY-MM-DD.' });
    }
    let record = await SmallWin.findOne({ user: req.user.id, dateKey });

    if (!record) {
      record = {
        dateKey,
        tasks: [
          { key: 'smallWinWater', text: 'Drink a glass of water mindfully', completed: false },
          { key: 'smallWinBreaths', text: 'Take three deep breaths before studying', completed: false },
          { key: 'smallWinFinished', text: 'Write down one thing I finished today', completed: false }
        ]
      };
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const saveSmallWins = async (req, res, next) => {
  try {
    const { dateKey, tasks } = req.body;
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const key = dateKey || todayKey(tz);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    if (Array.isArray(tasks)) {
      for (const t of tasks) {
        if (t && t.text && [...String(t.text)].length > 500) {
          return res.status(400).json({ success: false, message: 'Small win task text cannot exceed 500 characters' });
        }
      }
    }

    const cleanTasks = Array.isArray(tasks)
      ? tasks.filter(Boolean).slice(0, 3).map(t => ({
          key: t.key ? String(t.key).trim().slice(0, 100) : undefined,
          text: String(t.text || '').trim().slice(0, 500),
          completed: Boolean(t.completed)
        }))
      : [];

    const record = await SmallWin.findOneAndUpdate(
      { user: req.user.id, dateKey: key },
      { tasks: cleanTasks },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Small wins updated', data: record });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExams,
  addExam,
  deleteExam,
  logStudySession,
  getStudyStats,
  getBurnoutStatus,
  getSmallWins,
  saveSmallWins
};
