const express = require('express');
const { getMessages, sendMessage, clearConversation } = require('../controllers/chatController');
const auth = require('../middleware/auth');
const requireAI = require('../middleware/requireAI');

const router = express.Router();

router.route('/messages')
  .get(auth, getMessages)
  .post(auth, requireAI, sendMessage)
  .delete(auth, clearConversation);

module.exports = router;
