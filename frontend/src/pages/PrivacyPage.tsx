import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Download, Trash2, ArrowLeft, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-calm-200 dark:border-calm-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            {t('privacy.sanctuaryBadge')}
          </div>
          <h1 className="text-3xl font-serif font-bold text-calm-900 dark:text-calm-50">
            {t('privacy.title')}
          </h1>
          <p className="text-sm text-calm-600 dark:text-calm-400 mt-1">
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
          <h2 className="text-base font-semibold text-calm-900 dark:text-calm-100">
            {t('privacy.encryptedTitle')}
          </h2>
          <p className="text-xs text-calm-600 dark:text-calm-400 mt-1.5 leading-relaxed">
            {t('privacy.encryptedDesc')}
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <EyeOff className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-calm-900 dark:text-calm-100">
            {t('privacy.zeroTrackingTitle')}
          </h2>
          <p className="text-xs text-calm-600 dark:text-calm-400 mt-1.5 leading-relaxed">
            {t('privacy.zeroTrackingDesc')}
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-calm-900 dark:text-calm-100">
            {t('privacy.deletableTitle')}
          </h2>
          <p className="text-xs text-calm-600 dark:text-calm-400 mt-1.5 leading-relaxed">
            {t('privacy.deletableDesc')}
          </p>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-6">
        {/* Section 1: What is stored */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-calm-900 dark:text-calm-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">1</span>
            {t('privacy.dataStoredTitle')}
          </h2>
          <div className="space-y-3 text-sm text-calm-700 dark:text-calm-300 leading-relaxed">
            <p>
              {t('privacy.storeIntro')}
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs text-calm-600 dark:text-calm-400">
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.storeCreds')}</strong> {t('privacy.storeCredsDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.storeJournal')}</strong> {t('privacy.storeJournalDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.storeWellness')}</strong> {t('privacy.storeWellnessDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.storeCalm')}</strong> {t('privacy.storeCalmDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.storeSafety')}</strong> {t('privacy.storeSafetyDesc')}</li>
            </ul>
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <strong>{t('privacy.ventBoxTip')}</strong> {t('privacy.ventBoxTipDesc')}
            </div>
          </div>
        </Card>

        {/* Section 2: Encryption & Security Details */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-calm-900 dark:text-calm-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">2</span>
            {t('privacy.howEncryptedTitle')}
          </h2>
          <div className="space-y-4 text-sm text-calm-700 dark:text-calm-300 leading-relaxed">
            <p>
              {t('privacy.encryptionIntro')}
            </p>

            {/* Exact honest encryption table */}
            <div className="overflow-x-auto rounded-xl border border-calm-200 dark:border-calm-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-calm-100 dark:bg-calm-900/60 text-calm-700 dark:text-calm-300 border-b border-calm-200 dark:border-calm-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.tableClassification')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.tableFields')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.tableProtection')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-calm-200 dark:divide-calm-800 font-sans">
                  <tr className="bg-white/50 dark:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> {t('privacy.encryptedAtRest')}
                    </td>
                    <td className="py-2.5 px-3 text-calm-600 dark:text-calm-300">
                      {t('privacy.encryptedAtRestDesc')}
                    </td>
                    <td className="py-2.5 px-3 text-calm-500 font-mono text-[11px]">{t('privacy.aesProtocol')}</td>
                  </tr>
                  <tr className="bg-white/50 dark:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400">
                      {t('privacy.notEncrypted')}
                    </td>
                    <td className="py-2.5 px-3 text-calm-600 dark:text-calm-300">
                      {t('privacy.notEncryptedDesc')}
                    </td>
                    <td className="py-2.5 px-3 text-calm-500 text-[11px]">{t('privacy.plaintextNote')}</td>
                  </tr>
                  <tr className="bg-white/50 dark:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-primary-600 dark:text-primary-400">
                      {t('privacy.hashedOneWay')}
                    </td>
                    <td className="py-2.5 px-3 text-calm-600 dark:text-calm-300">
                      {t('privacy.hashedOneWayDesc')}
                    </td>
                    <td className="py-2.5 px-3 text-calm-500 text-[11px]">{t('privacy.irreversibleHash')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-calm-500 dark:text-calm-400 italic">
              {t('privacy.securityNote')}
            </p>
          </div>
        </Card>

        {/* Section 3: AI and External Services */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-calm-900 dark:text-calm-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">3</span>
            {t('privacy.aiTitle')}
          </h2>
          <div className="space-y-3 text-sm text-calm-700 dark:text-calm-300 leading-relaxed">
            <p>
              {t('privacy.aiUsageDesc')}
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs text-calm-600 dark:text-calm-400">
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.onDemandOnlyTitle')}</strong> {t('privacy.onDemandOnlyDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.askDiaryConsentTitle')}</strong> {t('privacy.askDiaryConsentDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.providerNoTrainingTitle')}</strong> {t('privacy.providerNoTrainingDesc')}</li>
              <li><strong className="text-calm-800 dark:text-calm-200">{t('privacy.mediaNoticeTitle')}</strong> {t('privacy.mediaNoticeDesc')}</li>
            </ul>
          </div>
        </Card>

        {/* Section 4: Data Control & Deletion */}
        <Card className="p-6">
          <h2 className="text-lg font-serif font-bold text-calm-900 dark:text-calm-100 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-sans font-bold">4</span>
            {t('privacy.exportDeleteTitle')}
          </h2>
          <div className="space-y-4 text-sm text-calm-700 dark:text-calm-300 leading-relaxed">
            <p>
              {t('privacy.portabilityDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/settings" className="flex-1">
                <div className="p-4 rounded-xl border border-calm-200 dark:border-calm-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors bg-white dark:bg-[#0f172a]">
                  <div className="flex items-center gap-2 text-calm-900 dark:text-calm-100 font-semibold text-xs mb-1">
                    <Download className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    {t('privacy.downloadAllData')}
                  </div>
                  <p className="text-[11px] text-calm-500 dark:text-calm-400">
                    {t('privacy.downloadAllDataDesc')}
                  </p>
                </div>
              </Link>

              <Link to="/settings" className="flex-1">
                <div className="p-4 rounded-xl border border-calm-200 dark:border-calm-700 hover:border-red-400 dark:hover:border-red-500 transition-colors bg-white dark:bg-[#0f172a]">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs mb-1">
                    <Trash2 className="w-4 h-4" />
                    {t('privacy.deleteAccountData')}
                  </div>
                  <p className="text-[11px] text-calm-500 dark:text-calm-400">
                    {t('privacy.deleteAccountDataDesc')}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </Card>

        {/* Section 5: Crisis Safety Policy */}
        <Card className="p-6 bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/40">
          <h2 className="text-lg font-serif font-bold text-calm-900 dark:text-calm-100 mb-3 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            {t('privacy.crisisPolicyTitle')}
          </h2>
          <div className="space-y-2 text-xs text-calm-700 dark:text-calm-300 leading-relaxed">
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
    </div>
  );
};

export default PrivacyPage;
