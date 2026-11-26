import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { WellnessInsights } from '../../types';
import { Card } from '../common/Card';
import { Sparkles, TrendingUp, Info } from 'lucide-react';

interface MoodChartProps {
  insights: WellnessInsights;
}

export const MoodChart: React.FC<MoodChartProps> = ({ insights }) => {
  const { t, i18n } = useTranslation();
  const {
    hasEnoughData,
    dataPointsCount,
    moodPerDay,
    findings
  } = insights;

  const lineData = moodPerDay
    .filter((d) => d.moodScore != null)
    .map((d) => {
      const dateObj = new Date(d.date);
      return {
        date: dateObj.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' }),
        mood: d.moodScore,
      };
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Daily Mood Rhythm Line Chart */}
      <Card className="p-6 border-border dark:border-ink-800">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-50">
              {t('insights.moodTimeline', 'Mood Timeline')}
            </h3>
          </div>
          <span className="text-xs text-muted">
            {t('moodChart.reflectionPoints', { count: lineData.length })}
          </span>
        </div>

        {lineData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis domain={[1, 10]} ticks={[2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-surface dark:bg-ink-900 border border-border dark:border-ink-800 rounded-xl shadow-soft text-xs space-y-1">
                          <p className="font-semibold text-ink-900 dark:text-sky-100">{label}</p>
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
                  stroke="#0EA5E9"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted">
            {t('moodChart.noEntries')}
          </div>
        )}
      </Card>

      {/* Up to 3 one-line findings */}
      <Card className="p-5 border-border dark:border-ink-800 bg-sky-50 dark:bg-ink-900">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h4 className="font-semibold text-sm text-ink-900 dark:text-sky-100">{t('moodChart.whatWeNoticed')}</h4>
        </div>

        {hasEnoughData ? (
          <div className="space-y-2">
            {findings.length > 0 ? (
              findings.slice(0, 3).map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface dark:bg-ink-950 border border-border dark:border-ink-800 text-xs text-text dark:text-border flex items-center gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  <span className="truncate">{f}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">
                {t('moodChart.steadyBalance')}
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface dark:bg-ink-950 border border-border dark:border-ink-800 text-xs text-muted flex items-center gap-2.5">
            <Info className="w-4 h-4 text-muted shrink-0" />
            <span>{t('moodChart.notEnoughData', { count: dataPointsCount })}</span>
          </div>
        )}
      </Card>
    </div>
  );
};
