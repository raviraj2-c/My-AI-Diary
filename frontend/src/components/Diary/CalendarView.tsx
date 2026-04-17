import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { DiaryEntry } from '../../types';
import { format, isSameDay } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

import { CalendarProps } from 'react-calendar';
type Value = CalendarProps['value'];



interface CalendarViewProps {
  entries: DiaryEntry[];
  onDateSelect: (date: Date) => void;
  onEntrySelect: (entry: DiaryEntry) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDateSelect, onEntrySelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getEntriesForDate = (date: Date): DiaryEntry[] => {
    return entries.filter(entry => isSameDay(entry.date, date));
  };

  const hasEntryOnDate = (date: Date): boolean => {
    return entries.some(entry => isSameDay(entry.date, date));
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      onDateSelect(value);
    }
  };

  const selectedDateEntries = getEntriesForDate(selectedDate);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Calendar</h3>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileClassName={({ date, view }) => {
              if (view === 'month' && hasEntryOnDate(date)) {
                return 'has-entry';
              }
              return '';
            }}
            className="w-full"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            Entries for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          {selectedDateEntries.length > 0 ? (
            <div className="space-y-4">
              {selectedDateEntries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => onEntrySelect(entry)}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{entry.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 capitalize">{entry.mood}</p>
                  <div className="text-sm text-gray-700 mt-2 line-clamp-3">
                    <div dangerouslySetInnerHTML={{ __html: entry.content.slice(0, 100) + '...' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No entries for this date.</p>
              <button
                onClick={() => onDateSelect(selectedDate)}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Write an entry
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .has-entry {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 50%;
        }
        .has-entry:hover {
          background-color: #2563eb !important;
        }
      `}</style>
    </div>
  );
};