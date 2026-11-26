import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../services/wellnessService';
import { useHappyBox, useInvalidateWellness } from '../hooks/useQueries';
import { DiaryEntry } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Star, Sparkles, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { stripHtml } from '../utils/sanitize';
import { getMoodMeta } from '../utils/moods';

export const HappyBox: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading: loading, isError, refetch } = useHappyBox();
  const invalidateWellness = useInvalidateWellness();

  const favorites = data?.favorites || [];
  const mediaMemories = data?.mediaMemories || [];
  const onThisDay = data?.onThisDay || [];

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await WellnessService.toggleFavorite(id);
      await invalidateWellness();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEntry = (entry: DiaryEntry) => {
    navigate('/write', { state: { entry } });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-border dark:bg-ink-800" />
        <div className="h-32 rounded-2xl bg-sky-100 dark:bg-ink-900" />
        <div className="h-32 rounded-2xl bg-sky-100 dark:bg-ink-900" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-sm text-danger dark:text-danger">{t('common.error')}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>{t('common.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 text-xs font-semibold mb-1">
          <Sparkles className="w-4 h-4 fill-sky-400" />
          <span>{t('happybox.title')}</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('happybox.title')}</h1>
        <p className="text-sm text-muted mt-1">
          {t('happybox.subtitle')}
        </p>
      </div>

      {/* 1. On This Day in Past Years */}
      {onThisDay.length > 0 && (
        <Card className="p-6 md:p-8 bg-surface   dark: dark: border-sky-200 dark:border-ink-900 shadow-soft-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-200 uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4" />
            <span>{t('happybox.onThisDay')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {onThisDay.map((entry) => {
              const d = new Date(entry.entryDate || entry.createdAt);
              return (
                <div
                  key={entry.id}
                  onClick={() => handleOpenEntry(entry)}
                  className="p-4 rounded-xl bg-white/90 dark:bg-[#1e293b] border border-sky-200 dark:border-ink-900 cursor-pointer hover:border-sky-400 transition-all"
                >
                  <div className="text-xs text-sky-700 dark:text-sky-400 font-semibold mb-1">
                    {t('happybox.yearsAgo', { count: new Date().getFullYear() - d.getFullYear(), year: d.getFullYear() })}
                  </div>
                  <h4 className="font-serif font-bold text-sm text-ink-900 dark:text-sky-100 line-clamp-1">
                    {entry.title || t('diary.untitled')}
                  </h4>
                  <p className="text-xs text-muted dark:text-muted line-clamp-2 mt-1">
                    {stripHtml(entry.content)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 2. Starred / Favorite Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-sky-500 fill-sky-400" />
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">
              {t('happybox.starredMemoriesCount', { count: favorites.length })}
            </h2>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favorites.map((entry) => {
              const meta = getMoodMeta(entry.mood);
              return (
                <Card
                  key={entry.id}
                  onClick={() => handleOpenEntry(entry)}
                  className="p-5 border-border dark:border-ink-800 hover:border-primary-400 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.entryDate || entry.date || Date.now()).toLocaleDateString()}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(entry.id, e)}
                        aria-label="Unstar"
                        className="text-sky-400 hover:text-sky-500 transition-colors p-1"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="font-serif font-bold text-sm text-ink-900 dark:text-sky-100 line-clamp-1 group-hover:text-primary-600">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-muted dark:text-muted line-clamp-3 mt-2 leading-relaxed">
                      {stripHtml(entry.content)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.badgeClass}`}>
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                    {entry.media && entry.media.length > 0 && (
                      <span className="text-muted text-[11px]">📷 {entry.media.length}</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted py-6 text-center italic">
            {t('happybox.noStarred')}
          </p>
        )}
      </div>

      {/* 3. Media Memories */}
      {mediaMemories.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">
              {t('happybox.visualMemories')}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaMemories.map((entry) => {
              const primaryMedia = entry.media?.[0];
              const thumb = primaryMedia?.thumbnailUrl || primaryMedia?.url;
              if (!thumb) return null;
              return (
                <div
                  key={entry.id}
                  onClick={() => handleOpenEntry(entry)}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-sky-100 dark:bg-ink-800 cursor-pointer group shadow-xs border border-border dark:border-ink-800"
                >
                  <img
                    src={thumb}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-surface from-black/75 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                    <p className="text-xs font-semibold line-clamp-1">{entry.title}</p>
                    <p className="text-[10px] text-sky-200">
                      {new Date(entry.entryDate || entry.date || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
