const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const {
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
} = require('../controllers/wellnessController');

// Public route: Counselor Report View (authenticated via expiring token)
const counselorShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many requests for shared clinical reports, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/shared/:token', counselorShareLimiter, getSharedCounselorReport);

// All wellness routes below require authentication to ensure strict per-user privacy
router.use(auth);

// Check-ins
router.post(['/checkins', '/check-ins'], saveCheckIn);
router.get(['/checkins', '/check-ins'], getCheckIns);
router.get(['/checkins/today', '/check-ins/today'], getTodayCheckIn);

// Habits
router.post('/habits', saveHabitLog);
router.get('/habits', getHabits);
router.get('/habits/today', getTodayHabit);

// Gratitude
router.post('/gratitude', saveGratitude);
router.get('/gratitude', getGratitudeEntries);
router.get('/gratitude/random', getRandomGratitude);
router.delete('/gratitude/:id', deleteGratitude);

// Favorites & Happy Box
router.post('/favorites/:id', toggleFavorite);
router.post('/pins/:id', togglePin);
router.get('/happy-box', getHappyBox);

// Insights & Plain Statistics
router.get('/insights', getInsights);

// Counselor Report Sharing
router.post('/counselor-share', createCounselorReportShare);
router.delete('/counselor-share/:token', revokeCounselorReportShare);

// Calm Sessions & Self Checks
router.post('/calm-sessions', logCalmSession);
router.post('/self-checks', saveSelfCheck);
router.get('/self-checks', getSelfChecks);

// Unified daily mood & Home summary
router.get('/mood-days', getMoodDaysEndpoint);
router.get('/home-summary', getHomeSummary);

// Year in Pixels & Coping Plan
router.get('/year-pixels', getYearPixels);
router.get('/coping-plan', getCopingPlan);
router.put('/coping-plan', saveCopingPlan);

module.exports = router;
