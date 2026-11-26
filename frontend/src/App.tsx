import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DiaryProvider } from './contexts/DiaryContext';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/common/Layout';
import { Spinner } from './components/common/Spinner';
import { AppLockScreen } from './components/common/AppLockScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SOSButton } from './components/common/SOSButton';
import { API_CONFIG } from './config/api';

// Eagerly loaded primary auth page
import { AuthPage } from './pages/AuthPage';

// Lazy-loaded pages for performance & code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DiaryPage = lazy(() => import('./pages/DiaryPage').then(m => ({ default: m.DiaryPage })));
const JournalPage = lazy(() => import('./pages/JournalPage').then(m => ({ default: m.JournalPage })));
const MoodPage = lazy(() => import('./pages/MoodPage').then(m => ({ default: m.MoodPage })));
const TalkPage = lazy(() => import('./pages/TalkPage').then(m => ({ default: m.TalkPage })));
const ExportPage = lazy(() => import('./pages/ExportPage').then(m => ({ default: m.ExportPage })));
const StoriesPage = lazy(() => import('./pages/StoriesPage').then(m => ({ default: m.StoriesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CalmPage = lazy(() => import('./pages/CalmPage').then(m => ({ default: m.CalmPage })));
const SelfCheckPage = lazy(() => import('./pages/SelfCheckPage').then(m => ({ default: m.SelfCheckPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const StudentPage = lazy(() => import('./pages/StudentPage').then(m => ({ default: m.StudentPage })));
const CounselorReportView = lazy(() => import('./pages/CounselorReportView').then(m => ({ default: m.CounselorReportView })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const LettersPage = lazy(() => import('./pages/LettersPage').then(m => ({ default: m.LettersPage })));
const GratitudePage = lazy(() => import('./pages/GratitudePage').then(m => ({ default: m.GratitudePage })));
const DevUiPage = lazy(() => import('./pages/DevUiPage').then(m => ({ default: m.DevUiPage })));

const PageFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="text-center space-y-3">
        <Spinner size="md" />
        <p className="text-xs text-muted-foreground animate-pulse">{t('common.loadingGently')}</p>
      </div>
    </div>
  );
};

function AppContent() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const [slowNotice, setSlowNotice] = useState(false);
  const [demoAiBanner, setDemoAiBanner] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.demoAiBanner) setDemoAiBanner(true);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading) {
      setSlowNotice(false);
      return;
    }
    const timer = setTimeout(() => setSlowNotice(true), 3500);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <div className="text-center max-w-sm">
          <Spinner size="lg" className="mb-4 mx-auto" />
          <p className="text-sm font-medium text-foreground">{t('common.openingSanctuary')}</p>
          {slowNotice && (
            <p className="text-xs text-muted-foreground mt-3 animate-fade-in bg-muted/60 dark:bg-muted/30 p-2.5 rounded-lg border border-border">
              {t('common.serverWakingNotice')}
            </p>
          )}
        </div>
        <SOSButton />
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public standalone routes (no auth required) */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/shared/:token" element={<CounselorReportView />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/dev/ui" element={<DevUiPage />} />

          {/* Conditional routes based on authentication */}
          {!isAuthenticated ? (
            <Route path="*" element={<AuthPage />} />
          ) : (
            <Route
              path="*"
              element={
                <DiaryProvider>
                  <AppLockScreen>
                    {demoAiBanner && (
                      <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 px-4 py-1.5 text-center text-xs font-medium text-amber-900 dark:text-amber-200">
                        {t('ai.demoBanner')}
                      </div>
                    )}
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/write" element={<DiaryPage />} />
                        <Route path="/journal" element={<JournalPage />} />
                        <Route path="/mood" element={<MoodPage />} />
                        <Route path="/calm" element={<CalmPage />} />
                        <Route path="/talk" element={<TalkPage />} />
                        <Route path="/letters" element={<LettersPage />} />
                        <Route path="/gratitude" element={<GratitudePage />} />
                        <Route path="/export" element={<ExportPage />} />
                        <Route path="/stories" element={<StoriesPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/self-check" element={<SelfCheckPage />} />
                        <Route path="/student" element={<StudentPage />} />
                        {/* Redirect legacy routes to new 5-tab hubs */}
                        <Route path="/checkin" element={<Navigate to="/mood" replace />} />
                        <Route path="/pixels" element={<Navigate to="/mood?tab=year" replace />} />
                        <Route path="/insights" element={<Navigate to="/mood?tab=trends" replace />} />
                        <Route path="/calendar" element={<Navigate to="/journal?tab=calendar" replace />} />
                        <Route path="/search" element={<Navigate to="/journal?tab=search" replace />} />
                        <Route path="/happy-box" element={<Navigate to="/journal?filter=favorites" replace />} />
                        <Route path="/ask" element={<Navigate to="/talk?mode=diary" replace />} />
                        <Route path="/chat" element={<Navigate to="/talk" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </AppLockScreen>
                </DiaryProvider>
              }
            />
          )}
        </Routes>
      </Suspense>
      <SOSButton />
    </>
  );
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1
      }
    }
  });
}

const appQueryClient = createAppQueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={appQueryClient}>
        <Router>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
