const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP listener if not running in test suite
let server = null;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Verify AI Model health if key is configured
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
      try {
        const { verifyModelHealth } = require('./services/llmClient');
        await verifyModelHealth();
      } catch (aiErr) {
        console.warn('⚠️ AI Model check warning:', aiErr?.message || aiErr);
      }
    }
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('❌ Failed to start server:', err?.message || err);
    process.exit(1);
  });
}

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err?.message || String(err));
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err?.message || String(err));
  process.exit(1);
});

module.exports = app;
