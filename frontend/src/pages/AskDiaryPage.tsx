import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChatService } from '../services/chatService';
import { AskDiaryResponse, UsedDiaryEntry } from '../types';
import { Card, Button, Spinner, Modal } from '../components/common';
import { useToast } from '../components/common/Toast';
import {
  Send,
  Sparkles,
  Calendar,
  BookOpen,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
  Trash2
} from 'lucide-react';

interface HistoryMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt: string | Date;
}

export const AskDiaryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AskDiaryResponse | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<UsedDiaryEntry | null>(null);
  const [aiDisabled, setAiDisabled] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);

  const isAIOffInSettings = user?.settings?.allowAIFeatures === false || user?.settings?.allowDiaryAI === false;

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const msgs = await ChatService.getMessages('diary');
        if (isMounted) {
          setHistoryMessages(msgs.map((m, idx) => ({
            id: m._id || m.id || `h-${idx}`,
            sender: m.role,
            content: m.content,
            createdAt: m.createdAt || new Date()
          })));
        }
      } catch {
        // Soft fallback
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleForgetChat = async () => {
    try {
      await ChatService.clearMessages('diary');
      setHistoryMessages([]);
      setResult(null);
      setLastQuestion('');
      toast.success(t('askDiary.chatCleared'));
    } catch {
      toast.error(t('askDiary.chatClearError'));
    }
  };

  const suggestedQuestions = [
    t('askDiary.q1'),
    t('askDiary.q2'),
    t('askDiary.q3')
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    if (isAIOffInSettings) {
      setAiDisabled(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setAskError(null);
    setLastQuestion(q);
    setAiDisabled(false);

    try {
      const chatRes = await ChatService.sendMessage(q, 'diary');
      const data = chatRes.diaryResult!;
      setResult(data);
      // Append to local history list
      setHistoryMessages(prev => [
        ...prev,
        { id: `u-${Date.now()}`, sender: 'user', content: q, createdAt: new Date() },
        { id: `a-${Date.now()}`, sender: 'assistant', content: data.answer, sources: data.usedEntryIds, createdAt: new Date() }
      ]);
      setQuestion('');
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      if (apiErr?.code === 'DIARY_AI_DISABLED' || apiErr?.code === 'AI_DISABLED') {
        setAiDisabled(true);
      } else {
        const msg = apiErr?.code === 'AI_BLOCKED'
          ? t('ai.blocked')
          : apiErr?.code === 'AI_TRUNCATED'
            ? t('ai.truncated')
            : apiErr?.code === 'AI_EMPTY'
              ? t('ai.empty')
              : (apiErr?.message || t('askDiary.genericError'));
        setAskError(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border dark:border-ink-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
            {t('askDiary.title')}
          </h1>
        </div>

        {historyMessages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForgetChat}
            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
            className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 self-start sm:self-auto"
          >
            {t('askDiary.forgetChat')}
          </Button>
        )}
      </div>

      {/* AI Disabled State */}
      {(isAIOffInSettings || aiDisabled) && (
        <Card className="p-6 border-l-4 border-l-sky-500 bg-sky-50 dark:bg-ink-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-sky-200">
                {user?.settings?.allowAIFeatures === false
                  ? t('askDiary.aiOffTitle')
                  : t('askDiary.diaryOffTitle')}
              </h3>
              <p className="text-xs text-sky-700 dark:text-sky-200 leading-relaxed">
                {user?.settings?.allowAIFeatures === false
                  ? t('askDiary.aiOffDesc')
                  : t('askDiary.diaryOffDesc')}
              </p>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="mt-2 text-xs">
                  {t('askDiary.goToSettings')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Retryable AI Error State */}
      {askError && (
        <Card className="p-4 border-l-4 border-l-danger bg-sky-50 dark:bg-danger flex items-center justify-between gap-3">
          <p className="text-xs text-danger dark:text-danger">{askError}</p>
          {lastQuestion && (
            <Button variant="outline" size="sm" onClick={() => handleAsk(lastQuestion)} className="shrink-0 text-xs">
              {t('ai.retry')}
            </Button>
          )}
        </Card>
      )}

      {/* Input Box */}
      <Card className="p-4 sm:p-5 space-y-3">
        <label htmlFor="ask-diary-input" className="block text-xs font-medium text-muted dark:text-muted">
          {t('askDiary.inputPlaceholder')}
        </label>
        <div className="relative">
          <textarea
            id="ask-diary-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isAIOffInSettings}
            rows={3}
            placeholder={t('askDiary.inputPlaceholder')}
            className="w-full p-3.5 pr-12 rounded-xl text-sm border border-border dark:border-text bg-sky-50 dark:bg-ink-900 text-ink-900 dark:text-sky-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 resize-none"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={!question.trim() || isLoading || isAIOffInSettings}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:hover:bg-primary-600 transition-colors"
            title={t('askDiary.askBtn')}
            aria-label={t('askDiary.sendQuestion')}
          >
            {isLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Suggested Questions */}
        <div className="pt-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted dark:text-muted mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            <span>{t('askDiary.suggestedTitle')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                  handleAsk(sq);
                }}
                disabled={isLoading || isAIOffInSettings}
                className="text-xs text-left px-3 py-1.5 rounded-full border border-border dark:border-text bg-white dark:bg-ink-900 hover:bg-sky-100 dark:hover:bg-ink-800 text-text dark:text-sky-200 transition-colors disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 mx-auto rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Spinner size="md" />
          </div>
          <p className="text-sm font-medium text-text dark:text-sky-200">
            {t('askDiary.loading')}
          </p>
          <p className="text-xs text-muted">
            {t('askDiary.loadingDetail')}
          </p>
        </Card>
      )}

      {/* Answer Section */}
      {result && !isLoading && (
        <div className="space-y-4 animate-fade-in">
          {/* High risk crisis banner if triggered */}
          {result.safetyLevel === 'high' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
              <HeartHandshake className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 dark:text-red-200 space-y-1">
                <p className="font-semibold">{t('askDiary.supportAvailable')}</p>
                <p>{t('askDiary.crisisCallNotice')}</p>
              </div>
            </div>
          )}

          <Card className="p-6 space-y-4 border-l-4 border-l-primary-500 shadow-soft-sm">
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-ink-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-text dark:text-sky-200">
                <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>{t('askDiary.questionLabel', { question: lastQuestion })}</span>
              </div>
              {result.quotaRemaining !== undefined && (
                <span className="text-[11px] text-muted">
                  {t('askDiary.quotaNotice', { count: result.quotaRemaining })}
                </span>
              )}
            </div>

            <div className="text-sm text-ink-800 dark:text-border leading-relaxed font-serif whitespace-pre-wrap">
              {result.answer}
            </div>

            {/* Based on these entries section */}
            {result.usedEntries && result.usedEntries.length > 0 && (
              <div className="pt-4 border-t border-sky-100 dark:border-ink-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted dark:text-muted">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  <span>{t('askDiary.basedOnEntries')}:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.usedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="p-3 rounded-xl border border-border dark:border-text bg-white/70 dark:bg-ink-900 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-soft-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-ink-900 dark:text-sky-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {entry.title}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted shrink-0">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(entry.date)}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted dark:text-muted line-clamp-2 leading-relaxed">
                        {entry.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Entry Excerpt Modal */}
      {selectedEntry && (
        <Modal
          isOpen={Boolean(selectedEntry)}
          onClose={() => setSelectedEntry(null)}
          title={selectedEntry.title}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted pb-2 border-b border-sky-100 dark:border-ink-800">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(selectedEntry.date)}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-ink-900 text-xs text-text dark:text-sky-200 leading-relaxed font-serif whitespace-pre-wrap border border-border dark:border-ink-800">
              {selectedEntry.snippet}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEntry(null)}
              >
                {t('common.close')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSelectedEntry(null);
                  navigate('/search');
                }}
              >
                {t('askDiary.searchInJournal')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Privacy & Medical Disclaimer */}
      <div className="p-4 rounded-xl border border-border dark:border-ink-800 bg-sky-50 dark:bg-ink-950 flex items-start gap-2.5 text-[11px] text-muted dark:text-muted leading-relaxed">
        <HelpCircle className="w-4 h-4 shrink-0 text-muted mt-0.5" />
        <div>
          {t('askDiary.disclaimer')}{' '}
          <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('askDiary.readPrivacyCommitments')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AskDiaryPage;
