import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const activePlaceholder = placeholder || t('search.inputPlaceholder', 'Search reflections, tags, or memories...');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-calm-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder={activePlaceholder}
          aria-label="Search entries"
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#1e293b] border border-calm-200 dark:border-calm-700/80 rounded-2xl text-sm text-calm-900 dark:text-calm-100 placeholder-calm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent shadow-xs transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-calm-400 hover:text-calm-600 dark:hover:text-calm-200 rounded-full hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};
