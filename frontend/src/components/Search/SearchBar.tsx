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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder={activePlaceholder}
          aria-label="Search entries"
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#1e293b] border border-border dark:border-text rounded-2xl text-sm text-ink-900 dark:text-sky-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent shadow-xs transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-muted dark:hover:text-border rounded-full hover:bg-sky-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
};
