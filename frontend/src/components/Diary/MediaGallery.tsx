import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaItem } from '../../types';
import { Modal } from '../common/Modal';
import { Film, FileAudio, ZoomIn } from 'lucide-react';

interface MediaGalleryProps {
  media?: MediaItem[];
  compact?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media = [], compact = false }) => {
  const { t } = useTranslation();
  const [activeLightboxItem, setActiveLightboxItem] = useState<MediaItem | null>(null);

  if (!media || media.length === 0) return null;

  const images = media.filter(m => m.type === 'image');
  const videos = media.filter(m => m.type === 'video');
  const audios = media.filter(m => m.type === 'audio');

  return (
    <div className="space-y-4 my-4 animate-fade-in">
      {/* Images Grid */}
      {images.length > 0 && (
        <div className={`grid gap-2.5 rounded-2xl overflow-hidden ${
          images.length === 1
            ? 'grid-cols-1'
            : images.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}>
          {images.map((item, index) => (
            <div
              key={item.publicId || item.url || index}
              onClick={() => setActiveLightboxItem(item)}
              className="relative aspect-video sm:aspect-square bg-calm-100 dark:bg-calm-900 cursor-pointer overflow-hidden rounded-xl group"
            >
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.caption || `Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="p-2 rounded-full bg-black/60 text-white">
                  <ZoomIn className="w-4 h-4" />
                </span>
              </div>
              {item.caption && !compact && (
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-[11px] line-clamp-1">
                  {item.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((item, index) => (
            <div
              key={item.publicId || item.url || index}
              className="rounded-2xl overflow-hidden border border-calm-200 dark:border-calm-800 bg-black"
            >
              <video
                src={item.url}
                controls
                playsInline
                preload="metadata"
                poster={item.thumbnailUrl}
                className="w-full max-h-96 object-contain"
              />
              {item.caption && (
                <div className="p-2.5 bg-white dark:bg-[#1e293b] text-xs text-calm-600 dark:text-calm-300 border-t border-calm-100 dark:border-calm-800 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-calm-400 shrink-0" />
                  <span>{item.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audios / Voice Notes Section */}
      {audios.length > 0 && (
        <div className="space-y-2">
          {audios.map((item, index) => (
            <div
              key={item.publicId || item.url || index}
              className="p-3 rounded-xl border border-calm-200 dark:border-calm-800 bg-calm-50/70 dark:bg-calm-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center shrink-0">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-calm-800 dark:text-calm-200">
                    {item.caption || t('diary.voiceNote')}
                  </div>
                  <div className="text-[10px] text-calm-400">{t('diary.audioReflection')}</div>
                </div>
              </div>

              <audio controls src={item.url} className="w-full sm:w-64 h-8" preload="none" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Images */}
      {activeLightboxItem && (
        <Modal
          isOpen={!!activeLightboxItem}
          onClose={() => setActiveLightboxItem(null)}
          maxWidth="lg"
        >
          <div className="flex flex-col items-center">
            <img
              src={activeLightboxItem.url}
              alt={activeLightboxItem.caption || 'Enlarged photo'}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-soft-lg"
            />
            {activeLightboxItem.caption && (
              <p className="mt-3 text-sm text-calm-700 dark:text-calm-300 text-center font-medium">
                {activeLightboxItem.caption}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
