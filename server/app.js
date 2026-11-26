const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '.env') });

// Startup checks
if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: In production, MONGODB_URI is required. Please set it in server environment.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL: In production, JWT_SECRET is required and must be at least 32 characters long.');
    process.exit(1);
  }
  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey || !/^[0-9a-fA-F]{64}$/.test(encKey)) {
    console.error('❌ FATAL: In production, ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).');
    process.exit(1);
  }
  if (encKey.includes('0123456789abcdef') || encKey.toLowerCase().includes('sample') || encKey.toLowerCase().includes('placeholder')) {
    console.error('❌ FATAL: In production, ENCRYPTION_KEY cannot use default/sample values. Generate one with: openssl rand -hex 32');
    process.exit(1);
  }
  if (!process.env.CORS_ORIGIN && !process.env.FRONTEND_URL) {
    console.error('❌ FATAL: In production, CORS_ORIGIN or FRONTEND_URL is required to protect API endpoints.');
    process.exit(1);
  }
  if (!process.env.AI_MODEL) {
    console.error('❌ FATAL: In production, AI_MODEL must be configured explicitly.');
    process.exit(1);
  }
} else if (process.env.NODE_ENV !== 'test') {
  if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI is required. Please set it in server/.env');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL: JWT_SECRET is required and must be at least 32 characters long. Please set it in server/.env');
    process.exit(1);
  }
  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey || !/^[0-9a-fA-F]{64}$/.test(encKey)) {
    console.error('❌ FATAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Please set it in server/.env');
    process.exit(1);
  }
}

const authRoutes = require('./routes/auth');
const diaryRoutes = require('./routes/diary');
const aiRoutes = require('./routes/ai');
const exportRoutes = require('./routes/export');
const uploadRoutes = require('./routes/upload');
const wellnessRoutes = require('./routes/wellness');
const chatRoutes = require('./routes/chat');
const studentRoutes = require('./routes/student');
const letterRoutes = require('./routes/letters');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(compression());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "https://res.cloudinary.com"],
        mediaSrc: ["'self'", "https://res.cloudinary.com", "blob:", "data:"],
        connectSrc: ["'self'", "https://res.cloudinary.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration (returns 403 on disallowed origins, no console logging of every origin)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'https://ai-diary-iota.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const corsError = new Error('Not allowed by CORS');
    corsError.statusCode = 403;
    return callback(corsError);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

app.use(cors(corsOptions));

// General API Rate Limiter
// Strictly keyed by client IP before auth to prevent unverified JWT forged buckets
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (process.env.NODE_ENV === 'production' ? 120 : (process.env.NODE_ENV === 'test' ? (req.headers['x-test-rate-limit'] ? 2 : 1000) : 1000)),
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.originalUrl === '/api/health',
});

app.use('/api/', limiter);

// Logging
morgan.token('url', (req) => {
  const url = req.originalUrl || req.url || '';
  return url.replace(/(\/counselor-share\/|\/shared\/)([a-zA-Z0-9_-]+)/gi, '$1[REDACTED]');
});

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parser - global limit 100kb
app.use(express.json({ limit: '100kb', type: 'application/json' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Cache-Control: no-store for all /api responses to protect private mental health data
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/letters', letterRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const aiKeyConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key');
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'error',
    success: dbConnected,
    message: dbConnected ? 'MyDiary API is running with MongoDB' : 'Database disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    aiModel: process.env.AI_MODEL || 'gemini-2.5-flash',
    aiConfigured: aiKeyConfigured,
    uptime: process.uptime(),
  });
});

// API Root
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MyDiary AI API with MongoDB',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      auth: '/api/auth',
      diary: '/api/diary',
      ai: '/api/ai',
      export: '/api/export',
      health: '/api/health',
    },
  });
});

// Handle 404 for API routes BEFORE serving client
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Serve Frontend in Production only if dist exists
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Error Handler
app.use(errorHandler);

module.exports = app;
