import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { SearchBar } from '../components/Search/SearchBar';
import { FilterPanel } from '../components/Search/FilterPanel';
import { DiaryList } from '../components/Diary/DiaryList';
import { SearchFilters, DiaryEntry } from '../types';

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { entries, searchEntries, getAllTags, updateEntry, deleteEntry } = useDiary(user?.id || '');
  const [searchResults, setSearchResults] = useState<DiaryEntry[]>(entries);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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
  }, [entries]);

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
     
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
  const results = await searchEntries(filters);
        setSearchResults(results);
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const hasActiveFilters = !!(filters.query || filters.mood || filters.tags?.length || filters.dateRange);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Search & Filter</h1>
        <p className="text-gray-600">
          {searchResults.length} of {entries.length} entries
        </p>
      </div>

      <SearchBar onSearch={handleSearch} />

      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableTags={availableTags}
      />

      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-blue-800">
              {searchResults.length} entries match your search criteria
            </p>
            <button
              onClick={() => {
                setFilters({});
                setSearchResults(entries);
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <DiaryList
        entries={searchResults}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};