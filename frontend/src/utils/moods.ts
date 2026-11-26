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
  excited: {
    value: 'excited',
    label: 'Excited',
    emoji: '✨',
    icon: Zap,
    colorHex: '#0369A1',
    stripeClass: 'bg-sky-700',
    badgeClass: 'bg-sky-700 text-white dark:bg-sky-700 dark:text-white',
    dotClass: 'bg-sky-700',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgLightClass: 'bg-sky-100',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-sky-200 dark:border-ink-800',
    description: 'Energetic, inspired, and motivated'
  },
  happy: {
    value: 'happy',
    label: 'Happy',
    emoji: '☀️',
    icon: Smile,
    colorHex: '#0EA5E9',
    stripeClass: 'bg-sky-500',
    badgeClass: 'bg-sky-400 text-ink dark:bg-sky-400 dark:text-ink',
    dotClass: 'bg-sky-500',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgLightClass: 'bg-sky-100',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-sky-200 dark:border-ink-800',
    description: 'Bright, joyful, and optimistic'
  },
  peaceful: {
    value: 'peaceful',
    label: 'Peaceful',
    emoji: '🌿',
    icon: Sun,
    colorHex: '#38BDF8',
    stripeClass: 'bg-sky-400',
    badgeClass: 'bg-sky-200 text-ink dark:bg-ink-900 dark:text-sky-400',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgLightClass: 'bg-sky-50',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-sky-200 dark:border-ink-800',
    description: 'Calm, grounded, and content'
  },
  neutral: {
    value: 'neutral',
    label: 'Neutral',
    emoji: '☁️',
    icon: Meh,
    colorHex: '#BAE6FD',
    stripeClass: 'bg-sky-200',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-ink-900 dark:text-sky-400',
    dotClass: 'bg-sky-200',
    textClass: 'text-muted',
    bgLightClass: 'bg-sky-50',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-border',
    description: 'Quiet, observing, and balanced'
  },
  anxious: {
    value: 'anxious',
    label: 'Anxious',
    emoji: '💜',
    icon: Heart,
    colorHex: '#E0F2FE',
    stripeClass: 'bg-sky-100',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-ink-900 dark:text-sky-400',
    dotClass: 'bg-sky-100',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgLightClass: 'bg-sky-50',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-sky-200 dark:border-ink-800',
    description: 'Tender, uneasy, or needing gentleness'
  },
  sad: {
    value: 'sad',
    label: 'Sad',
    emoji: '💧',
    icon: Frown,
    colorHex: '#F0F9FF',
    stripeClass: 'bg-sky-100',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-ink-900 dark:text-sky-400',
    dotClass: 'bg-sky-100',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgLightClass: 'bg-sky-50',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-sky-200 dark:border-ink-800',
    description: 'Heavy-hearted, tender, or reflective'
  },
  angry: {
    value: 'angry',
    label: 'Frustrated',
    emoji: '🔥',
    icon: Flame,
    colorHex: '#F0F9FF',
    stripeClass: 'bg-sky-100',
    badgeClass: 'bg-sky-50 text-sky-700 dark:bg-ink-900 dark:text-sky-400',
    dotClass: 'bg-sky-100',
    textClass: 'text-sky-700 dark:text-sky-400',
    bgLightClass: 'bg-sky-50',
    bgDarkClass: 'dark:bg-ink-900',
    borderClass: 'border-sky-200 dark:border-ink-800',
    description: 'Pressured, restless, or needing space'
  }
};

export const getMoodMeta = (mood?: string): MoodConfig => {
  if (mood && mood in MOODS) {
    return MOODS[mood as MoodType];
  }
  return MOODS.neutral;
};

export const getAllMoods = (): MoodConfig[] => Object.values(MOODS);
