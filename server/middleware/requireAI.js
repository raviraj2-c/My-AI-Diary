/**
 * Middleware ensuring user has explicitly enabled AI features in settings.
 * Returns 403 AI_DISABLED so the client can prompt the user to enable them.
 */
const requireAI = (req, res, next) => {
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
