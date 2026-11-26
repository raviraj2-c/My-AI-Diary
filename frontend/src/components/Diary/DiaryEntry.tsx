import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DiaryEntry as DiaryEntryType, AIReflection } from '../../types';
import { Calendar, Tag, Edit, Trash2, Clock, Image as ImageIcon, Film, FileAudio, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { stripHtml } from '../../utils/sanitize';
import { getMoodMeta } from '../../utils/moods';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';
import { AIService } from '../../services/aiService';
import { SafetyBanner } from '../Wellness/SafetyBanner';
import { useSettings } from '../../hooks/useSettings';

interface DiaryEntryProps {
  entry: DiaryEntryType;
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
}

export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reflection, setReflection] = useState<AIReflection | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [isAIOff, setIsAIOff] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleReflect = async () => {
    setIsReflecting(true);
    setReflectionError(null);
    setIsAIOff(false);
    setIsRateLimited(false);
    try {
      const res = await AIService.reflectOnEntry(entry.content, entry.mood);
      setReflection(res);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; code?: string; message?: string };
      const msg = errorObj.message || '';
      if (
        errorObj.status === 403 ||
        errorObj.code === 'AI_DISABLED' ||
        msg.includes('disabled') ||
        msg.includes('Turn on AI')
      ) {
        setIsAIOff(true);
      } else if (
        errorObj.status === 429 ||
        errorObj.code === 'QUOTA_EXCEEDED' ||
        msg.includes('daily limit') ||
        msg.includes('429')
      ) {
        setIsRateLimited(true);
      } else {
        setReflectionError(msg || t('diary.reflectError', 'Unable to generate reflection right now.'));
      }
    } finally {
      setIsReflecting(false);
    }
  };

  const moodMeta = getMoodMeta(entry.mood);
  const MoodIcon = moodMeta.icon;
  const entryDate = new Date(entry.entryDate || entry.date || Date.now());

  const plainTextPreview = stripHtml(entry.content);

  // Derive thumbnail from media items or fallback images
  const mediaItems = entry.media || [];
  const primaryVisual = mediaItems.find(m => m.type === 'image' || m.type === 'video');
  const thumbnailSrc = primaryVisual?.thumbnailUrl || primaryVisual?.url || entry.images?.[0];
  const audioCount = mediaItems.filter(m => m.type === 'audio').length;
  const videoCount = mediaItems.filter(m => m.type === 'video').length;
  const imageCount = mediaItems.filter(m => m.type === 'image').length || (entry.images?.length || 0);

  return (
    <>
      <article
        className="group relative flex overflow-hidden bg-white dark:bg-[#131d31] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200"
      >
        {/* Mood color stripe */}
        <div
          className={`w-2.5 shrink-0 ${moodMeta.stripeClass}`}
          title={`Mood: ${moodMeta.label}`}
          aria-hidden="true"
        />

        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Header: Title, mood badge, action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${moodMeta.badgeClass}`}
                  >
                    <MoodIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{moodMeta.label}</span>
                    <span className="text-xs">{moodMeta.emoji}</span>
                  </span>

                  <span className="text-gray-300 dark:text-gray-700">•</span>

                  <div className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <time dateTime={entryDate.toISOString()}>
                      {entryDate.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </time>
                  </div>

                  {entry.readingTime ? (
                    <>
                      <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">•</span>
                      <div className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{t('write.readingTime', { count: entry.readingTime, defaultValue: `${entry.readingTime} min read` })}</span>
                      </div>
                    </>
                  ) : null}

                  {entry.aiExcluded && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {t('diary.hiddenFromAIBadge', 'Hidden from AI')}
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                  {entry.title}
                </h3>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  aria-label={`Edit ${entry.title}`}
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  aria-label={`Delete ${entry.title}`}
                  className="p-2 text-gray-400 hover:text-danger dark:hover:text-danger hover:bg-sky-50 dark:hover:bg-danger rounded-xl transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Short text preview + optional thumbnail */}
            <div className="flex gap-4 items-start mb-4">
              <p className="flex-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-serif line-clamp-3">
                {plainTextPreview || 'No additional content.'}
              </p>

              {/* Thumbnail */}
              {thumbnailSrc ? (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 shadow-xs">
                  <img
                    src={thumbnailSrc}
                    alt="Entry thumbnail"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {primaryVisual?.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                      <Film className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer: Tags & Attached Media indicators */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50 dark:border-gray-800/60">
            <div className="flex flex-wrap gap-1.5 items-center">
              {entry.tags.length > 0 ? (
                <>
                  <Tag className="h-3 w-3 text-gray-400 shrink-0" />
                  {entry.tags.map((tag) => (
                    <Badge key={tag} size="sm" variant="default" className="text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80">
                      #{tag}
                    </Badge>
                  ))}
                </>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-gray-600 italic">{t('diary.noTags')}</span>
              )}
            </div>

            {/* Media indicators & Action buttons */}
            <div className="flex items-center gap-3">
              {!entry.aiExcluded && (
                <button
                  type="button"
                  onClick={handleReflect}
                  disabled={isReflecting}
                  aria-label={t('diary.reflectWithMe', 'Reflect with me')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200/80 dark:border-primary-800 transition-all active:scale-[0.98]"
                >
                  {isReflecting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-primary-600" />
                      <span>{t('diary.reflecting', 'Reflecting...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 text-primary-500" />
                      <span>{t('diary.reflectWithMe', 'Reflect with me')}</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 text-[11px] text-muted">
                {imageCount > 0 && (
                  <span className="inline-flex items-center gap-1" title={`${imageCount} images attached`}>
                    <ImageIcon className="h-3 w-3 text-primary-500" />
                    <span>{imageCount}</span>
                  </span>
                )}
                {videoCount > 0 && (
                  <span className="inline-flex items-center gap-1" title={`${videoCount} videos attached`}>
                    <Film className="h-3 w-3 text-sky-500" />
                    <span>{videoCount}</span>
                  </span>
                )}
                {audioCount > 0 && (
                  <span className="inline-flex items-center gap-1" title={`${audioCount} voice notes attached`}>
                    <FileAudio className="h-3 w-3 text-sky-500" />
                    <span>{audioCount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Soft Card for AI Reflection States */}
          {(isReflecting || isAIOff || isRateLimited || reflectionError || reflection) && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
              {isReflecting && (
                <div
                  role="status"
                  className="p-3.5 rounded-2xl bg-primary-50/60 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 flex items-center gap-2.5 text-xs text-primary-700 dark:text-primary-300 animate-pulse"
                >
                  <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary-600" />
                  <span>{t('diary.reflecting', 'Reflecting...')}</span>
                </div>
              )}

              {isAIOff && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 text-xs text-ink-900 dark:text-sky-200 flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{t('diary.aiDisabledMsg', 'AI reflection is turned off in your settings.')}</span>
                  <Link
                    to="/settings"
                    className="font-semibold underline text-primary-600 dark:text-primary-400 hover:text-primary-700"
                  >
                    {t('diary.enableInSettings', 'Enable in Settings')}
                  </Link>
                </div>
              )}

              {isRateLimited && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
                >
                  {t('diary.dailyLimitMsg', 'You have reached your daily AI limit. Please take a gentle break and return tomorrow.')}
                </div>
              )}

              {reflectionError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-sky-50 dark:bg-danger border border-danger dark:border-danger text-xs text-danger dark:text-danger flex items-center justify-between gap-2"
                >
                  <span>{reflectionError}</span>
                  <button
                    type="button"
                    onClick={handleReflect}
                    className="inline-flex items-center gap-1 font-semibold underline hover:text-danger dark:hover:text-danger shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{t('diary.retry', 'Retry')}</span>
                  </button>
                </div>
              )}

              {reflection && !isReflecting && (
                reflection.safety?.level === 'high' ? (
                  <SafetyBanner
                    level="high"
                    country={settings?.country}
                    trustedContact={settings?.trustedContact}
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-ink-950 border border-border dark:border-ink-800 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-primary-700 dark:text-primary-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{t('diary.reflectionTitle', 'Gentle Reflection')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-serif leading-relaxed">
                      {reflection.reflection}
                    </p>
                    {reflection.question && (
                      <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 font-serif italic pt-1">
                        {reflection.question}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </article>

      {/* Confirmation Dialog to replace window.confirm */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          onDelete(entry.id);
        }}
        title={t('write.deleteEntryConfirm', 'Delete this entry?')}
        message={t('write.deleteEntryWarning', 'This will permanently delete this diary entry and its attached media from Cloudinary. This action cannot be undone.')}
        confirmLabel={t('common.delete', 'Delete Entry')}
        cancelLabel={t('common.cancel', 'Cancel')}
        variant="danger"
      />
    </>
  );
};
