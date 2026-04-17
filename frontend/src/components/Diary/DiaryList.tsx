import React from 'react';
import { DiaryEntry } from './DiaryEntry';
import { DiaryEntry as DiaryEntryType } from '../../types';

interface DiaryListProps {
  entries: DiaryEntryType[];
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
}

export const DiaryList: React.FC<DiaryListProps> = ({ entries, onEdit, onDelete }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No diary entries yet.</p>
        <p className="text-gray-400 mt-2">Start writing your first entry!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(entry => (
        <DiaryEntry
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};