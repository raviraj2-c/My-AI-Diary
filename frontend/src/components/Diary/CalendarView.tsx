import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import { DiaryEntry } from '../../types';
import { isSameDay } from 'date-fns';
import { stripHtml } from '../../utils/sanitize';
import { getMoodMeta } from '../../utils/moods';
import { Card, Button, Badge } from '../common';
import { Calendar as CalendarIcon, PenTool, Sparkles } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

import { CalendarProps } from 'react-calendar';
type Value = CalendarProps['value'];

export interface CalendarMonthItem {
  date: string;
  count: number;
  mood: string;
  hasMedia: boolean;
}

interface CalendarViewProps {
  entries: DiaryEntry[];
  monthItems?: CalendarMonthItem[];
  onMonthChange?: (month: string) => void;
  onDayTap?: (dateKey: string) => void;
  onDateSelect: (date: Date) => void;
  onEntrySelect: (entry: DiaryEntry) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  monthItems,
  onMonthChange,
  onDayTap,
  onDateSelect,
  onEntrySelect
}) => {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const toLocalDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const monthDateSet = new Set((monthItems || []).map((item) => item.date));

  const getEntriesForDate = (date: Date): DiaryEntry[] => {
    return entries.filter(entry => isSameDay(new Date(entry.entryDate || entry.date || Date.now()), date));
  };

  const hasEntryOnDate = (date: Date): boolean => {
    if (monthItems) {
      return monthDateSet.has(toLocalDateKey(date));
    }
    return entries.some(entry => isSameDay(new Date(entry.entryDate || entry.date || Date.now()), date));
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      if (onDayTap) {
        onDayTap(toLocalDateKey(value));
      } else {
        onDateSelect(value);
      }
    }
  };

  const selectedDateEntries = getEntriesForDate(selectedDate);

  return (
    <Card className="p-6 md:p-8 border-border dark:border-ink-800">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-base font-semibold text-ink-900 dark:text-sky-50">{t('calendar.selectDate')}</h3>
          </div>

          <div className="calendar-wrapper rounded-2xl overflow-hidden p-2 bg-sky-50 dark:bg-ink-900 border border-border dark:border-ink-800">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate && onMonthChange) {
                  const y = activeStartDate.getFullYear();
                  const m = String(activeStartDate.getMonth() + 1).padStart(2, '0');
                  onMonthChange(`${y}-${m}`);
                }
              }}
              tileClassName={({ date, view }) => {
                if (view === 'month' && hasEntryOnDate(date)) {
                  return 'sky-has-entry';
                }
                return '';
              }}
              className="w-full border-none font-sans"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-ink-900 dark:text-sky-50">
                {selectedDate.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-muted">
                {selectedDateEntries.length} {t('dashboard.recentEntries', 'reflections')}
              </p>
            </div>
            <Button
              onClick={() => onDateSelect(selectedDate)}
              variant="outline"
              size="sm"
              icon={<PenTool className="w-3.5 h-3.5" />}
            >
              {t('dashboard.writeEntry', 'Write for this day')}
            </Button>
          </div>

          {selectedDateEntries.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {selectedDateEntries.map(entry => {
                const plainPreview = stripHtml(entry.content);
                const moodMeta = getMoodMeta(entry.mood);
                return (
                  <div
                    key={entry.id}
                    onClick={() => onEntrySelect(entry)}
                    className="p-4 rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-[#1e293b] hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className="font-serif font-semibold text-ink-900 dark:text-sky-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                        {entry.title || 'Untitled reflection'}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${moodMeta.badgeClass}`}>
                        <span>{moodMeta.emoji}</span>
                        <span>{moodMeta.label}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted dark:text-muted line-clamp-2 leading-relaxed">
                      {plainPreview || 'No text content.'}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-2.5 flex-wrap">
                        {entry.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} size="sm">#{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border dark:border-ink-800 bg-white dark:bg-[#1e293b]">
              <Sparkles className="w-8 h-8 text-sky-200 dark:text-muted mb-2" />
              <p className="text-sm text-muted dark:text-sky-200 font-medium">{t('calendar.noEntry')}</p>
              <p className="text-xs text-muted max-w-xs mt-1">
                {t('calendar.noEntryPrompt')}
              </p>
              <Button
                onClick={() => onDateSelect(selectedDate)}
                variant="primary"
                size="sm"
                className="mt-4"
              >
                {t('calendar.createEntry')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* React-Calendar styling for calm & dark mode */
        .react-calendar {
          background: transparent !important;
          border: none !important;
          font-family: inherit !important;
          width: 100% !important;
        }
        .react-calendar__navigation button {
          font-weight: 600;
          border-radius: 8px;
          color: inherit;
        }
        .react-calendar__navigation button:hover,
        .react-calendar__navigation button:focus {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }
        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .react-calendar__tile {
          border-radius: 10px !important;
          padding: 10px 6px !important;
          font-size: 0.85rem !important;
          color: inherit;
          transition: all 0.15s ease;
        }
        .react-calendar__tile:hover {
          background-color: rgba(99, 102, 241, 0.08) !important;
        }
        .react-calendar__tile--now {
          background-color: transparent !important;
          font-weight: bold;
          text-decoration: underline;
          text-decoration-color: #6366f1;
        }
        .react-calendar__tile--active {
          background: #6366f1 !important;
          color: white !important;
          font-weight: 600 !important;
        }
        .sky-has-entry {
          position: relative;
        }
        .sky-has-entry::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #10b981;
        }
        .react-calendar__tile--active.sky-has-entry::after {
          background-color: white;
        }
        .dark .react-calendar__tile {
          color: #e2e8f0;
        }
        .dark .react-calendar__navigation button {
          color: #e2e8f0;
        }
      `}</style>
    </Card>
  );
};
