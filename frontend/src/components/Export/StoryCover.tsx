import React from 'react';
import { useTranslation } from 'react-i18next';
import { StorybookExport } from '../../types';
import { Sparkles, Heart, Compass, Search, Sun } from 'lucide-react';

interface StoryCoverProps {
  theme: StorybookExport['theme'];
  title: string;
  protagonist?: string;
  timeframe?: { start: Date; end: Date };
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const themeStyles: Record<
  StorybookExport['theme'],
  {
    gradient: string;
    border: string;
    accent: string;
    Icon: React.ComponentType<{ className?: string }>;
    motif: string;
  }
> = {
  romantic: {
    gradient: ' via-pink-900 ',
    border: 'border-danger',
    accent: 'text-danger',
    Icon: Heart,
    motif: '💌'
  },
  dramatic: {
    gradient: '  ',
    border: 'border-sky-400',
    accent: 'text-sky-200',
    Icon: Sparkles,
    motif: '🎭'
  },
  adventure: {
    gradient: '  ',
    border: 'border-sky-400',
    accent: 'text-sky-200',
    Icon: Compass,
    motif: '🧭'
  },
  mystery: {
    gradient: '  ',
    border: 'border-sky-400/30',
    accent: 'text-sky-200',
    Icon: Search,
    motif: '🔍'
  },
  comedy: {
    gradient: '  to-yellow-950',
    border: 'border-sky-400',
    accent: 'text-sky-200',
    Icon: Sun,
    motif: '☀️'
  }
};

export const StoryCover: React.FC<StoryCoverProps> = ({
  theme,
  title,
  protagonist,
  timeframe,
  size = 'md',
  className = ''
}) => {
  const { t } = useTranslation();
  const current = themeStyles[theme] || themeStyles.dramatic;

  const sizeClasses = {
    sm: 'w-full aspect-[3/4] p-3 text-center',
    md: 'w-full aspect-[3/4.2] p-5 text-center',
    lg: 'w-72 aspect-[3/4.4] p-6 text-center',
    full: 'max-w-md w-full aspect-[3/4.5] p-8 text-center'
  }[size];

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl bg-surface ${current.gradient} ${current.border} border shadow-soft-xl flex flex-col justify-between items-center text-white ${sizeClasses} ${className}`}
      style={{
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)'
      }}
    >
      {/* Subtle decorative book spine shading on left */}
      <div className="absolute top-0 bottom-0 left-0 w-3 bg-surface from-black/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-3 w-px bg-white/10 pointer-events-none" />

      {/* Subtle corner ornamental SVG frames */}
      <svg
        className="absolute top-2 left-4 w-6 h-6 text-white/20 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 12V4h8" />
      </svg>
      <svg
        className="absolute top-2 right-4 w-6 h-6 text-white/20 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20 12V4h-8" />
      </svg>
      <svg
        className="absolute bottom-2 left-4 w-6 h-6 text-white/20 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 12v8h8" />
      </svg>
      <svg
        className="absolute bottom-2 right-4 w-6 h-6 text-white/20 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20 12v8h-8" />
      </svg>

      {/* Top Header & Emblem */}
      <div className="pt-2 flex flex-col items-center gap-1 z-10">
        <span className="text-xl" role="img" aria-label={theme}>
          {current.motif}
        </span>
        <span className="text-[10px] tracking-widest uppercase font-mono font-semibold text-white/60">
          {t('storybook.memoir')}
        </span>
      </div>

      {/* Center Story Title & Protagonist */}
      <div className="my-auto px-2 z-10 space-y-2">
        <h3
          className={`font-serif font-bold tracking-tight text-white line-clamp-3 leading-snug ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
          }`}
        >
          {title}
        </h3>

        {protagonist && (
          <p className="text-xs font-medium text-white/80 italic truncate max-w-[200px] mx-auto">
            {t('storybook.journeyOf', { protagonist })}
          </p>
        )}

        <div className="w-12 h-0.5 bg-white/20 mx-auto rounded-full my-1.5" />
      </div>

      {/* Bottom Footer Info */}
      <div className="pb-2 flex items-center justify-between w-full px-4 text-[10px] text-white/50 z-10 border-t border-white/10 pt-2 font-mono">
        <span className="capitalize">{theme}</span>
        {timeframe && (
          <span>
            {formatDate(timeframe.start)}
            {timeframe.start.getTime() !== timeframe.end.getTime() &&
              ` – ${formatDate(timeframe.end)}`}
          </span>
        )}
      </div>
    </div>
  );
};
