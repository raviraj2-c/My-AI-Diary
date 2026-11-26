import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useHomeSummary, useInvalidateWellness } from '../hooks/useQueries';
import { useSettings } from '../hooks/useSettings';
import { WellnessService } from '../services/wellnessService';
import { Card, Button, Chip, EmptyState, Skeleton } from '../components/ui';
import { GraduationCap, PenTool } from 'lucide-react';
import { getMoodMeta } from '../utils/moods';
import { getRandomQuoteByMood } from '../data/quotes';

export interface DashboardProps {
  weeklyMoodSummary?: string;
  recommendedActivity?: string;
}

const QUICK_MOODS = [
  { score: 2, emoji: '😢', labelKey: 'moods.sad' },
  { score: 4, emoji: '😟', labelKey: 'moods.anxious' },
  { score: 6, emoji: '😐', labelKey: 'moods.neutral' },
  { score: 8, emoji: '🙂', labelKey: 'moods.happy' },
  { score: 9, emoji: '✨', labelKey: 'moods.excited' },
];

export const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: summary, isLoading, isError, refetch } = useHomeSummary();
  const invalidateWellness = useInvalidateWellness();
  const [quickSaved, setQuickSaved] = useState(false);

  const todayScore = summary?.todayScore ?? null;
  const streakDays = summary?.streakDays ?? 0;
  const lastEntry = summary?.lastEntry ?? null;
  const quote = getRandomQuoteByMood(lastEntry?.mood || 'peaceful');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning', 'Good morning');
    if (hour < 18) return t('dashboard.greetingAfternoon', 'Good afternoon');
    return t('dashboard.greetingEvening', 'Good evening');
  };

  const handleQuickMood = async (score: number) => {
    try {
      await WellnessService.saveCheckIn({ moodScore: score, emotions: [] });
      setQuickSaved(true);
      await invalidateWellness();
    } catch {
      // handled by toast/retry
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError && !summary) {
    return (
      <Card className="text-center space-y-3">
        <p className="text-sm text-danger">{t('common.error')}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {t('common.retry')}
        </Button>
      </Card>
    );
  }

  const weekDays = (summary?.weekDays || []).map((wd: { date: string; score: number | null }) => {
    const d = new Date(`${wd.date}T12:00:00Z`);
    return {
      dateKey: wd.date,
      dayName: d.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'narrow' }),
      score: wd.score,
    };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Greeting + Streak Chip */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text truncate">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <Chip tone="sky">
          {streakDays} {t('dashboard.streakDays', 'days')}
        </Chip>
      </div>

      {/* 5 Mood Faces Quick Check-in */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text">
            {t('dashboard.howAreYou', 'How are you?')}
          </span>
          {(quickSaved || todayScore != null) && (
            <Link to="/mood" className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline">
              {t('dashboard.addMore', 'Add more')}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {QUICK_MOODS.map((m) => {
            const active = todayScore === m.score;
            return (
              <button
                key={m.score}
                type="button"
                onClick={() => handleQuickMood(m.score)}
                aria-label={t(m.labelKey)}
                className={`py-2.5 rounded-card border text-center transition-colors ${
                  active
                    ? 'bg-sky-700 text-white border-sky-700'
                    : 'bg-surface text-text border-border hover:bg-sky-50 dark:hover:bg-ink-800'
                }`}
              >
                <span className="text-lg block">{m.emoji}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card 1: This Week (7 dots) */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text">
            {t('dashboard.thisWeek', 'This week')}
          </span>
          <div className="flex items-center gap-2.5">
            {weekDays.map((day: { dateKey: string; dayName: string; score: number | null }) => {
              const dotClass =
                day.score == null
                  ? 'border border-border bg-transparent'
                  : day.score >= 8
                    ? 'bg-sky-700'
                    : day.score >= 6
                      ? 'bg-sky-500'
                      : day.score >= 4
                        ? 'bg-sky-400'
                        : 'bg-sky-200';
              return (
                <div key={day.dateKey} className="flex flex-col items-center gap-1" title={`${day.dateKey}: ${day.score ?? '—'}`}>
                  <span className="text-xs text-muted">{day.dayName}</span>
                  <span className={`w-3.5 h-3.5 rounded-full ${dotClass}`} />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Card 2: Last Entry or EmptyState */}
      {lastEntry ? (
        <Card
          className="cursor-pointer hover:bg-sky-50 dark:hover:bg-ink-800 transition-colors"
          onClick={() => navigate('/write', { state: { entryId: lastEntry.id } })}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">{lastEntry.title}</p>
              <p className="text-xs text-muted mt-0.5">
                {new Date(lastEntry.date).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Chip tone="sky">
              {getMoodMeta(lastEntry.mood).emoji} {getMoodMeta(lastEntry.mood).label}
            </Chip>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<PenTool size={24} strokeWidth={1.75} />}
          message={t('dashboard.noEntries', 'Your diary is quiet right now.')}
          actionLabel={t('dashboard.writeFirst', 'Write entry')}
          onAction={() => navigate('/write')}
        />
      )}

      {/* Card 3 (Conditional): Student Card */}
      {settings.isStudent && (
        <Card
          className="cursor-pointer hover:bg-sky-50 dark:hover:bg-ink-800 transition-colors"
          onClick={() => navigate('/student')}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <GraduationCap size={20} strokeWidth={1.75} className="text-sky-500" />
              <span className="text-sm font-semibold text-text">
                {t('nav.student', 'Student')}
              </span>
            </div>
            <span className="text-xs text-muted">{t('common.open', 'Open')}</span>
          </div>
        </Card>
      )}

      {/* One small affirmation line */}
      <p className="text-xs text-muted text-center">
        {t('dashboard.quoteLine', { text: quote.text, author: quote.author, defaultValue: `“${quote.text}” — ${quote.author}` })}
      </p>
    </div>
  );
};

export default Dashboard;
