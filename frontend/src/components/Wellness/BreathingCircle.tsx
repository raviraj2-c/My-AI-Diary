import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

export interface BreathingCircleProps {
  onSessionComplete?: (type: string, durationMinutes: number, technique: string) => void;
}

interface Technique {
  id: string;
  name: string;
  description: string;
  phases: Array<{ name: string; duration: number }>;
}

const TECHNIQUES: Technique[] = [
  {
    id: 'box',
    name: 'Box Breathing (4-4-4-4)',
    description: 'Grounding rhythm used by first responders to stabilize heart rate and panic.',
    phases: [
      { name: 'Inhale slowly...', duration: 4 },
      { name: 'Gently hold...', duration: 4 },
      { name: 'Exhale completely...', duration: 4 },
      { name: 'Rest empty...', duration: 4 }
    ]
  },
  {
    id: '478',
    name: '4-7-8 Deep Calm',
    description: 'Natural tranquilizer for the nervous system, great for sleep and racing minds.',
    phases: [
      { name: 'Inhale through nose...', duration: 4 },
      { name: 'Hold gently...', duration: 7 },
      { name: 'Exhale fully through mouth...', duration: 8 }
    ]
  },
  {
    id: 'simple',
    name: 'Simple Flow (4-6)',
    description: 'Extended exhale activates the parasympathetic relaxation response effortlessly.',
    phases: [
      { name: 'Inhale gently...', duration: 4 },
      { name: 'Exhale slowly...', duration: 6 }
    ]
  }
];

export const BreathingCircle: React.FC<BreathingCircleProps> = ({ onSessionComplete }) => {
  const { t } = useTranslation();
  const [selectedTechniqueId, setSelectedTechniqueId] = useState('box');
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(2);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState(0);
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [completed, setCompleted] = useState(false);

  const technique = TECHNIQUES.find((t) => t.id === selectedTechniqueId) || TECHNIQUES[0];
  const currentPhase = technique.phases[phaseIndex] || technique.phases[0];

  // Prefers-reduced-motion check
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const triggerHaptic = useCallback(() => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch {
        // ignore
      }
    }
  }, [hapticsEnabled]);

  const resetSession = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsInPhase(0);
    setElapsedTotalSeconds(0);
    setCompleted(false);
  };

  const handleTechniqueChange = (id: string) => {
    setSelectedTechniqueId(id);
    resetSession();
  };

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setElapsedTotalSeconds((prev) => {
        const nextTotal = prev + 1;
        const targetTotalSeconds = sessionMinutes * 60;

        if (nextTotal >= targetTotalSeconds) {
          setIsActive(false);
          setCompleted(true);
          triggerHaptic();
          if (onSessionComplete) {
            onSessionComplete('breathing', sessionMinutes, technique.name);
          }
        }
        return nextTotal;
      });

      setSecondsInPhase((prev) => {
        const next = prev + 1;
        if (next >= currentPhase.duration) {
          setPhaseIndex((p) => {
            const nextP = (p + 1) % technique.phases.length;
            triggerHaptic();
            return nextP;
          });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, currentPhase, technique, sessionMinutes, triggerHaptic, onSessionComplete]);

  // Visual scale calculation
  const isExpanding = currentPhase.name.toLowerCase().includes('inhale');
  const isHolding = currentPhase.name.toLowerCase().includes('hold') || currentPhase.name.toLowerCase().includes('rest');

  let scaleClass = 'scale-100';
  if (!reducedMotion) {
    if (isExpanding) {
      scaleClass = 'scale-125 transition-transform duration-[4000ms] ease-out';
    } else if (isHolding) {
      scaleClass = 'scale-120 transition-transform duration-700 ease-in-out';
    } else {
      scaleClass = 'scale-75 transition-transform duration-[6000ms] ease-in';
    }
  }

  const phaseProgressPct = ((secondsInPhase + 1) / currentPhase.duration) * 100;
  const remainingPhaseSeconds = currentPhase.duration - secondsInPhase;

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center">
      {/* Technique Switcher */}
      <div className="flex flex-wrap justify-center gap-2">
        {TECHNIQUES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTechniqueChange(t.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedTechniqueId === t.id
                ? 'bg-primary-600 text-white shadow-soft-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 font-serif max-w-sm mx-auto">
        {technique.description}
      </p>

      {/* Main Animated Circle Container */}
      <Card className="p-8 sm:p-12 border-border dark:border-gray-800 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden bg-surface  to-white dark:from-[#131d31] dark:to-[#0f172a]">
        {/* Animated Expanding Rings */}
        <div className="relative flex items-center justify-center w-64 h-64">
          <div
            className={`absolute w-48 h-48 rounded-full bg-primary-100/40 dark:bg-primary-950/30 blur-2xl transition-all duration-1000 ${
              isActive && isExpanding ? 'scale-150' : 'scale-90'
            }`}
          />

          <div
            className={`w-44 h-44 rounded-full border-2 border-primary-300/60 dark:border-primary-700/60 flex flex-col items-center justify-center p-4 bg-white/80 dark:bg-[#1a253c]/90 shadow-soft-lg transform ${scaleClass}`}
          >
            <span className="text-sm sm:text-base font-serif font-bold text-gray-800 dark:text-gray-100 tracking-wide">
              {isActive ? currentPhase.name : completed ? t('calm.wellDone') : t('calm.ready')}
            </span>
            {isActive && (
              <span className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400 mt-1">
                {t('common.secondsShort', { count: remainingPhaseSeconds })}
              </span>
            )}
          </div>
        </div>

        {/* Phase progress line */}
        {isActive && (
          <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-6">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${phaseProgressPct}%` }}
            />
          </div>
        )}

        {/* Completion Message */}
        {completed && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-400 font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('calm.breathingLogged')}</span>
          </div>
        )}
      </Card>

      {/* Session Progress / Time Remaining */}
      <div className="text-center text-xs font-mono text-gray-500 dark:text-gray-400">
        {t('calm.timeRemaining')}: {Math.floor(Math.max(0, sessionMinutes * 60 - elapsedTotalSeconds) / 60)}:
        {String(Math.max(0, sessionMinutes * 60 - elapsedTotalSeconds) % 60).padStart(2, '0')}
      </div>

      {/* Session Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Duration Select */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
          {[1, 2, 5].map((m) => (
            <button
              key={m}
              type="button"
              disabled={isActive}
              onClick={() => {
                setSessionMinutes(m);
                resetSession();
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                sessionMinutes === m
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('common.minutesShort', { count: m })}
            </button>
          ))}
        </div>

        {/* Play / Pause Button */}
        <Button
          variant="primary"
          size="md"
          icon={isActive ? Pause : Play}
          onClick={() => {
            if (completed) resetSession();
            setIsActive(!isActive);
          }}
          className="px-6"
        >
          {isActive ? t('calm.pauseBreathing', 'Pause') : completed ? t('sos.resetGrounding', 'Restart') : t('calm.startBreathing', 'Begin Breathing')}
        </Button>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          icon={RotateCcw}
          onClick={resetSession}
          aria-label="Reset session"
        />

        {/* Haptics toggle if supported */}
        {typeof navigator !== 'undefined' && 'vibrate' in navigator && (
          <button
            type="button"
            onClick={() => setHapticsEnabled(!hapticsEnabled)}
            title={hapticsEnabled ? 'Haptic feedback on' : 'Haptic feedback off'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              hapticsEnabled
                ? 'border-primary-300 bg-primary-50 text-primary-700 dark:bg-primary-950/40'
                : 'border-gray-200 dark:border-gray-700 text-gray-400'
            }`}
          >
            {hapticsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
