import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckIn } from '../components/Wellness/CheckIn';
import { HabitTracker } from '../components/Wellness/HabitTracker';
import { useToday, useInvalidateWellness } from '../hooks/useQueries';
import { Heart, Activity, ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '../components/common/Button';

export const CheckInPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checkin' | 'habits'>('checkin');
  const { data, isLoading: loading, isError, refetch } = useToday();
  const invalidateWellness = useInvalidateWellness();
  const initialCheckIn = data?.checkIn ?? null;
  const initialHabit = data?.habit ?? null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back', 'Back to Dashboard')}</span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          icon={TrendingUp}
          onClick={() => navigate('/insights')}
          className="text-xs"
        >
          {t('nav.insights', 'View Insights')}
        </Button>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'checkin'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Heart className="w-4 h-4 text-danger" />
            <span>{t('checkin.title', 'Feelings & Mood Check')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'habits'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 text-sky-500" />
            <span>{t('checkin.habitsTitle', 'Habits & Body Log')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : isError ? (
        <div className="p-6 text-center rounded-2xl border border-danger dark:border-danger space-y-3">
          <p className="text-sm text-danger dark:text-danger">{t('common.error')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>{t('common.retry')}</Button>
        </div>
      ) : (
        <div className="animate-fade-in">
          {activeTab === 'checkin' ? (
            <CheckIn
              initialCheckIn={initialCheckIn}
              onSuccess={() => {
                void invalidateWellness();
                navigate('/insights');
              }}
              onCancel={() => navigate('/')}
            />
          ) : (
            <div className="max-w-2xl mx-auto">
              <HabitTracker
                initialHabit={initialHabit}
                onSaved={() => {
                  void invalidateWellness();
                  navigate('/insights');
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
