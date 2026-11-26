const {
  User,
  DiaryEntry,
  CheckIn,
  HabitLog,
  GratitudeEntry,
  CalmSession,
  SelfCheck,
  Storybook,
  ChatMessage,
  ThoughtRecord,
  StudySession,
  Exam,
  SmallWin,
  CounselorReport,
  FutureLetter,
  CopingPlan
} = require('../config/models');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/email');
const {
  isNonEmptyString,
  isValidEmail,
  isValidPassword
} = require('../utils/validate');
const { isValidTimezone } = require('../utils/dates');
const { deleteCloudinaryMedia, deleteCloudinaryFolder } = require('../config/cloudinary');

const DUMMY_HASH = '$2a$12$e8Y5tGZ5Ym9mYF0E7y9a.eG0pYg2tV3G.m1R0H7y.Q8Z5W2q0vK2G';

function formatUserSettings(user) {
  return {
    theme: user.theme || 'system',
    fontSize: user.fontSize || 'medium',
    fontFamily: user.fontFamily || 'inter',
    language: user.language || 'en',
    speechLanguage: user.speechLanguage || 'en-US',
    reminderEnabled: user.reminderEnabled || false,
    reminderTime: user.reminderTime || '20:00',
    country: user.country || 'IN',
    timezone: user.timezone || 'UTC',
    trustedContact: {
      name: user.trustedContact?.name || '',
      phone: user.trustedContact?.phone || '',
      relation: user.trustedContact?.relation || ''
    },
    appLockEnabled: user.appLockEnabled || false,
    appLockTimeoutMinutes: user.appLockTimeoutMinutes || 5,
    allowAIFeatures: user.allowAIFeatures || false,
    allowDiaryAI: user.allowDiaryAI || false,
    isStudent: user.isStudent || false
  };
}

function formatUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    settings: formatUserSettings(user),
    aiDailyUsage: user.aiDailyUsage || { count: 0 },
    stats: {
      totalEntries: user.totalEntries || 0,
      longestStreak: user.longestStreak || 0,
      currentStreak: user.currentStreak || 0,
      lastEntryDate: user.lastEntryDate || null
    },
    createdAt: user.createdAt
  };
}

