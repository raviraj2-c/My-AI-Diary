const { Storybook, DiaryEntry } = require('../config/models');
const { generateStorybook } = require('../services/aiService');

const generateStorybookController = async (req, res, next) => {
  try {
    const { theme, startDate, endDate } = req.body;

    if (!theme || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Theme, start date, and end date are required'
      });
    }

    const validThemes = ['romantic', 'dramatic', 'adventure', 'mystery', 'comedy'];
    if (!validThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme. Must be one of: ' + validThemes.join(', ')
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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

    const entries = await DiaryEntry.find({
      user: req.user.id,
      entryDate: { $gte: start, $lte: end }
    }).sort({ entryDate: 1 });

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No entries found in the selected date range'
      });
    }

    const storybookData = await generateStorybook(entries, theme, {
      start,
      end
    });

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
      data: {
        id: storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: storybook.startDate,
          end: storybook.endDate
        },
        generatedContent: storybook.generatedContent,
        wordCount: storybook.wordCount,
        pageCount: storybook.pageCount,
        createdAt: storybook.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getStorybooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: Math.min(50, parseInt(limit) || 10)
    };
    
    const storybooks = await Storybook.find({ user: req.user.id })
      .select('-generatedContent -protagonist -chapters')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort({ createdAt: -1 });
    
    const total = await Storybook.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      count: storybooks.length,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      },
      data: storybooks
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
      data: storybook
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

module.exports = {
  generateStorybookController,
  getStorybooks,
  getStorybook,
  deleteStorybook
};