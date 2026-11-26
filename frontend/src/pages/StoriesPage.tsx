import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StorybookMetadata, StorybookExport } from '../types';
import { AIService } from '../services/aiService';
import { ExportService } from '../services/exportService';
import { StoryCover } from '../components/Export/StoryCover';
import { StoryReader } from '../components/Export/StoryReader';
import { Card, Button, ConfirmDialog, Spinner } from '../components/common';
import { useToast } from '../components/common/Toast';
import { BookOpen, Plus, Trash2, Download, FileText, Calendar, Sparkles } from 'lucide-react';

export const StoriesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [stories, setStories] = useState<StorybookMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<StorybookExport | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AIService.getStorybooks();
      setStories(data);
    } catch (err) {
      console.error('Error fetching storybooks:', err);
      toast.error(t('stories.toastLoadError'));
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleOpenStory = async (id: string) => {
    try {
      const fullStory = await AIService.getStorybook(id);
      setActiveStory(fullStory);
    } catch (err) {
      console.error(err);
      toast.error(t('stories.toastOpenError'));
    }
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
      await AIService.deleteStorybook(storyToDelete);
      setStories((prev) => prev.filter((s) => s.id !== storyToDelete));
      toast.success(t('stories.toastDeleted'));
      setStoryToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error(t('stories.toastDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const fullStory = await AIService.getStorybook(id);
      await ExportService.exportToPDF(fullStory);
      toast.success(t('stories.toastPdfSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('stories.toastPdfError'));
    }
  };

  const handleDownloadText = async (id: string) => {
    try {
      const fullStory = await AIService.getStorybook(id);
      ExportService.exportToText(fullStory);
      toast.success(t('stories.toastTextSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('stories.toastTextError'));
    }
  };

  const formatDate = (date: Date | string) =>
    new Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
          {t('stories.libraryTitle')}
        </h1>

        <Link to="/export">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            {t('stories.createNew')}
          </Button>
        </Link>
      </div>

      {/* Stories Grid or Loading / Empty state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted">{t('stories.gathering')}</p>
        </div>
      ) : stories.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border dark:border-ink-800">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-ink-800 text-muted mx-auto flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100 mb-1">
            {t('stories.emptyTitle')}
          </h3>
          <p className="text-sm text-muted dark:text-muted max-w-md mx-auto mb-6">
            {t('stories.emptyDesc')}
          </p>
          <Link to="/export">
            <Button variant="primary" size="md" icon={<Sparkles className="w-4 h-4" />}>
              {t('stories.createFirst')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="p-5 flex flex-col justify-between border-border dark:border-ink-800 hover:shadow-soft-lg transition-all group"
            >
              <div className="space-y-4">
                {/* Visual Cover Preview */}
                <div
                  onClick={() => handleOpenStory(story.id)}
                  className="cursor-pointer transform group-hover:scale-[1.01] transition-transform"
                >
                  <StoryCover
                    theme={story.theme}
                    title={story.title}
                    protagonist={story.protagonist?.name}
                    timeframe={story.timeframe}
                    size="sm"
                  />
                </div>

                {/* Metadata */}
                <div>
                  <h3
                    onClick={() => handleOpenStory(story.id)}
                    className="text-base font-serif font-bold text-ink-900 dark:text-sky-50 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer line-clamp-1 transition-colors"
                  >
                    {story.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted dark:text-muted">
                    <span className="capitalize font-medium text-text dark:text-sky-200">
                      {story.theme}
                    </span>
                    <span>•</span>
                    <span>{t('stories.chaptersCount', { count: story.chapterCount || 1 })}</span>
                    {story.wordCount ? (
                      <>
                        <span>•</span>
                        <span>{t('stories.wordsCount', { count: story.wordCount })}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('stories.createdOn', { date: formatDate(story.createdAt) })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenStory(story.id)}
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  className="flex-1"
                >
                  {t('stories.openStory')}
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownloadPDF(story.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-ink-800 dark:hover:text-border hover:bg-sky-100 dark:hover:bg-ink-800 transition-colors"
                    title={t('stories.downloadPDF')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadText(story.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-ink-800 dark:hover:text-border hover:bg-sky-100 dark:hover:bg-ink-800 transition-colors"
                    title={t('stories.downloadText')}
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStoryToDelete(story.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title={t('stories.deleteTitle')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {activeStory && (
        <StoryReader
          storybook={activeStory}
          onClose={() => setActiveStory(null)}
          onUpdate={(updated) => {
            setActiveStory(updated);
            setStories((prev) =>
              prev.map((s) =>
                s.id === updated.id
                  ? {
                      ...s,
                      title: updated.title,
                      chapterCount: updated.chapters ? updated.chapters.length : s.chapterCount
                    }
                  : s
              )
            );
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(storyToDelete)}
        title={t('stories.deleteTitle')}
        message={t('stories.deleteDesc')}
        confirmText={t('stories.deleteConfirm')}
        cancelText={t('stories.deleteKeep')}
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setStoryToDelete(null)}
      />
    </div>
  );
};

export default StoriesPage;
