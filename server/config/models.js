const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encryptText, decryptText, isEncrypted } = require('../utils/encrypt');
const { isValidTimezone } = require('../utils/dates');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  fontFamily: {
    type: String,
    enum: ['inter', 'serif', 'mono'],
    default: 'inter'
  },
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  speechLanguage: {
    type: String,
    default: 'en-US'
  },
  reminderEnabled: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: String,
    default: '20:00'
  },
  country: {
    type: String,
    default: 'IN'
  },
  timezone: {
    type: String,
    default: 'UTC',
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return isValidTimezone(v);
      },
      message: 'Invalid IANA timezone'
    }
  },
  trustedContact: {
    name: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    relation: { type: String, default: '', trim: true }
  },
  appLockPinHash: {
    type: String,
    default: null
  },
  appLockEnabled: {
    type: Boolean,
    default: false
  },
  appLockTimeoutMinutes: {
    type: Number,
    default: 5
  },
  appLockFailedAttempts: {
    type: Number,
    default: 0
  },
  appLockLockedUntil: {
    type: Date,
    default: null
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  allowAIFeatures: {
    type: Boolean,
    default: false
  },
  allowDiaryAI: {
    type: Boolean,
    default: false
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  aiDailyUsage: {
    count: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  totalEntries: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastEntryDate: {
    type: Date,
    default: null
  },
  ageConfirmedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

const diaryEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true,
    set: encryptText,
    get: decryptText
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'neutral', 'excited', 'anxious', 'angry', 'peaceful'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String
  }],
  media: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio'],
      required: true
    },
    thumbnailUrl: {
      type: String
    },
    caption: {
      type: String,
      default: '',
      set: encryptText,
      get: decryptText
    },
    bytes: {
      type: Number
    }
  }],
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  wordCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number,
    default: 0
  },
  emotions: [{
    type: String,
    trim: true
  }],
  moodScore: {
    type: Number,
    min: 1,
    max: 10
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  aiExcluded: {
    type: Boolean,
    default: false
  },
  prompt: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

diaryEntrySchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (typeof update.content === 'string') {
      update.content = encryptText(update.content);
    }
    if (update.$set && typeof update.$set.content === 'string') {
      update.$set.content = encryptText(update.$set.content);
    }
  }
  next();
});

diaryEntrySchema.index({ user: 1, entryDate: -1 });
diaryEntrySchema.index({ user: 1, mood: 1 });
diaryEntrySchema.index({ user: 1, isFavorite: 1 });
diaryEntrySchema.index({ user: 1, isPinned: 1 });

const storybookChapterSchema = new mongoose.Schema({
  chapterNumber: { type: Number },
  title: { type: String, trim: true },
  content: {
    type: String,
    set: encryptText,
    get: decryptText
  }
}, { _id: false, toJSON: { getters: true }, toObject: { getters: true } });

const storybookSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  theme: {
    type: String,
    enum: ['romantic', 'dramatic', 'adventure', 'mystery', 'comedy'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  generatedContent: {
    type: String,
    required: true,
    set: encryptText,
    get: decryptText
  },
  protagonist: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  chapters: [storybookChapterSchema],
  wordCount: {
    type: Number,
    default: 0
  },
  pageCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'completed'
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

storybookSchema.index({ user: 1, createdAt: -1 });

// --- CheckIn Schema (One per user per day) ---
const checkInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateKey: {
    type: String,
    trim: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  emotions: [{
    type: String,
    trim: true
  }],
  sleepHours: {
    type: Number,
    min: 0,
    max: 24,
    default: null
  },
  energy: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  stress: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  anxiety: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  note: {
    type: String,
    set: encryptText,
    get: decryptText,
    default: '',
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

checkInSchema.index({ user: 1, date: 1 }, { unique: true });
checkInSchema.index({ user: 1, date: -1 });

// --- HabitLog Schema (One per user per day) ---
const habitLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateKey: {
    type: String,
    trim: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  sleepHours: {
    type: Number,
    min: 0,
    max: 24,
    default: null
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  waterGlasses: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  exerciseMinutes: {
    type: Number,
    min: 0,
    max: 1440,
    default: 0
  },
  screenTimeHours: {
    type: Number,
    min: 0,
    max: 24,
    default: 0
  },
  medicationTaken: {
    type: Boolean,
    default: null
  },
  steps: {
    type: Number,
    min: 0,
    default: null
  }
}, {
  timestamps: true
});

habitLogSchema.index({ user: 1, date: 1 }, { unique: true });
habitLogSchema.index({ user: 1, date: -1 });

// --- GratitudeEntry Schema ---
const gratitudeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateKey: {
    type: String,
    trim: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [{
    type: String,
    set: encryptText,
    get: decryptText,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

gratitudeEntrySchema.index({ user: 1, date: -1 });

// --- CalmSession Schema ---
const calmSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['breathing', 'grounding', 'relaxation', 'sounds', 'vent'],
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 1,
    min: 0.1
  },
  technique: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

calmSessionSchema.index({ user: 1, date: -1 });

// --- SelfCheck Schema ---
const selfCheckSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['PHQ-9', 'GAD-7'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  severity: {
    type: String,
    required: true
  },
  answers: {
    type: mongoose.Schema.Types.Mixed,
    set: (val) => {
      if (isEncrypted(val)) return val;
      return encryptText(JSON.stringify(val ?? []));
    },
    get: (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && !isEncrypted(val)) {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      try {
        const decrypted = decryptText(val);
        const parsed = JSON.parse(decrypted);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

selfCheckSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (update.answers !== undefined && !isEncrypted(update.answers)) {
      update.answers = encryptText(JSON.stringify(update.answers ?? []));
    }
    if (update.$set && update.$set.answers !== undefined && !isEncrypted(update.$set.answers)) {
      update.$set.answers = encryptText(JSON.stringify(update.$set.answers ?? []));
    }
  }
  next();
});

selfCheckSchema.index({ user: 1, date: -1 });

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    set: encryptText,
    get: decryptText
  },
  safetyLevel: {
    type: String,
    enum: ['none', 'concern', 'high'],
    default: 'none'
  },
  mode: {
    type: String,
    enum: ['chat', 'diary'],
    default: 'chat',
    index: true
  },
  sources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiaryEntry'
  }]
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

chatMessageSchema.index({ user: 1, createdAt: 1 });
chatMessageSchema.index({ user: 1, mode: 1, createdAt: 1 });

const thoughtRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  situation: {
    type: String,
    required: true,
    set: encryptText,
    get: decryptText
  },
  thought: {
    type: String,
    required: true,
    set: encryptText,
    get: decryptText
  },
  emotion: {
    type: String,
    default: 'anxious',
    trim: true
  },
  initialIntensity: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  evidenceFor: {
    type: String,
    default: '',
    set: encryptText,
    get: decryptText
  },
  evidenceAgainst: {
    type: String,
    default: '',
    set: encryptText,
    get: decryptText
  },
  balancedThought: {
    type: String,
    default: '',
    set: encryptText,
    get: decryptText
  },
  finalIntensity: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  aiAssisted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

thoughtRecordSchema.index({ user: 1, createdAt: -1 });

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  technique: {
    type: String,
    default: 'Pomodoro 25/5'
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

studySessionSchema.index({ user: 1, date: -1 });

const examSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    set: encryptText,
    get: decryptText
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

examSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (typeof update.notes === 'string' && !isEncrypted(update.notes)) {
      update.notes = encryptText(update.notes);
    }
    if (update.$set && typeof update.$set.notes === 'string' && !isEncrypted(update.$set.notes)) {
      update.$set.notes = encryptText(update.$set.notes);
    }
  }
  next();
});

examSchema.index({ user: 1, date: 1 });

const smallWinSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dateKey: {
    type: String,
    required: true,
    index: true
  },
  tasks: [{
    key: { type: String },
    text: {
      type: String,
      required: true,
      set: encryptText,
      get: decryptText
    },
    completed: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

smallWinSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const update = this.getUpdate();
  if (update) {
    if (Array.isArray(update.tasks)) {
      update.tasks = update.tasks.map(t => ({
        ...t,
        text: typeof t.text === 'string' && !isEncrypted(t.text) ? encryptText(t.text) : t.text
      }));
    }
    if (update.$set && Array.isArray(update.$set.tasks)) {
      update.$set.tasks = update.$set.tasks.map(t => ({
        ...t,
        text: typeof t.text === 'string' && !isEncrypted(t.text) ? encryptText(t.text) : t.text
      }));
    }
  }
  next();
});

smallWinSchema.index({ user: 1, dateKey: 1 }, { unique: true });

const counselorReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

counselorReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const futureLetterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  content: {
    type: String,
    required: true,
    set: encryptText,
    get: decryptText
  },
  writtenOn: {
    type: Date,
    default: Date.now
  },
  deliverOn: {
    type: Date,
    required: true,
    index: true
  },
  openedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});
futureLetterSchema.index({ user: 1, deliverOn: 1 });

const makeEncryptedArrayField = () => ({
  type: mongoose.Schema.Types.Mixed,
  default: [],
  set: (val) => {
    if (isEncrypted(val)) return val;
    return encryptText(JSON.stringify(val ?? []));
  },
  get: (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const dec = decryptText(val);
      const parsed = JSON.parse(dec);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
});

const copingPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  warningSigns: makeEncryptedArrayField(),
  copingStrategies: makeEncryptedArrayField(),
  peopleToContact: makeEncryptedArrayField(),
  safePlaces: makeEncryptedArrayField(),
  reasonsToKeepGoing: makeEncryptedArrayField()
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
  runSettersOnQuery: true
});

const User = mongoose.model('User', userSchema);
const DiaryEntry = mongoose.model('DiaryEntry', diaryEntrySchema);
const Storybook = mongoose.model('Storybook', storybookSchema);
const CheckIn = mongoose.model('CheckIn', checkInSchema);
const HabitLog = mongoose.model('HabitLog', habitLogSchema);
const GratitudeEntry = mongoose.model('GratitudeEntry', gratitudeEntrySchema);
const CalmSession = mongoose.model('CalmSession', calmSessionSchema);
const SelfCheck = mongoose.model('SelfCheck', selfCheckSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const ThoughtRecord = mongoose.model('ThoughtRecord', thoughtRecordSchema);
const StudySession = mongoose.model('StudySession', studySessionSchema);
const Exam = mongoose.model('Exam', examSchema);
const SmallWin = mongoose.model('SmallWin', smallWinSchema);
const CounselorReport = mongoose.model('CounselorReport', counselorReportSchema);
const FutureLetter = mongoose.model('FutureLetter', futureLetterSchema);
const CopingPlan = mongoose.model('CopingPlan', copingPlanSchema);

module.exports = {
  User,
  DiaryEntry,
  Storybook,
  CheckIn,
  HabitLog,
  GratitudeEntry,
  CalmSession,
  SelfCheck,
  ChatMessage,
  ThoughtRecord,
  StudySession,
  Exam,
  SmallWin,
  CounselorReport,
  FutureLetter,
  CopingPlan
};
