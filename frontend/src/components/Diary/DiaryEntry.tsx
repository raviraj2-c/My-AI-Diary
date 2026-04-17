import React from 'react';
import { DiaryEntry as DiaryEntryType } from '../../types';
import { Calendar, Tag, Edit, Trash2, Smile, Frown, Meh, Angry, Heart, Zap } from 'lucide-react';

interface DiaryEntryProps {
  entry: DiaryEntryType;
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
}

const moodIcons = {
  happy: { icon: Smile, color: 'text-yellow-500' },
  sad: { icon: Frown, color: 'text-blue-500' },
  neutral: { icon: Meh, color: 'text-gray-500' },
  excited: { icon: Zap, color: 'text-orange-500' },
  anxious: { icon: Heart, color: 'text-red-500' },
  angry: { icon: Angry, color: 'text-red-600' },
  peaceful: { icon: Heart, color: 'text-green-500' },
};

export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry, onEdit, onDelete }) => {
  const MoodIcon = moodIcons[entry.mood]?.icon || Meh;
  const moodColor = moodIcons[entry.mood]?.color || 'text-gray-500';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{entry.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {entry.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className={`flex items-center gap-1 ${moodColor}`}>
              <MoodIcon className="h-4 w-4" />
              {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div 
        className="prose prose-sm max-w-none mb-4 text-gray-700"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      {entry.tags.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          <Tag className="h-4 w-4 text-gray-400" />
          <div className="flex flex-wrap gap-1">
            {entry.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};