const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { User } = require('../config/models');

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (process.env.NODE_ENV === 'test' ? (req.headers['x-test-user-limit'] ? 2 : 5000) : 600),
  keyGenerator: (req) => `user_${req.user?.id || req.user?._id || 'unknown'}`,
  message: {
    success: false,
    message: 'Too many requests for this account, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'No token provided, authorization denied'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: isExpired ? 'Token has expired' : 'Token is not valid'
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Token is not valid'
      });
    }

    // Check tokenVersion: reject tokens issued before a password reset, password change, or global logout
    if (Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please log in again.'
      });
    }

    req.user = user;
    userLimiter(req, res, next);
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    // Database or unexpected server errors must return 503 so client doesn't wipe session/drafts
    res.status(503).json({
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable. Please try again.'
    });
  }
};

module.exports = auth;
