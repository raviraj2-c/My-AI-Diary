import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { WellnessService } from '../services/wellnessService';
import { LetterService } from '../services/letterService';
import { CheckIn, WellnessInsights } from '../types';
import {
  PenTool,
  Calendar,
  Sparkles,
  Flame,
  HeartHandshake,
  ArrowRight,
  Smile,
  Archive,
  TrendingUp,
  CheckCircle2,
  Wind,
  ClipboardCheck,
  Bot,
  GraduationCap,
  Music,
  ExternalLink,
  Quote,
  Mail
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { DiaryEntry as DiaryEntryComponent } from '../components/Diary/DiaryEntry';
import { getAllMoods, getMoodMeta } from '../utils/moods';
import { getRandomQuoteByMood } from '../data/quotes';
import { getMoodMusicLinks } from '../utils/musicSearch';

export interface DashboardProps {
  weeklyMoodSummary?: string;
  recommendedActivity?: string;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { entries, total, deleteEntry } = useDiary(user?.id);
  const navigate = useNavigate();

  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [insights, setInsights] = useState<WellnessInsights | null>(null);
  const [dailyQuote, setDailyQuote] = useState(() => getRandomQuoteByMood('peaceful'));
  const [dueLetters, setDueLetters] = useState<Array<{ _id: string; title: string }>>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      WellnessService.getTodayCheckIn().catch(() => null),
      WellnessService.getInsights('week').catch(() => null),
      LetterService.getDueLetters().catch(() => [])
    ]).then(([ci, ins, due]) => {
      if (mounted) {
        if (ci) {
          setTodayCheckIn(ci);
          if (ci.emotions && ci.emotions.length > 0) {
            setDailyQuote(getRandomQuoteByMood(ci.emotions[0]));
          }
        }
        if (ins) setInsights(ins);
        if (due) setDueLetters(due);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const musicLinks = getMoodMusicLinks(
    todayCheckIn?.emotions?.[0] || entries[0]?.mood || 'peaceful'
  );

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning', 'Good morning');
    if (hour < 18) return t('dashboard.greetingAfternoon', 'Good afternoon');
    return t('dashboard.greetingEvening', 'Good evening');
  };

  // 7-day mood strip calculation (last 7 calendar days)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayKey = d.toISOString().slice(0, 10);

    const dayCheckIn = insights?.moodPerDay.find((mpd) => {
      const k = typeof mpd.date === 'string' ? mpd.date.slice(0, 10) : new Date(mpd.date).toISOString().slice(0, 10);
      return k === dayKey;
    });

    const diaryMatch = entries.find((e) => {
      const entryD = new Date(e.entryDate || e.date || Date.now()).toISOString().slice(0, 10);
      return entryD === dayKey;
    });

    return {
      date: d,
      dayName: d.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'narrow' }),
      moodScore: dayCheckIn?.moodScore,
      diaryMood: diaryMatch?.mood,
      hasActivity: Boolean(dayCheckIn?.moodScore != null || diaryMatch)
    };
  });

  const moodsList = getAllMoods();
  const recentEntries = entries.slice(0, 3);

  const quickActions = [
    {
      title: t('dashboard.writeEntry', 'Write an Entry'),
      description: t('write.contentPlaceholder', 'Pour your heart onto the page'),
      icon: PenTool,
      link: '/write',
      color: 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400',
    },
    {
      title: t('checkin.title', 'Daily Check-In'),
      description: t('checkin.subtitle', '10-second check on feelings & habits'),
      icon: HeartHandshake,
      link: '/checkin',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      title: t('dashboard.studentHub', 'Student Focus'),
      description: t('student.subtitle', 'Pomodoro timer, exam countdowns & burnout notice'),
      icon: GraduationCap,
      link: '/student',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      title: t('gratitude.title', 'Gratitude Jar'),
      description: t('gratitude.subtitle', '3 good things and gentle memories'),
      icon: Smile,
      link: '/gratitude',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      title: t('happybox.title', 'Happy Box'),
      description: t('happybox.subtitle', 'Favorites and on-this-day flashbacks'),
      icon: Archive,
      link: '/happy-box',
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    },
    {
      title: t('nav.insights', 'Wellness Insights'),
      description: t('insights.subtitle', 'Gentle patterns and counselor PDF report'),
      icon: TrendingUp,
      link: '/insights',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      title: t('dashboard.calmRoom', 'Calm Space'),
      description: t('calm.subtitle', 'Breathing, ambient sounds, grounding & vent box'),
      icon: Wind,
      link: '/calm',
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
    },
    {
      title: t('selfcheck.title', 'Self-Check'),
      description: t('selfcheck.subtitle', 'Private PHQ-9 & GAD-7 screening questionnaires'),
      icon: ClipboardCheck,
      link: '/self-check',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    },
    {
      title: t('nav.chat', 'AI Companion'),
      description: t('chat.subtitle', 'Gentle, supportive chat reflections'),
      icon: Bot,
      link: '/chat',
      color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    },
    {
      title: t('nav.calendar', 'Calendar Journey'),
      description: t('calendar.subtitle', 'Reflect on your memory map'),
      icon: Calendar,
      link: '/calendar',
      color: 'bg-calm-50 text-calm-600 dark:bg-calm-950/60 dark:text-calm-400',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">🌿</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-serif">
            {t('dashboard.subtitle', 'Your safe, private sanctuary to reflect, breathe, and grow.')}
          </p>
        </div>

        <Button
          variant="calm"
          size="md"
          icon={PenTool}
          onClick={() => navigate('/write')}
          className="self-start md:self-auto shadow-soft-sm"
        >
          {t('dashboard.writeEntry', 'Write Diary Entry')}
        </Button>
      </div>

      {/* Arrived Future Letter Banner */}
      {dueLetters.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/90 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Mail className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-gray-900 dark:text-gray-100">
                {t('letters.dashboardBannerTitle', 'A letter from past you has arrived!')}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {dueLetters.length === 1
                  ? dueLetters[0].title
                  : t('letters.dashboardBannerMultiple', '{{count}} letters are ready to open', { count: dueLetters.length })}
              </p>
            </div>
          </div>
          <Link to="/letters" className="shrink-0">
            <Button variant="calm" size="sm" icon={Mail} className="whitespace-nowrap">
              {t('letters.openLetter', 'Read Letter')}
            </Button>
          </Link>
        </div>
      )}

      {/* Gentle check-in card & Streak section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* "How are you feeling today?" interactive card */}
        <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-calm-50/70 via-white to-primary-50/50 dark:from-[#131d31] dark:via-[#131d31] dark:to-[#0f172a] border-calm-200/60 dark:border-gray-800">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-calm-100 dark:bg-calm-900/60 text-calm-700 dark:text-calm-300">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t('dashboard.howAreYouFeeling', 'How are you feeling right now?')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('dashboard.subtitle', 'Take a 10-second check-in or select a mood to write')}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/checkin')}
              className="text-xs shrink-0"
            >
              {todayCheckIn ? t('dashboard.updateCheckIn', 'Update Check-In') : t('dashboard.tenSecCheckIn', '10s Check-In')}
            </Button>
          </div>

          {/* Today's Check-in Summary pill if completed */}
          {todayCheckIn && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {t('dashboard.todayCheckInScore', { score: todayCheckIn.moodScore })}
                  {todayCheckIn.emotions && todayCheckIn.emotions.length > 0
                    ? ` • ${todayCheckIn.emotions.join(', ')}`
                    : ''}
                </span>
              </div>
              <Link to="/insights" className="text-emerald-700 dark:text-emerald-300 underline font-medium hover:opacity-80">
                {t('dashboard.viewTrends')}
              </Link>
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 my-4">
            {moodsList.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => navigate('/write', { state: { mood: m.value } })}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 hover:shadow-soft-md hover:border-calm-300 dark:hover:border-calm-700 hover:scale-105 active:scale-95 transition-all text-center group"
                >
                  <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{m.emoji}</span>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{m.label}</span>
                  <Icon className="h-3 w-3 text-gray-400 group-hover:text-calm-600 dark:group-hover:text-calm-400 mt-1 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* 7-day mood strip */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-calm-500" />
              <span>{t('dashboard.statsStreak', 'Past 7 Days Rhythm')}</span>
            </span>
            <div className="flex items-center gap-2">
              {weekDays.map((day, idx) => {
                const meta = day.diaryMood ? getMoodMeta(day.diaryMood) : null;
                const scoreColor =
                  day.moodScore != null
                    ? day.moodScore >= 8
                      ? 'bg-emerald-500'
                      : day.moodScore >= 6
                        ? 'bg-primary-500'
                        : day.moodScore >= 4
                          ? 'bg-amber-500'
                          : 'bg-rose-400'
                    : null;

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1"
                    title={`${day.date.toDateString()}: ${day.moodScore != null
                      ? `Score ${day.moodScore}/10`
                      : meta
                        ? meta.label
                        : 'Rest day'
                      }`}
                  >
                    <span className="text-[10px] text-gray-400 font-medium">{day.dayName}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 ${scoreColor
                        ? `${scoreColor} shadow-soft-sm ring-2 ring-white dark:ring-gray-900`
                        : meta
                          ? `${meta.dotClass} shadow-soft-sm ring-2 ring-white dark:ring-gray-900`
                          : 'border border-gray-300 dark:border-gray-700 bg-transparent'
                        }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Gentle Streak & Total Entries Card */}
        <Card className="flex flex-col justify-between border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('dashboard.statsStreak', 'Reflective Rhythm')}
              </span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Flame className="h-5 w-5" />
              </span>
            </div>

            <div className="mb-3">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                {insights?.streak ? `${insights.streak.last7DaysRatio} ${t('dashboard.streakDays', 'days')}` : `${entries.length > 0 ? 1 : 0} / 7`}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-serif mt-1.5 leading-relaxed italic">
                "{insights?.streak?.kindMessage || 'Take your time. A single word is always enough.'}"
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400">{t('dashboard.statsEntries', 'Total Active Days')}</span>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {insights?.streak?.totalActiveDays ?? (total || entries.length)}
              </p>
            </div>
            <Link to="/insights">
              <Badge variant="calm" size="sm" className="hover:opacity-80 cursor-pointer">
                {t('nav.insights', 'Insights')} →
              </Badge>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('dashboard.quickTools', 'Explore Your Sanctuary')}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.link}
                className="group flex flex-col p-5 bg-white dark:bg-[#131d31] rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-soft-md transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Daily Affirmation & Mood Music Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Affirmation Card */}
        <div className="md:col-span-7 bg-gradient-to-br from-calm-50/80 via-white to-amber-50/40 dark:from-[#131d31] dark:via-[#131d31] dark:to-[#172554]/30 rounded-2xl border border-calm-200/70 dark:border-gray-800 p-6 flex flex-col justify-between shadow-soft-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-calm-600 dark:text-calm-400 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" /> {t('dashboard.dailyAffirmation', 'Mindful Affirmation')}
              </span>
              <button
                onClick={() => setDailyQuote(getRandomQuoteByMood())}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                title="Shuffle affirmation"
              >
                ✨
              </button>
            </div>
            <p className="text-base sm:text-lg font-serif italic text-gray-800 dark:text-gray-100 leading-relaxed">
              "{dailyQuote.text}"
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-mono text-right">
            — {dailyQuote.author}
          </p>
        </div>

        {/* Mood-based Music Card */}
        <div className="md:col-span-5 bg-white dark:bg-[#131d31] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between shadow-soft-sm">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Music className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.moodMusicTitle', 'Soundtrack For Your Mood')}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {musicLinks.label}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {musicLinks.description}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <a
              href={musicLinks.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              {t('dashboard.youtube')} <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={musicLinks.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              {t('dashboard.spotify')} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Recent Entries Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.recentEntries', 'Recent Reflections')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-serif">{t('dashboard.subtitle', 'Moments from your journey')}</p>
          </div>
          <Link
            to="/search"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
          >
            <span>{t('dashboard.viewAll', 'View All')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentEntries.length > 0 ? (
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <DiaryEntryComponent
                key={entry.id}
                entry={entry}
                onEdit={(item) => navigate('/write', { state: { entry: item } })}
                onDelete={deleteEntry}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-3xl mb-2 inline-block">📖</span>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {t('dashboard.noEntries', 'Your diary is quiet right now')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4 font-serif">
              {t('write.contentPlaceholder', 'Write when you feel ready. There are no expectations or rules here.')}
            </p>
            <Button
              variant="calm"
              size="sm"
              icon={PenTool}
              onClick={() => navigate('/write')}
            >
              {t('dashboard.startFirst', 'Write Your First Thought')}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
