import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getHelplinesForCountry, isHelplineVerificationStale } from '../../data/helplines';
import { TrustedContact } from '../../types';
import { Phone, MessageSquare, Heart, Shield, ExternalLink, X } from 'lucide-react';

interface SafetyBannerProps {
  level: 'none' | 'concern' | 'high';
  onDismiss?: () => void;
  country?: string;
  trustedContact?: TrustedContact;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  level,
  onDismiss,
  country,
  trustedContact
}) => {
  const { t } = useTranslation();
  const [showHelplineList, setShowHelplineList] = useState(false);
  const countryData = getHelplinesForCountry(country);
  const primaryHelpline = countryData.helplines[0];

  useEffect(() => {
    if (level !== 'high' || !onDismiss) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [level, onDismiss]);

  if (level === 'none') return null;

  // Level: Concern — Soft, gentle caring card
  if (level === 'concern') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="my-4 p-4 rounded-2xl bg-calm-50/90 dark:bg-calm-950/40 border border-calm-200 dark:border-calm-800 text-calm-900 dark:text-calm-100 shadow-soft-sm animate-fade-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-calm-100 dark:bg-calm-900/60 text-calm-700 dark:text-calm-300 shrink-0 mt-0.5">
              <Heart className="w-4 h-4 fill-current" />
            </span>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{t('safety.concernTitle', 'We are here with you')}</h4>
              <p className="text-xs text-calm-600 dark:text-calm-300 leading-relaxed font-serif">
                {t('safety.concernDesc', 'If thoughts feel heavy or exhausting today, remember that you never have to carry them alone. Gentle, confidential support is always available whenever you need a listening ear.')}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {primaryHelpline && (
                  <a
                    href={primaryHelpline.callUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-soft-sm transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t('safety.callNow', 'Talk to')} {primaryHelpline.name} ({primaryHelpline.number})</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowHelplineList((prev) => !prev)}
                  className="text-xs font-medium text-calm-700 dark:text-calm-300 hover:underline"
                >
                  {showHelplineList ? t('safety.hideResources', 'Hide additional resources') : t('safety.moreResources', 'More helplines & resources')}
                </button>
              </div>

              {showHelplineList && (
                <div className="pt-3 mt-2 border-t border-calm-200/60 dark:border-calm-800 space-y-2">
                  {countryData.helplines.map((h) => (
                    <div key={h.name} className="flex items-center justify-between text-xs py-1">
                      <div>
                        <span className="font-semibold text-calm-800 dark:text-calm-200">{h.name}: </span>
                        <span className="text-calm-500">{h.description}</span>
                        {isHelplineVerificationStale(h.lastVerified) && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            {t('sos.verifyNumber')}
                          </div>
                        )}
                      </div>
                      <a
                        href={h.callUrl}
                        className="px-2 py-1 rounded-lg bg-calm-100 dark:bg-calm-800 text-calm-800 dark:text-calm-200 font-semibold hover:bg-calm-200 transition-colors shrink-0 ml-2"
                      >
                        {h.number}
                      </a>
                    </div>
                  ))}
                  {primaryHelpline?.lastVerified && (
                    <div className="text-[10px] text-calm-500 dark:text-calm-400 pt-1">
                      {t('sos.lastVerifiedDate', { date: primaryHelpline.lastVerified })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close message"
              className="p-1 rounded-lg text-calm-400 hover:text-calm-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Level: High — Calm full-screen overlay (non-punitive, dignified, caring)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-support-title"
      className="fixed inset-0 z-50 bg-[#0f172a]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#131d31] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-soft-xl text-center space-y-6">
        {/* Soft Dignified Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-soft-sm">
          <Heart className="w-7 h-7 fill-rose-500/20" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2
            id="crisis-support-title"
            className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-gray-100"
          >
            {t('safety.highTitle', 'You matter. You are not alone.')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-serif max-w-md mx-auto">
            {t('safety.highDesc', 'If you are experiencing painful distress or thoughts of harm, caring support is available 24/7.')}
          </p>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-3 pt-2">
          {primaryHelpline && (
            <a
              href={primaryHelpline.callUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base shadow-soft-md transition-all active:scale-[0.98]"
            >
              <Phone className="w-5 h-5" />
              <span>{t('safety.callNow', 'Call Helpline Now')} - {primaryHelpline.name} ({primaryHelpline.number})</span>
            </a>
          )}

          {/* Trusted Contact Button if configured */}
          {trustedContact?.phone && (
            <a
              href={`tel:${trustedContact.phone}`}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-calm-100 dark:bg-calm-800 hover:bg-calm-200 text-calm-900 dark:text-calm-100 font-medium text-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 text-calm-600" />
              <span>
                {t('safety.messageContact', 'Message Trusted Contact')} ({trustedContact.name || 'Friend'}: {trustedContact.phone})
              </span>
            </a>
          )}
        </div>

        {/* Helplines for Country */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-left space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('sos.freeConfidentialIn', { country: countryData.countryName })}
            </p>
            {primaryHelpline?.lastVerified && (
              <span className="text-[10px] text-gray-400">
                {t('sos.lastVerifiedDate', { date: primaryHelpline.lastVerified })}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {countryData.helplines.map((h) => (
              <div
                key={h.name}
                className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">{h.name}</div>
                  <div className="text-[11px] text-gray-500">{h.description}</div>
                  {isHelplineVerificationStale(h.lastVerified) && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                      {t('sos.verifyNumber')}
                    </div>
                  )}
                </div>
                <a
                  href={h.callUrl}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-primary-600 dark:text-primary-300 font-bold hover:shadow-soft-sm shrink-0 ml-2"
                >
                  {h.number}
                </a>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              <span>{t('sos.internationalDirectory')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Dismiss Option */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition-colors"
          >
            {t('safety.continue')}
          </button>
        </div>

        {/* MindDiary Disclaimer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 pt-2">
          <Shield className="w-3 h-3" />
          <span>{t('sos.disclaimer')}</span>
        </div>
      </div>
    </div>
  );
};
