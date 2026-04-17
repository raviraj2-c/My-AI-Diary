const express = require('express');
const {
  register,
  login,
  getMe,
  updateSettings,
  forgotPassword
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/settings', auth, updateSettings);
router.post('/forgot-password', forgotPassword);

module.exports = router;