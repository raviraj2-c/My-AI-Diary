/**
 * LLM Client wrapper for Google Gemini API.
 * Handles authentication, timeout, daily usage quotas, and friendly error mapping.
 */

const mongoose = require('mongoose');
const { User } = require('../config/models');
const { dayRange, todayKey } = require('../utils/dates');

const DEFAULT_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DAILY_LIMIT = 30;
const TIMEOUT_MS = 25000;

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return null;
  }
  return apiKey.trim();
}

async function requestGemini({ apiKey, model, systemPrompt, messages, maxTokens, temperature }) {
  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;
  const body = {
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })),
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature
    }
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (!res.ok) {
    let errMessage = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMessage = errData?.error?.message || errMessage;
    } catch {
      // keep default HTTP status message
    }
    const err = new Error(errMessage);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('');
}

/**
 * Checks and increments daily AI usage quota for an authenticated user.
 * Quota resets daily at the user's local midnight. Uses atomic operations to prevent race conditions.
 *
 * @param {string} userId
 * @returns {Promise<{ allowed: boolean, remaining: number, count: number }>}
 */
async function checkAndIncrementUsage(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { allowed: true, remaining: DAILY_LIMIT, count: 0 };
  }

  const userRecord = await User.findById(userId).select('timezone');
  const tz = userRecord?.timezone || 'UTC';
  const now = new Date();
  const todayStart = dayRange(todayKey(tz), tz).start;

  // 1. Try atomic increment within the current local day where count < DAILY_LIMIT
  let updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      allowAIFeatures: true,
      'aiDailyUsage.lastReset': { $gte: todayStart },
      'aiDailyUsage.count': { $lt: DAILY_LIMIT }
    },
    {
      $inc: { 'aiDailyUsage.count': 1 }
    },
    { new: true }
  );

  // 2. If not updated, check if it is a new day (lastReset < todayStart or not initialized)
  if (!updatedUser) {
    updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        allowAIFeatures: true,
        $or: [
          { 'aiDailyUsage.lastReset': { $lt: todayStart } },
          { 'aiDailyUsage.lastReset': { $exists: false } },
          { 'aiDailyUsage': { $exists: false } }
        ]
      },
      {
        $set: {
          'aiDailyUsage.count': 1,
          'aiDailyUsage.lastReset': now
        }
      },
      { new: true }
    );
  }

  // 3. If still not updated, determine the exact rejection cause
  if (!updatedUser) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (!user.allowAIFeatures) {
      const error = new Error('AI features are disabled in your settings. Please enable them in Settings to use this feature.');
      error.statusCode = 403;
      error.code = 'AI_DISABLED';
      throw error;
    }

    const error = new Error(`You have reached your daily limit of ${DAILY_LIMIT} AI interactions. Give yourself a gentle pause today and return tomorrow.`);
    error.statusCode = 429;
    error.code = 'QUOTA_EXCEEDED';
    throw error;
  }

  const count = updatedUser.aiDailyUsage.count;
  return {
    allowed: true,
    remaining: Math.max(0, DAILY_LIMIT - count),
    count
  };
}

/**
 * Refunds daily usage count atomically if an operation fails after charging.
 *
 * @param {string} userId
 * @param {number} [count=1]
 */
async function refundDailyUsage(userId, count = 1) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return;
  try {
    const updated = await User.findOneAndUpdate(
      {
        _id: userId,
        'aiDailyUsage.count': { $gt: 0 }
      },
      {
        $inc: { 'aiDailyUsage.count': -count }
      },
      { new: true }
    );
    if (updated && updated.aiDailyUsage && updated.aiDailyUsage.count < 0) {
      await User.updateOne({ _id: userId }, { $set: { 'aiDailyUsage.count': 0 } });
    }
  } catch (err) {
    console.error('Failed to refund daily AI usage:', err.message);
  }
}

/**
 * Executes a call to the Gemini LLM with system prompt, messages, and safety limits.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated user ID (for quota check)
 * @param {string} params.systemPrompt - System safety instructions
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} params.messages - Chat message history
 * @param {number} [params.maxTokens=1024]
 * @param {number} [params.temperature=0.7]
 * @param {boolean} [params.countUsage=true] - Whether this call counts toward daily limit
 * @returns {Promise<{ text: string, quotaRemaining: number, mock?: boolean }>}
 */
