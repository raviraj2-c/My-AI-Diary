import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { SearchFilters } from '../../types';
import { getAllMoods } from '../../utils/moods';
import { Card, Badge } from '../common';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, availableTags }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const moods = getAllMoods();

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    if (!value) return;
    const dateVal = new Date(value);
    const newDateRange = {
      start: filters.dateRange?.start || dateVal,
      end: filters.dateRange?.end || dateVal,
      [field]: dateVal
    };

    onFiltersChange({
      ...filters,
      dateRange: newDateRange
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    onFiltersChange({
      ...filters,
      tags: newTags
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: filters.query
    });
  };

  const hasActiveFilters = !!(filters.mood || filters.tags?.length || filters.dateRange);

  return (
    <Card className="p-4 border-calm-200 dark:border-calm-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-300 flex items-center justify-center">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-calm-900 dark:text-calm-100">{t('common.filter', 'Filter Reflections')}</h3>
            <p className="text-xs text-calm-500">{t('search.subtitle', 'Filter by mood, tag, or time range')}</p>
          </div>
          {hasActiveFilters && (
            <Badge variant="primary" size="sm">{t('search.filterMood', 'Active Filters')}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-calm-500 hover:text-calm-800 dark:hover:text-calm-200 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {t('sos.resetGrounding', 'Reset')}
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-calm-400 hover:text-calm-700 dark:hover:text-calm-200 hover:bg-calm-100 dark:hover:bg-calm-800 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5 pt-4 mt-4 border-t border-calm-100 dark:border-calm-800 animate-fade-in text-sm">
          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
              {t('filter.byMood')}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFiltersChange({ ...filters, mood: undefined })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  !filters.mood
                    ? 'bg-calm-900 text-white dark:bg-calm-100 dark:text-calm-900 border-transparent'
                    : 'bg-white dark:bg-[#0f172a] border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300'
                }`}
              >
                {t('filter.allMoods')}
              </button>
              {moods.map(m => {
                const isSelected = filters.mood === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => onFiltersChange({ ...filters, mood: isSelected ? undefined : m.value })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                        : 'bg-white dark:bg-[#0f172a] border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-800'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
                {t('filter.byTags')}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {availableTags.map(tag => {
                  const isSelected = filters.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-calm-50 dark:bg-calm-800 border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 hover:bg-calm-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
              {t('export.selectHorizon')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-calm-500 mb-1">{t('export.from')}</label>
                <input
                  type="date"
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-calm-500 mb-1">{t('export.until')}</label>
                <input
                  type="date"
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
