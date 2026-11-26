import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { DiaryEntry, SearchFilters } from '../types';
import { DiaryService } from '../services/diaryService';
import { useAuth } from './AuthContext';
import { useInvalidateWellness } from '../hooks/useQueries';

export interface DiaryContextType {
  entries: DiaryEntry[];
  loading: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  total: number;
  searchResults: DiaryEntry[];
  stats: Record<string, unknown> | null;
  loadMore: () => Promise<void>;
  saveEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DiaryEntry>;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => Promise<DiaryEntry>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (filters: SearchFilters) => Promise<DiaryEntry[]>;
  getAllTags: () => Promise<string[]>;
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const invalidateWellness = useInvalidateWellness();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchResults, setSearchResults] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});

  const refreshStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const statsData = await DiaryService.getStatsAsync();
      setStats(statsData);
    } catch (err) {
      console.warn('Failed to fetch diary stats:', err);
    }
  }, [isAuthenticated]);

  const loadInitial = useCallback(async () => {
    if (!isAuthenticated) {
      setEntries([]);
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await DiaryService.fetchEntries(1, 10);
      setEntries(res.entries);
      setSearchResults(res.entries);
      setPage(1);
      setTotalPages(res.pages);
      setTotal(res.total);
      refreshStats();
    } catch (error) {
      console.error('Error loading diary entries:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshStats]);

  useEffect(() => {
    loadInitial();
  }, [user?.id, loadInitial]);

  useEffect(() => {
    const handleLogout = () => {
      setEntries([]);
      setSearchResults([]);
      setStats({});
      setTotal(0);
      setPage(1);
    };
    window.addEventListener('minddiary_logout', handleLogout);
    return () => window.removeEventListener('minddiary_logout', handleLogout);
  }, []);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await DiaryService.fetchEntries(nextPage, 10);
      setEntries((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newUnique = res.entries.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newUnique];
      });
      setPage(nextPage);
      setTotalPages(res.pages);
      setTotal(res.total);
    } catch (error) {
      console.error('Error loading more entries:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const saveEntry = async (entryData: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> => {
    try {
      const saved = await DiaryService.saveEntryAsync(entryData);
      setEntries((prev) => [saved, ...prev.filter((e) => e.id !== saved.id)]);
      setTotal((prev) => prev + 1);
      refreshStats();
      void invalidateWellness();
      return saved;
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> => {
    try {
      const updated = await DiaryService.updateEntryAsync(id, updates);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      refreshStats();
      return updated;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    try {
      await DiaryService.deleteEntryAsync(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSearchResults((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      refreshStats();
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const searchEntries = async (filters: SearchFilters): Promise<DiaryEntry[]> => {
    try {
      const results = await DiaryService.searchEntriesAsync(filters);
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Error searching entries:', error);
      return [];
    }
  };

  const getAllTags = async (): Promise<string[]> => {
    try {
      return await DiaryService.getAllTagsAsync();
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  };

  const value: DiaryContextType = {
    entries,
    loading,
    loadingMore,
    page,
    hasMore: page < totalPages,
    total,
    searchResults,
    stats,
    loadMore,
    saveEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getAllTags,
    refresh: loadInitial,
    refreshStats,
  };

  return (
    <DiaryContext.Provider value={value}>
      {children}
    </DiaryContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDiaryContext = (): DiaryContextType => {
  const context = useContext(DiaryContext);
  if (!context) {
    throw new Error('useDiaryContext must be used within a DiaryProvider');
  }
  return context;
};
