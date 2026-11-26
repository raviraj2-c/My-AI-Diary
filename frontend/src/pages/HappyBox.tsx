import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../services/wellnessService';
import { DiaryEntry } from '../types';
import { Card } from '../components/common/Card';
import { Star, Sparkles, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { stripHtml } from '../utils/sanitize';
import { getMoodMeta } from '../utils/moods';

export const HappyBox: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<DiaryEntry[]>([]);
  const [mediaMemories, setMediaMemories] = useState<DiaryEntry[]>([]);
  const [onThisDay, setOnThisDay] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHappyBox();
  }, []);

  const loadHappyBox = async () => {
    try {
      setLoading(true);
      const data = await WellnessService.getHappyBox();
      setFavorites(data.favorites || []);
      setMediaMemories(data.mediaMemories || []);
      setOnThisDay(data.onThisDay || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isFav = await WellnessService.toggleFavorite(id);
      setFavorites((prev) =>
        isFav ? prev : prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEntry = (entry: DiaryEntry) => {
    navigate('/write', { state: { entry } });
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('happybox.opening')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
          <Sparkles className="w-4 h-4 fill-amber-400" />
          <span>{t('happybox.title')}</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('happybox.title')}</h1>
        <p className="text-sm text-calm-500 mt-1">
          {t('happybox.subtitle')}
        </p>
      </div>

      {/* 1. On This Day in Past Years */}
      {onThisDay.length > 0 && (
        <Card className="p-6 md:p-8 bg-gradient-to-r from-amber-50 to-primary-50 dark:from-amber-950/30 dark:to-primary-950/20 border-amber-200/70 dark:border-amber-900/40 shadow-soft-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
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
                  className="p-4 rounded-xl bg-white/90 dark:bg-[#1e293b] border border-amber-200/80 dark:border-amber-900/50 cursor-pointer hover:border-amber-400 transition-all"
                >
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                    {t('happybox.yearsAgo', { count: new Date().getFullYear() - d.getFullYear(), year: d.getFullYear() })}
                  </div>
                  <h4 className="font-serif font-bold text-sm text-calm-900 dark:text-calm-100 line-clamp-1">
                    {entry.title || t('diary.untitled')}
                  </h4>
                  <p className="text-xs text-calm-600 dark:text-calm-400 line-clamp-2 mt-1">
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
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h2 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">
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
                  className="p-5 border-calm-200 dark:border-calm-800 hover:border-primary-400 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-calm-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.entryDate || entry.date || Date.now()).toLocaleDateString()}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(entry.id, e)}
                        aria-label="Unstar"
                        className="text-amber-400 hover:text-amber-500 transition-colors p-1"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="font-serif font-bold text-sm text-calm-900 dark:text-calm-100 line-clamp-1 group-hover:text-primary-600">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-calm-600 dark:text-calm-400 line-clamp-3 mt-2 leading-relaxed">
                      {stripHtml(entry.content)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-calm-100 dark:border-calm-800 flex items-center justify-between text-xs">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.badgeClass}`}>
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                    {entry.media && entry.media.length > 0 && (
                      <span className="text-calm-400 text-[11px]">📷 {entry.media.length}</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-calm-400 py-6 text-center italic">
            {t('happybox.noStarred')}
          </p>
        )}
      </div>

      {/* 3. Media Memories */}
      {mediaMemories.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">
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
                  className="relative aspect-square rounded-2xl overflow-hidden bg-calm-100 dark:bg-calm-800 cursor-pointer group shadow-xs border border-calm-200 dark:border-calm-800"
                >
                  <img
                    src={thumb}
                    alt={entry.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                    <p className="text-xs font-semibold line-clamp-1">{entry.title}</p>
                    <p className="text-[10px] text-calm-300">
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
