import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StorybookExport, StorybookChapter } from '../../types';
import { AIService } from '../../services/aiService';
import { Modal, Button } from '../common';
import { useToast } from '../common/Toast';
import { Save, Plus, Trash2 } from 'lucide-react';

interface StoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  storybook: StorybookExport;
  onSave: (updated: StorybookExport) => void;
}

export const StoryEditModal: React.FC<StoryEditModalProps> = ({
  isOpen,
  onClose,
  storybook,
  onSave
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(storybook.title);
  const [chapters, setChapters] = useState<StorybookChapter[]>(
    storybook.chapters && storybook.chapters.length > 0
      ? storybook.chapters.map(c => ({ ...c }))
      : [{ chapterNumber: 1, title: 'Chapter 1', content: storybook.generatedContent || '' }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleChapterChange = (index: number, field: 'title' | 'content', value: string) => {
    setChapters(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddChapter = () => {
    setChapters(prev => [
      ...prev,
      {
        chapterNumber: prev.length + 1,
        title: `Chapter ${prev.length + 1}`,
        content: ''
      }
    ]);
  };

  const handleRemoveChapter = (index: number) => {
    if (chapters.length <= 1) {
      toast.warning('A storybook must have at least one chapter.');
      return;
    }
    setChapters(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Story title cannot be empty.');
      return;
    }

    for (let i = 0; i < chapters.length; i++) {
      if (!chapters[i].content.trim()) {
        toast.warning(`Chapter ${i + 1} content cannot be empty.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const updated = await AIService.updateStorybook(storybook.id, {
        title: title.trim(),
        chapters: chapters.map((c, idx) => ({
          chapterNumber: idx + 1,
          title: c.title.trim() || `Chapter ${idx + 1}`,
          content: c.content.trim()
        }))
      });
      toast.success('Storybook updated successfully!');
      onSave(updated);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update storybook';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('storyEdit.modalTitle')} maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
            {t('storyEdit.titleLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-sm font-serif font-bold text-calm-900 dark:text-calm-100 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            placeholder={t('storyEdit.titlePlaceholder')}
            maxLength={150}
          />
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300">
              {t('storyEdit.chaptersCount', { count: chapters.length })}
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddChapter}
            >
              {t('storyEdit.addChapter')}
            </Button>
          </div>

          {chapters.map((ch, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-calm-200 dark:border-calm-800 bg-calm-50/50 dark:bg-calm-900/30 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={ch.title}
                  onChange={(e) => handleChapterChange(idx, 'title', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-lg text-sm font-serif font-semibold text-calm-900 dark:text-calm-100 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                  placeholder={t('storyEdit.chapterTitlePlaceholder', { count: idx + 1 })}
                />
                {chapters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChapter(idx)}
                    className="p-1.5 text-calm-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title={t('storyEdit.deleteChapter')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <textarea
                value={ch.content}
                onChange={(e) => handleChapterChange(idx, 'content', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-lg text-sm font-serif leading-relaxed text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-400 focus:outline-none resize-y"
                placeholder={t('storyEdit.chapterContentPlaceholder')}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-calm-100 dark:border-calm-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            {t('storyEdit.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
