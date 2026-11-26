const express = require('express');
const {
  generateStorybookController,
  getStorybooks,
  getStorybook,
  updateStorybook,
  deleteStorybook,
  reflectOnEntry,
  analyzeMoodController,
  challengeThoughtController,
  getWritingStartersController,
  getAIUsageController,
  saveThoughtRecord,
  getThoughtRecords,
  deleteThoughtRecord,
  askDiaryController,
  getAskDiaryHistory,
  clearAskDiaryHistory
} = require('../controllers/aiController');
const auth = require('../middleware/auth');
const requireAI = require('../middleware/requireAI');

const router = express.Router();

router.post('/generate-storybook', auth, requireAI, generateStorybookController);
router.post('/ask-diary', auth, askDiaryController);
router.route('/ask-diary/history')
  .get(auth, getAskDiaryHistory)
  .delete(auth, clearAskDiaryHistory);

router.route('/storybooks')
  .get(auth, getStorybooks);

router.route('/storybooks/:id')
  .get(auth, getStorybook)
  .put(auth, updateStorybook)
  .delete(auth, deleteStorybook);

router.post('/reflect', auth, requireAI, reflectOnEntry);
router.post('/analyze-mood', auth, requireAI, analyzeMoodController);
router.post('/challenge-thought', auth, requireAI, challengeThoughtController);
router.post('/writing-starters', auth, requireAI, getWritingStartersController);
router.get('/usage', auth, getAIUsageController);

// Thought records (CBT)
router.route('/thoughts')
  .get(auth, getThoughtRecords)
  .post(auth, saveThoughtRecord);

router.delete('/thoughts/:id', auth, deleteThoughtRecord);

module.exports = router;
