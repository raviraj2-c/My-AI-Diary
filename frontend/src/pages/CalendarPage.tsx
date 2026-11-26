import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendarMonth, useEntries } from '../hooks/useQueries';
import { CalendarView } from '../components/Diary/CalendarView';
import { DiaryEntry } from '../types';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../utils/sanitize';
import { getMoodMeta } from '../utils/moods';
import { Card, Button, Badge } from '../components/common';
import { MediaGallery } from '../components/Diary/MediaGallery';
import { PenTool, X } from 'lucide-react';

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visibleMonth, setVisibleMonth] = useState<string>(getCurrentMonthKey);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(getTodayKey);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const monthQuery = useCalendarMonth(visibleMonth);
  const dayEntriesQuery = useEntries(1, { startDate: selectedDayKey, endDate: selectedDayKey });
  const entries = dayEntriesQuery.data?.entries || [];

  const handleDateSelect = (date: Date) => {
    navigate('/write', { state: { selectedDate: date } });
  };

  const handleEntrySelect = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    navigate('/write', { state: { entry } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('calendar.title', 'Calendar')}</h1>
          <p className="text-sm text-muted dark:text-muted mt-0.5">
            {t('calendar.subtitle', 'Trace your emotional and personal journey over time')}
          </p>
        </div>
      </div>

      {monthQuery.isLoading ? (
        <div className="h-80 rounded-2xl bg-sky-100 dark:bg-ink-900 animate-pulse" />
      ) : monthQuery.isError ? (
        <Card className="p-6 text-center space-y-3">
          <p className="text-sm text-danger dark:text-danger">{t('common.error')}</p>
          <Button variant="outline" size="sm" onClick={() => monthQuery.refetch()}>{t('common.retry')}</Button>
        </Card>
      ) : (
        <CalendarView
          entries={entries}
          monthItems={monthQuery.data || []}
          onMonthChange={setVisibleMonth}
          onDayTap={setSelectedDayKey}
          onDateSelect={handleDateSelect}
          onEntrySelect={handleEntrySelect}
        />
      )}

      {selectedEntry && (
        <Card className="p-6 md:p-8 animate-slide-up border-primary-200 dark:border-primary-900">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-sky-100 dark:border-ink-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getMoodMeta(selectedEntry.mood).badgeClass}`}>
                  <span>{getMoodMeta(selectedEntry.mood).emoji}</span>
                  <span>{getMoodMeta(selectedEntry.mood).label}</span>
                </span>
                <span className="text-xs text-muted">
                  {new Date(selectedEntry.entryDate || selectedEntry.date || Date.now()).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
                {selectedEntry.title || 'Untitled reflection'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleEditEntry(selectedEntry)}
                variant="outline"
                size="sm"
                icon={<PenTool className="w-3.5 h-3.5" />}
              >
                {t('common.edit')}
              </Button>
              <button
                onClick={() => setSelectedEntry(null)}
                aria-label={t('common.close')}
                className="p-1.5 text-muted hover:text-muted dark:hover:text-border rounded-lg hover:bg-sky-100 dark:hover:bg-ink-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="pt-6 prose dark:prose-invert max-w-none text-sm text-ink-800 dark:text-border font-serif leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEntry.content) }}
          />

          {selectedEntry.media && selectedEntry.media.length > 0 && (
            <MediaGallery media={selectedEntry.media} />
          )}

          {selectedEntry.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap pt-6 mt-6 border-t border-sky-100 dark:border-ink-800">
              {selectedEntry.tags.map(tag => (
                <Badge key={tag} size="sm">#{tag}</Badge>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
