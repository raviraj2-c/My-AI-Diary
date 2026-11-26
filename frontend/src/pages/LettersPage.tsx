import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LetterService } from '../services/letterService';
import { FutureLetterItem } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/common/Toast';
import {
  Mail,
  Lock,
  MailOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  Send,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';

export const LettersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const [letters, setLetters] = useState<FutureLetterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [readingLetter, setReadingLetter] = useState<FutureLetterItem | null>(null);
  const [readingLoading, setReadingLoading] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deliverOn, setDeliverOn] = useState('');
  const [saving, setSaving] = useState(false);
  const [highRiskAlert, setHighRiskAlert] = useState<boolean>(false);

  // Tomorrow's date string YYYY-MM-DD for datepicker min attribute
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const fetchLetters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await LetterService.getLetters();
      setLetters(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load letters';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !deliverOn) {
      showToast(t('letters.fillAllFields'), 'error');
      return;
    }

    try {
      setSaving(true);
      // Ensure deliverOn has time boundary (e.g., 09:00 local time)
      const targetDate = new Date(`${deliverOn}T09:00:00`).toISOString();
      const res = await LetterService.createLetter({
        title: title.trim(),
        content: content.trim(),
        deliverOn: targetDate
      });

      if (res.safety?.level === 'high') {
        setHighRiskAlert(true);
      } else {
        showToast(t('letters.saveSuccess', 'Letter sealed securely for your future self!'), 'success');
        setIsWriteModalOpen(false);
        setTitle('');
        setContent('');
        setDeliverOn('');
      }

      await fetchLetters();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save letter';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLetter = async (letter: FutureLetterItem) => {
    if (letter.isLocked) {
      showToast(t('letters.lockedNotice', 'This letter is locked until its delivery date.'), 'info');
      return;
    }

    try {
      setReadingLoading(true);
      const fullLetter = await LetterService.getLetter(letter.id);
      setReadingLetter(fullLetter);
      // Update local state to show as opened
      setLetters((prev) =>
        prev.map((l) => (l.id === letter.id ? { ...l, openedAt: fullLetter.openedAt } : l))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not open letter';
      showToast(msg, 'error');
    } finally {
      setReadingLoading(false);
    }
  };

  const handleDeleteLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('letters.confirmDelete', 'Are you sure you want to delete this letter?'))) {
      return;
    }

    try {
      await LetterService.deleteLetter(id);
      setLetters((prev) => prev.filter((l) => l.id !== id));
      if (readingLetter?.id === id) setReadingLetter(null);
      showToast(t('letters.deleteSuccess', 'Letter deleted.'), 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete letter';
      showToast(msg, 'error');
    }
  };

  const lockedLetters = letters.filter((l) => l.isLocked);
  const deliveredLetters = letters.filter((l) => !l.isLocked);

  const getDaysUntil = (dateStr: string | Date) => {
    const diffMs = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days <= 0 ? 1 : days;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-ink-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-200 text-xs font-semibold mb-1">
            <Mail className="w-3.5 h-3.5" />
            <span>{t('letters.badge', 'Time Capsule')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-900 dark:text-sky-50">
            {t('letters.title', 'Letters to Future Self')}
          </h1>
          <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
            {t('letters.title', 'Future Letters')}
          </h1>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsWriteModalOpen(true)}
          className="whitespace-nowrap"
        >
          {t('letters.writeButton', 'Write a Letter')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Delivered Letters */}
          {deliveredLetters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MailOpen className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <h2 className="text-base font-serif font-bold text-ink-900 dark:text-sky-100">
                  {t('letters.deliveredTitle', 'Delivered Letters')} ({deliveredLetters.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveredLetters.map((letter) => (
                  <Card
                    key={letter.id}
                    onClick={() => handleOpenLetter(letter)}
                    className="p-5 cursor-pointer hover:shadow-soft-lg transition-all border-l-4 border-l-sky-500 bg-white/80 dark:bg-slate-900/80 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-ink-900 dark:text-sky-100 group-hover:text-primary-600 transition-colors">
                            {letter.title}
                          </h3>
                          {letter.openedAt ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-400 font-medium">
                              {t('letters.opened', 'Opened')}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-400 font-bold animate-pulse">
                              {t('letters.newArrival', 'New!')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted dark:text-muted flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('letters.deliveredOn', 'Delivered')}:{' '}
                            {new Date(letter.deliverOn).toLocaleDateString(i18n.language)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLetter(letter.id, e)}
                          title="Delete letter"
                          className="p-1.5 rounded-lg text-muted hover:text-danger dark:hover:text-danger opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Locked Letters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-700 dark:text-sky-400" />
              <h2 className="text-base font-serif font-bold text-ink-900 dark:text-sky-100">
                {t('letters.lockedTitle', 'Locked in Time')} ({lockedLetters.length})
              </h2>
            </div>

            {lockedLetters.length === 0 ? (
              <Card className="p-8 text-center bg-white/60 dark:bg-slate-900/60 border-dashed">
                <Mail className="w-8 h-8 text-muted mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-ink-800 dark:text-border">
                  {t('letters.noLocked', 'No future letters currently sealed.')}
                </p>
                <p className="text-xs text-muted dark:text-muted mt-1 max-w-sm mx-auto">
                  {t(
                    'letters.noLockedDesc',
                    'Write a gentle message to your future self for a birthday, new year, exam day, or difficult week.'
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsWriteModalOpen(true)}
                >
                  {t('letters.writeFirst', 'Write your first future letter')}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedLetters.map((letter) => {
                  const daysLeft = getDaysUntil(letter.deliverOn);
                  return (
                    <Card
                      key={letter.id}
                      className="p-5 border-l-4 border-l-sky-500 bg-white/70 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
                            <h3 className="font-semibold text-sm text-ink-900 dark:text-sky-100">
                              {letter.title}
                            </h3>
                          </div>

                          <div className="space-y-1 text-xs text-muted dark:text-muted">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-muted" />
                              <span>
                                {t('letters.opensOn', 'Opens on')}:{' '}
                                {new Date(letter.deliverOn).toLocaleDateString(i18n.language, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="inline-block px-2 py-0.5 rounded bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-200 font-medium text-[11px]">
                              {t('letters.daysLeft', 'Arrives in {{count}} days', { count: daysLeft })}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteLetter(letter.id, e)}
                          title="Delete letter"
                          className="p-1.5 rounded-lg text-muted hover:text-danger dark:hover:text-danger opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose Letter Modal */}
      {isWriteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !saving && setIsWriteModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#131d31] rounded-2xl shadow-soft-2xl border border-border dark:border-ink-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-sky-100">
                  {t('letters.composeTitle', 'Write to Your Future Self')}
                </h3>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-text dark:hover:text-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {highRiskAlert ? (
              <div className="space-y-4 p-4 rounded-xl bg-sky-50 dark:bg-danger border border-danger dark:border-danger">
                <div className="flex items-start gap-3">
                  <HeartHandshake className="w-6 h-6 text-danger dark:text-danger shrink-0 mt-0.5" />
                  <div className="space-y-2 text-xs text-danger dark:text-danger">
                    <h4 className="font-bold text-sm">
                      {t('letters.safetyHeading', 'Your letter is saved. We care about you.')}
                    </h4>
                    <p className="leading-relaxed">
                      {t(
                        'letters.safetyText',
                        'We noticed some deep pain in what you wrote. Please remember you do not have to carry this alone. Free, confidential human support is here whenever you need it.'
                      )}
                    </p>
                    <div className="pt-2">
                      <a
                        href="tel:988"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger text-white font-bold hover:bg-danger transition-colors"
                      >
                        {t('sos.call988', 'Call or Text 988')}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHighRiskAlert(false);
                      setIsWriteModalOpen(false);
                      setTitle('');
                      setContent('');
                      setDeliverOn('');
                    }}
                  >
                    {t('common.close', 'Close')}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateLetter} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text dark:text-sky-200 mb-1">
                    {t('letters.fieldTitle', 'Letter Title')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('letters.placeholderTitle', 'e.g. Read this on my graduation day')}
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-slate-900 text-sm text-ink-900 dark:text-sky-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text dark:text-sky-200 mb-1">
                    {t('letters.fieldDate', 'Deliver On (must be in the future)')}
                  </label>
                  <input
                    type="date"
                    required
                    min={tomorrowStr}
                    value={deliverOn}
                    onChange={(e) => setDeliverOn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-slate-900 text-sm text-ink-900 dark:text-sky-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text dark:text-sky-200 mb-1">
                    {t('letters.fieldContent', 'Message to Future You')}
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t(
                      'letters.placeholderContent',
                      'Dear future me, right now I am experiencing... Remember the strength you found today...'
                    )}
                    className="w-full px-3 py-2 rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-slate-900 text-sm text-ink-900 dark:text-sky-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-serif leading-relaxed"
                  />
                  <div className="text-[11px] text-muted mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-sky-500" />
                    <span>{t('letters.encryptedNotice', 'Encrypted with AES-256. Locked until delivery date.')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100 dark:border-ink-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    onClick={() => setIsWriteModalOpen(false)}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={saving}
                    icon={<Send className="w-4 h-4" />}
                  >
                    {t('letters.sealButton', 'Seal & Save')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Read Letter Modal */}
      {readingLetter && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setReadingLetter(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#131d31] rounded-2xl shadow-soft-2xl border border-border dark:border-ink-800 p-6 space-y-4 max-h-[85vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3 overflow-y-auto pr-1">
              <div className="flex items-start justify-between pb-3 border-b border-sky-100 dark:border-ink-800">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('letters.deliveredTag', 'Delivered from your past')}</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-ink-900 dark:text-sky-100">
                    {readingLetter.title}
                  </h3>
                  <div className="text-xs text-muted dark:text-muted flex items-center gap-3">
                    <span>
                      {t('letters.writtenOn', 'Written')}:{' '}
                      {new Date(readingLetter.writtenOn).toLocaleDateString(i18n.language)}
                    </span>
                    <span>•</span>
                    <span>
                      {t('letters.deliveredOn', 'Delivered')}:{' '}
                      {new Date(readingLetter.deliverOn).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReadingLetter(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-text dark:hover:text-border"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {readingLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-sky-50 dark:bg-ink-900 border border-sky-100 dark:border-ink-900 font-serif leading-relaxed text-sm text-ink-900 dark:text-sky-100 whitespace-pre-wrap">
                  {readingLetter.content}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-sky-100 dark:border-ink-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setReadingLetter(null)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
