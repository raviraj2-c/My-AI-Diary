const { DiaryEntry, Storybook } = require('../config/models');

const exportEntries = async (req, res, next) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    let query = { user: req.user.id };
    
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }

    const entries = await DiaryEntry.find(query).sort({ entryDate: -1 });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="diary_entries.json"');
      res.json({
        success: true,
        data: entries,
        exportedAt: new Date(),
        totalEntries: entries.length
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format'
      });
    }
  } catch (error) {
    next(error);
  }
};

const trackStorybookDownload = async (req, res, next) => {
  try {
    const storybook = await Storybook.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!storybook) {
      return res.status(404).json({
        success: false,
        message: 'Storybook not found'
      });
    }

    res.json({
      success: true,
      message: 'Download tracked successfully',
      downloadCount: storybook.downloadCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportEntries,
  trackStorybookDownload
};