import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { CalendarView } from '../components/Diary/CalendarView';
import { DiaryEntry } from '../types';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '../utils/sanitize';
import { getMoodMeta } from '../utils/moods';
import { Card, Button, Badge } from '../components/common';
import { MediaGallery } from '../components/Diary/MediaGallery';
import { PenTool, X } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { entries } = useDiary(user?.id || '');
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

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
          <h1 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('calendar.title', 'Calendar')}</h1>
          <p className="text-sm text-calm-500 dark:text-calm-400 mt-0.5">
            {t('calendar.subtitle', 'Trace your emotional and personal journey over time')}
          </p>
        </div>
      </div>

      <CalendarView
        entries={entries}
        onDateSelect={handleDateSelect}
        onEntrySelect={handleEntrySelect}
      />

      {selectedEntry && (
        <Card className="p-6 md:p-8 animate-slide-up border-primary-200 dark:border-primary-900">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-calm-100 dark:border-calm-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getMoodMeta(selectedEntry.mood).badgeClass}`}>
                  <span>{getMoodMeta(selectedEntry.mood).emoji}</span>
                  <span>{getMoodMeta(selectedEntry.mood).label}</span>
                </span>
                <span className="text-xs text-calm-400">
                  {new Date(selectedEntry.entryDate || selectedEntry.date || Date.now()).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">
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
                className="p-1.5 text-calm-400 hover:text-calm-600 dark:hover:text-calm-200 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="pt-6 prose dark:prose-invert max-w-none text-sm text-calm-800 dark:text-calm-200 font-serif leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEntry.content) }}
          />

          {selectedEntry.media && selectedEntry.media.length > 0 && (
            <MediaGallery media={selectedEntry.media} />
          )}

          {selectedEntry.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap pt-6 mt-6 border-t border-calm-100 dark:border-calm-800">
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
