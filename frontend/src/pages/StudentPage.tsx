import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Calendar,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  HeartHandshake,
  CheckCircle
} from 'lucide-react';
import { StudentService } from '../services/studentService';
import { StudyTimer } from '../components/Wellness/StudyTimer';
import { ExamItem, StudyStats, BurnoutStatus, SmallWinTask } from '../types';

export const StudentPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [burnout, setBurnout] = useState<BurnoutStatus | null>(null);
  const [smallWins, setSmallWins] = useState<SmallWinTask[]>([
    { text: '', completed: false },
    { text: '', completed: false },
    { text: '', completed: false }
  ]);
  const [loading, setLoading] = useState(true);

  // New exam form state
  const [newSubject, setNewSubject] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [addingExam, setAddingExam] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedExams, fetchedStats, fetchedBurnout, fetchedWins] = await Promise.all([
        StudentService.getExams(),
        StudentService.getStudyStats(),
        StudentService.getBurnoutStatus(),
        StudentService.getSmallWins()
      ]);

      setExams(fetchedExams);
      setStats(fetchedStats);
      setBurnout(fetchedBurnout);

      if (fetchedWins && fetchedWins.length > 0) {
        const padded = [...fetchedWins];
        while (padded.length < 3) {
          padded.push({ text: '', completed: false });
        }
        setSmallWins(padded.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDate) return;
    try {
      setAddingExam(true);
      const created = await StudentService.addExam({
        subject: newSubject.trim(),
        date: newDate,
        notes: newNotes.trim()
      });
      setExams((prev) => [...prev, created]);
      setNewSubject('');
      setNewDate('');
      setNewNotes('');
      setShowAddExam(false);
    } catch (err) {
      console.error('Failed to add exam:', err);
    } finally {
      setAddingExam(false);
    }
  };

  const handleDeleteExam = async (id?: string) => {
    if (!id) return;
    try {
      await StudentService.deleteExam(id);
      setExams((prev) => prev.filter((e) => (e._id || e.id) !== id));
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  const handleToggleWin = async (index: number) => {
    const updated = smallWins.map((win, i) => (i === index ? { ...win, completed: !win.completed } : win));
    setSmallWins(updated);
    try {
      await StudentService.saveSmallWins(updated.filter((w) => w.text.trim().length > 0));
    } catch (err) {
      console.error('Failed to save small win toggle:', err);
    }
  };

  const handleWinTextChange = (index: number, text: string) => {
    const updated = smallWins.map((win, i) => (i === index ? { ...win, text } : win));
    setSmallWins(updated);
  };

  const handleBlurSaveWins = async () => {
    try {
      const valid = smallWins.filter((w) => w.text.trim().length > 0);
      await StudentService.saveSmallWins(valid);
    } catch (err) {
      console.error('Failed to save small wins on blur:', err);
    }
  };

  const calculateDaysLeft = (targetDate: string | Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(targetDate);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <GraduationCap className="w-6 h-6" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t('student.title', 'Student Companion')}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
            {t('student.title', 'Academic Balance & Focus')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('student.subtitle', 'Gentle productivity, balanced prep, and stress awareness for exams.')}
          </p>
        </div>

        {stats && (
          <div className="flex items-center gap-3">
            <div className="card px-4 py-2 text-center bg-card">
              <span className="text-xs text-muted-foreground block">{t('student.todayFocus')}</span>
              <span className="text-lg font-bold text-foreground font-mono">{t('student.minutes', { count: stats.todayMinutes })}</span>
            </div>
            <div className="card px-4 py-2 text-center bg-card">
              <span className="text-xs text-muted-foreground block">{t('student.sevenDayTotal')}</span>
              <span className="text-lg font-bold text-foreground font-mono">
                {t('student.hours', { count: Math.round((stats.weekMinutes / 60) * 10) / 10 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Burnout Early Notice (Gentle, Non-diagnostic) */}
      {burnout && burnout.status === 'notice' && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 animate-slide-up">
          <div className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-base">{t('student.pauseReminder')}</h3>
              <p className="text-sm mt-1 text-amber-800 dark:text-amber-300 leading-relaxed">
                {burnout.code === 'BURNOUT_WARNING'
                  ? t('student.burnoutMessage', {
                      highStressDays: burnout.params?.highStressDays ?? burnout.highStressDays,
                      checkedDays: burnout.params?.checkedDays ?? 7,
                      avgSleepHours: burnout.params?.avgSleepHours ?? burnout.avgSleep
                    })
                  : burnout.message || t('student.burnoutDesc')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full font-medium">
                  {t('student.highStressDays', { count: burnout.highStressDays })}
                </span>
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-full font-medium">
                  {t('student.avgSleep', { count: burnout.avgSleep })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Timer & Small Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study Timer Component */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {t('student.studyTimer', 'Study Flow Timer')}
          </h2>
          <StudyTimer onSessionLogged={loadData} />
        </div>

        {/* Small Wins (3 daily micro tasks) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('student.smallWins', 'Today’s 3 Small Wins')}
            </h2>
            <span className="text-xs text-muted-foreground">{t('student.smallWinsSubtitle')}</span>
          </div>

          <div className="card p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('student.smallWinsDesc')}
            </p>

            <div className="space-y-3">
              {smallWins.map((win, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    win.completed
                      ? 'bg-calm-50/60 dark:bg-calm-950/20 border-calm-200 dark:border-calm-800'
                      : 'bg-background border-border hover:border-primary/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleWin(idx)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      win.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-muted-foreground/40 hover:border-primary'
                    }`}
                  >
                    {win.completed && <CheckCircle className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={win.text}
                    placeholder={t('student.taskPlaceholder')}
                    onChange={(e) => handleWinTextChange(idx, e.target.value)}
                    onBlur={handleBlurSaveWins}
                    className={`flex-1 bg-transparent border-0 focus:outline-none text-sm ${
                      win.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={handleBlurSaveWins}
                className="text-xs text-primary hover:underline font-medium"
              >
                {t('student.saveIntentions')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Stress Tracker Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t('student.examTrackerTitle')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('student.examTrackerDesc')}
            </p>
          </div>

          <button
            onClick={() => setShowAddExam(!showAddExam)}
            className="btn btn-outline text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {showAddExam ? t('common.cancel') : t('student.addExam')}
          </button>
        </div>

        {showAddExam && (
          <form
            onSubmit={handleAddExam}
            className="card p-5 bg-card border-primary/20 space-y-4 animate-slide-up"
          >
            <h3 className="text-sm font-semibold text-foreground">{t('student.addExam')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('student.subjectRequired')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('student.dateRequired')}
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input text-sm w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('student.notesSyllabus')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapters 1-5, Formula sheet"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="input text-sm w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddExam(false)}
                className="btn btn-ghost text-xs"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={addingExam}
                className="btn btn-primary text-xs"
              >
                {addingExam ? t('common.save') : t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Exams List */}
        {loading ? (
          <div className="card p-8 text-center text-sm text-muted-foreground">
            {t('student.loadingExams')}
          </div>
        ) : exams.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">{t('student.noUpcomingExams')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('student.noUpcomingExamsDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const daysLeft = calculateDaysLeft(exam.date);
              const isPast = daysLeft < 0;
              const isToday = daysLeft === 0;

              return (
                <div
                  key={exam._id || exam.id}
                  className="card p-5 flex flex-col justify-between border-border hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground text-base leading-snug">
                        {exam.subject}
                      </h4>
                      <button
                        onClick={() => handleDeleteExam(exam._id || exam.id)}
                        className="text-muted-foreground hover:text-danger-500 p-1 rounded-lg transition-colors"
                        title="Delete exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(exam.date).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>

                    {exam.notes && (
                      <p className="text-xs text-muted-foreground/80 mt-2.5 bg-muted/30 p-2 rounded-lg">
                        {exam.notes}
                      </p>
                    )}
                  </div>

                  {/* Countdown Badge */}
                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('student.examTracker', 'Countdown')}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isPast
                          ? 'bg-muted text-muted-foreground'
                          : isToday
                          ? 'bg-primary text-primary-foreground font-bold animate-pulse'
                          : daysLeft <= 3
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                          : 'bg-calm-100 dark:bg-calm-950/60 text-calm-800 dark:text-calm-200'
                      }`}
                    >
                      {isPast
                        ? t('student.taskCompleted', 'Completed')
                        : isToday
                        ? t('student.examDate', 'Exam Today!')
                        : t('student.daysRemaining', { count: daysLeft })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
