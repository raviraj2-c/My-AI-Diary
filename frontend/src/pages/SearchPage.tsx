import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { SearchBar } from '../components/Search/SearchBar';
import { FilterPanel } from '../components/Search/FilterPanel';
import { DiaryList } from '../components/Diary/DiaryList';
import { SearchFilters, DiaryEntry } from '../types';
import { ConfirmDialog } from '../components/common';
import { useToast } from '../components/common/Toast';
import { Sparkles, X } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { entries, searchEntries, getAllTags, deleteEntry } = useDiary(user?.id || '');
  const navigate = useNavigate();
  const toast = useToast();

  const [searchResults, setSearchResults] = useState<DiaryEntry[]>(entries);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setSearchResults(entries);
    (async () => {
      try {
        const tags = await getAllTags();
        setAvailableTags(tags);
      } catch {
        setAvailableTags([]);
      }
    })();
  }, [entries, getAllTags]);

  const handleSearch = async (query: string) => {
    const newFilters = { ...filters, query };
    setFilters(newFilters);
    const results = await searchEntries(newFilters);
    setSearchResults(results);
  };

  const handleFiltersChange = async (newFilters: SearchFilters) => {
    setFilters(newFilters);
    const results = await searchEntries(newFilters);
    setSearchResults(results);
  };

  const handleEdit = (entry: DiaryEntry) => {
    navigate('/write', { state: { entry } });
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      const results = await searchEntries(filters);
      setSearchResults(results);
      toast.info('Entry deleted.');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearFilters = async () => {
    setFilters({});
    setSearchResults(entries);
  };

  const hasActiveFilters = !!(filters.query || filters.mood || filters.tags?.length || filters.dateRange);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('search.title', 'Search & Filter')}</h1>
          <p className="text-sm text-muted dark:text-muted mt-0.5">
            {t('search.subtitle', 'Search your private encrypted entries by keywords, moods, or tags.')}
          </p>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} />

      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableTags={availableTags}
      />

      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3.5 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-900 rounded-xl text-xs text-primary-900 dark:text-primary-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
            <span>
              {t('search.foundCount', { count: searchResults.length })}
            </span>
          </div>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1 font-semibold text-primary-700 dark:text-primary-300 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            {t('search.clearFilters')}
          </button>
        </div>
      )}

      <DiaryList
        entries={searchResults}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this entry?"
        message="This entry will be permanently removed from your diary."
        confirmText="Delete Entry"
        variant="danger"
      />
    </div>
  );
};
