import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { useSettings } from '../../hooks/useSettings';
import { AIService } from '../../services/aiService';
import { ThoughtRecord } from '../../types';
import {
  BrainCircuit,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Trash2,
  Calendar
} from 'lucide-react';

const COMMON_EMOTIONS = [
  'Anxious', 'Overwhelmed', 'Sad', 'Angry', 'Guilty', 'Ashamed', 'Hopeless', 'Frustrated'
];

export const ThoughtChallenger: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [emotion, setEmotion] = useState('Anxious');
  const [initialIntensity, setInitialIntensity] = useState(70);
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [balancedThought, setBalancedThought] = useState('');
  const [finalIntensity, setFinalIntensity] = useState(40);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);

  // History state
  const [history, setHistory] = useState<ThoughtRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    AIService.getThoughtRecords()
      .then(setHistory)
      .catch(() => {});
  }, []);

  const handleAiReframing = async () => {
    if (!thought.trim()) {
      toast.warning(t('thought.toastDescribeThought'));
      return;
    }
    if (!settings.allowAIFeatures) {
      toast.info(t('thought.toastAiDisabled'));
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await AIService.challengeThought({
        situation,
        thought,
        evidenceFor,
        evidenceAgainst
      });
      setBalancedThought(res.balancedThought);
      setAiAssisted(true);
      toast.success(t('thought.toastSuggested'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error');
      toast.error(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!situation.trim() || !thought.trim()) {
      toast.error(t('common.error'));
      return;
    }

    setIsSaving(true);
    try {
      const record = await AIService.saveThoughtRecord({
        situation,
        thought,
        emotion,
        initialIntensity,
        evidenceFor,
        evidenceAgainst,
        balancedThought,
        finalIntensity,
        aiAssisted
      });
      setHistory(prev => [record, ...prev]);
      toast.success(t('thought.toastSaved'));
      resetForm();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await AIService.deleteThoughtRecord(id);
      setHistory(prev => prev.filter(r => (r.id || r._id) !== id));
      toast.info(t('thought.toastRemoved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const resetForm = () => {
    setStep(1);
    setSituation('');
    setThought('');
    setEmotion('Anxious');
    setInitialIntensity(70);
    setEvidenceFor('');
    setEvidenceAgainst('');
    setBalancedThought('');
    setFinalIntensity(40);
    setAiAssisted(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            {t('calm.thoughtChallengerTitle')}
          </div>
          <h2 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">
            {t('calm.thoughtChallengerTitle')}
          </h2>
          <p className="text-xs text-calm-500 dark:text-calm-400">
            {t('calm.thoughtChallengerDesc')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? t('thought.newExercise') : t('thought.historyCount', { count: history.length })}
        </Button>
      </div>

      {showHistory ? (
        /* History View */
        <div className="space-y-4 animate-fade-in">
          {history.length === 0 ? (
            <Card className="p-8 text-center text-xs text-calm-400">
              {t('thought.noRecords')}
            </Card>
          ) : (
            history.map((record) => (
              <Card key={record.id || record._id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-calm-100 dark:border-calm-800 pb-2">
                  <div>
                    <span className="text-xs font-semibold text-calm-800 dark:text-calm-200">
                      {t('thought.intensityShift', { emotion: record.emotion, initial: record.initialIntensity, final: record.finalIntensity })}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-calm-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {record.createdAt
                        ? new Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-US').format(new Date(record.createdAt))
                        : t('thought.recent')}
                      {record.aiAssisted && (
                        <span className="ml-1 px-1.5 py-0.2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 rounded text-[10px]">
                          {t('thought.aiAssisted')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id || record._id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title={t('thought.deleteRecord')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs space-y-2 text-calm-700 dark:text-calm-300">
                  <p><strong>{t('thought.situationLabel')}</strong> {record.situation}</p>
                  <p className="text-amber-800 dark:text-amber-400"><strong>{t('thought.automaticThoughtLabel')}</strong> {`"${record.thought}"`}</p>
                  {record.balancedThought && (
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-900 dark:text-emerald-300">
                      <strong>{t('thought.balancedPerspectiveLabel')}</strong> {record.balancedThought}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Guided Step-by-Step Exercise */
        <Card className="p-6 sm:p-8 animate-fade-in space-y-6">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-calm-500 dark:text-calm-400">
              <span>{t('thought.stepCount', { current: step })}</span>
              <span>{step === 1 ? t('thought.step1Name') : step === 2 ? t('thought.step2Name') : step === 3 ? t('thought.step3Name') : step === 4 ? t('thought.step4Name') : t('thought.step5Name')}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Situation */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-calm-900 dark:text-calm-100">
                  {t('thought.step1Question')}
                </h3>
                <p className="text-xs text-calm-500 mt-1">
                  {t('thought.step1Hint')}
                </p>
              </div>
              <textarea
                rows={3}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder={t('thought.step1Placeholder')}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          )}

          {/* Step 2: Automatic Thought & Emotion */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-calm-900 dark:text-calm-100">
                  {t('thought.step2Question')}
                </h3>
                <p className="text-xs text-calm-500 mt-1">
                  {t('thought.step2Hint')}
                </p>
              </div>
              <textarea
                rows={3}
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder={t('thought.step2Placeholder')}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-calm-700 dark:text-calm-300">
                  {t('thought.primaryEmotion')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_EMOTIONS.map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setEmotion(emo)}
                      className={`px-3 py-1 rounded-xl text-xs transition-colors ${
                        emotion === emo
                          ? 'bg-primary-600 text-white font-medium'
                          : 'bg-gray-100 dark:bg-gray-800 text-calm-600 dark:text-calm-300 hover:bg-gray-200'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-calm-600 dark:text-calm-400 mb-1">
                  <span>{t('thought.howIntense')}</span>
                  <span className="font-semibold text-primary-600">{initialIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={initialIntensity}
                  onChange={(e) => setInitialIntensity(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
              </div>
            </div>
          )}

          {/* Step 3: Evidence For & Against */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-calm-900 dark:text-calm-100">
                  {t('thought.step3Question')}
                </h3>
                <p className="text-xs text-calm-500 mt-1">
                  {t('thought.step3Hint')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-calm-700 dark:text-calm-300 mb-1">
                  {t('thought.evidenceForLabel')}
                </label>
                <textarea
                  rows={2}
                  value={evidenceFor}
                  onChange={(e) => setEvidenceFor(e.target.value)}
                  placeholder={t('thought.evidenceForPlaceholder')}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-calm-700 dark:text-calm-300 mb-1">
                  {t('thought.evidenceAgainstLabel')}
                </label>
                <textarea
                  rows={2}
                  value={evidenceAgainst}
                  onChange={(e) => setEvidenceAgainst(e.target.value)}
                  placeholder={t('thought.evidenceAgainstPlaceholder')}
                  className="w-full px-3.5 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 4: Balanced Thought */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-calm-900 dark:text-calm-100">
                    {t('thought.step4Question')}
                  </h3>
                  <p className="text-xs text-calm-500 mt-1">
                    {t('thought.step4Hint')}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  loading={isAiLoading}
                  onClick={handleAiReframing}
                  icon={<Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                >
                  {t('thought.aiSuggestion')}
                </Button>
              </div>

              <textarea
                rows={4}
                value={balancedThought}
                onChange={(e) => setBalancedThought(e.target.value)}
                placeholder={t('thought.step4Placeholder')}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />

              {!settings.allowAIFeatures && (
                <p className="text-[11px] text-calm-400">
                  {t('thought.aiTip')}
                </p>
              )}
            </div>
          )}

          {/* Step 5: Feeling Now */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-calm-900 dark:text-calm-100">
                  {t('thought.step5Question')}
                </h3>
                <p className="text-xs text-calm-500 mt-1">
                  {t('thought.step5Hint')}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs space-y-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-300 block">
                  {t('thought.yourBalancedThought')}
                </span>
                <p className="text-emerald-800 dark:text-emerald-200 italic leading-relaxed">
                  {`"${balancedThought || t('thought.defaultBalancedThought')}"`}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-calm-600 dark:text-calm-400 mb-1">
                  <span>{t('thought.currentIntensity', { emotion })}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{finalIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={finalIntensity}
                  onChange={(e) => setFinalIntensity(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-calm-400 mt-1">
                  <span>{t('thought.startedAt', { intensity: initialIntensity })}</span>
                  <span>{initialIntensity > finalIntensity ? t('thought.reducedBy', { diff: initialIntensity - finalIntensity }) : t('thought.mindfulObservation')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-calm-100 dark:border-calm-800">
            {step > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                {t('thought.prevStep')}
              </Button>
            ) : <div />}

            {step < 5 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (step === 1 && !situation.trim()) {
                    toast.warning(t('common.error'));
                    return;
                  }
                  if (step === 2 && !thought.trim()) {
                    toast.warning(t('thought.toastDescribeThought'));
                    return;
                  }
                  setStep(step + 1);
                }}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {t('thought.nextStep')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={isSaving}
                onClick={handleSave}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {t('thought.saveRecord')}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ThoughtChallenger;
