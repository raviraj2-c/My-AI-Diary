import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QUESTIONNAIRES, Questionnaire, getScoreBand } from '../data/questionnaires';
import { WellnessService } from '../services/wellnessService';
import { SelfCheckResult } from '../types';
import { useSettings } from '../hooks/useSettings';
import { SafetyBanner } from '../components/Wellness/SafetyBanner';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import {
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Shield,
  Calendar,
  AlertCircle
} from 'lucide-react';

const SelfCheckChart = React.lazy(() => import('../components/Wellness/SelfCheckChart'));

export const SelfCheckPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings } = useSettings();
  const isHindi = i18n.language === 'hi';

  const [selectedType, setSelectedType] = useState<'PHQ-9' | 'GAD-7'>('PHQ-9');
  const [isInProgress, setIsInProgress] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completedResult, setCompletedResult] = useState<{
    score: number;
    band: ReturnType<typeof getScoreBand>;
    questionnaire: Questionnaire;
  } | null>(null);

  // Safety trigger state for PHQ-9 item 9
  const [crisisTriggered, setCrisisTriggered] = useState(false);

  // Past results state
  const [pastResults, setPastResults] = useState<SelfCheckResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const questionnaire = QUESTIONNAIRES[selectedType];

  useEffect(() => {
    WellnessService.getSelfChecks(selectedType)
      .then((data) => setPastResults(data))
      .catch(() => {});
  }, [selectedType, completedResult]);

  const startTest = (type: 'PHQ-9' | 'GAD-7') => {
    setSelectedType(type);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCompletedResult(null);
    setCrisisTriggered(false);
    setIsInProgress(true);
  };

  const handleSelectOption = (optionScore: number) => {
    const updatedAnswers = [...answers, optionScore];
    setAnswers(updatedAnswers);

    // CRUCIAL SAFETY: PHQ-9 Item 9 (index 8) check
    if (selectedType === 'PHQ-9' && currentQuestionIndex === 8 && optionScore > 0) {
      setCrisisTriggered(true);
    }

    if (currentQuestionIndex < questionnaire.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Calculate final score
      const totalScore = updatedAnswers.reduce((sum, s) => sum + s, 0);
      const band = getScoreBand(selectedType, totalScore);
      setCompletedResult({
        score: totalScore,
        band,
        questionnaire
      });
      setIsInProgress(false);
    }
  };

  const handleSaveResult = async () => {
    if (!completedResult) return;
    try {
      await WellnessService.saveSelfCheck({
        type: selectedType,
        score: completedResult.score,
        severity: completedResult.band.label,
        answers,
        date: new Date()
      });
      toast.success('Self-check result saved to your private trends.');
      setCompletedResult(null);
      setIsInProgress(false);
    } catch {
      toast.error('Failed to save self-check result.');
    }
  };

  const handleDiscardResult = () => {
    setCompletedResult(null);
    setIsInProgress(false);
    toast.info('Result was discarded without saving.');
  };

  const progressPercent = isInProgress
    ? ((currentQuestionIndex + 1) / questionnaire.questions.length) * 100
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* High Crisis Overlay if PHQ-9 Item 9 was answered > 0 */}
      {crisisTriggered && (
        <SafetyBanner
          level="high"
          country={settings.country}
          trustedContact={settings.trustedContact}
          onDismiss={() => setCrisisTriggered(false)}
        />
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (isInProgress) {
              if (window.confirm('Are you sure you want to exit? Your answers will not be saved.')) {
                setIsInProgress(false);
              }
            } else {
              navigate('/');
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isInProgress ? 'Exit Questionnaire' : 'Back to Dashboard'}</span>
        </button>

        {!isInProgress && (
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {showHistory ? 'Take Questionnaire' : 'Past Self-Checks History'}
          </button>
        )}
      </div>

      {/* Header */}
      {!isInProgress && !completedResult && (
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-semibold">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>{t('selfcheck.title', 'Gentle Reflection & Screening')}</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">
            {t('selfcheck.title', 'Wellness Questionnaires')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-serif max-w-lg mx-auto leading-relaxed">
            {t('selfcheck.subtitle', 'Standard, scientifically validated screening tools to help you identify how your mind and body are holding up.')}
          </p>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 text-[11px] text-sky-700 dark:text-sky-200 max-w-lg mx-auto">
            {t('selfcheck.clinicalReviewNote', 'Clinical Notice: Translated text is for reflection and needs clinical review.')}
          </div>
        </div>
      )}

      {/* History View */}
      {showHistory && !isInProgress && !completedResult && (
        <Card className="p-6 border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedType('PHQ-9')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  selectedType === 'PHQ-9'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('selfCheck.phq9Tab')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('GAD-7')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  selectedType === 'GAD-7'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('selfCheck.gad7Tab')}
              </button>
            </div>
            <span className="text-xs text-gray-400">{t('selfCheck.recordsCount', { count: pastResults.length })}</span>
          </div>

          {/* Lazy-loaded trend chart */}
          <React.Suspense
            fallback={
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">
                {t('selfCheck.loadingTrend')}
              </div>
            }
          >
            <SelfCheckChart type={selectedType} results={pastResults} />
          </React.Suspense>

          {pastResults.length > 0 ? (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('selfCheck.pastAssessments')}
              </h4>
              {pastResults.map((r, i) => (
                <div
                  key={r.id || i}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Intl.DateTimeFormat(isHindi ? 'hi-IN' : 'en-US').format(new Date(r.date))}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">• {r.severity}</span>
                  </div>
                  <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                    {t('selfCheck.scoreLabel', { score: r.score })}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      )}

      {/* Questionnaire Selection Cards (Idle State) */}
      {!isInProgress && !completedResult && !showHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['PHQ-9', 'GAD-7'] as const).map((typeKey) => {
            const q = QUESTIONNAIRES[typeKey];
            return (
              <Card
                key={typeKey}
                className="p-6 border-border dark:border-gray-800 flex flex-col justify-between space-y-4 hover:shadow-soft-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    {t('selfCheck.questionsCount', { name: q.shortName, count: q.questions.length })}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-gray-100">
                    {q.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-serif">
                    {q.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => startTest(typeKey)}
                    className="w-full"
                  >
                    {t('selfCheck.startCheck', { name: q.shortName })}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* In-Progress: One Question Per Screen */}
      {/* TODO: Replace with clinically validated Hindi version of PHQ-9 and GAD-7 */}
      {isInProgress && (
        <Card className="p-6 sm:p-10 border-border dark:border-gray-800 space-y-6">
          {/* Clinical Review Notice Banner */}
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 text-[11px] text-sky-700 dark:text-sky-200">
            {t('selfcheck.clinicalReviewNote', 'Clinical Notice: Translated text is for reflection and needs clinical review.')}
          </div>

          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {questionnaire.shortName} • {t('selfcheck.questionProgress', { current: currentQuestionIndex + 1, total: questionnaire.questions.length })}
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Timeframe Instruction */}
          <p className="text-xs font-serif italic text-gray-400">
            "{isHindi && questionnaire.timeframeHi ? questionnaire.timeframeHi : questionnaire.timeframe}"
          </p>

          {/* Question Text */}
          <div className="py-2">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 dark:text-gray-100 leading-snug">
              {isHindi && questionnaire.questions[currentQuestionIndex].textHi
                ? questionnaire.questions[currentQuestionIndex].textHi
                : questionnaire.questions[currentQuestionIndex].text}
            </h2>
          </div>

          {/* Options (0 to 3 scale) */}
          <div className="space-y-2.5 pt-2">
            {questionnaire.options.map((opt) => (
              <button
                key={opt.score}
                type="button"
                onClick={() => handleSelectOption(opt.score)}
                className="w-full p-4 text-left rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50/40 dark:hover:bg-primary-950/20 transition-all duration-150 flex items-center justify-between group active:scale-[0.99]"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  {isHindi && opt.textHi ? opt.textHi : opt.text}
                </span>
                <span className="text-xs font-mono font-semibold text-gray-400 group-hover:text-primary-600">
                  +{opt.score}
                </span>
              </button>
            ))}
          </div>

          {/* Stop / Cancel Option */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>{t('selfCheck.canPause')}</span>
            <button
              type="button"
              onClick={() => setIsInProgress(false)}
              className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
            >
              {t('selfCheck.exitWithoutSaving')}
            </button>
          </div>
        </Card>
      )}

      {/* Completed Results Screen */}
      {completedResult && (
        <Card className="p-6 sm:p-10 border-border dark:border-gray-800 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {completedResult.questionnaire.shortName} {t('selfcheck.scoreLabel', 'Screening Result')}
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                {completedResult.score}
              </span>
              <span className="text-sm text-gray-400">
                / {completedResult.questionnaire.questions.length * 3}
              </span>
            </div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-1">
              <span className={`px-3 py-1 rounded-full ${completedResult.band.color}`}>
                {isHindi && completedResult.band.labelHi ? completedResult.band.labelHi : completedResult.band.label}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60 space-y-2 text-xs">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-serif">
              {isHindi && completedResult.band.descriptionHi ? completedResult.band.descriptionHi : completedResult.band.description}
            </p>
            <p className="text-primary-700 dark:text-primary-300 font-semibold">
              {t('selfcheck.clinicalRecommendation', 'Gentle Guidance')}: {isHindi && completedResult.band.recommendationHi ? completedResult.band.recommendationHi : completedResult.band.recommendation}
            </p>
          </div>

          {/* CRITICAL Clinical Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 flex items-start gap-3 text-xs text-ink-900 dark:text-sky-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-sky-700 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {t('selfcheck.clinicalNote', 'This is a screening, not a diagnosis. Please talk to a doctor or counselor.')}
              </p>
              <p className="text-[11px] leading-relaxed text-sky-700 dark:text-sky-200">
                {t('selfcheck.clinicalReviewNote', 'Clinical Notice: Translated text is for reflection and needs clinical review.')}
              </p>
            </div>
          </div>

          {/* Actions: Save or Don't Save */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardResult}
              className="w-full sm:w-auto"
            >
              {t('selfcheck.discardResult', "Don't Save Result")}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startTest(selectedType)}
              >
                {t('common.retry', 'Retake')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveResult}
                className="w-full sm:w-auto"
              >
                {t('selfcheck.saveResult', 'Save to Private Insights')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Scientific Citation & Disclaimer */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60 text-center space-y-1 text-[11px] text-gray-400">
        <p className="italic">
          {t('selfCheck.sourceCitation', { citation: questionnaire.citation })}
        </p>
        <div className="flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-gray-400" />
          <span>{t('selfCheck.disclaimerFooter')}</span>
        </div>
      </div>
    </div>
  );
};
