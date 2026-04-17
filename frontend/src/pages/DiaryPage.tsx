import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { DiaryEditor } from '../components/Diary/DiaryEditor';
import { DiaryList } from '../components/Diary/DiaryList';
import { DiaryEntry } from '../types';
import { PenTool, ArrowLeft } from 'lucide-react';

export const DiaryPage: React.FC = () => {
  const { user } = useAuth();
  const { entries, saveEntry, updateEntry, deleteEntry } = useDiary(user?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();

  const handleSave = async (entryData: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, entryData);
      } else {
        await saveEntry({
          ...entryData,
          userId: user?.id || ''
        });
      }
      setIsEditing(false);
      setEditingEntry(undefined);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingEntry(undefined);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Entries
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingEntry ? 'Edit Entry' : 'New Entry'}
          </h1>
        </div>
        
        <DiaryEditor
          entry={editingEntry}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Diary</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PenTool className="h-4 w-4" />
          Write New Entry
        </button>
      </div>

      <DiaryList
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};