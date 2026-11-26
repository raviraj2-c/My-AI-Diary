import React, { useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../services/wellnessService';
import { ExportService } from '../services/exportService';
import { useInsights } from '../hooks/useQueries';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BottomSheet, Stat } from '../components/ui';

// Lazy-load recharts / MoodChart component to shrink main page bundle size
const MoodChart = lazy(() => import('../components/Wellness/MoodChart').then(m => ({ default: m.MoodChart })));
import {
  Download,
  RefreshCw,
  AlertCircle,
  Share2,
  Copy,
  Check,
  Info
} from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState<'week' | 'month' | '3months'>('week');
  const { data: insights = null, isLoading: loading, isError, refetch } = useInsights(range);
  const error = isError ? 'Could not load your wellness insights right now. Please try again.' : null;
  const [counselorSummaryOnly, setCounselorSummaryOnly] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const fetchInsights = (_selectedRange: 'week' | 'month' | '3months') => {
    void _selectedRange;
    void refetch();
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border dark:border-ink-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-serif font-bold text-text dark:text-sky-50">
            {t('insights.title', 'Trends')}
          </h1>
          <button
            type="button"
            onClick={() => setShowShareSheet(true)}
            aria-label={t('insights.exportPdf', 'Share & export')}
            className="p-1.5 rounded-full text-muted hover:text-primary-600 hover:bg-sky-50 dark:hover:bg-ink-800"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-sky-50 dark:bg-ink-900 p-1 rounded-xl">
            {(
              [
                { id: 'week', label: t('insights.days7', '7d') },
                { id: 'month', label: t('insights.days30', '30d') },
                { id: '3months', label: t('insights.days90', '90d') }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  range === item.id
                    ? 'bg-surface dark:bg-ink-800 text-text dark:text-sky-50 shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" icon={Share2} onClick={() => setShowShareSheet(true)}>
            {t('common.export', 'Export')}
          </Button>
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
        <div className="space-y-6">
          {/* 3 Key Numbers */}
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label={t('insights.consistency', 'This week')}
              value={insights.streak.last7DaysRatio}
            />
            <Stat
              label={t('insights.averageMood', 'Average mood')}
              value={insights.averageMood !== null ? `${insights.averageMood.toFixed(1)}` : '—'}
            />
            <Stat
              label={t('insights.totalActiveDays', 'Active days')}
              value={insights.streak.totalActiveDays}
            />
          </div>

          {/* 1 Chart + up to 3 one-line findings */}
          <Suspense fallback={
            <div className="h-64 flex items-center justify-center p-8 rounded-2xl bg-sky-50 dark:bg-ink-950 border border-border dark:border-ink-800 text-xs text-muted animate-pulse">
              {t('insights.loadingVisual')}
            </div>
          }>
            <MoodChart insights={insights} />
          </Suspense>
        </div>
      )}

      <BottomSheet
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        title={t('insights.exportPdf', 'Export & share')}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">{t('insights.exportHelp')}</p>
          <label className="flex items-center gap-2 text-xs text-text dark:text-sky-200 cursor-pointer">
            <input
              type="checkbox"
              checked={counselorSummaryOnly}
              onChange={(e) => setCounselorSummaryOnly(e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-primary-500"
            />
            <span>{t('insights.counselorSummary')}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={Download} loading={exporting} onClick={handleExportPDF}>
              {t('insights.exportPdf', 'Export PDF')}
            </Button>
            <Button variant="primary" size="sm" icon={Share2} loading={sharing} onClick={handleGenerateShareLink}>
              {t('insights.shareCounselor', 'Share link')}
            </Button>
          </div>
          {shareLink && (
            <div className="p-3 bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-800 rounded-xl flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-muted truncate">{shareLink}</p>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copyLink')}
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};
