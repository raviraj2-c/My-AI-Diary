const express = require('express');
const {
  getExams,
  addExam,
  deleteExam,
  logStudySession,
  getStudyStats,
  getBurnoutStatus,
  getSmallWins,
  saveSmallWins
} = require('../controllers/studentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.route('/exams')
  .get(auth, getExams)
  .post(auth, addExam);

router.delete('/exams/:id', auth, deleteExam);

router.post('/study-session', auth, logStudySession);
router.get('/study-stats', auth, getStudyStats);
router.get('/burnout-status', auth, getBurnoutStatus);

router.route('/small-wins')
  .get(auth, getSmallWins)
  .post(auth, saveSmallWins);

module.exports = router;
