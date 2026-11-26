import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid
} from 'recharts';
import { SelfCheckResult } from '../../types';

interface SelfCheckChartProps {
  type: 'PHQ-9' | 'GAD-7';
  results: SelfCheckResult[];
}

export const SelfCheckChart: React.FC<SelfCheckChartProps> = ({ type, results }) => {
  const { t } = useTranslation();
  if (!results || results.length < 2) {
    return (
      <div className="p-6 rounded-2xl bg-calm-50/70 dark:bg-gray-800/40 border border-calm-200/80 dark:border-gray-800 text-center space-y-2">
        <p className="text-xs font-medium text-calm-700 dark:text-calm-300">
          {t('selfcheck.chartHint')}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
          {t('selfcheck.screeningDisclaimer')}
        </p>
      </div>
    );
  }

  const sorted = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sorted.map((r) => {
    const d = new Date(r.date);
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: d.toLocaleDateString(),
      score: r.score,
      severity: r.severity || ''
    };
  });

  const firstScore = chartData[0].score;
  const latestScore = chartData[chartData.length - 1].score;
  let trendSummary = `${type} score trend across ${chartData.length} assessments. Initial score: ${firstScore}, latest score: ${latestScore}.`;
  if (latestScore < firstScore) {
    trendSummary += ' Trend shows a decrease in symptom scores.';
  } else if (latestScore > firstScore) {
    trendSummary += ' Trend shows an increase in symptom scores.';
  } else {
    trendSummary += ' Trend remains steady.';
  }

  const maxY = type === 'PHQ-9' ? 27 : 21;

  return (
    <div
      role="region"
      aria-label={trendSummary}
      tabIndex={0}
      className="p-5 rounded-2xl bg-white dark:bg-[#131d31] border border-gray-100 dark:border-gray-800 shadow-soft-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('selfcheck.scoreTrend', { type })}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t('selfcheck.checksRecorded', { count: chartData.length, start: chartData[0].date, end: chartData[chartData.length - 1].date })}
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800">
          {t('selfcheck.latestScore', { score: latestScore, max: maxY })}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

            {/* Score Severity Bands */}
            {type === 'PHQ-9' ? (
              <>
                <ReferenceArea y1={0} y2={4} fill="#10b981" fillOpacity={0.06} />
                <ReferenceArea y1={5} y2={9} fill="#f59e0b" fillOpacity={0.06} />
                <ReferenceArea y1={10} y2={14} fill="#f97316" fillOpacity={0.06} />
                <ReferenceArea y1={15} y2={19} fill="#ef4444" fillOpacity={0.06} />
                <ReferenceArea y1={20} y2={27} fill="#b91c1c" fillOpacity={0.08} />
              </>
            ) : (
              <>
                <ReferenceArea y1={0} y2={4} fill="#10b981" fillOpacity={0.06} />
                <ReferenceArea y1={5} y2={9} fill="#f59e0b" fillOpacity={0.06} />
                <ReferenceArea y1={10} y2={14} fill="#f97316" fillOpacity={0.06} />
                <ReferenceArea y1={15} y2={21} fill="#ef4444" fillOpacity={0.08} />
              </>
            )}

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#888888' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, maxY]}
              tick={{ fontSize: 11, fill: '#888888' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as { fullDate: string; score: number; severity: string };
                  return (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-soft-md text-xs space-y-1">
                      <div className="font-semibold text-gray-700 dark:text-gray-200">{data.fullDate}</div>
                      <div className="text-primary-600 dark:text-primary-400 font-bold">
                        {t('selfcheck.scoreOutOf', { score: data.score, max: maxY })}
                      </div>
                      {data.severity && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {data.severity}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 italic pt-1">
        {t('selfcheck.screeningDisclaimer')}
      </p>
    </div>
  );
};

export default SelfCheckChart;
