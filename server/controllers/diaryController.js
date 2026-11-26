const mongoose = require('mongoose');
const { DiaryEntry, User } = require('../config/models');
const {
  isNonEmptyString,
  isValidMood,
  validateTags,
  escapeRegex
} = require('../utils/validate');
const {
  deleteCloudinaryMedia,
  isValidCloudinaryUrl
} = require('../config/cloudinary');
const { checkRisk } = require('../utils/riskCheck');
const {
  SANITIZE_CONTENT_OPTIONS,
  sanitizeContent,
  stripAllTags
} = require('../utils/sanitize');
const {
  startOfDay,
  endOfDay,
  keyOf,
  todayKey,
  getPreviousDateKey,
  diffInCalendarDays
} = require('../utils/dates');

function validateEntryMedia(media, userId) {
  if (!media) return { valid: true, items: [] };
  if (!Array.isArray(media)) {
    return { valid: false, error: 'Media must be an array of media objects' };
  }
  if (media.length > 10) {
    return { valid: false, error: 'An entry can contain at most 10 media items' };
  }
  if (media.length > 0 && !process.env.CLOUDINARY_CLOUD_NAME) {
    return { valid: false, error: 'Cloudinary storage is not configured on this server' };
  }

  const expectedPrefix = `mydiary/user_${userId}/`;
  const validTypes = ['image', 'video', 'audio'];
  const cleaned = [];

  for (const item of media) {
    if (!item || typeof item !== 'object') {
      return { valid: false, error: 'Invalid media item format' };
    }
    if (!isNonEmptyString(item.url) || !isNonEmptyString(item.publicId) || !validTypes.includes(item.type)) {
      return { valid: false, error: 'Each media item must have a valid url, publicId, and type (image, video, audio)' };
    }
    // Verify each media.publicId starts with the CURRENT user's folder prefix
    if (!item.publicId.startsWith(expectedPrefix)) {
      return { valid: false, error: 'Media asset does not belong to your account' };
    }
    if (!isValidCloudinaryUrl(item.url)) {
      return { valid: false, error: 'Media URLs must originate from the verified Cloudinary storage' };
    }
    if (item.caption) {
      const rawCaption = stripAllTags(String(item.caption));
      if ([...rawCaption].length > 500) {
        return { valid: false, error: 'Media caption cannot exceed 500 characters' };
      }
    }
    cleaned.push({
      url: item.url.trim(),
      publicId: item.publicId.trim(),
      type: item.type,
      thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl.trim() : item.url.trim(),
      caption: typeof item.caption === 'string' ? stripAllTags(item.caption).slice(0, 500) : '',
      bytes: typeof item.bytes === 'number' ? item.bytes : undefined
    });
  }

  return { valid: true, items: cleaned };
}

async function recalculateUserStreaks(userId) {
  const entries = await DiaryEntry.find({ user: userId })
    .select('entryDate')
    .sort({ entryDate: 1 });

  const user = await User.findById(userId).select('timezone');
  const tz = user?.timezone || 'UTC';

  if (entries.length === 0) {
    await User.findByIdAndUpdate(userId, {
      totalEntries: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastEntryDate: null
    });
    return { totalEntries: 0, currentStreak: 0, longestStreak: 0, lastEntryDate: null };
  }

  const dayKeysSet = new Set();
  let maxDate = null;
  for (const e of entries) {
    if (e.entryDate && !isNaN(new Date(e.entryDate).getTime())) {
      const key = keyOf(e.entryDate, tz);
      dayKeysSet.add(key);
      const d = new Date(e.entryDate);
      if (!maxDate || d > maxDate) maxDate = d;
    }
  }

  const dayKeys = Array.from(dayKeysSet).sort();

  let longestStreak = 0;
  let runningStreak = 0;
  let prevKey = null;

  for (const key of dayKeys) {
    if (prevKey === null) {
      runningStreak = 1;
    } else {
      const diff = diffInCalendarDays(prevKey, key);
      if (diff === 1) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) longestStreak = runningStreak;
    prevKey = key;
  }

  const today = todayKey(tz);
  const yesterday = getPreviousDateKey(today);

  const latestKey = dayKeys[dayKeys.length - 1];
  let currentStreak = 0;

  if (latestKey === today || latestKey === yesterday) {
    currentStreak = 1;
    let checkKey = latestKey;
    for (let i = dayKeys.length - 2; i >= 0; i--) {
      if (diffInCalendarDays(dayKeys[i], checkKey) === 1) {
        currentStreak += 1;
        checkKey = dayKeys[i];
      } else {
        break;
      }
    }
  }

  await User.findByIdAndUpdate(userId, {
    totalEntries: entries.length,
    currentStreak,
    longestStreak,
    lastEntryDate: maxDate
  });

  return {
    totalEntries: entries.length,
    currentStreak,
    longestStreak,
    lastEntryDate: maxDate
  };
}

const getEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, mood, tags, startDate, endDate, search } = req.query;
    
    const query = { user: req.user.id };
    
    if (mood && typeof mood === 'string' && isValidMood(mood)) {
      query.mood = mood;
    }
    
    if (tags) {
      if (typeof tags === 'string') {
        const tagList = tags.split(',').map(stripAllTags).filter(Boolean);
        if (tagList.length > 0) query.tags = { $in: tagList };
      } else if (Array.isArray(tags)) {
        const tagList = tags.map(stripAllTags).filter(Boolean);
        if (tagList.length > 0) query.tags = { $in: tagList };
      }
    }
    
    if (startDate || endDate) {
      const user = await User.findById(req.user.id).select('timezone');
      const tz = user?.timezone || 'UTC';
      query.entryDate = {};
      if (startDate) {
        query.entryDate.$gte = startOfDay(startDate, tz);
      }
      if (endDate) {
        query.entryDate.$lte = endOfDay(endDate, tz);
      }
    }
    
    if (search && typeof search === 'string') {
      const searchTrimmed = search.trim();
      const safeSearch = escapeRegex(searchTrimmed);
      const searchLower = searchTrimmed.toLowerCase();

      // Content is encrypted at rest in MongoDB.
      // Search title & tags in database, and decrypt content in-memory for this user's entries up to a cap of 500.
      const candidates = await DiaryEntry.find(query)
        .sort({ entryDate: -1, createdAt: -1 })
        .limit(500);

      const titleRegex = new RegExp(safeSearch, 'i');
      const matchedEntries = candidates.filter((entry) => {
        if (entry.title && titleRegex.test(entry.title)) return true;
        if (Array.isArray(entry.tags) && entry.tags.some((t) => titleRegex.test(t))) return true;
        const decryptedContent = entry.content || '';
        return decryptedContent.toLowerCase().includes(searchLower);
      });

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
      const total = matchedEntries.length;
      const paginated = matchedEntries.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        success: true,
        count: paginated.length,
        searchedLimit: 500,
        searchNote: 'searched the latest 500 entries',
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1
        },
        data: paginated
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const options = {
      page: pageNum,
      limit: limitNum,
      sort: { entryDate: -1, createdAt: -1 }
    };
    
    const entries = await DiaryEntry.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
    
    const total = await DiaryEntry.countDocuments(query);
    
    res.json({
      success: true,
      count: entries.length,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      },
      data: entries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns non-encrypted calendar metadata for a given month (YYYY-MM).
 * Never selects or decrypts entry content.
 */
const getCalendarMonth = async (req, res, next) => {
  try {
    const { month } = req.query;
    if (!month || typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter month must be in YYYY-MM format'
      });
    }

    const [yearStr, monthStr] = month.split('-');
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const lastDay = new Date(Date.UTC(yearNum, monthNum, 0)).getUTCDate();
    const fromKey = `${month}-01`;
    const toKey = `${month}-${String(lastDay).padStart(2, '0')}`;

    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';
    const start = startOfDay(fromKey, tz);
    const end = endOfDay(toKey, tz);

    const rows = await DiaryEntry.find({
      user: req.user.id,
      entryDate: { $gte: start, $lte: end }
    })
      .select('entryDate dateKey mood media')
      .sort({ entryDate: 1 })
      .lean();

    const byDate = new Map();
    for (const row of rows) {
      const date = row.dateKey || keyOf(row.entryDate, tz);
      const hasMedia = Array.isArray(row.media) && row.media.length > 0;
      const existing = byDate.get(date);
      if (!existing) {
        byDate.set(date, {
          date,
          count: 1,
          mood: row.mood || 'neutral',
          hasMedia
        });
      } else {
        existing.count += 1;
        existing.hasMedia = existing.hasMedia || hasMedia;
        if (row.mood) existing.mood = row.mood;
      }
    }

    res.json({
      success: true,
      month,
      data: Array.from(byDate.values())
    });
  } catch (error) {
    next(error);
  }
};

