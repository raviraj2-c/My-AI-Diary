import React from 'react';
import { Smile, Frown, Meh, Zap, Heart, Flame, Sun } from 'lucide-react';
import { DiaryEntry } from '../types';

export type MoodType = DiaryEntry['mood'];

export interface MoodConfig {
  value: MoodType;
  label: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  colorHex: string;
  stripeClass: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  bgLightClass: string;
  bgDarkClass: string;
  borderClass: string;
  description: string;
}

export const MOODS: Record<MoodType, MoodConfig> = {
  peaceful: {
    value: 'peaceful',
    label: 'Peaceful',
    emoji: '🌿',
    icon: Sun,
    colorHex: '#589464',
    stripeClass: 'bg-calm-500',
    badgeClass: 'bg-calm-100 text-calm-800 dark:bg-calm-900/60 dark:text-calm-200',
    dotClass: 'bg-calm-500',
    textClass: 'text-calm-600 dark:text-calm-400',
    bgLightClass: 'bg-calm-50',
    bgDarkClass: 'dark:bg-calm-950/40',
    borderClass: 'border-calm-200 dark:border-calm-800',
    description: 'Calm, grounded, and content'
  },
  happy: {
    value: 'happy',
    label: 'Happy',
    emoji: '☀️',
    icon: Smile,
    colorHex: '#eab308',
    stripeClass: 'bg-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-600 dark:text-amber-400',
    bgLightClass: 'bg-amber-50',
    bgDarkClass: 'dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800',
    description: 'Bright, joyful, and optimistic'
  },
  excited: {
    value: 'excited',
    label: 'Excited',
    emoji: '✨',
    icon: Zap,
    colorHex: '#f97316',
    stripeClass: 'bg-orange-500',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgLightClass: 'bg-orange-50',
    bgDarkClass: 'dark:bg-orange-950/40',
    borderClass: 'border-orange-200 dark:border-orange-800',
    description: 'Energetic, inspired, and motivated'
  },
  neutral: {
    value: 'neutral',
    label: 'Neutral',
    emoji: '☁️',
    icon: Meh,
    colorHex: '#64748b',
    stripeClass: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    dotClass: 'bg-slate-400',
    textClass: 'text-slate-600 dark:text-slate-400',
    bgLightClass: 'bg-slate-50',
    bgDarkClass: 'dark:bg-slate-900/40',
    borderClass: 'border-slate-200 dark:border-slate-700',
    description: 'Quiet, observing, and balanced'
  },
  anxious: {
    value: 'anxious',
    label: 'Anxious',
    emoji: '💜',
    icon: Heart,
    colorHex: '#a855f7',
    stripeClass: 'bg-purple-400',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
    dotClass: 'bg-purple-400',
    textClass: 'text-purple-600 dark:text-purple-400',
    bgLightClass: 'bg-purple-50',
    bgDarkClass: 'dark:bg-purple-950/40',
    borderClass: 'border-purple-200 dark:border-purple-800',
    description: 'Tender, uneasy, or needing gentleness'
  },
  sad: {
    value: 'sad',
    label: 'Sad',
    emoji: '💧',
    icon: Frown,
    colorHex: '#38bdf8',
    stripeClass: 'bg-sky-400',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-600 dark:text-sky-400',
    bgLightClass: 'bg-sky-50',
    bgDarkClass: 'dark:bg-sky-950/40',
    borderClass: 'border-sky-200 dark:border-sky-800',
    description: 'Heavy-hearted, tender, or reflective'
  },
  angry: {
    value: 'angry',
    label: 'Frustrated',
    emoji: '🔥',
    icon: Flame,
    colorHex: '#f43f5e',
    stripeClass: 'bg-rose-500',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-600 dark:text-rose-400',
    bgLightClass: 'bg-rose-50',
    bgDarkClass: 'dark:bg-rose-950/40',
    borderClass: 'border-rose-200 dark:border-rose-800',
    description: 'Frustrated, overwhelmed, or passionate'
  }
};

export const getMoodMeta = (mood?: string): MoodConfig => {
  if (mood && mood in MOODS) {
    return MOODS[mood as MoodType];
  }
  return MOODS.neutral;
};

export const getAllMoods = (): MoodConfig[] => Object.values(MOODS);
