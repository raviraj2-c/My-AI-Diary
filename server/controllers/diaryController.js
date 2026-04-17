const { DiaryEntry, User } = require('../config/models');

const getEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, mood, tags, startDate, endDate, search } = req.query;
    
    let query = { user: req.user.id };
    
    if (mood) {
      query.mood = mood;
    }
    
    if (tags) {
      const tagList = tags.split(',');
      query.tags = { $in: tagList };
    }
    
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: Math.min(100, parseInt(limit) || 10),
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
    const { title, content, mood, tags, date, images } = req.body;

    if (!title || !content || !mood) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and mood are required'
      });
    }

    const allowedMoods = ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'peaceful'];
    if (!allowedMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mood value'
      });
    }

    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText ? plainText.split(' ').filter(word => word.length > 0).length : 0;
    const readingTime = Math.ceil((wordCount || 1) / 200);

    const entryDate = date ? new Date(date) : new Date();

    const entry = await DiaryEntry.create({
      user: req.user.id,
      title,
      content,
      mood,
      tags: tags || [],
      images: images || [],
      entryDate,
      wordCount,
      readingTime
    });

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalEntries: 1 },
      lastEntryDate: entryDate
    });

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

const updateEntry = async (req, res, next) => {
  try {
    const { title, content, mood, tags, date, images } = req.body;

    if (!title || !content || !mood) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and mood are required'
      });
    }

    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText ? plainText.split(' ').filter(word => word.length > 0).length : 0;
    const readingTime = Math.ceil((wordCount || 1) / 200);

    const entryDate = date ? new Date(date) : new Date();

    const entry = await DiaryEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        title,
        content,
        mood,
        tags: tags || [],
        images: images || [],
        entryDate,
        wordCount,
        readingTime
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Entry updated successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    const entry = await DiaryEntry.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found'
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalEntries: -1 }
    });

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
    const totalEntries = await DiaryEntry.countDocuments({ user: req.user.id });
    
    const moodStats = await DiaryEntry.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const entriesThisMonth = await DiaryEntry.countDocuments({
      user: req.user.id,
      entryDate: { $gte: thisMonth }
    });
    
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
        recentEntries
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  getTags,
  getStats
};