import { useState, useEffect } from 'react';
import { DiaryEntry, SearchFilters } from '../types';
import { DiaryService } from '../services/diaryService';

export const useDiary = (userId: string) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    if (userId) {
      loadEntries();
    }
  }, [userId]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const userEntries = await DiaryService.fetchEntries();
      setEntries(userEntries);
      setSearchResults(userEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> => {
    try {
      const savedEntry = await DiaryService.saveEntryAsync(entry);
      await loadEntries();
      return savedEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> => {
    try {
      const updatedEntry = await DiaryService.updateEntryAsync(id, updates);
      await loadEntries();
      return updatedEntry;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string): Promise<void> => {
    try {
      await DiaryService.deleteEntryAsync(id);
      await loadEntries();
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
      const tags = await DiaryService.getAllTagsAsync();
      return tags;
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  };

  return {
    entries,
    searchResults,
    loading,
    saveEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getAllTags,
    refresh: loadEntries
  };
};