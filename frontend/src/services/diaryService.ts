import { DiaryEntry, SearchFilters, MediaItem } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export interface RawDiaryEntry {
  _id: string;
  user: string;
  title: string;
  content: string;
  tags?: string[];
  mood: DiaryEntry['mood'];
  aiExcluded?: boolean;
  entryDate?: string | Date;
  date?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  images?: string[];
  media?: MediaItem[];
  wordCount?: number;
  readingTime?: number;
}

export interface PaginatedEntriesResult {
  entries: DiaryEntry[];
  total: number;
  pages: number;
  page: number;
}

const mapRawEntryToDiaryEntry = (entry: RawDiaryEntry): DiaryEntry => {
  const parsedDate = new Date(entry.entryDate || entry.date || Date.now());
  return {
    ...entry,
    id: entry._id,
    userId: entry.user,
    aiExcluded: Boolean(entry.aiExcluded),
    tags: entry.tags || [],
    media: entry.media || [],
    images: entry.images || [],
    entryDate: parsedDate,
    date: parsedDate,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  };
};

export class DiaryService {
  static async fetchEntries(page = 1, limit = 10): Promise<PaginatedEntriesResult> {
    try {
      const data = await apiRequest<RawDiaryEntry[]>(`${API_CONFIG.ENDPOINTS.DIARY.ENTRIES}?page=${page}&limit=${limit}`);

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Failed to fetch entries');
      }

      const pagination = data.pagination as { page: number; limit: number; total: number; pages: number } | undefined;

      return {
        entries: data.data.map((entry: RawDiaryEntry) => mapRawEntryToDiaryEntry(entry)),
        total: pagination?.total || data.data.length,
        pages: pagination?.pages || 1,
        page: pagination?.page || page,
      };
    } catch (error) {
      console.error('Fetch entries error:', error);
      throw error;
    }
  }

  static async saveEntryAsync(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> {
    try {
      const data = await apiRequest<RawDiaryEntry>(API_CONFIG.ENDPOINTS.DIARY.ENTRIES, {
        method: 'POST',
        body: JSON.stringify({
          ...entry,
          entryDate: entry.entryDate || entry.date,
        }),
      });

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to save entry');
      }

      const mapped = mapRawEntryToDiaryEntry(data.data);
      if (data.safety) {
        (mapped as DiaryEntry & { safety?: { level: 'none' | 'concern' | 'high' } }).safety = data.safety as { level: 'none' | 'concern' | 'high' };
      }
      return mapped;
    } catch (error) {
      console.error('Save entry error:', error);
      throw error;
    }
  }

  static async updateEntryAsync(id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> {
    try {
      const data = await apiRequest<RawDiaryEntry>(API_CONFIG.ENDPOINTS.DIARY.ENTRY(id), {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          ...(updates.entryDate ? { entryDate: updates.entryDate } : updates.date ? { entryDate: updates.date } : {}),
        }),
      });

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to update entry');
      }

      const mapped = mapRawEntryToDiaryEntry(data.data);
      if (data.safety) {
        (mapped as DiaryEntry & { safety?: { level: 'none' | 'concern' | 'high' } }).safety = data.safety as { level: 'none' | 'concern' | 'high' };
      }
      return mapped;
    } catch (error) {
      console.error('Update entry error:', error);
      throw error;
    }
  }

  static async deleteEntryAsync(id: string): Promise<void> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.DIARY.ENTRY(id), {
        method: 'DELETE',
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Delete entry error:', error);
      throw error;
    }
  }

  static async searchEntriesAsync(filters: SearchFilters): Promise<DiaryEntry[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('search', filters.query);
      if (filters.mood) params.append('mood', filters.mood);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start.toISOString());
      if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end.toISOString());

      const endpoint = `${API_CONFIG.ENDPOINTS.DIARY.ENTRIES}?${params}`;
      const data = await apiRequest<RawDiaryEntry[]>(endpoint);

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Failed to search entries');
      }

      return data.data.map((entry: RawDiaryEntry) => mapRawEntryToDiaryEntry(entry));
    } catch (error) {
      console.error('Search entries error:', error);
      throw error;
    }
  }

  static async getAllTagsAsync(): Promise<string[]> {
    try {
      const data = await apiRequest<string[]>(API_CONFIG.ENDPOINTS.DIARY.TAGS);

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Failed to fetch tags');
      }

      return data.data;
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  static async getCalendarMonth(month: string): Promise<Array<{ date: string; count: number; mood: string; hasMedia: boolean }>> {
    const data = await apiRequest<Array<{ date: string; count: number; mood: string; hasMedia: boolean }>>(
      API_CONFIG.ENDPOINTS.DIARY.CALENDAR(month)
    );
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(data.message || 'Failed to fetch calendar month');
    }
    return data.data;
  }

  static async getStatsAsync(): Promise<Record<string, unknown>> {
    try {
      const data = await apiRequest<Record<string, unknown>>(API_CONFIG.ENDPOINTS.DIARY.STATS);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch stats');
      }

      return data.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
}
