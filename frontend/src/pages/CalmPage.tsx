import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BreathingCircle } from '../components/Wellness/BreathingCircle';
import { SoundPlayer } from '../components/Wellness/SoundPlayer';
import { ThoughtChallenger } from '../components/Wellness/ThoughtChallenger';
import { WellnessService } from '../services/wellnessService';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import {
  Wind,
  Compass,
  Activity,
  Headphones,
  Flame,
  CheckCircle2,
  Sparkles,
  Shield,
  RotateCcw,
  ChevronRight,
  Heart,
  BrainCircuit
} from 'lucide-react';

export const CalmPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'relaxation' | 'sounds' | 'vent' | 'cbt'>('breathing');

  // Grounding 5-4-3-2-1 state
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<string[]>(['', '', '', '', '']);
  const [groundingDone, setGroundingDone] = useState(false);

  // Progressive Muscle Relaxation state
  const [pmrStep, setPmrStep] = useState(0);
  const [pmrActive, setPmrActive] = useState(false);
  const [pmrSeconds, setPmrSeconds] = useState(30);
  const [pmrDone, setPmrDone] = useState(false);

  // Vent & Let Go state (STRICT: NEVER sent to network or stored in state outside this component)
  const [ventText, setVentText] = useState('');
  const [isBurning, setIsBurning] = useState(false);
  const [hasBurned, setHasBurned] = useState(false);

  const groundingPrompts = [
    { title: '5 things you can SEE', desc: 'Look around your room or out a window. Notice small details: shadow, texture, color, a shape you haven’t focused on today.' },
    { title: '4 things you can TOUCH', desc: 'Feel your clothes against your skin, your feet firmly supported by the floor, the texture of a surface or blanket.' },
    { title: '3 things you can HEAR', desc: 'Close your eyes. Listen for distant sounds: traffic, clock ticking, wind, ambient room hum.' },
    { title: '2 things you can SMELL', desc: 'Breathe gently through your nose. Notice the air, rain, soap, or the scent of a shirt or cup.' },
    { title: '1 thing you can TASTE', desc: 'Notice the lingering taste of mint, tea, water, or simply take a gentle swallow and soften your jaw.' }
  ];

  const pmrSteps = [
    { title: '1. Forehead & Brow', instruction: 'Scrunch your forehead and squeeze your eyebrows down tight for 10 seconds... now release completely. Feel the tension melting away.' },
    { title: '2. Shoulders & Neck', instruction: 'Gently pull your shoulders up toward your ears. Hold gently for 10 seconds... and drop them down loose and heavy.' },
    { title: '3. Hands & Forearms', instruction: 'Clench your hands into soft fists, tightening your forearms... hold... now open your fingers wide and let them soften into your lap.' },
    { title: '4. Stomach & Chest', instruction: 'Tighten your abdomen and take a deep breath into your ribs... hold for a moment... exhale slowly, letting your belly soften.' },
    { title: '5. Legs & Feet', instruction: 'Curl your toes down and gently tighten your calves and thighs... hold... and release. Feel heavy, supported, and grounded.' }
  ];

  // PMR countdown timer
  useEffect(() => {
    if (!pmrActive) return;
    const interval = setInterval(() => {
      setPmrSeconds((prev) => {
        if (prev <= 1) {
          if (pmrStep < pmrSteps.length - 1) {
            setPmrStep((s) => s + 1);
            return 30;
          } else {
            setPmrActive(false);
            setPmrDone(true);
            WellnessService.logCalmSession({ type: 'relaxation', durationMinutes: 3, technique: 'Progressive Muscle Relaxation' });
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pmrActive, pmrStep, pmrSteps.length]);

  const handleGroundingNext = () => {
    if (groundingStep < groundingPrompts.length - 1) {
      setGroundingStep((s) => s + 1);
    } else {
      setGroundingDone(true);
      WellnessService.logCalmSession({ type: 'grounding', durationMinutes: 2, technique: '5-4-3-2-1 Sensory Grounding' });
      toast.success(t('calm.wellDone'));
    }
  };

  const handleResetGrounding = () => {
    setGroundingStep(0);
    setGroundingInputs(['', '', '', '', '']);
    setGroundingDone(false);
  };

  // Vent & Let go burn action (purely client-side fade/destroy)
  const handleBurnVent = () => {
    if (!ventText.trim()) return;
    setIsBurning(true);
    setTimeout(() => {
      setVentText('');
      setIsBurning(false);
      setHasBurned(true);
      toast.info(t('calm.ventDissolved'));
      WellnessService.logCalmSession({ type: 'vent', durationMinutes: 1, technique: 'Release & Let Go' });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-calm-100 dark:bg-calm-950/60 text-calm-700 dark:text-calm-300 text-xs font-semibold">
          <Wind className="w-3.5 h-3.5" />
          <span>{t('calm.title')}</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">
          {t('calm.title')}
        </h1>
        <p className="text-sm text-gray-500 font-serif max-w-md mx-auto">
          {t('calm.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl max-w-xl mx-auto">
        {(
          [
            { id: 'breathing', label: t('calm.breathingTitle'), icon: Wind },
            { id: 'grounding', label: t('calm.groundingTitle'), icon: Compass },
            { id: 'relaxation', label: t('calm.pmrTitle'), icon: Activity },
            { id: 'sounds', label: t('calm.soundsTitle'), icon: Headphones },
            { id: 'cbt', label: t('calm.thoughtChallengerTitle'), icon: BrainCircuit },
            { id: 'vent', label: t('calm.ventTitle'), icon: Flame }
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Panels */}
      <div className="min-h-[420px]">
        {/* 1. Breathing Circle */}
        {activeTab === 'breathing' && (
          <BreathingCircle
            onSessionComplete={(_type, mins, tech) => {
              WellnessService.logCalmSession({ type: 'breathing', durationMinutes: mins, technique: tech });
            }}
          />
        )}

        {/* 2. 5-4-3-2-1 Sensory Grounding */}
        {activeTab === 'grounding' && (
          <div className="max-w-xl mx-auto space-y-6">
            <Card className="p-6 sm:p-8 border-calm-200/80 dark:border-gray-800 space-y-6">
              {!groundingDone ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      {t('calm.groundingStepCount', { current: groundingStep + 1, total: 5 })}
                    </span>
                    <span className="text-xs text-gray-400">{t('calm.sensoryReconnection')}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-gray-100">
                      {groundingPrompts[groundingStep].title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-serif">
                      {groundingPrompts[groundingStep].desc}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="grounding-input" className="block text-xs font-medium text-gray-500 mb-1.5">
                      {t('calm.groundingInputLabel')}
                    </label>
                    <textarea
                      id="grounding-input"
                      rows={3}
                      value={groundingInputs[groundingStep]}
                      onChange={(e) => {
                        const next = [...groundingInputs];
                        next[groundingStep] = e.target.value;
                        setGroundingInputs(next);
                      }}
                      placeholder={t('calm.ventPlaceholder')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-serif text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleResetGrounding}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('calm.reset')}</span>
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleGroundingNext}
                      icon={ChevronRight}
                    >
                      {groundingStep === 4 ? t('common.done') : t('common.next')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-gray-100">
                    {t('calm.wellDone')}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto font-serif">
                    {t('calm.ventDissolved')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetGrounding}
                    icon={RotateCcw}
                  >
                    {t('calm.pmrRepeat')}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 3. Progressive Muscle Relaxation */}
        {activeTab === 'relaxation' && (
          <div className="max-w-xl mx-auto space-y-6">
            <Card className="p-6 sm:p-8 border-calm-200/80 dark:border-gray-800 space-y-6 text-center">
              {!pmrDone ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      {t('calm.pmrStepCount', { current: pmrStep + 1, total: pmrSteps.length })}
                    </span>
                    <span className="font-mono text-gray-500">
                      {pmrActive ? `${pmrSeconds}s` : t('calm.pmrPerZone')}
                    </span>
                  </div>

                  <div className="space-y-3 py-4">
                    <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-gray-100">
                      {pmrSteps[pmrStep].title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-serif max-w-md mx-auto">
                      {pmrSteps[pmrStep].instruction}
                    </p>
                  </div>

                  {pmrActive && (
                    <div className="w-48 mx-auto h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-1000"
                        style={{ width: `${((30 - pmrSeconds) / 30) * 100}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setPmrActive(!pmrActive)}
                    >
                      {pmrActive ? t('calm.pauseBreathing') : t('calm.pmrStart')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPmrActive(false);
                        setPmrStep(0);
                        setPmrSeconds(30);
                      }}
                    >
                      {t('calm.reset')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8 space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-gray-100">
                    {t('calm.pmrReleasedTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 font-serif max-w-sm mx-auto">
                    {t('calm.pmrReleasedDesc')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPmrDone(false);
                      setPmrStep(0);
                      setPmrSeconds(30);
                    }}
                  >
                    {t('calm.pmrRepeat')}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 4. Ambient Nature Sounds */}
        {activeTab === 'sounds' && (
          <div className="max-w-md mx-auto">
            <SoundPlayer />
          </div>
        )}

        {/* 5. Vent & Let Go */}
        {activeTab === 'vent' && (
          <div className="max-w-xl mx-auto space-y-6">
            <Card className="p-6 sm:p-8 border-calm-200/80 dark:border-gray-800 space-y-5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{t('calm.ventLetGo')}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span>{t('calm.neverSaved')}</span>
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold text-gray-900 dark:text-gray-100">
                  {t('calm.releaseCannotCarry')}
                </h3>
                <p className="text-xs text-gray-500 font-serif">
                  {t('calm.ventDescription')}
                </p>
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  value={ventText}
                  onChange={(e) => {
                    setVentText(e.target.value);
                    if (hasBurned) setHasBurned(false);
                  }}
                  disabled={isBurning}
                  placeholder={t('calm.ventPlaceholder')}
                  className={`w-full p-4 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-2xl text-xs sm:text-sm font-serif leading-relaxed text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all duration-1000 ${
                    isBurning ? 'opacity-0 blur-sm scale-95' : 'opacity-100'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-gray-400 italic">
                  {ventText.length > 0 ? t('calm.wordsReady', { count: ventText.trim().split(/\s+/).length }) : t('calm.completelyPrivate')}
                </span>

                <Button
                  variant="danger"
                  size="md"
                  icon={Flame}
                  disabled={!ventText.trim() || isBurning}
                  onClick={handleBurnVent}
                  className="px-5 shadow-soft-sm"
                >
                  {isBurning ? t('calm.releasing') : t('calm.letGoButton')}
                </Button>
              </div>

              {hasBurned && (
                <div className="p-3 rounded-xl bg-calm-50 dark:bg-calm-950/40 text-center text-xs text-calm-700 dark:text-calm-300 animate-fade-in flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-calm-500" />
                  <span>{t('calm.ventReleasedNotice')}</span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 6. CBT Thought Challenger */}
        {activeTab === 'cbt' && (
          <ThoughtChallenger />
        )}
      </div>

      {/* Safety & Grounding Reminder */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5 pt-4">
        <Heart className="w-3.5 h-3.5 text-rose-400" />
        <span>{t('calm.disclaimerFooter')}</span>
      </div>
    </div>
  );
};

export default CalmPage;
