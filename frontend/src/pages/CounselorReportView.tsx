import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Calendar,
  Heart,
  TrendingUp,
  AlertCircle,
  Printer,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { WellnessService } from '../services/wellnessService';
import { CounselorReportSummary } from '../types';

export const CounselorReportView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<CounselorReportSummary | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) {
        setError('Missing report access token.');
        setLoading(false);
        return;
      }

      try {
        const res = await WellnessService.getSharedCounselorReport(token);
        if (res.data) {
          setReport(res.data);
          setExpiresAt(res.expiresAt || null);
        } else {
          setError('Report unavailable or link has expired.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load report';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token]);

  const formatDate = (dateStr: string | Date, options?: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-US', options).format(new Date(dateStr));
    } catch {
      return String(dateStr);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('counselor.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('counselor.unavailable')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            {error || 'This link may have expired (valid for 7 days) or was revoked by the user.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            {t('counselor.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{t('counselor.title')}</h1>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t('counselor.verified')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('counselor.generatedOn', { date: formatDate(report.generatedAt), range: report.range })}
                {expiresAt && t('counselor.validUntil', { date: formatDate(expiresAt) })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" /> {t('counselor.printPdf')}
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-300 text-xs flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>{t('counselor.confidentialNotice')}</strong> {t('counselor.confidentialDesc')}
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">{t('counselor.totalCheckIns')}</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono">{report.totalCheckIns}</span>
            <span className="text-xs text-slate-400 block mt-1">{t('counselor.dataPointsCaptured')}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">{t('counselor.avgMoodScore')}</span>
            <span className="text-3xl font-bold text-primary font-mono">
              {report.averageMood != null ? `${report.averageMood}/10` : '—'}
            </span>
            <span className="text-xs text-slate-400 block mt-1">{t('counselor.tenPointScale')}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">{t('counselor.screeningsLogged')}</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {report.recentScreenings?.length || 0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">{t('counselor.screeningTypes')}</span>
          </div>
        </div>

        {/* Mood Timeline */}
        {report.moodPerDay && report.moodPerDay.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> {t('counselor.dailyMoodSection')}
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-2">
              {report.moodPerDay.map((day, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {formatDate(day.date, { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>

                  <div className="flex items-center gap-3">
                    {day.emotions && day.emotions.length > 0 && (
                      <span className="text-slate-500 hidden sm:inline">
                        {day.emotions.slice(0, 3).join(', ')}
                      </span>
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {day.moodScore != null ? `${day.moodScore}/10` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Screenings */}
        {report.recentScreenings && report.recentScreenings.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> {t('counselor.clinicalScreeningsSection')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.recentScreenings.map((sc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{sc.type}</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(sc.date)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-primary">{sc.score}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {sc.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlations & Habits */}
        {report.correlations && report.correlations.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> {t('counselor.lifestyleCorrelationsSection')}
            </h2>
            <ul className="space-y-2">
              {report.correlations.map((c, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-6 border-t border-slate-200 dark:border-slate-800">
          {t('counselor.footerNotice')}
        </div>
      </div>
    </div>
  );
};

export default CounselorReportView;
