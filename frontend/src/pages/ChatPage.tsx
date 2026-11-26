import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { AIService } from '../services/aiService';
import { ChatMessage, AIUsage } from '../types';
import { SafetyBanner } from '../components/Wellness/SafetyBanner';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import {
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  HeartHandshake,
  Paperclip,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_STARTS = [
  "I'm feeling stressed about my workload today.",
  "I can't sleep and my mind is racing.",
  "I had a surprisingly good day and want to savor it.",
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load chat history & usage status
    Promise.all([
      AIService.getChatMessages().catch(() => []),
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
      const res = await AIService.sendChatMessage(text, attachCheckIn);

      // Check safety trigger
      if (res.safety && (res.safety.level === 'high' || res.safety.level === 'concern')) {
        setSafetyLevel(res.safety.level as 'concern' | 'high');
      }

      setMessages(prev => [
        ...prev.slice(0, -1),
        res.userMessage,
        res.assistantMessage
      ]);

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
      await AIService.clearChat();
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

      {/* Header & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-calm-200 dark:border-calm-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            {t('chat.companionTagline', 'AI Companion Sanctuary')}
          </div>
          <h1 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">
            {t('chat.title', 'Support Companion')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {usage && (
            <span className="text-xs font-mono text-calm-500 bg-calm-100 dark:bg-calm-800/80 px-2.5 py-1 rounded-xl">
              {t('chat.remainingToday', { remaining: usage.remaining, limit: usage.limit })}
            </span>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={<Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />}
            >
              {t('chat.clearHistory')}
            </Button>
          )}
        </div>
      </div>

      {/* Prominent Clinical Disclaimer */}
      <div className="p-3 bg-primary-50/70 dark:bg-primary-950/20 border border-primary-200/60 dark:border-primary-900/40 rounded-2xl flex items-center gap-2.5 text-xs text-primary-800 dark:text-primary-300">
        <HeartHandshake className="w-4 h-4 shrink-0 text-primary-600 dark:text-primary-400" />
        <span>
          {t('chat.disclaimer')}
        </span>
      </div>

      {/* Notice if AI is disabled */}
      {!settings.allowAIFeatures && (
        <Card className="p-5 border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-center space-y-2">
          <p className="text-xs text-amber-800 dark:text-amber-200">
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
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-calm-900 dark:text-calm-100">
                  {t('chat.companionName', 'A gentle ear whenever you need')}
                </h3>
                <p className="text-xs text-calm-500 dark:text-calm-400 max-w-sm mt-1">
                  {t('chat.emptyPrompt', 'Share whatever is on your heart. You can also pick a prompt below to get started:')}
                </p>
              </div>

              {/* Quick-start chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                {QUICK_STARTS.map((qs) => (
                  <button
                    key={qs}
                    onClick={() => handleSend(qs)}
                    className="p-3 text-left rounded-xl border border-calm-200 dark:border-calm-800 hover:border-purple-300 dark:hover:border-purple-700 bg-calm-50/50 dark:bg-calm-900/30 text-xs text-calm-700 dark:text-calm-300 transition-colors flex items-center justify-between group"
                  >
                    <span>{qs}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-calm-400 group-hover:text-purple-600 transition-colors shrink-0 ml-1.5" />
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
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-calm-100 dark:bg-[#1a253d] text-calm-900 dark:text-calm-100 rounded-tl-none border border-calm-200/60 dark:border-calm-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isUser ? 'text-primary-200' : 'text-calm-400'
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
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-calm-100 dark:bg-[#1a253d] rounded-2xl rounded-tl-none px-4 py-3 border border-calm-200/60 dark:border-calm-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="pt-4 border-t border-calm-100 dark:border-calm-800 space-y-2">
          {/* Options: Attach today's check-in */}
          <div className="flex items-center justify-between text-[11px] text-calm-500">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-calm-800 dark:hover:text-calm-200">
              <input
                type="checkbox"
                checked={attachCheckIn}
                onChange={(e) => setAttachCheckIn(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <Paperclip className="w-3 h-3 text-calm-400" />
              <span>{t('chat.attachCheckin')}</span>
            </label>

            <span className="text-[10px] text-calm-400">{t('chat.memoryContext')}</span>
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
              className="flex-1 px-4 py-2.5 bg-calm-50 dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-900 dark:text-calm-100 focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50"
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
    </div>
  );
};
