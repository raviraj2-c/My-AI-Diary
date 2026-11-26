const mongoose = require('mongoose');
const { Storybook, DiaryEntry, ThoughtRecord, User, ChatMessage } = require('../config/models');
const AIService = require('../services/aiService');
const llmClient = require('../services/llmClient');
const { sanitizeContent, stripAllTags } = require('../utils/sanitize');
const { checkRisk } = require('../utils/riskCheck');
const { startOfDay, endOfDay } = require('../utils/dates');

function evenlySample(arr, maxCount) {
  if (arr.length <= maxCount) return arr;

  const indexed = arr.map((item, idx) => ({ item, idx }));
  const favorites = indexed.filter((x) => Boolean(x.item?.isFavorite));
  const nonFavorites = indexed.filter((x) => !x.item?.isFavorite);

  const sampleList = (list, count) => {
    if (count <= 0) return [];
    if (list.length <= count) return list;
    if (count === 1) return [list[0]];
    const picked = [];
    const step = (list.length - 1) / (count - 1);
    for (let i = 0; i < count; i++) {
      picked.push(list[Math.round(i * step)]);
    }
    return picked;
  };

  let chosen;
  if (favorites.length >= maxCount) {
    chosen = sampleList(favorites, maxCount);
  } else {
    const remaining = maxCount - favorites.length;
    chosen = [...favorites, ...sampleList(nonFavorites, remaining)].sort((a, b) => a.idx - b.idx);
  }

  return chosen.map((x) => x.item);
}

