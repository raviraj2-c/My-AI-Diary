export interface MediaItem {
  url: string;
  publicId: string;
  type: 'image' | 'video' | 'audio';
  thumbnailUrl?: string;
  caption?: string;
  bytes?: number;
}

export interface TrustedContact {
  name: string;
  phone: string;
  relation: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'inter' | 'serif' | 'mono';
  language: 'en' | 'hi';
  speechLanguage?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  country?: string;
  timezone?: string;
  trustedContact?: TrustedContact;
  appLockEnabled?: boolean;
  appLockTimeoutMinutes?: number;
  allowAIFeatures?: boolean;
  allowDiaryAI?: boolean;
  isStudent?: boolean;
}

export interface UserStats {
  totalEntries: number;
  longestStreak: number;
  currentStreak: number;
  lastEntryDate?: Date | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  settings?: UserSettings;
  stats?: UserStats;
  createdAt: Date;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  mood: 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'angry' | 'peaceful';
  moodScore?: number;
  emotions?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  prompt?: string;
  aiExcluded?: boolean;
  entryDate: Date;
  date?: Date; // backwards-compatibility helper
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
  media?: MediaItem[];
  wordCount?: number;
  readingTime?: number;
}

export interface CheckIn {
  id: string;
  userId: string;
  date: Date;
  moodScore: number;
  emotions: string[];
  sleepHours?: number | null;
  energy?: number | null;
  stress?: number | null;
  anxiety?: number | null;
  tags: string[];
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HabitLog {
  id: string;
  userId: string;
  date: Date;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  waterGlasses: number;
  exerciseMinutes: number;
  screenTimeHours: number;
  medicationTaken?: boolean | null;
  steps?: number | null;
}

export interface GratitudeEntry {
  id: string;
  userId: string;
  date: Date;
  items: string[];
  createdAt: Date;
}

export interface WellnessInsights {
  hasEnoughData: boolean;
  dataPointsCount: number;
  averageMood: number | null;
  bestDay: { date: string | Date; moodScore: number; emotions: string[] } | null;
  hardestDay: { date: string | Date; moodScore: number; emotions: string[] } | null;
  moodPerDay: Array<{
    date: string | Date;
    key: string;
    moodScore: number | null;
    emotions: string[];
    sleepHours?: number | null;
    energy?: number | null;
    stress?: number | null;
    anxiety?: number | null;
    waterGlasses?: number;
    exerciseMinutes?: number;
    screenTimeHours?: number;
  }>;
  mostFrequentEmotions: Array<{ emotion: string; count: number }>;
  commonTagsOnLowDays: Array<{ tag: string; count: number }>;
  weekdayPattern: Array<{ day: string; averageMood: number | null; sampleSize: number }>;
  correlations: Array<{ factor: string; diff: number; text: string }>;
  findings: string[];
  streak: {
    currentDays: number;
    last7DaysCount: number;
    last7DaysRatio: string;
    kindMessage: string;
    totalActiveDays: number;
  };
}

export interface StorybookChapter {
  chapterNumber?: number;
  title: string;
  content: string;
}

export interface StorybookMetadata {
  id: string;
  title: string;
  theme: 'romantic' | 'dramatic' | 'adventure' | 'mystery' | 'comedy';
  timeframe: {
    start: Date;
    end: Date;
  };
  protagonist?: {
    name?: string;
    journey?: string;
  };
  chapterCount: number;
  wordCount?: number;
  pageCount?: number;
  createdAt: Date;
  status?: string;
}

export interface StorybookGenerationOptions {
  length?: 'short' | 'medium' | 'long';
  language?: 'en' | 'hi' | 'hinglish';
  tone?: 'gentle' | 'hopeful' | 'funny' | 'reflective';
  protagonistNickname?: string;
  entryIds?: string[];
}

export interface StorybookExport {
  id: string;
  title: string;
  theme: 'romantic' | 'dramatic' | 'adventure' | 'mystery' | 'comedy';
  timeframe: {
    start: Date;
    end: Date;
  };
  entries: DiaryEntry[];
  generatedContent: string;
  protagonist?: {
    name?: string;
    journey?: string;
  };
  chapters?: StorybookChapter[];
  createdAt: Date;
  language?: 'en' | 'hi' | 'hinglish';
  safety?: { level: 'none' | 'concern' | 'high' };
  excludedCount?: number;
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  mood?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CalmSession {
  id?: string;
  userId?: string;
  type: 'breathing' | 'grounding' | 'relaxation' | 'sounds' | 'vent';
  durationMinutes: number;
  technique?: string;
  date?: Date;
}

export interface SelfCheckResult {
  id?: string;
  userId?: string;
  type: 'PHQ-9' | 'GAD-7';
  score: number;
  severity: string;
  answers: number[];
  date: Date;
}

export interface AIMoodAnalysis {
  suggestedEmotions: string[];
  suggestedScore: number;
  confidence: number;
  safety?: { level: 'none' | 'concern' | 'high' };
  quotaRemaining?: number;
}

export interface AIReflection {
  reflection: string;
  question?: string;
  safety?: { level: 'none' | 'concern' | 'high' };
  quotaRemaining?: number;
}

export interface AIUsage {
  count: number;
  limit: number;
  remaining: number;
  allowAIFeatures: boolean;
  allowDiaryAI?: boolean;
}

export interface ChatMessage {
  _id?: string;
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  safetyLevel?: 'none' | 'concern' | 'high';
  createdAt?: string | Date;
}

export interface ThoughtRecord {
  _id?: string;
  id?: string;
  situation: string;
  thought: string;
  emotion: string;
  initialIntensity: number;
  evidenceFor?: string;
  evidenceAgainst?: string;
  balancedThought?: string;
  finalIntensity: number;
  aiAssisted?: boolean;
  createdAt?: string | Date;
}

export interface ExamItem {
  _id?: string;
  id?: string;
  subject: string;
  date: string | Date;
  notes?: string;
}

export interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  totalSessions: number;
  recentSessions: Array<{
    durationMinutes: number;
    technique: string;
    date: string | Date;
  }>;
}

export interface BurnoutStatus {
  warning?: boolean;
  status: 'safe' | 'notice';
  code?: 'BURNOUT_WARNING' | 'BURNOUT_SAFE';
  params?: {
    highStressDays: number;
    checkedDays?: number;
    windowDays?: number;
    avgSleepHours: number;
  };
  message: string;
  highStressDays: number;
  avgSleep: number;
  avgSleepHours?: number;
}

export interface SmallWinTask {
  key?: string;
  text: string;
  completed: boolean;
}

export interface SmallWinsRecord {
  dateKey: string;
  tasks: SmallWinTask[];
}

export interface CounselorReportSummary {
  generatedAt: string;
  range: string;
  totalCheckIns: number;
  averageMood: number | null;
  bestDay: { date: string | Date; moodScore: number; emotions: string[] } | null;
  hardestDay: { date: string | Date; moodScore: number; emotions: string[] } | null;
  moodPerDay: Array<{
    date: string | Date;
    key: string;
    moodScore: number | null;
    emotions: string[];
    sleepHours?: number | null;
    energy?: number | null;
    stress?: number | null;
    anxiety?: number | null;
  }>;
  correlations: Array<{ factor: string; diff: number; text: string }>;
  recentScreenings: Array<{
    type: string;
    score: number;
    severity: string;
    date: string | Date;
  }>;
}

export interface UsedDiaryEntry {
  id: string;
  title: string;
  date: string | Date;
  snippet: string;
}

export interface AskDiaryFilters {
  startDate?: string;
  endDate?: string;
  mood?: string;
}

export interface AskDiaryResponse {
  answer: string;
  usedEntryIds: string[];
  usedEntries: UsedDiaryEntry[];
  safetyLevel?: 'none' | 'concern' | 'high';
  quotaRemaining?: number;
}

export interface YearPixelsDay {
  score: number;
  source: 'checkin' | 'diary';
  mood: string;
  entryId: string | null;
  title: string | null;
}

export interface YearPixelsData {
  year: number;
  pixels: Record<string, YearPixelsDay>;
}

export interface FutureLetterItem {
  id: string;
  title: string;
  content?: string;
  writtenOn: string | Date;
  deliverOn: string | Date;
  openedAt?: string | Date | null;
  isLocked: boolean;
}

export interface CopingPlanData {
  id?: string;
  warningSigns: string[];
  copingStrategies: string[];
  peopleToContact: Array<string | { name?: string; phone?: string; relation?: string }>;
  safePlaces: string[];
  reasonsToKeepGoing: string[];
  updatedAt?: string | Date;
}

