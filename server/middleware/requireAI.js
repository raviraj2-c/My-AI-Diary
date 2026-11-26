const { isFreeTierDiaryAIBlocked } = require('../config/ai');

/**
 * Middleware ensuring user has explicitly enabled AI features in settings
 * and that free-tier production guard allows diary AI.
 * Returns 403 AI_DISABLED or FREE_TIER_DIARY_AI_DISABLED.
 */
const requireAI = (req, res, next) => {
  if (isFreeTierDiaryAIBlocked()) {
    return res.status(403).json({
      success: false,
      code: 'FREE_TIER_DIARY_AI_DISABLED',
      message: 'Diary AI features are disabled on the free Gemini tier in production because submitted content may be used by Google. Enable billing and set GEMINI_TIER=paid, or set ALLOW_FREE_TIER_DIARY_AI=true for non-personal demos.'
    });
  }
  if (!req.user || !req.user.allowAIFeatures) {
    return res.status(403).json({
      success: false,
      code: 'AI_DISABLED',
      message: 'AI reflection features are disabled in your account settings. Turn on AI in Settings to continue.'
    });
  }
  next();
};

module.exports = requireAI;
