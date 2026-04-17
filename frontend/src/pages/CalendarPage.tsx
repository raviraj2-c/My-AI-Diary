import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { CalendarView } from '../components/Diary/CalendarView';
import { DiaryEntry } from '../types';
import { useNavigate } from 'react-router-dom';

export const CalendarPage: React.FC = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
        <p className="text-gray-600">
          {entries.length} total entries
        </p>
      </div>

      <CalendarView
        entries={entries}
        onDateSelect={handleDateSelect}
        onEntrySelect={handleEntrySelect}
      />

      {selectedEntry && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Entry Details</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{selectedEntry.title}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {selectedEntry.date.toLocaleDateString()} • {selectedEntry.mood}
              </p>
            </div>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: selectedEntry.content }}
            />
            {selectedEntry.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedEntry.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};