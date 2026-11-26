import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Coffee, BookOpen, CheckCircle2 } from 'lucide-react';
import { StudentService } from '../../services/studentService';

interface StudyTimerProps {
  onSessionLogged?: () => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ onSessionLogged }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [logging, setLogging] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    if (mode === 'study') {
      setLogging(true);
      try {
        await StudentService.logStudySession(25, 'pomodoro-25');
        setCompletedSessions((prev) => prev + 1);
        if (onSessionLogged) onSessionLogged();
      } catch (err) {
        console.error('Failed to log study session:', err);
      } finally {
        setLogging(false);
      }
      setJustFinished(true);
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('study');
      setTimeLeft(25 * 60);
      setJustFinished(false);
    }
  }, [mode, onSessionLogged]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, timeLeft, handleComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    setJustFinished(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
    setJustFinished(false);
  };

  const switchMode = (newMode: 'study' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? 25 * 60 : 5 * 60);
    setJustFinished(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'study' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="card p-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 bg-muted/30 p-1.5 rounded-xl border border-border">
        <button
          onClick={() => switchMode('study')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'study'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 text-primary" />
          {t('student.focusTime', 'Focus (25m)')}
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'break'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Coffee className="w-4 h-4 text-muted dark:text-muted" />
          {t('student.breakTime', 'Break (5m)')}
        </button>
      </div>

      {/* Circular Progress & Display */}
      <div className="relative w-48 h-48 flex items-center justify-center my-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-muted/40"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className={`${
              mode === 'study' ? 'stroke-primary' : 'stroke-muted'
            } transition-all duration-500`}
            strokeWidth="8"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-mono font-bold tracking-tight text-foreground">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            {mode === 'study' ? 'Deep Work' : 'Gentle Pause'}
          </span>
        </div>
      </div>

      {/* Break suggestion alert */}
      {mode === 'break' && (
        <div className="mb-4 text-center max-w-xs text-xs bg-sky-50 dark:bg-ink-950 border border-border dark:border-ink-800 text-ink-800 dark:text-border p-3 rounded-xl animate-fade-in">
          <p className="font-medium mb-1">{t('studyTimer.timeToUnwind')}</p>
          <p>{t('studyTimer.unwindInstructions')}</p>
        </div>
      )}

      {justFinished && mode === 'break' && (
        <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-400 mb-4 font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {t('studyTimer.sessionSaved')}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTimer}
          disabled={logging}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all ${
            isRunning
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              {t('student.pauseFocus')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {t('student.startFocus')}
            </>
          )}
        </button>

        <button
          onClick={resetTimer}
          className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          title={t('student.resetTimer')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {completedSessions > 0 && (
        <p className="text-xs text-muted-foreground mt-4">
          {t('studyTimer.focusCompleted', { count: completedSessions })}
        </p>
      )}
    </div>
  );
};
