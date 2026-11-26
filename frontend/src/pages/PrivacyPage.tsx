import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Lock, EyeOff, Download, Trash2, ArrowLeft, HeartHandshake, CheckCircle2, ChevronDown } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();
  const [showMore, setShowMore] = React.useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border dark:border-ink-800 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
            {t('privacy.title')}
          </h1>
          <p className="text-sm text-muted mt-0.5 line-clamp-2">
            {t('privacy.subtitle')}
          </p>
        </div>

        <Link to="/settings">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            {t('privacy.backToSettings')}
          </Button>
        </Link>
      </div>

      {/* Core Commitments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-primary-500">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-ink-900 dark:text-sky-100">
            {t('privacy.encryptedTitle')}
          </h2>
          <p className="text-xs text-muted dark:text-muted mt-1.5 leading-relaxed">
            {t('privacy.encryptedDesc')}
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-500">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-400 flex items-center justify-center mb-3">
            <EyeOff className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-ink-900 dark:text-sky-100">
            {t('privacy.zeroTrackingTitle')}
          </h2>
          <p className="text-xs text-muted dark:text-muted mt-1.5 leading-relaxed">
            {t('privacy.zeroTrackingDesc')}
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-sky-500">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-ink-900 text-sky-700 dark:text-sky-400 flex items-center justify-center mb-3">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-ink-900 dark:text-sky-100">
            {t('privacy.deletableTitle')}
          </h2>
          <p className="text-xs text-muted dark:text-muted mt-1.5 leading-relaxed">
            {t('privacy.deletableDesc')}
          </p>
        </Card>
      </div>

      {/* Read more accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          {t('privacy.readMore', { defaultValue: 'Read more' })}
          <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Detailed Sections */}
      {showMore && (
      <div className="space-y-6">
        {/* Section 1: What is stored */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">1</span>
            {t('privacy.dataStoredTitle')}
          </h2>
          <div className="space-y-3 text-sm text-text dark:text-sky-200 leading-relaxed">
            <p>
              {t('privacy.storeIntro')}
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs text-muted dark:text-muted">
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.storeCreds')}</strong> {t('privacy.storeCredsDesc')}</li>
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.storeJournal')}</strong> {t('privacy.storeJournalDesc')}</li>
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.storeWellness')}</strong> {t('privacy.storeWellnessDesc')}</li>
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.storeCalm')}</strong> {t('privacy.storeCalmDesc')}</li>
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.storeSafety')}</strong> {t('privacy.storeSafetyDesc')}</li>
            </ul>
            <div className="mt-3 p-3 bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 rounded-xl text-xs text-sky-700 dark:text-sky-200">
              <strong>{t('privacy.ventBoxTip')}</strong> {t('privacy.ventBoxTipDesc')}
            </div>
          </div>
        </Card>

        {/* Section 2: Encryption & Security Details */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">2</span>
            {t('privacy.howEncryptedTitle')}
          </h2>
          <div className="space-y-4 text-sm text-text dark:text-sky-200 leading-relaxed">
            <p>
              {t('privacy.encryptionIntro')}
            </p>

            {/* Exact honest encryption table */}
            <div className="overflow-x-auto rounded-xl border border-border dark:border-ink-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-100 dark:bg-ink-900 text-text dark:text-sky-200 border-b border-border dark:border-ink-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.tableClassification')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.tableFields')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.tableProtection')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-ink-800 font-sans">
                  <tr className="bg-white/50 dark:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> {t('privacy.encryptedAtRest')}
                    </td>
                    <td className="py-2.5 px-3 text-muted dark:text-sky-200">
                      {t('privacy.encryptedAtRestDesc')}
                    </td>
                    <td className="py-2.5 px-3 text-muted font-mono text-[11px]">{t('privacy.aesProtocol')}</td>
                  </tr>
                  <tr className="bg-white/50 dark:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-sky-700 dark:text-sky-400">
                      {t('privacy.notEncrypted')}
                    </td>
                    <td className="py-2.5 px-3 text-muted dark:text-sky-200">
                      {t('privacy.notEncryptedDesc')}
                    </td>
                    <td className="py-2.5 px-3 text-muted text-[11px]">{t('privacy.plaintextNote')}</td>
                  </tr>
                  <tr className="bg-white/50 dark:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-primary-600 dark:text-primary-400">
                      {t('privacy.hashedOneWay')}
                    </td>
                    <td className="py-2.5 px-3 text-muted dark:text-sky-200">
                      {t('privacy.hashedOneWayDesc')}
                    </td>
                    <td className="py-2.5 px-3 text-muted text-[11px]">{t('privacy.irreversibleHash')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted dark:text-muted italic">
              {t('privacy.securityNote')}
            </p>
          </div>
        </Card>

        {/* Section 3: AI and External Services */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">3</span>
            {t('privacy.aiTitle')}
          </h2>
          <div className="space-y-3 text-sm text-text dark:text-sky-200 leading-relaxed">
            <p>
              {t('privacy.aiUsageDesc')}
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs text-muted dark:text-muted">
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.onDemandOnlyTitle')}</strong> {t('privacy.onDemandOnlyDesc')}</li>
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.askDiaryConsentTitle')}</strong> {t('privacy.askDiaryConsentDesc')}</li>
              <li>
                <strong className="text-ink-800 dark:text-border">{t('privacy.providerNoTrainingTitle')}</strong> {t('privacy.providerNoTrainingDesc')}{' '}
                <a
                  href="https://ai.google.dev/gemini-api/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary-600 dark:text-primary-400 hover:text-primary-700"
                >
                  {t('privacy.geminiTermsLink')}
                </a>
              </li>
              <li><strong className="text-ink-800 dark:text-border">{t('privacy.mediaNoticeTitle')}</strong> {t('privacy.mediaNoticeDesc')}</li>
            </ul>
          </div>
        </Card>

        {/* Section 4: Data Control & Deletion */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">4</span>
            {t('privacy.exportDeleteTitle')}
          </h2>
          <div className="space-y-4 text-sm text-text dark:text-sky-200 leading-relaxed">
            <p>
              {t('privacy.portabilityDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/settings" className="flex-1">
                <div className="p-4 rounded-xl border border-border dark:border-text hover:border-primary-400 dark:hover:border-primary-500 transition-colors bg-white dark:bg-[#0f172a]">
                  <div className="flex items-center gap-2 text-ink-900 dark:text-sky-100 font-semibold text-xs mb-1">
                    <Download className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    {t('privacy.downloadAllData')}
                  </div>
                  <p className="text-[11px] text-muted dark:text-muted">
                    {t('privacy.downloadAllDataDesc')}
                  </p>
                </div>
              </Link>

              <Link to="/settings" className="flex-1">
                <div className="p-4 rounded-xl border border-border dark:border-text hover:border-red-400 dark:hover:border-red-500 transition-colors bg-white dark:bg-[#0f172a]">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs mb-1">
                    <Trash2 className="w-4 h-4" />
                    {t('privacy.deleteAccountData')}
                  </div>
                  <p className="text-[11px] text-muted dark:text-muted">
                    {t('privacy.deleteAccountDataDesc')}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </Card>

        {/* Section 5: Crisis Safety Policy */}
        <Card className="p-6 bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/40">
          <h2 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100 mb-3 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            {t('privacy.crisisPolicyTitle')}
          </h2>
          <div className="space-y-2 text-xs text-text dark:text-sky-200 leading-relaxed">
            <p>
              {t('privacy.crisisPolicyDesc')}
            </p>
            <div className="space-y-1.5 pl-3 border-l-2 border-primary-300 dark:border-primary-700">
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                {t('privacy.neverStoreKeywords')}
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                {t('privacy.neverContactPolice')}
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
                {t('privacy.compassionateAccess')}
              </p>
            </div>
          </div>
        </Card>
      </div>
      )}
    </div>
  );
};

export default PrivacyPage;
