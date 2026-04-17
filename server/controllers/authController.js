const { User } = require('../config/models');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: {
          theme: user.theme,
          fontSize: user.fontSize,
          fontFamily: user.fontFamily,
          language: user.language
        },
        stats: {
          totalEntries: user.totalEntries,
          longestStreak: user.longestStreak,
          currentStreak: user.currentStreak,
          lastEntryDate: user.lastEntryDate
        },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: {
          theme: user.theme,
          fontSize: user.fontSize,
          fontFamily: user.fontFamily,
          language: user.language
        },
        stats: {
          totalEntries: user.totalEntries,
          longestStreak: user.longestStreak,
          currentStreak: user.currentStreak,
          lastEntryDate: user.lastEntryDate
        },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: {
          theme: user.theme,
          fontSize: user.fontSize,
          fontFamily: user.fontFamily,
          language: user.language
        },
        stats: {
          totalEntries: user.totalEntries,
          longestStreak: user.longestStreak,
          currentStreak: user.currentStreak,
          lastEntryDate: user.lastEntryDate
        },
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        theme: settings.theme,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        language: settings.language
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        theme: user.theme,
        fontSize: user.fontSize,
        fontFamily: user.fontFamily,
        language: user.language
      }
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateSettings,
  forgotPassword
};