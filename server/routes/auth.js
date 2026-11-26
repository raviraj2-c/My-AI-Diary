const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getMe,
  updateSettings,
  forgotPassword,
  resetPassword,
  setupAppLock,
  verifyAppLock,
  disableAppLock,
  exportAllData,
  deleteAccount,
  changePassword,
  logoutAll
} = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (process.env.NODE_ENV === 'test' ? (req.headers['x-test-rate-limit'] ? 2 : 1000) : 10),
  keyGenerator: (req) => `${req.ip}_${typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''}`,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', auth, getMe);
router.put('/settings', auth, updateSettings);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/change-password', auth, changePassword);
router.post('/logout-all', auth, logoutAll);

// App Lock & Privacy
router.post('/app-lock/setup', auth, setupAppLock);
router.post('/app-lock/verify', auth, verifyAppLock);
router.post('/app-lock/disable', auth, disableAppLock);
router.get('/export-data', auth, exportAllData);
router.post('/delete-account', auth, deleteAccount);
router.delete('/delete-account', auth, deleteAccount);
router.delete('/account', auth, deleteAccount);

module.exports = router;
