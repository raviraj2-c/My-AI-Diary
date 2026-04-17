import { DiaryEntry, SearchFilters } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export class DiaryService {
  static async fetchEntries(): Promise<DiaryEntry[]> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.DIARY.ENTRIES);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch entries');
      }

      return data.data.map((entry: any) => ({
        ...entry,
        id: entry._id,
        userId: entry.user,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
    } catch (error) {
      console.error('Fetch entries error:', error);
      throw error;
    }
  }

  static async saveEntryAsync(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> {
    try {
      
      
      const data = await apiRequest(API_CONFIG.ENDPOINTS.DIARY.ENTRIES, {
        method: 'POST',
        body: JSON.stringify(entry),
      });

      

      if (!data.success) {
        throw new Error(data.message || 'Failed to save entry');
      }

      return {
        ...data.data,
        id: data.data._id,
        userId: data.data.user,
        date: new Date(data.data.date),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt)
      };
    } catch (error : any) {
      console.error('❌ DiaryService: Save entry error:', error);
      console.error('❌ DiaryService: Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async updateEntryAsync(id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.DIARY.ENTRY(id), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to update entry');
      }

      return {
        ...data.data,
        id: data.data._id,
        userId: data.data.user,
        date: new Date(data.data.date),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt)
      };
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
      const data = await apiRequest(endpoint);

      if (!data.success) {
        throw new Error(data.message || 'Failed to search entries');
      }

      return data.data.map((entry: any) => ({
        ...entry,
        id: entry._id,
        userId: entry.user,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));
    } catch (error) {
      console.error('Search entries error:', error);
      throw error;
    }
  }

  static async getAllTagsAsync(): Promise<string[]> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.DIARY.TAGS);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tags');
      }

      return data.data;
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  static async getStatsAsync(): Promise<any> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.DIARY.STATS);

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