async function callLLM({ userId, systemPrompt, messages, maxTokens = 1024, temperature = 0.7, countUsage = true }) {
  let quota = { allowed: true, remaining: DAILY_LIMIT, count: 0 };
  let usageIncremented = false;

  // 1. Check and record daily quota if applicable
  if (countUsage) {
    quota = await checkAndIncrementUsage(userId);
    usageIncremented = true;
  } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const user = await User.findById(userId);
    if (user && !user.allowAIFeatures) {
      const error = new Error('AI features are disabled in your settings. Please enable them in Settings to use this feature.');
      error.statusCode = 403;
      error.code = 'AI_DISABLED';
      throw error;
    }
  }

  const apiKey = getApiKey();

  // If Gemini API key is not yet set in environment, provide a safe dev fallback
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('AI service is temporarily unavailable.');
      error.statusCode = 503;
      throw error;
    }
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    return {
      text: generateDevMockResponse(systemPrompt, lastUserMsg),
      quotaRemaining: quota.remaining,
      mock: true
    };
  }

  try {
    const text = await requestGemini({
      apiKey,
      model: DEFAULT_MODEL,
      systemPrompt,
      messages,
      maxTokens,
      temperature
    });

    return {
      text,
      quotaRemaining: quota.remaining,
      mock: false
    };
  } catch (err) {
    if (usageIncremented) {
      await refundDailyUsage(userId, 1);
    }
    console.error(`Gemini API Error (status: ${err.status ?? 'unknown'}):`, err.message);

    if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('NOT_FOUND')) {
      console.error(`❌ FATAL / CONFIG ERROR: Configured AI_MODEL '${DEFAULT_MODEL}' was not found or is deprecated on Gemini. Update AI_MODEL in .env.`);
      const error = new Error('AI service configuration issue (model not found). Please contact support.');
      error.statusCode = 502;
      throw error;
    }
    if (err.status === 401 || err.status === 403) {
      const error = new Error('AI service configuration issue. Please contact support.');
      error.statusCode = 502;
      throw error;
    }
    if (err.status === 429) {
      const error = new Error('AI companion is temporarily receiving too many thoughts. Please take a breath and try again shortly.');
      error.statusCode = 429;
      throw error;
    }
    if (err.name === 'TimeoutError' || err.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
      const error = new Error('The AI took a little too long to reflect. Please try sending your thought again.');
      error.statusCode = 504;
      throw error;
    }

    const friendlyError = new Error('MindDiary AI companion is taking a quiet rest. Please try again in a few moments.');
    friendlyError.statusCode = 503;
    throw friendlyError;
  }
}

/**
 * Fallback generator for development environments when GEMINI_API_KEY is not yet supplied.
 */
function generateDevMockResponse(systemPrompt, userText) {
  if (systemPrompt.includes('story author')) {
    return JSON.stringify({
      title: "Echoes of Mindful Moments",
      protagonist: {
        name: "Alex",
        journey: "Navigating quiet transformations with gentle courage"
      },
      chapters: [
        {
          chapterNumber: 1,
          title: "The Quiet Morning",
          content: "Underneath a soft sky, Alex paused to observe the quiet rhythm of the morning. Each small detail carried a subtle warmth, reminding them that progress begins with listening."
        },
        {
          chapterNumber: 2,
          title: "Embracing the Unpredictable",
          content: "When unexpected challenges arose, Alex chose to breathe rather than hurry. Even on tangled days, there was room to grant oneself kindness and take the next step."
        },
        {
          chapterNumber: 3,
          title: "Finding Stillness",
          content: "As dusk settled, Alex realized that healing is not about having everything solved, but about being gentle with wherever today found them."
        }
      ]
    });
  }

  if (systemPrompt.includes('tone analyzer')) {
    return JSON.stringify({
      suggestedEmotions: ["reflective", "thoughtful", "calm"],
      suggestedScore: 7,
      confidence: 0.85
    });
  }

  if (systemPrompt.includes('Cognitive Behavioral')) {
    return "Thank you for sharing that thought. Another gentle way to look at this might be: While things feel overwhelming right now, one difficult moment does not define your entire journey. Could it be that you are doing the best you can with the energy you have today?";
  }

  if (systemPrompt.includes('Ask My Diary')) {
    let usedIds = [];
    const xmlMatches = [...userText.matchAll(/<diary_entry\s+id="([^"]+)"/g)];
    if (xmlMatches && xmlMatches.length > 0) {
      usedIds = xmlMatches.map(m => m[1]).slice(0, 2);
    } else {
      const idMatches = userText.match(/"id":\s*"([^"]+)"/g);
      if (idMatches && idMatches.length > 0) {
        usedIds = idMatches.map(m => m.split('"')[3]).slice(0, 2);
      }
    }
    return JSON.stringify({
      answer: "Based on your reflections, it seems you noticed moments of quiet peace and gentle awareness.",
      usedEntryIds: usedIds
    });
  }

  return "I hear you, and it is completely normal to feel what you're experiencing. Taking time to notice these feelings is already a meaningful step. What is one small, kind thing you could do for yourself right now?";
}

/**
 * Health check verification for the configured Gemini AI model at startup or diagnostic.
 *
 * @returns {Promise<{ ok: boolean, model?: string, status?: number|string, error?: string }>}
 */
async function verifyModelHealth() {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ WARNING: GEMINI_API_KEY is missing or unconfigured in production.');
    }
    return { ok: false, status: 'missing_key' };
  }

  try {
    await requestGemini({
      apiKey,
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: 'ping' }],
      maxTokens: 1,
      temperature: 0
    });
    console.log(`✅ Gemini AI model '${DEFAULT_MODEL}' verified successfully.`);
    return { ok: true, model: DEFAULT_MODEL };
  } catch (err) {
    console.error(`❌ Gemini AI startup verification failed for model '${DEFAULT_MODEL}' (status: ${err.status ?? 'unknown'}):`, err.message);
    if (err.status === 404) {
      console.error(`❌ FATAL: Configured AI_MODEL '${DEFAULT_MODEL}' does not exist on Gemini. Update AI_MODEL in .env.`);
    }
    return { ok: false, status: err.status, error: err.message };
  }
}

module.exports = {
  callLLM,
  checkAndIncrementUsage,
  refundDailyUsage,
  verifyModelHealth,
  DAILY_LIMIT,
  DEFAULT_MODEL
};
