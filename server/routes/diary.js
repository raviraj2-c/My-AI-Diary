const express = require('express');
const {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getTags,
  getStats
} = require('../controllers/diaryController');
const auth = require('../middleware/auth');

const router = express.Router();

router.route('/entries')
  .get(auth, getEntries)
  .post(auth, createEntry);

router.route('/entries/:id')
  .get(auth, getEntry)
  .put(auth, updateEntry)
  .delete(auth, deleteEntry);

router.get('/tags', auth, getTags);
router.get('/stats', auth, getStats);

module.exports = router;