const getEntry = async (req, res, next) => {
  try {
    const entry = await DiaryEntry.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

const createEntry = async (req, res, next) => {
  try {
    const { title, content, mood, tags, date, entryDate: incomingEntryDate, images, media, aiExcluded } = req.body;

    if (!isNonEmptyString(title) || !isNonEmptyString(content) || !isNonEmptyString(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and mood are required'
      });
    }

    if (!isValidMood(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mood value'
      });
    }

    const validatedTags = validateTags(tags);
    if (validatedTags === null) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be a string or array of strings'
      });
    }

    if (validatedTags.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Cannot provide more than 20 tags'
      });
    }

    if (validatedTags.some(t => [...t].length > 30)) {
      return res.status(400).json({
        success: false,
        message: 'Each tag cannot exceed 30 characters'
      });
    }

    if (typeof content === 'string' && [...content].length > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Entry content cannot exceed 100,000 characters'
      });
    }

    const cleanTitle = stripAllTags(title);
    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      });
    }

    const mediaResult = validateEntryMedia(media, req.user.id);
    if (!mediaResult.valid) {
      return res.status(400).json({
        success: false,
        message: mediaResult.error
      });
    }

    const cleanContent = sanitizeContent(content);
    const cleanTags = validatedTags.map(stripAllTags).filter(Boolean);

    const plainText = cleanContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText ? plainText.split(' ').filter(word => word.length > 0).length : 0;
    const readingTime = Math.ceil((wordCount || 1) / 200);

    const rawDate = incomingEntryDate || date;
    if (rawDate !== undefined && rawDate !== null) {
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entry date format'
        });
      }
    }
    const finalEntryDate = rawDate ? new Date(rawDate) : new Date();

    const entryMedia = mediaResult.items;
    const entryImages = Array.isArray(images) && images.length > 0
      ? images
      : entryMedia.filter(m => m.type === 'image').map(m => m.url);

    const entry = await DiaryEntry.create({
      user: req.user.id,
      title: cleanTitle,
      content: cleanContent,
      mood,
      tags: cleanTags,
      images: entryImages,
      media: entryMedia,
      entryDate: finalEntryDate,
      wordCount,
      readingTime,
      aiExcluded: typeof aiExcluded === 'boolean' ? aiExcluded : false
    });

    await recalculateUserStreaks(req.user.id);

    const risk = checkRisk(cleanTitle + ' ' + plainText);

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      data: entry,
      safety: { level: risk.level }
    });
  } catch (error) {
    next(error);
  }
};

