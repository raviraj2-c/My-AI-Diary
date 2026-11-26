const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const { uploadMedia, deleteMedia } = require('../controllers/uploadController');

// Multer memory storage with 50 MB hard ceiling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

// Stricter rate limit for uploads: max 30 uploads per hour per user
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  message: {
    success: false,
    message: 'Upload limit reached (30 uploads per hour). Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Pre-check Content-Length header before buffering in memory
const checkContentLength = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  if (contentLength && contentLength > 50 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: 'File exceeds the maximum allowable size of 50 MB.'
    });
  }
  next();
};

// Wrapper to intercept multer size/type errors and return a friendly 400 response
const handleUploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File exceeds the maximum allowable size of 50 MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
};

// POST /api/upload - Upload image, video, or voice audio
router.post('/', auth, uploadRateLimiter, checkContentLength, handleUploadMiddleware, uploadMedia);

// DELETE /api/upload/* - Delete file by publicId (supporting subfolder path slashes)
router.delete('/*', auth, deleteMedia);

module.exports = router;
