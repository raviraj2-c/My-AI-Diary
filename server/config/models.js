const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
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
    enum: ['en', 'es', 'fr'],
    default: 'en'
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
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

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
    required: true
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
  }
}, {
  timestamps: true
});

diaryEntrySchema.index({ user: 1, entryDate: -1 });
diaryEntrySchema.index({ user: 1, mood: 1 });

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
    required: true
  },
  protagonist: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  chapters: [{
    type: mongoose.Schema.Types.Mixed
  }],
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
  timestamps: true
});

storybookSchema.index({ user: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
const DiaryEntry = mongoose.model('DiaryEntry', diaryEntrySchema);
const Storybook = mongoose.model('Storybook', storybookSchema);

module.exports = {
  User,
  DiaryEntry,
  Storybook
};