const updateEntry = async (req, res, next) => {
  try {
    const { title, content, mood, tags, date, entryDate: incomingEntryDate, images, media, aiExcluded } = req.body;

    if (!isNonEmptyString(title) || !isNonEmptyString(content) || !isNonEmptyString(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and mood are required'
      });
    }

    if (!isValidMood(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mood value'
      });
    }

    const validatedTags = validateTags(tags);
    if (validatedTags === null) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be a string or array of strings'
      });
    }

    if (validatedTags.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Cannot provide more than 20 tags'
      });
    }

    if (validatedTags.some(t => [...t].length > 30)) {
      return res.status(400).json({
        success: false,
        message: 'Each tag cannot exceed 30 characters'
      });
    }

    if (typeof content === 'string' && [...content].length > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Entry content cannot exceed 100,000 characters'
      });
    }

    const cleanTitle = stripAllTags(title);
    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      });
    }

    const mediaResult = validateEntryMedia(media, req.user.id);
    if (!mediaResult.valid) {
      return res.status(400).json({
        success: false,
        message: mediaResult.error
      });
    }

    const cleanContent = sanitizeContent(content);
    const cleanTags = validatedTags.map(stripAllTags).filter(Boolean);

    const plainText = cleanContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText ? plainText.split(' ').filter(word => word.length > 0).length : 0;
    const readingTime = Math.ceil((wordCount || 1) / 200);

    const existingEntry = await DiaryEntry.findOne({ _id: req.params.id, user: req.user.id });
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    const entryMedia = mediaResult.items;
    const entryImages = Array.isArray(images) && images.length > 0
      ? images
      : entryMedia.filter(m => m.type === 'image').map(m => m.url);

    // If media items were removed in this update, clean them from Cloudinary asynchronously
    if (Array.isArray(existingEntry.media) && existingEntry.media.length > 0) {
      const newPublicIds = new Set(entryMedia.map(m => m.publicId));
      const removedMedia = existingEntry.media.filter(m => !newPublicIds.has(m.publicId));
      for (const rem of removedMedia) {
        deleteCloudinaryMedia(rem.publicId, rem.type).catch(() => {});
      }
    }

    const updateFields = {
      title: cleanTitle,
      content: cleanContent,
      mood,
      tags: cleanTags,
      images: entryImages,
      media: entryMedia,
      wordCount,
      readingTime
    };

    if (typeof aiExcluded === 'boolean') {
      updateFields.aiExcluded = aiExcluded;
    }

    // If date or entryDate is explicitly sent, update it; otherwise KEEP old entryDate
    const rawDate = incomingEntryDate || date;
    if (rawDate !== undefined && rawDate !== null) {
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid entry date format'
        });
      }
      updateFields.entryDate = parsedDate;
    }

    const entry = await DiaryEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateFields,
      { new: true, runValidators: true }
    );

    await recalculateUserStreaks(req.user.id);

    const risk = checkRisk(cleanTitle + ' ' + plainText);

    res.json({
      success: true,
      message: 'Entry updated successfully',
      data: entry,
      safety: { level: risk.level }
    });
  } catch (error) {
    next(error);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    const entry = await DiaryEntry.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    // Delete attached Cloudinary files when an entry is deleted
    if (Array.isArray(entry.media) && entry.media.length > 0) {
      for (const item of entry.media) {
        deleteCloudinaryMedia(item.publicId, item.type).catch(() => {});
      }
    }

    await DiaryEntry.deleteOne({ _id: entry._id });

    // Recalculate streaks and totalEntries accurately
    await recalculateUserStreaks(req.user.id);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getTags = async (req, res, next) => {
  try {
    const tags = await DiaryEntry.distinct('tags', { user: req.user.id });
    res.json({
      success: true,
      data: tags.filter(tag => tag)
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const user = await User.findById(req.user.id).select('timezone');
    const tz = user?.timezone || 'UTC';

    const totalEntries = await DiaryEntry.countDocuments({ user: req.user.id });
    
    const moodStats = await DiaryEntry.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const thisMonthKey = todayKey(tz).slice(0, 7) + '-01';
    const thisMonth = startOfDay(thisMonthKey, tz);
    
    const entriesThisMonth = await DiaryEntry.countDocuments({
      user: req.user.id,
      entryDate: { $gte: thisMonth }
    });
    
    const thirtyDaysAgoKey = todayKey(tz);
    const thirtyDaysAgo = new Date(startOfDay(thirtyDaysAgoKey, tz).getTime() - 30 * 86400000);

    const dailyMoodStats = await DiaryEntry.aggregate([
      {
        $match: {
          user: userObjectId,
          entryDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$entryDate', timezone: tz } },
            mood: '$mood'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          mood: '$_id.mood',
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    const recentEntries = await DiaryEntry.find({ user: req.user.id })
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(5)
      .select('title entryDate mood tags');

    res.json({
      success: true,
      data: {
        totalEntries,
        entriesThisMonth,
        moodStats,
        dailyMoodStats,
        recentEntries
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEntries,
  getCalendarMonth,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getTags,
  getStats
};
