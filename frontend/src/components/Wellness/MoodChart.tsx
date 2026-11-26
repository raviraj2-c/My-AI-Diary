import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { WellnessInsights } from '../../types';
import { Card } from '../common/Card';
import { Sparkles, Calendar, Moon, Smile, TrendingUp, Info } from 'lucide-react';

interface MoodChartProps {
  insights: WellnessInsights;
}

export const MoodChart: React.FC<MoodChartProps> = ({ insights }) => {
  const { t, i18n } = useTranslation();
  const {
    hasEnoughData,
    dataPointsCount,
    moodPerDay,
    mostFrequentEmotions,
    weekdayPattern,
    findings
  } = insights;

  // Format daily timeline
  const lineData = moodPerDay
    .filter((d) => d.moodScore != null)
    .map((d) => {
      const dateObj = new Date(d.date);
      return {
        date: dateObj.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' }),
        mood: d.moodScore,
        energy: d.energy || null,
        sleep: d.sleepHours || null
      };
    });

  // Scatter data: Sleep vs Mood
  const scatterData = moodPerDay
    .filter((d) => d.moodScore != null && d.sleepHours != null && d.sleepHours > 0)
    .map((d) => ({
      sleep: d.sleepHours,
      mood: d.moodScore
    }));

  const emotionBarData = mostFrequentEmotions.map((e) => ({
    name: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
    count: e.count
  }));

  const weekdayBarData = weekdayPattern
    .filter((w) => w.averageMood != null)
    .map((w) => ({
      day: w.day.slice(0, 3),
      mood: w.averageMood
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Daily Mood Rhythm Line Chart */}
      <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>{t('insights.emotionalTrajectory', 'Emotional Trajectory')}</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('insights.moodTimeline', 'Mood Timeline')}</h3>
          </div>
          <div className="text-xs text-calm-400">
            {t('moodChart.reflectionPoints', { count: lineData.length })}
          </div>
        </div>

        {lineData.length > 0 ? (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis domain={[1, 10]} ticks={[2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-white dark:bg-[#1e293b] border border-calm-200 dark:border-calm-800 rounded-xl shadow-soft text-xs space-y-1">
                          <p className="font-semibold text-calm-900 dark:text-calm-100">{label}</p>
                          <p className="text-primary-600 font-medium">{t('moodChart.moodScore', { score: payload[0]?.value })}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-calm-400">
            {t('moodChart.noEntries')}
          </div>
        )}
      </Card>

      {/* 2. Grid of Emotion Frequencies and Weekday Pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Emotions */}
        <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800">
          <div className="flex items-center gap-2 mb-4">
            <Smile className="w-4 h-4 text-emerald-500" />
            <h4 className="font-semibold text-sm text-calm-900 dark:text-calm-100">{t('moodChart.acknowledgedEmotions')}</h4>
          </div>

          {emotionBarData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionBarData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 bg-white dark:bg-[#1e293b] border border-calm-200 rounded-lg shadow-xs text-xs">
                            <span className="font-semibold">{payload[0].payload.name}: </span>
                            <span>{t('moodChart.timesCount', { count: payload[0].value })}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-calm-400 py-8 text-center">
              {t('moodChart.identifyFeelings')}
            </p>
          )}
        </Card>

        {/* Weekday Rhythm */}
        <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-sm text-calm-900 dark:text-calm-100">{t('moodChart.weekdayAverages')}</h4>
          </div>

          {weekdayBarData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2 bg-white dark:bg-[#1e293b] border border-calm-200 rounded-lg shadow-xs text-xs">
                            <span>{t('moodChart.avgMood', { score: payload[0].value })}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="mood" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-calm-400 py-8 text-center">
              {t('moodChart.moreCheckIns')}
            </p>
          )}
        </Card>
      </div>

      {/* 3. Mood vs Sleep Scatter / Correlation */}
      {scatterData.length >= 4 && (
        <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-4 h-4 text-primary-500" />
            <h4 className="font-semibold text-sm text-calm-900 dark:text-calm-100">{t('moodChart.sleepVsMood')}</h4>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="sleep"
                  name="Sleep"
                  unit="h"
                  domain={[3, 12]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  type="number"
                  dataKey="mood"
                  name="Mood"
                  domain={[1, 10]}
                  ticks={[2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2.5 bg-white dark:bg-[#1e293b] border border-calm-200 rounded-xl shadow-xs text-xs">
                          <p>{t('moodChart.sleepHours', { hours: payload[0]?.value })}</p>
                          <p className="text-primary-600 font-semibold">{t('moodChart.moodScore', { score: payload[1]?.value })}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Days" data={scatterData} fill="#8b5cf6">
                  {scatterData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 4. "What I Noticed" Plain Observations */}
      <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800 bg-calm-50/40 dark:bg-calm-900/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h4 className="font-semibold text-sm text-calm-900 dark:text-calm-100">{t('moodChart.whatWeNoticed')}</h4>
        </div>

        {hasEnoughData ? (
          <div className="space-y-3">
            {findings.length > 0 ? (
              findings.map((f, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#1e293b] border border-calm-200/80 dark:border-calm-800 text-xs text-calm-700 dark:text-calm-200 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-calm-500">
                {t('moodChart.steadyBalance')}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white dark:bg-[#1e293b] border border-calm-200/80 dark:border-calm-800 text-xs text-calm-500 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-calm-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-calm-700 dark:text-calm-300">
                {t('moodChart.notEnoughData', { count: dataPointsCount })}
              </p>
              <p className="mt-1 text-calm-400">
                {t('moodChart.notEnoughDataDesc')}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
