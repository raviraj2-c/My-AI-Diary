const express = require('express');
const {
  generateStorybookController,
  getStorybooks,
  getStorybook,
  deleteStorybook
} = require('../controllers/aiController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/generate-storybook', auth, generateStorybookController);

router.route('/storybooks')
  .get(auth, getStorybooks);

router.route('/storybooks/:id')
  .get(auth, getStorybook)
  .delete(auth, deleteStorybook);

module.exports = router;