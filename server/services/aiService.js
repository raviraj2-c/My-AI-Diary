/**
 * AI Service for MindDiary.
 * Powered by Google Gemini LLM with rigorous clinical safety, input risk screening,
 * structured JSON validation, and respectful mental wellness boundaries.
 */

const llmClient = require('./llmClient');
const {
  WELLNESS_SYSTEM_PROMPT,
  STORYBOOK_SYSTEM_PROMPT,
  MOOD_ANALYZER_SYSTEM_PROMPT,
  CBT_CHALLENGER_SYSTEM_PROMPT,
  ASK_DIARY_SYSTEM_PROMPT
} = require('./safetyPrompt');
const { checkRisk } = require('../utils/riskCheck');
const { ChatMessage } = require('../config/models');
const { retrieveDiaryExcerpts } = require('./diaryRetriever');

function parseAskDiaryJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  try {
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const data = JSON.parse(cleanJson);
    if (!data || typeof data.answer !== 'string' || !Array.isArray(data.usedEntryIds)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

class AIService {
  /**
   * Generates a literary storybook from diary entries using Gemini.
   *
   * @param {Array<object>} entries - Array of DiaryEntry documents
   * @param {string} theme - 'romantic' | 'dramatic' | 'adventure' | 'mystery' | 'comedy'
   * @param {{ start: Date, end: Date }} timeframe
   * @param {string|object} [optionsOrNickname]
   * @param {string} userId - User ID for quota tracking
   */
  static async generateStorybook(entries, theme, timeframe, optionsOrNickname, userId) {
    if (!entries || entries.length === 0) {
      throw new Error('At least one diary entry is required to synthesize a storybook.');
    }

    let protagonistNickname = '';
    let length = 'medium';
    let language = 'en';
    let tone = 'reflective';

    if (typeof optionsOrNickname === 'string') {
      protagonistNickname = optionsOrNickname;
    } else if (optionsOrNickname && typeof optionsOrNickname === 'object') {
      protagonistNickname = optionsOrNickname.protagonistNickname || '';
      length = optionsOrNickname.length || 'medium';
      language = optionsOrNickname.language || 'en';
      tone = optionsOrNickname.tone || 'reflective';
    }

    // 1. Sanitize entries and check for crisis signals
    const preparedEntries = entries.map((entry, idx) => {
      const rawContent = entry.content || '';
      const cleanText = rawContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1000); // Send only necessary excerpt per entry

      return {
        index: idx + 1,
        title: (entry.title || `Entry ${idx + 1}`).slice(0, 100),
        date: entry.entryDate ? new Date(entry.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date',
        mood: entry.mood || 'reflective',
        text: cleanText
      };
    });

    // Check EACH prepared entry individually for crisis signals
    const safeEntries = [];
    let excludedCount = 0;
    for (const entry of preparedEntries) {
      const risk = checkRisk(entry.text);
      if (risk.level === 'high') {
        excludedCount++;
      } else {
        safeEntries.push(entry);
      }
    }

    if (safeEntries.length === 0) {
      const err = new Error('All entries in this time range reflect moments of severe distress. For your safety, storybook generation is paused. Please connect with our support resources.');
      err.statusCode = 400;
      err.safety = { level: 'high' };
      err.excludedCount = excludedCount;
      throw err;
    }

    const entriesForPrompt = safeEntries.map((e, idx) => ({
      ...e,
      index: idx + 1
    }));

    const protagonistName = protagonistNickname && protagonistNickname.trim().length > 0
      ? protagonistNickname.trim().slice(0, 30)
      : 'The Traveler';

    const lengthGuide = length === 'short'
      ? 'Generate exactly 3 chapters.'
      : length === 'long'
        ? 'Generate exactly 6 chapters.'
        : 'Generate 4 to 5 chapters.';

    const languageGuide = language === 'hi'
      ? 'Write the entire story (title, protagonist summary, and chapter contents) in pure Hindi using the Devanagari script.'
      : language === 'hinglish'
        ? 'Write in warm, conversational Hinglish (Hindi words mixed with English in Roman/Latin script, easy for Indian youth to relate to).'
        : 'Write in natural, evocative English.';

    const toneGuide = tone === 'gentle'
      ? 'Tone: Soft, warm, nurturing, compassionate, and reassuring.'
      : tone === 'hopeful'
        ? 'Tone: Uplifting, inspiring, forward-looking, and courageous.'
        : tone === 'funny'
          ? 'Tone: Lighthearted, cheerful, playful, and subtly witty.'
          : 'Tone: Thoughtful, introspective, mindful, and deeply reflective.';

    const promptMessage = `Please write a heartwarming, uplifting storybook based on the following real diary events:
Selected Theme: ${theme}
Desired Tone: ${tone} (${toneGuide})
Target Length: ${length} (${lengthGuide})
Language: ${language} (${languageGuide})
Timeframe: ${timeframe.start.toISOString().slice(0, 10)} to ${timeframe.end.toISOString().slice(0, 10)}
Protagonist Preferred Name: ${protagonistName}

STRICT SAFETY & ETHICAL RULES:
- stay faithful to the real events; never invent harm; never name illnesses or medicines.
- Do not fabricate traumatic events, violence, self-harm, or clinical labels.

Diary Entries to weave into the story:
${JSON.stringify(entriesForPrompt, null, 2)}

Remember to return ONLY valid JSON matching the specified schema with a title, protagonist, and the requested chapters.`;

    const parseStorybookJson = (rawText) => {
      if (!rawText || typeof rawText !== 'string') return null;
      try {
        const cleanJson = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(cleanJson);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.title &&
          typeof parsed.title === 'string' &&
          Array.isArray(parsed.chapters) &&
          parsed.chapters.length > 0
        ) {
          return parsed;
        }
      } catch {
        return null;
      }
      return null;
    };

    // Attempt 1: Call LLM with daily quota tracking
    const response = await llmClient.callLLM({
      userId,
      systemPrompt: STORYBOOK_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: promptMessage }],
      maxTokens: 2500,
      temperature: 0.7,
      countUsage: true,
      responseMimeType: 'application/json',
      timeoutMs: 60000
    });

    let storybookData = parseStorybookJson(response?.text);

    // If Gemini's JSON fails validation, retry once with a stricter reminder prompt
    if (!storybookData) {
      try {
        const retryPrompt = `${promptMessage}\n\nCRITICAL: Return only valid JSON, nothing before or after.`;
        const retryResponse = await llmClient.callLLM({
          userId,
          systemPrompt: STORYBOOK_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: retryPrompt }],
          maxTokens: 2500,
          temperature: 0.5,
          countUsage: false, // Do not charge additional quota for internal retry
          responseMimeType: 'application/json',
          timeoutMs: 60000
        });
        storybookData = parseStorybookJson(retryResponse?.text);
      } catch {
        // If retry call fails, storybookData remains null
      }
    }

    // If it fails again, refund daily usage, throw 503, and never save a storybook
    if (!storybookData) {
      await llmClient.refundDailyUsage(userId, 1);
      const failError = new Error("We couldn't make your story this time. Please try again.");
      failError.statusCode = 503;
      throw failError;
    }

    // Ensure title and chapters format
    const title = storybookData.title;
    const chapters = storybookData.chapters.map((ch, idx) => ({
      chapterNumber: ch.chapterNumber || idx + 1,
      title: ch.title || `Chapter ${idx + 1}`,
      content: ch.content || ''
    }));

    // Compile generatedContent in markdown format compatible with exportService jsPDF generator
    let generatedContent = `# ${title}\n\n`;
    if (storybookData.protagonist?.name) {
      generatedContent += `**Protagonist:** ${storybookData.protagonist.name}\n\n`;
    }

    chapters.forEach((chapter) => {
      generatedContent += `---\n\n## ${chapter.title}\n\n${chapter.content}\n\n`;
    });

    return {
      title,
      theme,
      timeframe,
      protagonist: storybookData.protagonist || { name: protagonistName },
      chapters,
      generatedContent: generatedContent.trim(),
      safety: excludedCount > 0 ? { level: 'high' } : { level: 'none' },
      excludedCount
    };
  }

  /**
   * Generates a gentle reflective response to a journal entry.
   */
  static async generateReflection(content, mood, userId) {
    if (!content || typeof content !== 'string') {
      throw new Error('Entry content is required for reflection.');
    }

    const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);

    // Run risk check first
    const risk = checkRisk(cleanContent);
    if (risk.level === 'high') {
      return {
        safety: { level: 'high' },
        reflection: "I hear how heavy things feel right now. You matter, and you do not have to carry this alone. Please reach out to someone who cares about you or connect with a free, confidential helpline.",
        question: "Would you be willing to take one deep breath and reach out to someone you trust right now?"
      };
    }

    const userPrompt = `Here is a reflection from my journal today (Mood: ${mood || 'unspecified'}):
<diary_entry>
${cleanContent}
</diary_entry>

Please offer a warm, compassionate reflection of my feelings and at most ONE gentle question to help me ponder this softly. Keep it under 100 words.`;

    const response = await llmClient.callLLM({
      userId,
      systemPrompt: WELLNESS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: 300,
      temperature: 0.6
    });

    const hasCrisisSignal = response.text.includes('[CRISIS_SIGNAL_DETECTED]');
    const cleanText = response.text.replace('[CRISIS_SIGNAL_DETECTED]', '').trim();

    return {
      safety: { level: hasCrisisSignal ? 'high' : risk.level },
      reflection: cleanText,
      quotaRemaining: response.quotaRemaining
    };
  }

  /**
   * Analyzes emotional tone of text.
   */
  static async analyzeMood(text, userId) {
    if (!text || typeof text !== 'string') {
      return { suggestedEmotions: ['neutral'], suggestedScore: 5, confidence: 0.5 };
    }

    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
    const risk = checkRisk(cleanText);

    if (risk.level === 'high') {
      return {
        safety: { level: 'high' },
        suggestedEmotions: ['overwhelmed', 'deep distress'],
        suggestedScore: 1,
        confidence: 0.95
      };
    }

    const response = await llmClient.callLLM({
      userId,
      systemPrompt: MOOD_ANALYZER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyze the tone of this journal text:\n"${cleanText}"` }],
      maxTokens: 150,
      temperature: 0.3,
      countUsage: false,
      responseMimeType: 'application/json'
    });

    try {
      const cleanJson = response.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleanJson);
      return {
        safety: { level: risk.level },
        suggestedEmotions: Array.isArray(parsed.suggestedEmotions) ? parsed.suggestedEmotions.slice(0, 4) : ['reflective'],
        suggestedScore: Math.max(1, Math.min(10, Math.round(Number(parsed.suggestedScore) || 5))),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
        quotaRemaining: response.quotaRemaining
      };
    } catch {
      return {
        safety: { level: risk.level },
        suggestedEmotions: ['reflective'],
        suggestedScore: 6,
        confidence: 0.6,
        quotaRemaining: response.quotaRemaining
      };
    }
  }

  /**
   * Reframes cognitive distortions (CBT thought challenger helper).
   */
  static async challengeThought({ situation, thought, evidenceFor, evidenceAgainst }, userId) {
    const rawCheck = `${situation || ''} ${thought || ''} ${evidenceFor || ''} ${evidenceAgainst || ''}`;
    const risk = checkRisk(rawCheck);

    if (risk.level === 'high') {
      return {
        safety: { level: 'high' },
        balancedThought: "Right now you are in acute distress. Please pause this exercise and reach out to someone you trust or a helpline."
      };
    }

    const prompt = `I am doing a thought reframing exercise:
Situation: ${situation || 'Unspecified'}
Automatic thought: "${thought || ''}"
Evidence supporting it: "${evidenceFor || 'None listed'}"
Evidence against it: "${evidenceAgainst || 'None listed'}"

Please suggest 1-2 balanced, compassionate ways to see this situation without toxic positivity. Keep it under 90 words.`;

    const response = await llmClient.callLLM({
      userId,
      systemPrompt: CBT_CHALLENGER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 250,
      temperature: 0.6
    });

    return {
      safety: { level: risk.level },
      balancedThought: response.text.trim(),
      quotaRemaining: response.quotaRemaining
    };
  }

  /**
   * Generates 3 gentle sentence starters from a prompt or feeling.
   */
  static async generateWritingStarters(prompt, userId) {
    const risk = checkRisk(prompt || '');
    if (risk.level === 'high') {
      return {
        safety: { level: 'high' },
        starters: [
          "Right now, the most caring thing I can do for myself is...",
          "Someone I feel safe reaching out to is...",
          "A gentle reminder I need to hear right now is..."
        ]
      };
    }

    const response = await llmClient.callLLM({
      userId,
      systemPrompt: `You are a gentle writing assistant for a personal wellness journal.
Give exactly 3 distinct, thoughtful opening sentence starters based on the user's focus prompt.
Rules:
- Warm, non-intrusive, open-ended.
- Never write the whole entry, only the beginning of a sentence.
- Return ONLY a JSON array of 3 strings: ["starter 1...", "starter 2...", "starter 3..."]`,
      messages: [{ role: 'user', content: `Writing prompt/topic: "${prompt || 'How I am feeling right now'}"` }],
      maxTokens: 200,
      temperature: 0.7,
      responseMimeType: 'application/json'
    });

    try {
      const cleanJson = response.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const starters = JSON.parse(cleanJson);
      return {
        safety: { level: risk.level },
        starters: Array.isArray(starters) ? starters.slice(0, 3) : [
          "Right now, the thought that is staying with me is...",
          "If I'm completely honest about today, I felt...",
          "One thing my body has been trying to tell me is..."
        ]
      };
    } catch {
      return {
        safety: { level: risk.level },
        starters: [
          "Right now, the thought that is staying with me is...",
          "If I'm completely honest about today, I felt...",
          "One thing my body has been trying to tell me is..."
        ]
      };
    }
  }

  /**
   * Answers questions using ONLY the user's own journal entries and identifies used sources.
   *
   * @param {string} question - User question
   * @param {object} [filters={}] - Optional filters { startDate, endDate, mood }
   * @param {string} userId - Authenticated user ID
   */
  static async askDiary(question, filters = {}, userId) {
    if (!question || typeof question !== 'string' || !question.trim()) {
      const err = new Error('Question is required');
      err.statusCode = 400;
      throw err;
    }

    // 1. In-memory retrieval of excerpts with mood/date detection, scoring & safety screening
    const retrieval = await retrieveDiaryExcerpts({
      userId,
      question,
      filters
    });

    // If nothing matched or all matches were dropped
    if (retrieval.noMatch || retrieval.excerpts.length === 0) {
      await llmClient.refundDailyUsage(userId, 1);
      if (retrieval.droppedCrisisCount > 0) {
        return {
          safety: { level: 'high' },
          data: {
            answer: "I hear how painful things feel right now. Your reflections during this time contained deep pain, so they were kept completely private. Caring support is available for you.",
            usedEntryIds: [],
            usedEntries: []
          }
        };
      }
      return {
        safety: { level: 'none' },
        data: {
          answer: "I could not find that in your diary.",
          usedEntryIds: [],
          usedEntries: []
        }
      };
    }

    const sentEntries = retrieval.excerpts;
    const sentIdSet = new Set(sentEntries.map(e => e.id));
    const sentEntriesMap = new Map(sentEntries.map(e => [e.id, e]));

    // 2. Construct excerpts payload for LLM with explicit XML delimiters
    const xmlExcerpts = sentEntries.map(e => {
      const dateStr = new Date(e.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `<diary_entry id="${e.id}" date="${dateStr}" mood="${e.mood || 'neutral'}">\n<title>${e.title || 'Untitled'}</title>\n<content>\n${e.excerpt}\n</content>\n</diary_entry>`;
    }).join('\n\n');

    // 3. Short memory: retrieve last 6 messages of conversation with mode: 'diary', excluding high-risk crisis exchanges
    const history = await ChatMessage.find({
      user: userId,
      mode: 'diary',
      safetyLevel: { $ne: 'high' }
    })
      .sort({ createdAt: -1 })
      .limit(6);
    history.reverse();

    const recentHistoryText = history.length > 0
      ? history.map(m => `${(m.role || m.sender) === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
      : '';

    const droppedNote = retrieval.droppedCrisisCount > 0
      ? 'Some entries were not included because they were very painful. Do not ask about them; respond with care and mention that support is available.'
      : '';

    let userPrompt = `Available Diary Entry Excerpts:\n<diary_data>\n${xmlExcerpts}\n</diary_data>\n\n`;
    if (droppedNote) {
      userPrompt += `${droppedNote}\n\n`;
    }
    if (recentHistoryText) {
      userPrompt += `Recent Conversation History:\n${recentHistoryText}\n\n`;
    }
    userPrompt += `Current User Question: "${question.trim()}"\n\n`;
    userPrompt += `Please answer the user's question using ONLY the provided diary excerpts. Return valid JSON:\n{"answer": "...", "usedEntryIds": [...]}`;

    // 4. Call LLM (quota was already checked/deducted at Gate 3)
    const response = await llmClient.callLLM({
      userId,
      systemPrompt: ASK_DIARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: 500,
      temperature: 0.3,
      countUsage: false,
      responseMimeType: 'application/json'
    });

    let parsed = parseAskDiaryJson(response.text);
    if (!parsed) {
      // Retry once on invalid JSON
      const retryResponse = await llmClient.callLLM({
        userId,
        systemPrompt: ASK_DIARY_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: response.text },
          { role: 'user', content: 'Your response was not valid JSON. Please respond with ONLY the JSON object: {"answer": "...", "usedEntryIds": [...]}.' }
        ],
        maxTokens: 500,
        temperature: 0.2,
        countUsage: false,
        responseMimeType: 'application/json'
      });
      parsed = parseAskDiaryJson(retryResponse.text);
    }

    if (!parsed) {
      const err = new Error("Could not process diary answer. Please try again.");
      err.statusCode = 503;
      throw err;
    }

    // 5. Enforce that every usedEntryId must be in the sent set; reject any outside
    const validUsedIds = (parsed.usedEntryIds || []).filter(id => sentIdSet.has(String(id)));

    const usedEntries = validUsedIds.map(id => {
      const entry = sentEntriesMap.get(String(id));
      return {
        id: entry.id,
        title: entry.title,
        date: entry.entryDate,
        snippet: entry.snippet
      };
    });

    // 6. Crisis marker handling
    const hasCrisisSignal = parsed.answer.includes('[CRISIS_SIGNAL_DETECTED]');
    const cleanAnswer = parsed.answer.replace('[CRISIS_SIGNAL_DETECTED]', '').trim();

    // 7. Persist messages with mode: 'diary' and sources (encrypted at rest by schema)
    try {
      await ChatMessage.create({
        user: userId,
        role: 'user',
        content: question.trim(),
        mode: 'diary'
      });
      await ChatMessage.create({
        user: userId,
        role: 'assistant',
        content: cleanAnswer,
        mode: 'diary',
        sources: validUsedIds
      });
    } catch (saveErr) {
      console.error('Failed to persist Ask Diary chat turn:', saveErr.message);
    }

    return {
      safety: { level: hasCrisisSignal ? 'high' : 'none' },
      data: {
        answer: cleanAnswer,
        usedEntryIds: validUsedIds,
        usedEntries,
        quotaRemaining: response.quotaRemaining
      }
    };
  }
}

module.exports = AIService;
