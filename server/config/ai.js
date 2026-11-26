/**
 * Single source of truth for Gemini AI configuration.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const MODEL = (process.env.GEMINI_MODEL || process.env.AI_MODEL || DEFAULT_MODEL).trim();

function getModel() {
  return (process.env.GEMINI_MODEL || process.env.AI_MODEL || DEFAULT_MODEL).trim();
}

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return null;
  }
  return apiKey.trim();
}

function isAIConfigured() {
  return Boolean(getModel() && getApiKey());
}

function getGeminiTier() {
  return (process.env.GEMINI_TIER || 'free').trim().toLowerCase() === 'paid' ? 'paid' : 'free';
}

function isFreeTierDiaryAIBlocked() {
  return (
    process.env.NODE_ENV === 'production' &&
    getGeminiTier() === 'free' &&
    process.env.ALLOW_FREE_TIER_DIARY_AI !== 'true'
  );
}

function isDemoFreeTierAI() {
  return getGeminiTier() === 'free' && process.env.ALLOW_FREE_TIER_DIARY_AI === 'true';
}

module.exports = {
  MODEL,
  GEMINI_API_BASE,
  getModel,
  getApiKey,
  isAIConfigured,
  getGeminiTier,
  isFreeTierDiaryAIBlocked,
  isDemoFreeTierAI
};
