const { ChatMessage, CheckIn, User } = require('../config/models');
const llmClient = require('../services/llmClient');
const { WELLNESS_SYSTEM_PROMPT } = require('../services/safetyPrompt');
const { checkRisk } = require('../utils/riskCheck');
const { dayRange, todayKey } = require('../utils/dates');

/**
 * Lists the user's saved conversation history (up to last 50 messages).
 */
const getMessages = async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ user: req.user.id, mode: { $ne: 'diary' } })
      .sort({ createdAt: -1 })
      .limit(50);

    messages.reverse();

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Normalizes conversation history for Claude API:
 * - Drops leading assistant messages (must start with 'user')
 * - Merges consecutive same-role messages so roles strictly alternate
 */
function normalizeChatHistory(messages) {
  let startIndex = 0;
  while (startIndex < messages.length && messages[startIndex].role !== 'user') {
    startIndex++;
  }
  const filtered = messages.slice(startIndex);
  if (filtered.length === 0) return [];

  const normalized = [];
  for (const msg of filtered) {
    if (normalized.length === 0) {
      normalized.push({ role: msg.role, content: msg.content });
    } else {
      const prev = normalized[normalized.length - 1];
      if (prev.role === msg.role) {
        prev.content += `\n\n${msg.content}`;
      } else {
        normalized.push({ role: msg.role, content: msg.content });
      }
    }
  }
  return normalized;
}

/**
 * Sends a message to the AI companion with memory and safety screening.
 */
const sendMessage = async (req, res, next) => {
  let userMsg = null;
  try {
    const { message, attachCheckIn } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const cleanInput = message.trim().slice(0, 2000);

    // 1. Mandatory Pre-Flight Risk Check on User Input
    const risk = checkRisk(cleanInput);

    if (risk.level === 'high') {
      // Save user message
      const userMsg = await ChatMessage.create({
        user: req.user.id,
        role: 'user',
        content: cleanInput,
        safetyLevel: 'high'
      });

      // Provide immediate caring crisis message WITHOUT calling external AI
      const crisisReply = "I hear how painful things feel right now. You matter, and you do not have to carry this alone. Please reach out to someone you trust or talk with a free, confidential helpline right away.";
      const assistantMsg = await ChatMessage.create({
        user: req.user.id,
        role: 'assistant',
        content: crisisReply,
        safetyLevel: 'high'
      });

      return res.json({
        success: true,
        safety: { level: 'high' },
        data: {
          userMessage: userMsg,
          assistantMessage: assistantMsg
        }
      });
    }

    // 2. Save user message to database
    userMsg = await ChatMessage.create({
      user: req.user.id,
      role: 'user',
      content: cleanInput,
      safetyLevel: risk.level
    });

    // 3. Fetch past conversation memory (last 10 messages)
    const history = await ChatMessage.find({ user: req.user.id, mode: { $ne: 'diary' } })
      .sort({ createdAt: -1 })
      .limit(10);
    const sortedHistory = history.reverse();

    // 4. Optionally attach today's check-in context if requested
    let systemPrompt = WELLNESS_SYSTEM_PROMPT;
    if (attachCheckIn) {
      const user = await User.findById(req.user.id).select('timezone');
      const tz = user?.timezone || 'UTC';
      const today = todayKey(tz);
      const { start, end } = dayRange(today, tz);

      const checkIn = await CheckIn.findOne({
        user: req.user.id,
        $or: [
          { dateKey: today },
          { date: { $gte: start, $lte: end } }
        ]
      });

      if (checkIn) {
        systemPrompt += `\n[Context - User's check-in today: Mood score ${checkIn.moodScore || 'N/A'}/10, Stress: ${checkIn.stress || 'N/A'}/5, Energy: ${checkIn.energy || 'N/A'}/5, Sleep: ${checkIn.sleepHours || 'N/A'} hours]`;
      }
    }

    // 5. Invoke Claude with normalized role sequence
    const rawMessages = sortedHistory.map(m => ({
      role: m.role,
      content: m.content
    }));
    const chatMessages = normalizeChatHistory(rawMessages);

    const response = await llmClient.callLLM({
      userId: req.user.id,
      systemPrompt,
      messages: chatMessages,
      maxTokens: 500,
      temperature: 0.7
    });

    const hasCrisisSignal = response.text.includes('[CRISIS_SIGNAL_DETECTED]');
    const cleanReply = response.text.replace('[CRISIS_SIGNAL_DETECTED]', '').trim();
    const replySafetyLevel = hasCrisisSignal ? 'high' : risk.level;

    // 6. Save assistant reply to database
    const assistantMsg = await ChatMessage.create({
      user: req.user.id,
      role: 'assistant',
      content: cleanReply,
      safetyLevel: replySafetyLevel
    });

    res.json({
      success: true,
      safety: { level: replySafetyLevel },
      data: {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        quotaRemaining: response.quotaRemaining
      }
    });
  } catch (error) {
    // If AI invocation failed, remove the orphaned user message so chat doesn't have an unanswered question
    if (userMsg && userMsg._id) {
      await ChatMessage.findByIdAndDelete(userMsg._id).catch(() => {});
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }
    next(error);
  }
};

/**
 * Clears the user's active conversation history.
 */
const clearConversation = async (req, res, next) => {
  try {
    await ChatMessage.deleteMany({ user: req.user.id });
    res.json({
      success: true,
      message: 'Conversation cleared'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  clearConversation,
  normalizeChatHistory
};