const generateStorybookController = async (req, res, next) => {
  try {
    const {
      theme,
      startDate,
      endDate,
      protagonistNickname,
      length = 'medium',
      language = 'en',
      tone = 'reflective',
      entryIds
    } = req.body;

    if (!theme) {
      return res.status(400).json({
        success: false,
        message: 'Theme is required'
      });
    }

    const validThemes = ['romantic', 'dramatic', 'adventure', 'mystery', 'comedy'];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be one of: ' + validThemes.join(', ')
      });
    }

    const validLengths = ['short', 'medium', 'long'];
    if (length && !validLengths.includes(length)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid length. Must be one of: ' + validLengths.join(', ')
      });
    }

    const validLanguages = ['en', 'hi', 'hinglish'];
    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Must be one of: ' + validLanguages.join(', ')
      });
    }

    const validTones = ['gentle', 'hopeful', 'funny', 'reflective'];
    if (tone && !validTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tone. Must be one of: ' + validTones.join(', ')
      });
    }

    let sanitizedNickname = '';
    if (protagonistNickname !== undefined && protagonistNickname !== null) {
      sanitizedNickname = stripAllTags(String(protagonistNickname));
      if (sanitizedNickname.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Protagonist nickname cannot exceed 30 characters'
        });
      }
    }

    let entries = [];
    let start, end;

    if (entryIds !== undefined) {
      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one entry must be selected'
        });
      }

      if (entryIds.length > 366) {
        return res.status(400).json({
          success: false,
          message: 'Cannot select more than 366 entries'
        });
      }

      for (const id of entryIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid entry ID format'
          });
        }
      }

      entries = await DiaryEntry.find({
        _id: { $in: entryIds },
        user: req.user.id
      }).sort({ entryDate: 1 });

      if (entries.length !== entryIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected entries were not found or belong to another user'
        });
      }

      const excludedEntries = entries.filter(e => e.aiExcluded);
      if (excludedEntries.length > 0) {
        return res.status(400).json({
          success: false,
          message: `${excludedEntries.length} selected ${excludedEntries.length === 1 ? 'entry is' : 'entries are'} hidden from AI features and cannot be used in a storybook`
        });
      }

      start = entries[0].entryDate || new Date();
      end = entries[entries.length - 1].entryDate || new Date();
    } else {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required when entry IDs are not provided'
        });
      }

      try {
        start = startOfDay(startDate);
        end = endOfDay(endDate);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before or equal to end date'
        });
      }

      const diffMs = end.getTime() - start.getTime();
      const maxMs = 366 * 24 * 60 * 60 * 1000;
      if (diffMs > maxMs) {
        return res.status(400).json({
          success: false,
          message: 'Date range cannot exceed 366 days'
        });
      }

      entries = await DiaryEntry.find({
        user: req.user.id,
        aiExcluded: { $ne: true },
        entryDate: { $gte: start, $lte: end }
      }).sort({ entryDate: 1 });

      if (entries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No reflections found in the selected date range. Write an entry or broaden your dates.',
          count: 0
        });
      }
    }

    const entriesForAI = evenlySample(entries, 40);

    const storybookData = await AIService.generateStorybook(
      entriesForAI,
      theme,
      { start, end },
      {
        protagonistNickname: sanitizedNickname,
        length,
        language,
        tone
      },
      req.user.id
    );

    const plainText = storybookData.generatedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(' ').filter(word => word.length > 0).length;
    const pageCount = Math.ceil(wordCount / 250);

    const storybook = await Storybook.create({
      user: req.user.id,
      title: storybookData.title,
      theme,
      startDate: start,
      endDate: end,
      generatedContent: storybookData.generatedContent,
      protagonist: storybookData.protagonist || {},
      chapters: storybookData.chapters || [],
      wordCount,
      pageCount,
      status: 'completed'
    });

    res.json({
      success: true,
      message: 'Storybook generated successfully',
      safety: storybookData.safety,
      excludedCount: storybookData.excludedCount || 0,
      entriesUsed: entriesForAI.length,
      data: {
        id: storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: storybook.startDate,
          end: storybook.endDate
        },
        generatedContent: storybook.generatedContent,
        protagonist: storybook.protagonist,
        chapters: storybook.chapters,
        wordCount: storybook.wordCount,
        pageCount: storybook.pageCount,
        entriesUsed: entriesForAI.length,
        createdAt: storybook.createdAt
      }
    });
  } catch (error) {
    if (error.safety) {
      return res.status(error.statusCode || 400).json({
        success: false,
        safety: error.safety,
        excludedCount: error.excludedCount,
        message: error.message
      });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const getStorybooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [storybooks, total] = await Promise.all([
      Storybook.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('title theme startDate endDate protagonist chapters wordCount pageCount createdAt status'),
      Storybook.countDocuments({ user: req.user.id })
    ]);

    const formattedStorybooks = storybooks.map(sb => ({
      id: sb._id,
      title: sb.title,
      theme: sb.theme,
      timeframe: {
        start: sb.startDate,
        end: sb.endDate
      },
      protagonist: sb.protagonist,
      chapterCount: Array.isArray(sb.chapters) ? sb.chapters.length : 0,
      wordCount: sb.wordCount,
      pageCount: sb.pageCount,
      createdAt: sb.createdAt,
      status: sb.status
    }));

    res.json({
      success: true,
      data: formattedStorybooks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStorybook = async (req, res, next) => {
  try {
    const storybook = await Storybook.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!storybook) {
      return res.status(404).json({
        success: false,
        message: 'Storybook not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: storybook.startDate,
          end: storybook.endDate
        },
        generatedContent: storybook.generatedContent,
        protagonist: storybook.protagonist,
        chapters: storybook.chapters,
        wordCount: storybook.wordCount,
        pageCount: storybook.pageCount,
        createdAt: storybook.createdAt,
        status: storybook.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteStorybook = async (req, res, next) => {
  try {
    const storybook = await Storybook.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!storybook) {
      return res.status(404).json({
        success: false,
        message: 'Storybook not found'
      });
    }

    res.json({
      success: true,
      message: 'Storybook deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateStorybook = async (req, res, next) => {
  try {
    const storybook = await Storybook.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!storybook) {
      return res.status(404).json({
        success: false,
        message: 'Storybook not found'
      });
    }

    const { title, chapters } = req.body;

    if (title !== undefined) {
      const cleanTitle = stripAllTags(String(title)).trim();
      if (!cleanTitle) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty'
        });
      }
      storybook.title = cleanTitle;
    }

    if (chapters !== undefined) {
      if (!Array.isArray(chapters) || chapters.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one chapter is required'
        });
      }

      const cleanChapters = [];
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const chTitle = stripAllTags(String(ch.title || `Chapter ${i + 1}`)).trim();
        const chContent = sanitizeContent(String(ch.content || '')).trim();
        if (!chContent) {
          return res.status(400).json({
            success: false,
            message: `Chapter ${i + 1} content cannot be empty`
          });
        }
        cleanChapters.push({
          chapterNumber: ch.chapterNumber || i + 1,
          title: chTitle,
          content: chContent
        });
      }
      storybook.chapters = cleanChapters;
    }

    // Rebuild generatedContent
    let newContent = `# ${storybook.title}\n\n`;
    if (storybook.protagonist?.name) {
      newContent += `**Protagonist:** ${storybook.protagonist.name}\n\n`;
    }
    if (Array.isArray(storybook.chapters)) {
      storybook.chapters.forEach((ch) => {
        newContent += `---\n\n## ${ch.title}\n\n${ch.content}\n\n`;
      });
    }
    storybook.generatedContent = newContent.trim();
    const plain = storybook.generatedContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    storybook.wordCount = plain.split(' ').filter(w => w.length > 0).length;
    storybook.pageCount = Math.ceil(storybook.wordCount / 250);

    await storybook.save();

    res.json({
      success: true,
      message: 'Storybook updated successfully',
      data: {
        id: storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: storybook.startDate,
          end: storybook.endDate
        },
        generatedContent: storybook.generatedContent,
        protagonist: storybook.protagonist,
        chapters: storybook.chapters,
        wordCount: storybook.wordCount,
        pageCount: storybook.pageCount,
        createdAt: storybook.createdAt,
        updatedAt: storybook.updatedAt,
        status: storybook.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reflects gently on a saved diary entry.
 */
const reflectOnEntry = async (req, res, next) => {
  try {
    const { content, mood, entryId } = req.body;
    let entryContent = content;
    let entryMood = mood;

    if (entryId) {
      if (!mongoose.Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
      }
      const entry = await DiaryEntry.findOne({ _id: entryId, user: req.user.id });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }
      if (entry.aiExcluded) {
        return res.status(400).json({ success: false, message: 'This entry is hidden from AI features.' });
      }
      if (!entryContent) entryContent = entry.content;
      if (!entryMood) entryMood = entry.mood;
    } else if (entryContent) {
      const excludedEntries = await DiaryEntry.find({ user: req.user.id, aiExcluded: true }).select('content');
      const normInput = stripAllTags(entryContent).replace(/\s+/g, ' ').trim().toLowerCase();
      const isExcluded = excludedEntries.some(e => {
        const normExisting = stripAllTags(e.content || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return normExisting === normInput;
      });
      if (isExcluded) {
        return res.status(400).json({ success: false, message: 'This entry is hidden from AI features.' });
      }
    }

    if (!entryContent) {
      return res.status(400).json({ success: false, message: 'Content is required for reflection' });
    }

    const result = await AIService.generateReflection(entryContent, entryMood, req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Emotional tone detection for text editor.
 */
const analyzeMoodController = async (req, res, next) => {
  try {
    const { text, entryId } = req.body;
    let textToAnalyze = text;

    if (entryId) {
      if (!mongoose.Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
      }
      const entry = await DiaryEntry.findOne({ _id: entryId, user: req.user.id });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }
      if (entry.aiExcluded) {
        return res.status(400).json({ success: false, message: 'This entry is hidden from AI features.' });
      }
      if (!textToAnalyze) textToAnalyze = entry.content;
    } else if (textToAnalyze) {
      const excludedEntries = await DiaryEntry.find({ user: req.user.id, aiExcluded: true }).select('content');
      const normInput = stripAllTags(textToAnalyze).replace(/\s+/g, ' ').trim().toLowerCase();
      const isExcluded = excludedEntries.some(e => {
        const normExisting = stripAllTags(e.content || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return normExisting === normInput;
      });
      if (isExcluded) {
        return res.status(400).json({ success: false, message: 'This entry is hidden from AI features.' });
      }
    }

    if (!textToAnalyze || typeof textToAnalyze !== 'string') {
      return res.status(400).json({ success: false, message: 'Text string is required' });
    }

    const result = await AIService.analyzeMood(textToAnalyze, req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * CBT thought challenger reframing helper.
 */
const challengeThoughtController = async (req, res, next) => {
  try {
    const { situation, thought, evidenceFor, evidenceAgainst } = req.body;
    if (!thought) {
      return res.status(400).json({ success: false, message: 'Automatic thought is required' });
    }

    const result = await AIService.challengeThought(
      { situation, thought, evidenceFor, evidenceAgainst },
      req.user.id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Writing sentence starters helper.
 */
const getWritingStartersController = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const result = await AIService.generateWritingStarters(prompt, req.user.id);
    res.json({
      success: true,
      safety: result.safety,
      data: result
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Returns current daily AI quota status for user.
 */
const getAIUsageController = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('aiDailyUsage allowAIFeatures allowDiaryAI');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const lastResetDate = new Date(user.aiDailyUsage?.lastReset || now);
    const isSameDay =
      now.getUTCFullYear() === lastResetDate.getUTCFullYear() &&
      now.getUTCMonth() === lastResetDate.getUTCMonth() &&
      now.getUTCDate() === lastResetDate.getUTCDate();

    const count = isSameDay ? (user.aiDailyUsage?.count || 0) : 0;

    res.json({
      success: true,
      data: {
        count,
        limit: llmClient.DAILY_LIMIT,
        remaining: Math.max(0, llmClient.DAILY_LIMIT - count),
        allowAIFeatures: Boolean(user.allowAIFeatures),
        allowDiaryAI: Boolean(user.allowDiaryAI)
      }
    });
  } catch (error) {
    next(error);
  }
};

function parseIntensity(val, defaultVal = 50) {
  if (val === null || val === undefined || val === '') return defaultVal;
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.min(100, Math.max(0, num));
}

/**
 * Thought Records CRUD (CBT)
 */
const saveThoughtRecord = async (req, res, next) => {
  try {
    const {
      situation,
      thought,
      emotion,
      initialIntensity,
      evidenceFor,
      evidenceAgainst,
      balancedThought,
      finalIntensity,
      aiAssisted
    } = req.body;

    if (!situation || !thought) {
      return res.status(400).json({ success: false, message: 'Situation and thought are required' });
    }

    if (typeof situation === 'string' && [...situation].length > 2000) {
      return res.status(400).json({ success: false, message: 'Situation cannot exceed 2000 characters' });
    }
    if (typeof thought === 'string' && [...thought].length > 2000) {
      return res.status(400).json({ success: false, message: 'Thought cannot exceed 2000 characters' });
    }
    if (emotion && typeof emotion === 'string' && [...emotion].length > 50) {
      return res.status(400).json({ success: false, message: 'Emotion cannot exceed 50 characters' });
    }
    if (evidenceFor && typeof evidenceFor === 'string' && [...evidenceFor].length > 2000) {
      return res.status(400).json({ success: false, message: 'Evidence for cannot exceed 2000 characters' });
    }
    if (evidenceAgainst && typeof evidenceAgainst === 'string' && [...evidenceAgainst].length > 2000) {
      return res.status(400).json({ success: false, message: 'Evidence against cannot exceed 2000 characters' });
    }
    if (balancedThought && typeof balancedThought === 'string' && [...balancedThought].length > 2000) {
      return res.status(400).json({ success: false, message: 'Balanced thought cannot exceed 2000 characters' });
    }

    const freeText = `${situation || ''} ${thought || ''} ${evidenceFor || ''} ${evidenceAgainst || ''} ${balancedThought || ''}`;
    const risk = checkRisk(freeText);

    const record = await ThoughtRecord.create({
      user: req.user.id,
      situation,
      thought,
      emotion: emotion || 'anxious',
      initialIntensity: parseIntensity(initialIntensity, 50),
      evidenceFor: evidenceFor || '',
      evidenceAgainst: evidenceAgainst || '',
      balancedThought: balancedThought || '',
      finalIntensity: parseIntensity(finalIntensity, 50),
      aiAssisted: Boolean(aiAssisted)
    });

    res.status(201).json({
      success: true,
      message: 'Thought record saved',
      safety: { level: risk.level },
      data: record
    });
  } catch (error) {
    next(error);
  }
};

const getThoughtRecords = async (req, res, next) => {
  try {
    const records = await ThoughtRecord.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

const deleteThoughtRecord = async (req, res, next) => {
  try {
    const record = await ThoughtRecord.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Thought record not found' });
    }

    res.json({
      success: true,
      message: 'Thought record deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Answers questions using the user's own journal entries and returns used sources.
 */
const askDiaryController = async (req, res, next) => {
  try {
    const { question, startDate, endDate, mood } = req.body;

    // Gate 1: Require BOTH allowAIFeatures and allowDiaryAI (else 403 DIARY_AI_DISABLED)
    if (!req.user || !req.user.allowAIFeatures || !req.user.allowDiaryAI) {
      return res.status(403).json({
        success: false,
        code: 'DIARY_AI_DISABLED',
        message: 'Diary AI reading is disabled in your account settings. Turn on AI features and allow diary reading in Settings to continue.'
      });
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const cleanQuestion = question.trim().slice(0, 1000);

    // Gate 2: riskCheck on the question, and if HIGH make no AI call and return fixed caring reply plus safety flag
    const risk = checkRisk(cleanQuestion);
    if (risk.level === 'high') {
      const caringReply = "I hear how painful or overwhelming things feel right now. You matter, and you do not have to carry this alone. Please reach out to someone you trust or talk with a free, confidential helpline right away.";
      return res.json({
        success: true,
        safety: { level: 'high' },
        data: {
          answer: caringReply,
          usedEntryIds: [],
          usedEntries: []
        }
      });
    }

    // Gate 3: the 30/day limit (429) is enforced before retrieval/LLM
    const quota = await llmClient.checkAndIncrementUsage(req.user.id);

    try {
      const result = await AIService.askDiary(cleanQuestion, { startDate, endDate, mood }, req.user.id);

      res.json({
        success: true,
        safety: result.safety,
        data: {
          ...result.data,
          quotaRemaining: result.data.quotaRemaining ?? quota.remaining
        }
      });
    } catch (err) {
      await llmClient.refundDailyUsage(req.user.id, 1);
      throw err;
    }
  } catch (error) {
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

const getAskDiaryHistory = async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ user: req.user.id, mode: 'diary' })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({
      success: true,
      data: messages.map(m => ({
        id: m._id.toString(),
        sender: m.sender,
        content: m.content,
        sources: (m.sources || []).map(s => s.toString()),
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

const clearAskDiaryHistory = async (req, res, next) => {
  try {
    await ChatMessage.deleteMany({ user: req.user.id, mode: 'diary' });
    res.json({
      success: true,
      message: 'Ask Diary history cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateStorybookController,
  getStorybooks,
  getStorybook,
  updateStorybook,
  deleteStorybook,
  reflectOnEntry,
  analyzeMoodController,
  challengeThoughtController,
  getWritingStartersController,
  getAIUsageController,
  saveThoughtRecord,
  getThoughtRecords,
  deleteThoughtRecord,
  askDiaryController,
  getAskDiaryHistory,
  clearAskDiaryHistory
};
