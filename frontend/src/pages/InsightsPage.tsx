import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../services/wellnessService';
import { ExportService } from '../services/exportService';
import { WellnessInsights } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

// Lazy-load recharts / MoodChart component to shrink main page bundle size
const MoodChart = lazy(() => import('../components/Wellness/MoodChart').then(m => ({ default: m.MoodChart })));
import {
  Sparkles,
  Download,
  Heart,
  TrendingUp,
  ShieldCheck,
  Smile,
  RefreshCw,
  AlertCircle,
  Share2,
  Copy,
  Check
} from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState<'week' | 'month' | '3months'>('week');
  const [insights, setInsights] = useState<WellnessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counselorSummaryOnly, setCounselorSummaryOnly] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchInsights = async (selectedRange: 'week' | 'month' | '3months') => {
    try {
      setLoading(true);
      setError(null);
      const data = await WellnessService.getInsights(selectedRange);
      setInsights(data);
    } catch (err: unknown) {
      console.error('Failed to load insights:', err);
      setError('Could not load your wellness insights right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(range);
  }, [range]);

  const handleExportPDF = async () => {
    if (!insights) return;
    setExporting(true);
    try {
      await ExportService.exportWellnessReport(insights, counselorSummaryOnly);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setSharing(true);
    try {
      const res = await WellnessService.createCounselorShare(range);
      const fullUrl = `${window.location.origin}${res.sharePath}`;
      setShareLink(fullUrl);
      setCopied(false);
    } catch (err) {
      console.error('Failed to create counselor link:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-gray-100">
              {t('insights.title', 'Wellness Insights')}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('insights.subtitle', 'Gentle observations of your mood, habits, and emotional rhythms over time.')}
          </p>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl self-start sm:self-auto">
          {(
            [
              { id: 'week', label: t('insights.days7', '7 Days') },
              { id: 'month', label: t('insights.days30', '30 Days') },
              { id: '3months', label: t('insights.days90', '90 Days') }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                range === item.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('insights.gathering')}
          </p>
        </div>
      )}

      {error && !loading && (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchInsights(range)}>
            {t('insights.tryAgain')}
          </Button>
        </Card>
      )}

      {/* Content */}
      {!loading && !error && insights && (
        <div className="space-y-8">
          {/* Gentle Streak & Reflection Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary-50/60 to-calm-50/40 dark:from-primary-950/20 dark:to-calm-950/10 border-primary-100 dark:border-primary-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                    {t('insights.consistency', 'Gentle Consistency')}
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {insights.streak.last7DaysRatio} {t('dashboard.streakDays', 'days logged')}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                "{insights.streak.kindMessage}"
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('insights.averageMood', 'Average Mood')}
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {insights.averageMood !== null ? `${insights.averageMood.toFixed(1)} / 10` : '—'}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {insights.dataPointsCount > 0
                  ? `Across ${insights.dataPointsCount} logs in this time window.`
                  : 'Start tracking daily to see your average.'}
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('insights.totalActiveDays', 'Total Active Days')}
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {insights.streak.totalActiveDays} {t('dashboard.streakDays', 'days')}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {t('insights.careMoment')}
              </p>
            </Card>
          </div>

          {/* Export & Sharing Card */}
          <Card className="bg-calm-50/50 dark:bg-calm-950/20 border-calm-200 dark:border-calm-800/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {t('insights.exportPdf', 'Download or Share Clinical Summary')}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('insights.exportHelp')}
                </p>
                <label className="flex items-center gap-2 pt-1 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={counselorSummaryOnly}
                    onChange={(e) => setCounselorSummaryOnly(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    <strong>{t('insights.counselorSummary')}</strong>: {t('insights.counselorSummaryDesc')}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  loading={exporting}
                  onClick={handleExportPDF}
                >
                  {t('insights.exportPdf', 'Export PDF')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Share2}
                  loading={sharing}
                  onClick={handleGenerateShareLink}
                >
                  {t('insights.shareCounselor', '7-Day Counselor Link')}
                </Button>
              </div>
            </div>

            {shareLink && (
              <div className="p-3 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <div className="text-xs space-y-0.5 overflow-hidden w-full">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {t('insights.secureLinkActive')}
                  </p>
                  <p className="font-mono text-muted-foreground truncate">{shareLink}</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 hover:bg-emerald-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copyLink')}
                </button>
              </div>
            )}
          </Card>

          {/* Visual Charts & Correlations (Lazy-loaded recharts) */}
          <Suspense fallback={
            <div className="h-64 flex items-center justify-center p-8 rounded-2xl bg-calm-50 dark:bg-calm-950/30 border border-calm-200 dark:border-calm-800 text-xs text-gray-500 animate-pulse">
              {t('insights.loadingVisual')}
            </div>
          }>
            <MoodChart insights={insights} />
          </Suspense>
        </div>
      )}
    </div>
  );
};
