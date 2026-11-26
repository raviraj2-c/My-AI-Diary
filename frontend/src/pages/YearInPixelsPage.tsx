import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { WellnessService } from '../services/wellnessService';
import { YearPixelsData, YearPixelsDay } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/common/Toast';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  PenTool,
  X
} from 'lucide-react';

// Colorblind-safe palette (Okabe-Ito inspired)
const PALETTE = [
  { min: 9, max: 10, color: '#0072B2', labelKey: 'pixels.scoreGreat', defaultLabel: 'Joyful & Thriving (9-10)' },
  { min: 7, max: 8, color: '#56B4E9', labelKey: 'pixels.scoreGood', defaultLabel: 'Good & Peaceful (7-8)' },
  { min: 5, max: 6, color: '#009E73', labelKey: 'pixels.scoreNeutral', defaultLabel: 'Neutral & Calm (5-6)' },
  { min: 3, max: 4, color: '#E69F00', labelKey: 'pixels.scoreLow', defaultLabel: 'Low & Anxious (3-4)' },
  { min: 1, max: 2, color: '#D55E00', labelKey: 'pixels.scoreHard', defaultLabel: 'Difficult & Heavy (1-2)' },
];

const EMPTY_COLOR_LIGHT = '#E5E7EB';

export const YearInPixelsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [data, setData] = useState<YearPixelsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<{ dateStr: string; pixel: YearPixelsDay | null } | null>(null);

  const monthNames = [
    t('months.jan', 'Jan'), t('months.feb', 'Feb'), t('months.mar', 'Mar'),
    t('months.apr', 'Apr'), t('months.may', 'May'), t('months.jun', 'Jun'),
    t('months.jul', 'Jul'), t('months.aug', 'Aug'), t('months.sep', 'Sep'),
    t('months.oct', 'Oct'), t('months.nov', 'Nov'), t('months.dec', 'Dec')
  ];

  const daysInMonth = (mIndex: number, y: number) => {
    return new Date(y, mIndex + 1, 0).getDate();
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    WellnessService.getYearPixels(year)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          showToast(err.message || 'Failed to load pixels', 'error');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [year, showToast]);

  const getColorForScore = (score?: number): string => {
    if (typeof score !== 'number' || score < 1) return EMPTY_COLOR_LIGHT;
    const match = PALETTE.find((p) => score >= p.min && score <= p.max);
    return match ? match.color : '#009E73';
  };

  const handleCellClick = (monthIdx: number, dayNum: number) => {
    const totalDays = daysInMonth(monthIdx, year);
    if (dayNum > totalDays) return;

    const mStr = String(monthIdx + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const dateKey = `${year}-${mStr}-${dStr}`;

    const pixel = data?.pixels?.[dateKey] || null;
    setSelectedDay({ dateStr: dateKey, pixel });
  };

  const handleDownloadImage = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const colWidth = 32;
      const rowHeight = 22;
      const leftMargin = 50;
      const topMargin = 90;
      const bottomLegendHeight = 120;

      const totalWidth = leftMargin + 12 * colWidth + 40;
      const totalHeight = topMargin + 31 * rowHeight + bottomLegendHeight;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px serif';
      ctx.fillText(`MindDiary — ${t('pixels.title', 'Year in Pixels')} ${year}`, 30, 42);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText(t('pixels.subtitle', 'A colorful tapestry of your emotional journey throughout the year.'), 30, 64);

      // Draw Month Headers (Cols)
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      for (let m = 0; m < 12; m++) {
        const x = leftMargin + m * colWidth + colWidth / 2;
        ctx.fillStyle = '#475569';
        ctx.fillText(monthNames[m], x, topMargin - 12);
      }

      // Draw Day Labels (Rows 1-31)
      ctx.textAlign = 'right';
      ctx.font = '10px sans-serif';
      for (let d = 1; d <= 31; d++) {
        const y = topMargin + (d - 1) * rowHeight + rowHeight / 2 + 4;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(String(d), leftMargin - 10, y);
      }

      // Draw Cells
      for (let m = 0; m < 12; m++) {
        const maxD = daysInMonth(m, year);
        for (let d = 1; d <= 31; d++) {
          const x = leftMargin + m * colWidth + 2;
          const y = topMargin + (d - 1) * rowHeight + 2;
          const w = colWidth - 4;
          const h = rowHeight - 4;

          if (d > maxD) {
            // Disabled cell
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(x, y, w, h);
            continue;
          }

          const mStr = String(m + 1).padStart(2, '0');
          const dStr = String(d).padStart(2, '0');
          const dateKey = `${year}-${mStr}-${dStr}`;
          const pixel = data?.pixels?.[dateKey];

          if (pixel && pixel.score) {
            ctx.fillStyle = getColorForScore(pixel.score);
          } else {
            ctx.fillStyle = '#e2e8f0';
          }

          // Rounded rectangle cell
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, 4);
          ctx.fill();
        }
      }

      // Draw Legend at the bottom
      const legendY = topMargin + 31 * rowHeight + 24;
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(t('pixels.legendTitle', 'Mood Score Legend:'), 30, legendY);

      const lx = 30;
      const itemSpacing = 145;
      const legendRowY = legendY + 16;

      PALETTE.forEach((item, idx) => {
        const currentX = lx + (idx % 3) * itemSpacing;
        const currentY = legendRowY + Math.floor(idx / 3) * 22;

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(currentX, currentY - 10, 14, 14, 3);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.font = '10px sans-serif';
        const label = t(item.labelKey, item.defaultLabel);
        ctx.fillText(label, currentX + 20, currentY + 1);
      });

      // No entry legend item
      const emptyX = lx + 2 * itemSpacing;
      const emptyY = legendRowY + 22;
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(emptyX, emptyY - 10, 14, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText(t('pixels.noEntry', 'No reflection recorded'), emptyX + 20, emptyY + 1);

      // Download trigger
      const link = document.createElement('a');
      link.download = `minddiary-year-in-pixels-${year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(t('pixels.downloadSuccess', 'Year in pixels image downloaded successfully!'), 'success');
    } catch {
      showToast(t('pixels.downloadError', 'Could not export canvas image'), 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-calm-200 dark:border-calm-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('pixels.badge', 'Visual Tapestry')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-calm-900 dark:text-calm-50">
            {t('pixels.title', 'Year in Pixels')}
          </h1>
          <p className="text-xs sm:text-sm text-calm-600 dark:text-calm-400 mt-0.5">
            {t('pixels.subtitle', 'A colorful tapestry of your emotional journey throughout the year.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-calm-200 dark:border-calm-800 rounded-xl shadow-soft-sm p-1">
            <button
              type="button"
              onClick={() => setYear((y) => Math.max(2000, y - 1))}
              disabled={year <= 2000}
              className="p-1.5 rounded-lg hover:bg-calm-100 dark:hover:bg-slate-800 text-calm-600 dark:text-calm-300 disabled:opacity-30"
              aria-label="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif font-bold text-sm px-3 text-calm-900 dark:text-calm-100">
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => Math.min(2100, y + 1))}
              disabled={year >= 2100}
              className="p-1.5 rounded-lg hover:bg-calm-100 dark:hover:bg-slate-800 text-calm-600 dark:text-calm-300 disabled:opacity-30"
              aria-label="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Download as Image Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadImage}
            icon={<Download className="w-4 h-4" />}
            className="whitespace-nowrap"
          >
            {t('pixels.downloadButton', 'Download Image')}
          </Button>
        </div>
      </div>

      {/* Palette Legend */}
      <Card className="p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-calm-800 dark:text-calm-200">
            {t('pixels.legendTitle', 'Mood Score Legend:')}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {PALETTE.map((item) => (
              <div key={item.color} className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded shadow-soft-xs" style={{ backgroundColor: item.color }} />
                <span className="text-calm-600 dark:text-calm-400 text-[11px]">
                  {t(item.labelKey, item.defaultLabel)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-gray-200 dark:bg-slate-700 shadow-soft-xs" />
              <span className="text-calm-500 dark:text-calm-400 text-[11px]">
                {t('pixels.noEntry', 'No reflection recorded')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid Card */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card className="p-4 sm:p-6 overflow-x-auto bg-white/80 dark:bg-slate-900/80">
          <div className="min-w-[680px]">
            {/* Month Column Headers */}
            <div className="grid grid-cols-[40px_repeat(12,1fr)] gap-1 mb-2 text-center text-xs font-semibold text-calm-600 dark:text-calm-300">
              <div className="text-[10px] text-calm-400 uppercase tracking-wider py-1">{t('pixels.dayLabel', 'Day')}</div>
              {monthNames.map((name) => (
                <div key={name} className="py-1">
                  {name}
                </div>
              ))}
            </div>

            {/* Day Rows (1 to 31) */}
            <div className="space-y-1">
              {Array.from({ length: 31 }, (_, dIdx) => {
                const dayNum = dIdx + 1;
                return (
                  <div key={dayNum} className="grid grid-cols-[40px_repeat(12,1fr)] gap-1 items-center">
                    {/* Row label */}
                    <div className="text-[11px] font-mono text-calm-400 dark:text-calm-500 text-right pr-2">
                      {dayNum}
                    </div>

                    {/* 12 month cells */}
                    {Array.from({ length: 12 }, (_, mIdx) => {
                      const maxDays = daysInMonth(mIdx, year);
                      const isOutOfMonth = dayNum > maxDays;

                      if (isOutOfMonth) {
                        return (
                          <div
                            key={mIdx}
                            className="h-6 rounded bg-calm-50/50 dark:bg-slate-900/30 opacity-20 pointer-events-none"
                          />
                        );
                      }

                      const mStr = String(mIdx + 1).padStart(2, '0');
                      const dStr = String(dayNum).padStart(2, '0');
                      const dateKey = `${year}-${mStr}-${dStr}`;
                      const pixel = data?.pixels?.[dateKey];
                      const hasData = Boolean(pixel && pixel.score);
                      const bgColor = hasData ? getColorForScore(pixel?.score) : undefined;

                      return (
                        <button
                          key={mIdx}
                          type="button"
                          onClick={() => handleCellClick(mIdx, dayNum)}
                          title={`${dateKey}: ${hasData ? `Mood score ${pixel?.score}/10` : 'No reflection recorded'}`}
                          style={bgColor ? { backgroundColor: bgColor } : undefined}
                          className={`h-6 rounded transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-soft-xs ${
                            !hasData
                              ? 'bg-calm-100 hover:bg-calm-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                              : 'hover:brightness-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#131d31] rounded-2xl shadow-soft-2xl border border-calm-200 dark:border-calm-800 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-calm-100 dark:border-calm-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h3 className="font-serif font-bold text-base text-calm-900 dark:text-calm-100">
                  {new Date(selectedDay.dateStr + 'T00:00:00').toLocaleDateString(i18n.language, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-calm-400 hover:text-calm-700 dark:hover:text-calm-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDay.pixel ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-calm-50 dark:bg-slate-800/60 border border-calm-100 dark:border-slate-800">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-soft-sm shrink-0"
                    style={{ backgroundColor: getColorForScore(selectedDay.pixel.score) }}
                  >
                    {selectedDay.pixel.score}
                  </div>
                  <div>
                    <div className="text-xs text-calm-500 dark:text-calm-400">
                      {selectedDay.pixel.source === 'checkin'
                        ? t('pixels.sourceCheckIn', 'Recorded via Daily Check-In')
                        : t('pixels.sourceDiary', 'Recorded via Journal Entry')}
                    </div>
                    <div className="text-sm font-semibold capitalize text-calm-900 dark:text-calm-100">
                      {selectedDay.pixel.mood}
                    </div>
                  </div>
                </div>

                {selectedDay.pixel.title && (
                  <div className="text-xs text-calm-600 dark:text-calm-300 italic">
                    "{selectedDay.pixel.title}"
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={<PenTool className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSelectedDay(null);
                      navigate(`/write?date=${selectedDay.dateStr}`);
                    }}
                  >
                    {t('pixels.writeMore', 'Write for this Day')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-calm-500 dark:text-calm-400 leading-relaxed">
                  {t('pixels.noEntryDesc', 'No reflection was recorded for this day. You can add a journal entry or check-in anytime.')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={<PenTool className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setSelectedDay(null);
                    navigate(`/write?date=${selectedDay.dateStr}`);
                  }}
                >
                  {t('pixels.writeForDay', 'Write Entry for this Day')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