const register = async (req, res, next) => {
  try {
    const { name, email, password, timezone, ageConfirmed } = req.body;

    if (ageConfirmed !== true) {
      return res.status(400).json({
        success: false,
        code: 'AGE_CONFIRMATION_REQUIRED',
        message: 'You must confirm that you are 18 years or older to create an account'
      });
    }

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid name, email, and password strings'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 72 characters and contain at least one letter and one number'
      });
    }

    let userTz = 'UTC';
    if (timezone !== undefined && timezone !== null && timezone !== '') {
      if (!isValidTimezone(timezone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IANA timezone'
        });
      }
      userTz = timezone.trim();
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      timezone: userTz,
      ageConfirmedAt: new Date()
    });

    const token = generateToken(user._id, user.tokenVersion || 0);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({
        success: false,
        code: 'BAD_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'BAD_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    if (req.body.timezone && isValidTimezone(req.body.timezone)) {
      if (!user.timezone || user.timezone === 'UTC') {
        user.timezone = req.body.timezone.trim();
        await user.save();
      }
    }

    const token = generateToken(user._id, user.tokenVersion || 0);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }

    const settings = req.body.settings || req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const validEnums = {
      theme: ['light', 'dark', 'system'],
      fontSize: ['small', 'medium', 'large'],
      fontFamily: ['inter', 'serif', 'mono'],
      language: ['en', 'hi'],
      speechLanguage: ['en-US', 'en-IN', 'en-GB', 'hi-IN', 'es', 'es-ES', 'fr', 'fr-FR', 'de', 'de-DE', 'ja', 'ja-JP']
    };

    const updateData = {};
    for (const [key, allowed] of Object.entries(validEnums)) {
      if (settings[key] !== undefined) {
        if (!allowed.includes(settings[key])) {
          return res.status(400).json({
            success: false,
            message: `Invalid value for ${key}. Allowed: ${allowed.join(', ')}`
          });
        }
        updateData[key] = settings[key];
      }
    }

    if (settings.reminderEnabled !== undefined) {
      updateData.reminderEnabled = Boolean(settings.reminderEnabled);
    }
    if (settings.reminderTime !== undefined) {
      if (typeof settings.reminderTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(settings.reminderTime.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reminderTime format. Must be HH:MM in 24-hour format',
          message: 'Invalid reminderTime format. Must be HH:MM in 24-hour format'
        });
      }
      updateData.reminderTime = settings.reminderTime.trim();
    }
    const ALLOWED_COUNTRIES = ['IN', 'US', 'UK', 'GB', 'CA', 'AU', 'GLOBAL'];
    if (settings.country !== undefined) {
      if (typeof settings.country !== 'string' || !ALLOWED_COUNTRIES.includes(settings.country.trim().toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid country code. Must be one of: ${ALLOWED_COUNTRIES.join(', ')}`,
          message: `Invalid country code. Must be one of: ${ALLOWED_COUNTRIES.join(', ')}`
        });
      }
      updateData.country = settings.country.trim().toUpperCase();
    }
    if (settings.trustedContact !== undefined) {
      if (!settings.trustedContact || typeof settings.trustedContact !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid trustedContact object',
          message: 'Invalid trustedContact object'
        });
      }
      const { name, relation, phone } = settings.trustedContact;
      if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
        return res.status(400).json({
          success: false,
          error: 'trustedContact name must be a string up to 100 characters',
          message: 'trustedContact name must be a string up to 100 characters'
        });
      }
      if (relation !== undefined && (typeof relation !== 'string' || relation.length > 50)) {
        return res.status(400).json({
          success: false,
          error: 'trustedContact relation must be a string up to 50 characters',
          message: 'trustedContact relation must be a string up to 50 characters'
        });
      }
      if (phone !== undefined) {
        if (typeof phone !== 'string' || phone.length > 20 || !/^[0-9+\-\s()]*$/.test(phone)) {
          return res.status(400).json({
            success: false,
            error: 'trustedContact phone contains invalid characters or exceeds 20 characters',
            message: 'trustedContact phone contains invalid characters or exceeds 20 characters'
          });
        }
      }
      updateData.trustedContact = {
        name: typeof name === 'string' ? name.trim() : '',
        phone: typeof phone === 'string' ? phone.trim() : '',
        relation: typeof relation === 'string' ? relation.trim() : ''
      };
    }
    if (settings.appLockTimeoutMinutes != null) {
      updateData.appLockTimeoutMinutes = Math.max(1, Math.min(120, Number(settings.appLockTimeoutMinutes) || 5));
    }
    if (settings.allowAIFeatures !== undefined) {
      updateData.allowAIFeatures = Boolean(settings.allowAIFeatures);
    }
    if (settings.allowDiaryAI !== undefined) {
      updateData.allowDiaryAI = Boolean(settings.allowDiaryAI);
    }
    if (settings.isStudent !== undefined) {
      updateData.isStudent = Boolean(settings.isStudent);
    }
    if (settings.timezone !== undefined) {
      if (!isValidTimezone(settings.timezone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid IANA timezone',
          message: 'Invalid IANA timezone'
        });
      }
      updateData.timezone = settings.timezone.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid settings provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: formatUserSettings(user),
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!isNonEmptyString(email) || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Always respond immediately so timing never reveals whether the account exists
    res.json({
      success: true,
      message: 'If an account exists with that email, reset instructions have been sent.'
    });

    const normalizedEmail = email.toLowerCase().trim();
    setImmediate(async () => {
      try {
        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
          const rawToken = crypto.randomBytes(32).toString('hex');
          const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

          await User.findByIdAndUpdate(user._id, {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: Date.now() + 30 * 60 * 1000 // 30 minutes
          });

          await sendPasswordResetEmail(user.email, rawToken);
        }
      } catch (asyncErr) {
        // Catch and log without token
        if (process.env.NODE_ENV !== 'test') {
          console.error('Password reset background email error:', asyncErr.message);
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing reset token' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 72 characters, with at least one letter and one number'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Set new password (pre-save hook hashes with bcrypt)
    user.password = password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Your password has been successfully reset. You may now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be between 8 and 72 characters and contain at least one letter and one number'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, code: 'BAD_CREDENTIALS', message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const newToken = generateToken(user._id, user.tokenVersion);
    res.json({
      success: true,
      message: 'Password changed successfully. All other active sessions have been invalidated.',
      token: newToken
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({
      success: true,
      message: 'All active sessions on all devices have been signed out.'
    });
  } catch (error) {
    next(error);
  }
};

const setupAppLock = async (req, res, next) => {
  try {
    const { pin, password, timeoutMinutes } = req.body;
    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      return res.status(400).json({ success: false, message: 'PIN must be 4 to 6 numeric digits' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!password) {
      return res.status(400).json({ success: false, message: 'Account password is required to configure app lock' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, code: 'BAD_CREDENTIALS', message: 'Account password verification failed' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(String(pin), salt);

    user.appLockPinHash = pinHash;
    user.appLockEnabled = true;
    user.appLockFailedAttempts = 0;
    user.appLockLockedUntil = null;
    if (timeoutMinutes) user.appLockTimeoutMinutes = Number(timeoutMinutes);
    await user.save();

    res.json({ success: true, message: 'App lock PIN configured successfully' });
  } catch (error) {
    next(error);
  }
};

const verifyAppLock = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || !user.appLockPinHash) {
      return res.status(400).json({ success: false, error: 'App lock is not enabled', message: 'App lock is not enabled' });
    }

    // Check wrong attempts cooldown (persisted in MongoDB; 5 attempts -> 60s freeze)
    if (user.appLockLockedUntil) {
      if (new Date() < new Date(user.appLockLockedUntil)) {
        const waitSec = Math.ceil((new Date(user.appLockLockedUntil) - new Date()) / 1000);
        return res.status(429).json({
          success: false,
          error: `Too many wrong PIN attempts. Please wait ${waitSec} seconds.`,
          message: `Too many wrong PIN attempts. Please wait ${waitSec} seconds.`,
          lockedSeconds: waitSec
        });
      } else {
        // Cooldown expired: grant 5 fresh tries
        user.appLockLockedUntil = null;
        user.appLockFailedAttempts = 0;
      }
    }

    const isMatch = await bcrypt.compare(String(pin), user.appLockPinHash);
    if (!isMatch) {
      user.appLockFailedAttempts = (user.appLockFailedAttempts || 0) + 1;
      if (user.appLockFailedAttempts >= 5) {
        user.appLockLockedUntil = new Date(Date.now() + 60000);
        user.appLockFailedAttempts = 0; // Fresh 5 tries post-freeze
        await user.save();
        return res.status(429).json({
          success: false,
          error: 'Too many incorrect attempts. App lock frozen for 60 seconds.',
          message: 'Too many incorrect attempts. App lock frozen for 60 seconds.',
          lockedSeconds: 60
        });
      }
      await user.save();
      return res.status(401).json({
        success: false,
        code: 'BAD_CREDENTIALS',
        error: `Incorrect PIN. ${5 - user.appLockFailedAttempts} attempt(s) remaining.`,
        message: 'Incorrect PIN',
        attemptsRemaining: 5 - user.appLockFailedAttempts
      });
    }

    user.appLockFailedAttempts = 0;
    user.appLockLockedUntil = null;
    await user.save();
    res.json({ success: true, message: 'PIN verified' });
  } catch (error) {
    next(error);
  }
};

const disableAppLock = async (req, res, next) => {
  try {
    const { password, pin } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let authorized = false;
    if (password && (await user.matchPassword(password))) {
      authorized = true;
    } else if (pin && user.appLockPinHash && (await bcrypt.compare(String(pin), user.appLockPinHash))) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(401).json({ success: false, code: 'BAD_CREDENTIALS', message: 'Valid password or PIN required to disable app lock' });
    }

    user.appLockEnabled = false;
    user.appLockPinHash = null;
    user.appLockFailedAttempts = 0;
    user.appLockLockedUntil = null;
    await user.save();

    res.json({ success: true, message: 'App lock disabled' });
  } catch (error) {
    next(error);
  }
};

const exportAllData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [
      user,
      entries,
      checkIns,
      habits,
      gratitudes,
      calmSessions,
      selfChecks,
      chatMessages,
      thoughtRecords,
      storybooks,
      exams,
      smallWins,
      studySessions,
      counselorReports,
      futureLetters,
      copingPlan
    ] = await Promise.all([
      User.findById(userId).select('-password -appLockPinHash'),
      DiaryEntry.find({ user: userId }).sort({ entryDate: -1 }),
      CheckIn.find({ user: userId }).sort({ date: -1 }),
      HabitLog.find({ user: userId }).sort({ date: -1 }),
      GratitudeEntry.find({ user: userId }).sort({ date: -1 }),
      CalmSession.find({ user: userId }).sort({ date: -1 }),
      SelfCheck.find({ user: userId }).sort({ date: -1 }),
      ChatMessage.find({ user: userId }).sort({ createdAt: 1 }),
      ThoughtRecord.find({ user: userId }).sort({ createdAt: -1 }),
      Storybook.find({ user: userId }).sort({ createdAt: -1 }),
      Exam.find({ user: userId }).sort({ date: 1 }),
      SmallWin.find({ user: userId }).sort({ dateKey: -1 }),
      StudySession.find({ user: userId }).sort({ date: -1 }),
      CounselorReport.find({ user: userId }).sort({ createdAt: -1 }),
      FutureLetter.find({ user: userId }).sort({ deliverOn: 1 }),
      CopingPlan.findOne({ user: userId })
    ]);

    const backupArchive = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: {
          theme: user.theme,
          fontSize: user.fontSize,
          fontFamily: user.fontFamily,
          language: user.language,
          country: user.country,
          trustedContact: user.trustedContact,
          allowAIFeatures: user.allowAIFeatures || false,
          allowDiaryAI: user.allowDiaryAI || false
        },
        stats: {
          totalEntries: user.totalEntries,
          longestStreak: user.longestStreak,
          currentStreak: user.currentStreak
        }
      },
      entries,
      checkIns,
      habits,
      gratitudes,
      calmSessions,
      selfChecks,
      chatMessages,
      thoughtRecords,
      storybooks,
      exams,
      smallWins,
      studySessions,
      counselorReports,
      futureLetters,
      copingPlan
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="minddiary_complete_backup.json"');
    res.json(backupArchive);
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password confirmation is required to delete your account' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, code: 'BAD_CREDENTIALS', message: 'Incorrect password. Account was not deleted.' });
    }

    // 1. Delete whole Cloudinary user folder by prefix so orphaned uploads go too
    await deleteCloudinaryFolder(`mydiary/user_${req.user.id}/`);

    // 2. Cascade delete child collections first; User deleted last; fail loudly without swallowing errors
    await DiaryEntry.deleteMany({ user: req.user.id });
    await CheckIn.deleteMany({ user: req.user.id });
    await HabitLog.deleteMany({ user: req.user.id });
    await GratitudeEntry.deleteMany({ user: req.user.id });
    await CalmSession.deleteMany({ user: req.user.id });
    await SelfCheck.deleteMany({ user: req.user.id });
    await Storybook.deleteMany({ user: req.user.id });
    await ChatMessage.deleteMany({ user: req.user.id });
    await ThoughtRecord.deleteMany({ user: req.user.id });
    await StudySession.deleteMany({ user: req.user.id });
    await Exam.deleteMany({ user: req.user.id });
    await SmallWin.deleteMany({ user: req.user.id });
    await CounselorReport.deleteMany({ user: req.user.id });
    await FutureLetter.deleteMany({ user: req.user.id });
    await CopingPlan.deleteMany({ user: req.user.id });

    // 3. Delete user last
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Your account and all associated reflections have been permanently erased.'
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
  forgotPassword,
  resetPassword,
  setupAppLock,
  verifyAppLock,
  disableAppLock,
  exportAllData,
  deleteAccount,
  changePassword,
  logoutAll
};
