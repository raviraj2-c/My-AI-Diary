const { FutureLetter } = require('../config/models');
const { stripAllTags, sanitizeContent } = require('../utils/sanitize');
const { checkRisk } = require('../utils/riskCheck');

/**
 * Creates a letter to the user's future self.
 */
const createLetter = async (req, res, next) => {
  try {
    const { title, content, deliverOn } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    if (!deliverOn) {
      return res.status(400).json({ success: false, message: 'Delivery date is required' });
    }

    const deliverDate = new Date(deliverOn);
    if (isNaN(deliverDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid delivery date format' });
    }

    // deliverOn must be at least 1 day in the future (allowing 60s clock skew)
    const minDeliveryDate = Date.now() + 24 * 60 * 60 * 1000 - 60000;
    if (deliverDate.getTime() < minDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date must be at least 1 day in the future'
      });
    }

    const cleanTitle = stripAllTags(title).trim().slice(0, 120);
    const cleanContent = sanitizeContent(content).trim();

    // Risk check on letter content
    const risk = checkRisk(cleanContent);

    // Save the letter (encrypted at rest via schema setters)
    const letter = await FutureLetter.create({
      user: req.user.id,
      title: cleanTitle,
      content: cleanContent,
      writtenOn: new Date(),
      deliverOn: deliverDate
    });

    res.status(201).json({
      success: true,
      message: 'Letter saved securely for your future self.',
      safety: { level: risk.level },
      data: {
        id: letter._id,
        title: letter.title,
        writtenOn: letter.writtenOn,
        deliverOn: letter.deliverOn,
        isLocked: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists the user's letters.
 * Strictly projects out content for any letter whose deliverOn is still in the future.
 */
const getLetters = async (req, res, next) => {
  try {
    const now = new Date();
    const letters = await FutureLetter.find({ user: req.user.id }).sort({ deliverOn: 1 });

    const projected = letters.map(letter => {
      const isLocked = new Date(letter.deliverOn) > now;
      if (isLocked) {
        return {
          id: letter._id,
          title: letter.title,
          writtenOn: letter.writtenOn,
          deliverOn: letter.deliverOn,
          openedAt: letter.openedAt,
          isLocked: true
          // Strict server-side projection: content property is completely absent
        };
      }
      return {
        id: letter._id,
        title: letter.title,
        content: letter.content,
        writtenOn: letter.writtenOn,
        deliverOn: letter.deliverOn,
        openedAt: letter.openedAt,
        isLocked: false
      };
    });

    res.json({
      success: true,
      data: projected
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves letters ready to be opened (deliverOn <= now).
 */
const getDueLetters = async (req, res, next) => {
  try {
    const now = new Date();
    const dueLetters = await FutureLetter.find({
      user: req.user.id,
      deliverOn: { $lte: now },
      openedAt: null
    }).select('title deliverOn writtenOn openedAt');

    res.json({
      success: true,
      data: dueLetters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Opens an individual letter.
 * If deliverOn is in the future, returns 403 (enforces strict server-side lock).
 */
const getLetter = async (req, res, next) => {
  try {
    const letter = await FutureLetter.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!letter) {
      return res.status(404).json({ success: false, message: 'Letter not found' });
    }

    const now = new Date();
    if (new Date(letter.deliverOn) > now) {
      return res.status(403).json({
        success: false,
        message: 'This letter is locked until its delivery date',
        deliverOn: letter.deliverOn
      });
    }

    if (!letter.openedAt) {
      letter.openedAt = now;
      await letter.save();
    }

    res.json({
      success: true,
      data: {
        id: letter._id,
        title: letter.title,
        content: letter.content,
        writtenOn: letter.writtenOn,
        deliverOn: letter.deliverOn,
        openedAt: letter.openedAt,
        isLocked: false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a letter.
 */
const deleteLetter = async (req, res, next) => {
  try {
    const deleted = await FutureLetter.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Letter not found' });
    }

    res.json({
      success: true,
      message: 'Letter deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLetter,
  getLetters,
  getDueLetters,
  getLetter,
  deleteLetter
};
