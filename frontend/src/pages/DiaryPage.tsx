import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { DiaryEditor } from '../components/Diary/DiaryEditor';
import { DiaryList } from '../components/Diary/DiaryList';
import { DiaryEntry } from '../types';
import { PenTool, ArrowLeft } from 'lucide-react';
import { Button, ConfirmDialog } from '../components/common';
import { useToast } from '../components/common/Toast';
import { SafetyBanner } from '../components/Wellness/SafetyBanner';

export const DiaryPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { entries, saveEntry, updateEntry, deleteEntry, hasMore, loadMore, loading } = useDiary(user?.id || '');
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [safetyLevel, setSafetyLevel] = useState<'none' | 'concern' | 'high'>('none');

  useEffect(() => {
    if (location.state?.entry) {
      setEditingEntry(location.state.entry);
      setIsEditing(true);
    } else if (location.state?.selectedDate) {
      const parsedDate = new Date(location.state.selectedDate);
      setEditingEntry({
        id: '',
        userId: user?.id || '',
        title: '',
        content: '',
        tags: [],
        mood: 'neutral',
        entryDate: parsedDate,
        date: parsedDate,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setIsEditing(true);
    }
  }, [location.state, user?.id]);

  const handleSave = async (entryData: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let saved: DiaryEntry;
      if (editingEntry?.id) {
        saved = await updateEntry(editingEntry.id, entryData);
        toast.success('Your reflections were gently updated.');
      } else {
        saved = await saveEntry({
          ...entryData,
          userId: user?.id || ''
        });
        toast.success('Your entry has been saved safely.');
      }

      const safetyLevelReturned = (saved as DiaryEntry & { safety?: { level: 'none' | 'concern' | 'high' } })?.safety?.level;
      if (safetyLevelReturned && safetyLevelReturned !== 'none') {
        setSafetyLevel(safetyLevelReturned);
      }

      setIsEditing(false);
      setEditingEntry(undefined);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Could not save your entry. Please try again.');
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setIsEditing(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteEntry(deletingId);
      toast.info('Entry was permanently removed.');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to remove entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingEntry(undefined);
    // clear navigation state so going back doesn't re-open editor
    navigate('/write', { replace: true, state: null });
  };

  if (isEditing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SafetyBanner
          level={safetyLevel}
          onDismiss={() => setSafetyLevel('none')}
          country={user?.settings?.country}
          trustedContact={user?.settings?.trustedContact}
        />

        <div className="flex items-center gap-4">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            {t('common.back', 'Back to Journal')}
          </Button>
          <h1 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">
            {editingEntry?.id ? t('write.editTitle', 'Edit Entry') : t('write.title', 'New Entry')}
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
    <div className="space-y-6 animate-fade-in">
      <SafetyBanner
        level={safetyLevel}
        onDismiss={() => setSafetyLevel('none')}
        country={user?.settings?.country}
        trustedContact={user?.settings?.trustedContact}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('write.title', 'My Journal')}</h1>
          <p className="text-sm text-calm-500 dark:text-calm-400 mt-0.5">
            {entries.length} {t('dashboard.recentEntries', 'reflections')}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEntry(undefined);
            setIsEditing(true);
          }}
          variant="primary"
          icon={<PenTool className="h-4 w-4" />}
        >
          {t('dashboard.writeEntry', 'Write New Entry')}
        </Button>
      </div>

      <DiaryList
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        hasMore={hasMore}
        onLoadMore={loadMore}
        isLoading={loading}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title={t('write.deleteEntryConfirm', 'Delete this entry?')}
        message={t('write.deleteEntryWarning', 'This action cannot be undone. Your journal entry and AI insights associated with it will be permanently deleted.')}
        confirmText={t('common.delete', 'Delete Entry')}
        cancelText={t('common.cancel', 'Cancel')}
        variant="danger"
      />
    </div>
  );
};
