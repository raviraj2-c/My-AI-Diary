import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { getHelplinesForCountry, isHelplineVerificationStale } from '../../data/helplines';
import { WellnessService } from '../../services/wellnessService';
import { AuthService } from '../../services/authService';
import { CopingPlanData } from '../../types';
import {
  HeartHandshake,
  X,
  Phone,
  MessageSquare,
  Wind,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SOSButton: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);
  const [copingPlan, setCopingPlan] = useState<CopingPlanData | null>(null);
  const { settings } = useSettings();
  const countryData = getHelplinesForCountry(settings.country);
  const trustedContact = settings.trustedContact;

  // Safe check whether user is logged in (works inside and outside AuthProvider)
  const isAuth = Boolean(AuthService.getAuthToken());

  useEffect(() => {
    // Only fetch coping plan when authenticated; never let a failed or unauthenticated call block helplines
    if (isOpen && isAuth) {
      WellnessService.getCopingPlan()
        .then((plan) => setCopingPlan(plan))
        .catch(() => setCopingPlan(null));
    } else {
      setCopingPlan(null);
    }
  }, [isOpen, isAuth]);

  const hasPlanItems = Boolean(
    copingPlan &&
    ((copingPlan.warningSigns && copingPlan.warningSigns.length > 0) ||
      (copingPlan.copingStrategies && copingPlan.copingStrategies.length > 0) ||
      (copingPlan.peopleToContact && copingPlan.peopleToContact.length > 0) ||
      (copingPlan.safePlaces && copingPlan.safePlaces.length > 0) ||
      (copingPlan.reasonsToKeepGoing && copingPlan.reasonsToKeepGoing.length > 0))
  );

  const groundingSteps = [
    { label: t('calm.step1', '5 things you can SEE'), desc: 'Look around and notice 5 objects near you: colors, shapes, light.' },
    { label: t('calm.step2', '4 things you can TOUCH'), desc: 'Feel your feet on the ground, clothing texture, or desk surface.' },
    { label: t('calm.step3', '3 things you can HEAR'), desc: 'Listen closely for distant hums, breathing, or gentle ambient sounds.' },
    { label: t('calm.step4', '2 things you can SMELL'), desc: 'Notice the scent of the air, coffee, rain, or a nearby object.' },
    { label: t('calm.step5', '1 positive thing about yourself'), desc: 'Notice a sip of water or simply take one deep, gentle breath.' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t('sos.openAria', 'Open emergency help and crisis lines')}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-soft-lg hover:shadow-soft-xl transition-all duration-200 active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        <HeartHandshake className="w-4 h-4 animate-pulse" />
        <span className="tracking-wide">{t('sos.button', 'SOS / Helplines')}</span>
      </button>

      {/* Slide-over / Modal Sheet */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-sheet-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#131d31] h-full overflow-y-auto p-6 space-y-6 shadow-soft-2xl border-l border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    <HeartHandshake className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 id="sos-sheet-title" className="text-base font-serif font-bold text-gray-900 dark:text-gray-100">
                      {t('sos.title', 'Crisis Support & Grounding')}
                    </h3>
                    <p className="text-xs text-gray-500">{t('sos.description', 'Free, confidential support available 24/7')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close support sheet"
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Personal Safety Coping Plan (Shown First if available) */}
              {hasPlanItems && copingPlan ? (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t('copingPlan.myPlanTitle', 'My Personal Coping Plan')}</span>
                    </div>
                    <Link
                      to="/settings#coping-plan"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] text-amber-700 dark:text-amber-400 font-medium hover:underline"
                    >
                      {t('common.edit', 'Edit')}
                    </Link>
                  </div>

                  {copingPlan.copingStrategies && copingPlan.copingStrategies.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-calm-700 dark:text-calm-300">
                        {t('copingPlan.strategiesLabel', 'What helps me:')}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {copingPlan.copingStrategies.map((s: unknown, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 text-[11px] text-calm-800 dark:text-calm-200 border border-amber-200/50 dark:border-amber-900/40"
                          >
                            {typeof s === 'string' ? s : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {copingPlan.safePlaces && copingPlan.safePlaces.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-calm-700 dark:text-calm-300">
                        {t('copingPlan.safePlacesLabel', 'My safe places:')}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {copingPlan.safePlaces.map((p: unknown, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 text-[11px] text-calm-800 dark:text-calm-200 border border-amber-200/50 dark:border-amber-900/40"
                          >
                            {typeof p === 'string' ? p : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {copingPlan.reasonsToKeepGoing && copingPlan.reasonsToKeepGoing.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-calm-700 dark:text-calm-300">
                        {t('copingPlan.reasonsLabel', 'Reasons to hold on:')}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {copingPlan.reasonsToKeepGoing.map((r: unknown, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 text-[11px] text-calm-800 dark:text-calm-200 border border-amber-200/50 dark:border-amber-900/40"
                          >
                            {typeof r === 'string' ? r : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : isAuth ? (
                <div className="p-3.5 rounded-2xl bg-calm-50/70 dark:bg-slate-800/40 border border-calm-200/70 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-calm-900 dark:text-calm-100">
                      {t('copingPlan.gentlePromptTitle', 'Personal Coping Plan')}
                    </div>
                    <div className="text-[11px] text-calm-500 dark:text-calm-400">
                      {t('copingPlan.gentlePromptDesc', 'Have your own calming anchors ready.')}
                    </div>
                  </div>
                  <Link
                    to="/settings#coping-plan"
                    onClick={() => setIsOpen(false)}
                    className="px-2.5 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 hover:bg-primary-100 font-semibold text-xs whitespace-nowrap transition-colors"
                  >
                    {t('copingPlan.makePlanLink', 'Make your plan →')}
                  </Link>
                </div>
              ) : null}

              {/* Trusted Contact Card (Only when authenticated) */}
              {isAuth && (
                <div className="p-4 rounded-2xl bg-calm-50/70 dark:bg-calm-950/30 border border-calm-200/80 dark:border-calm-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-calm-800 dark:text-calm-200 uppercase tracking-wider">
                      {t('sos.trustedContact', 'Trusted Contact')}
                    </span>
                    <Link
                      to="/settings"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {trustedContact?.phone ? t('common.edit', 'Edit') : t('sos.addInSettings', 'Add in Settings')}
                    </Link>
                  </div>

                  {trustedContact?.phone ? (
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {trustedContact.name || t('sos.savedContact', 'Saved Contact')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trustedContact.relation ? `${trustedContact.relation} • ` : ''}
                          {trustedContact.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${trustedContact.phone}`}
                          className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                          title={t('sos.callContact', 'Call trusted contact')}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`sms:${trustedContact.phone}`}
                          className="p-2 rounded-xl bg-calm-200 dark:bg-calm-700 text-calm-800 dark:text-calm-200 hover:bg-calm-300 transition-colors"
                          title={t('sos.messageContact', 'Message trusted contact')}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 leading-relaxed font-serif">
                      {t('sos.trustedContactDesc', 'Save a trusted friend, family member, or counselor in Settings to reach them instantly in one tap.')}
                    </p>
                  )}
                </div>
              )}

              {/* National Helplines */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('sos.countryHelplines', '{{country}} Helplines', { country: countryData.countryName })}
                  </span>
                  <div className="text-right">
                    <span className="text-gray-400">{t('sos.emergencyLabel', 'Emergency: {{number}}', { number: countryData.emergencyNumber })}</span>
                    {countryData.helplines[0]?.lastVerified && !isHelplineVerificationStale(countryData.helplines[0].lastVerified) ? (
                      <div className="text-[10px] text-gray-400">
                        {t('sos.lastVerified', 'Numbers last verified: {{date}}', { date: countryData.helplines[0].lastVerified })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {t('sos.verifyNumber', 'Please verify this number')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {countryData.helplines.map((h) => (
                    <div
                      key={h.name}
                      className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">{h.name}</div>
                        <div className="text-[11px] text-gray-500">{h.description}</div>
                        {(!h.lastVerified || isHelplineVerificationStale(h.lastVerified)) && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                            {t('sos.verifyNumber', 'Please verify this number')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={h.callUrl}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{h.number}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 text-center">
                  <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <span>{t('sos.moreCountries', 'More countries on findahelpline.com')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Mini Grounding Exercise (5-4-3-2-1) */}
              <div className="p-4 rounded-2xl bg-primary-50/60 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-800 dark:text-primary-300">
                    <Wind className="w-3.5 h-3.5" />
                    <span>{t('sos.groundingTitle', '60-Second Grounding Pause')}</span>
                  </div>
                  <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold">
                    {t('sos.stepOf', 'Step {{current}} of {{total}}', { current: groundingStep + 1, total: groundingSteps.length })}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {groundingSteps[groundingStep].label}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-serif">
                    {groundingSteps[groundingStep].desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    to="/calm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('sos.openCalm', 'Open Calm Space →')}
                  </Link>

                  <button
                    type="button"
                    onClick={() => setGroundingStep((prev) => (prev + 1) % groundingSteps.length)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <span>{t('common.next', 'Next')}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer at bottom */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-1 text-[11px] text-gray-400 text-center">
              <Shield className="w-3 h-3 shrink-0" />
              <span>{t('sos.disclaimer', 'MindDiary is a support tool. It is not a doctor, therapist, or emergency service.')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
