const express = require('express');
const {
  exportEntries,
  trackStorybookDownload
} = require('../controllers/exportController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/entries', auth, exportEntries);
router.post('/storybook/:id/download', auth, trackStorybookDownload);

module.exports = router;