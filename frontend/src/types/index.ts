export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  mood: 'happy' | 'sad' | 'neutral' | 'excited' | 'anxious' | 'angry' | 'peaceful';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
}

export interface UserSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'inter' | 'serif' | 'mono';
  language: 'en' | 'es' | 'fr';
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
  createdAt: Date;
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