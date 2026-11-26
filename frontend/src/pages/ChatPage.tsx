import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { AIService } from '../services/aiService';
import { ChatService } from '../services/chatService';
import { ChatMessage, AIUsage } from '../types';
import { SafetyBanner } from '../components/Wellness/SafetyBanner';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BottomSheet } from '../components/ui';
import { useToast } from '../components/common/Toast';
import {
  Send,
  Trash2,
  Bot,
  User,
  Info,
  Paperclip,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_STARTS = [
  "I'm feeling stressed about my workload today.",
  "I can't sleep and my mind is racing.",
  "Help me untangle why I'm feeling so anxious right now."
];

export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const toast = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachCheckIn, setAttachCheckIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [safetyLevel, setSafetyLevel] = useState<'none' | 'concern' | 'high'>('none');
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load chat history & usage status
    Promise.all([
      ChatService.getMessages('general').catch(() => []),
      AIService.getAIUsage().catch(() => null)
    ]).then(([msgs, u]) => {
      setMessages(msgs);
      if (u) setUsage(u);
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!settings.allowAIFeatures) {
      toast.warning('AI features are disabled in Settings. Please turn them on to chat.');
      return;
    }

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      role: 'user',
      content: text,
      createdAt: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await ChatService.sendMessage(text, 'general', { attachCheckIn });

      // Check safety trigger
      if (res.safety && (res.safety.level === 'high' || res.safety.level === 'concern')) {
        setSafetyLevel(res.safety.level as 'concern' | 'high');
      }

      if (res.userMessage && res.assistantMessage) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          res.userMessage!,
          res.assistantMessage!
        ]);
      }

      if (res.quotaRemaining != null && usage) {
        setUsage(prev => prev ? { ...prev, remaining: res.quotaRemaining || 0 } : null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Message could not be sent';
      toast.error(msg);
      // Remove optimistic message if request completely failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await ChatService.clearMessages('general');
      setMessages([]);
      toast.info('Conversation cleared.');
    } catch {
      toast.error('Failed to clear conversation.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in py-2">
      <SafetyBanner
        level={safetyLevel}
        onDismiss={() => setSafetyLevel('none')}
        country={settings.country}
        trustedContact={settings.trustedContact}
      />

      {/* Header & 1-line Notice */}
      <div className="flex items-center justify-between gap-3 border-b border-border dark:border-ink-800 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
            {t('chat.title', 'Support')}
          </h1>
          <button
            type="button"
            onClick={() => setShowInfoSheet(true)}
            aria-label={t('chat.disclaimer', 'Info')}
            className="p-1.5 rounded-full text-muted hover:text-primary-600 hover:bg-sky-50 dark:hover:bg-ink-800"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {usage && (
            <span className="text-xs font-mono text-muted bg-sky-100 dark:bg-ink-800 px-2.5 py-1 rounded-xl">
              {t('chat.remainingToday', { remaining: usage.remaining, limit: usage.limit })}
            </span>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={<Trash2 className="w-3.5 h-3.5 text-muted hover:text-danger" />}
            >
              {t('chat.clearHistory')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50 dark:bg-ink-900 border border-border dark:border-ink-800 text-xs text-muted">
        <span className="truncate">{t('chat.disclaimer')}</span>
        <button
          type="button"
          onClick={() => setShowInfoSheet(true)}
          aria-label="Details"
          className="shrink-0 text-primary-600 hover:underline font-medium"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Notice if AI is disabled */}
      {!settings.allowAIFeatures && (
        <Card className="p-5 border-sky-200 dark:border-ink-900 bg-sky-50 dark:bg-ink-900 text-center space-y-2">
          <p className="text-xs text-sky-700 dark:text-sky-200">
            {t('chat.aiDisabledNotice')}
          </p>
          <Link to="/settings">
            <Button variant="primary" size="sm">
              {t('chat.enableInSettings')}
            </Button>
          </Link>
        </Card>
      )}

      {/* Chat Thread */}
      <Card className="min-h-[440px] max-h-[560px] flex flex-col justify-between p-4 sm:p-6 bg-white dark:bg-[#131d31] shadow-soft-sm">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-ink-900 dark:text-sky-100">
                  {t('chat.companionName', 'A gentle ear whenever you need')}
                </h3>
                <p className="text-xs text-muted dark:text-muted max-w-sm mt-1">
                  {t('chat.emptyPrompt', 'Share whatever is on your heart. You can also pick a prompt below to get started:')}
                </p>
              </div>

              {/* Quick-start chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                {QUICK_STARTS.map((qs) => (
                  <button
                    key={qs}
                    onClick={() => handleSend(qs)}
                    className="p-3 text-left rounded-xl border border-border dark:border-ink-800 hover:border-sky-200 dark:hover:border-sky-700 bg-sky-50 dark:bg-ink-900 text-xs text-text dark:text-sky-200 transition-colors flex items-center justify-between group"
                  >
                    <span>{qs}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-sky-700 transition-colors shrink-0 ml-1.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id || m._id || idx}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isUser
                        ? 'bg-primary-600 text-white'
                        : 'bg-sky-100 dark:bg-ink-900 text-sky-700 dark:text-sky-200'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-sky-100 dark:bg-[#1a253d] text-ink-900 dark:text-sky-100 rounded-tl-none border border-border dark:border-ink-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isUser ? 'text-primary-200' : 'text-muted'
                      }`}
                    >
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-ink-900 text-sky-700 dark:text-sky-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-sky-100 dark:bg-[#1a253d] rounded-2xl rounded-tl-none px-4 py-3 border border-border dark:border-ink-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="pt-4 border-t border-sky-100 dark:border-ink-800 space-y-2">
          {/* Options: Attach today's check-in */}
          <div className="flex items-center justify-between text-[11px] text-muted">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-ink-800 dark:hover:text-border">
              <input
                type="checkbox"
                checked={attachCheckIn}
                onChange={(e) => setAttachCheckIn(e.target.checked)}
                className="rounded text-sky-700 focus:ring-sky-500"
              />
              <Paperclip className="w-3 h-3 text-muted" />
              <span>{t('chat.attachCheckin')}</span>
            </label>

            <span className="text-[10px] text-muted">{t('chat.memoryContext')}</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={settings.allowAIFeatures ? t('chat.placeholder', "Type your thoughts gently...") : t('settings.allowAiLabel', "Enable AI in settings to send...")}
              disabled={!settings.allowAIFeatures || isLoading}
              className="flex-1 px-4 py-2.5 bg-sky-50 dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-900 dark:text-sky-100 focus:ring-2 focus:ring-sky-500 outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              disabled={!settings.allowAIFeatures || !inputText.trim()}
              icon={<Send className="w-4 h-4" />}
            >
              {t('chat.send', 'Send')}
            </Button>
          </form>
        </div>
      </Card>

      <BottomSheet
        open={showInfoSheet}
        onClose={() => setShowInfoSheet(false)}
        title={t('chat.title', 'Support')}
      >
        <p className="text-sm text-text dark:text-sky-200 leading-relaxed">
          {t('chat.disclaimer')}
        </p>
      </BottomSheet>
    </div>
  );
};
