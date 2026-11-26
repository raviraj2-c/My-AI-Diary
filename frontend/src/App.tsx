import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DiaryProvider } from './contexts/DiaryContext';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/common/Layout';
import { Spinner } from './components/common/Spinner';
import { AppLockScreen } from './components/common/AppLockScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SOSButton } from './components/common/SOSButton';

// Eagerly loaded primary auth page
import { AuthPage } from './pages/AuthPage';

// Lazy-loaded pages for performance & code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DiaryPage = lazy(() => import('./pages/DiaryPage').then(m => ({ default: m.DiaryPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const ExportPage = lazy(() => import('./pages/ExportPage').then(m => ({ default: m.ExportPage })));
const StoriesPage = lazy(() => import('./pages/StoriesPage').then(m => ({ default: m.StoriesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CheckInPage = lazy(() => import('./pages/CheckInPage').then(m => ({ default: m.CheckInPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
const GratitudePage = lazy(() => import('./pages/GratitudePage').then(m => ({ default: m.GratitudePage })));
const HappyBox = lazy(() => import('./pages/HappyBox').then(m => ({ default: m.HappyBox })));
const CalmPage = lazy(() => import('./pages/CalmPage').then(m => ({ default: m.CalmPage })));
const SelfCheckPage = lazy(() => import('./pages/SelfCheckPage').then(m => ({ default: m.SelfCheckPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const AskDiaryPage = lazy(() => import('./pages/AskDiaryPage').then(m => ({ default: m.AskDiaryPage })));
const StudentPage = lazy(() => import('./pages/StudentPage').then(m => ({ default: m.StudentPage })));
const CounselorReportView = lazy(() => import('./pages/CounselorReportView').then(m => ({ default: m.CounselorReportView })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const YearInPixelsPage = lazy(() => import('./pages/YearInPixelsPage').then(m => ({ default: m.YearInPixelsPage })));
const LettersPage = lazy(() => import('./pages/LettersPage').then(m => ({ default: m.LettersPage })));

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

          {/* Conditional routes based on authentication */}
          {!isAuthenticated ? (
            <Route path="*" element={<AuthPage />} />
          ) : (
            <Route
              path="*"
              element={
                <DiaryProvider>
                  <AppLockScreen>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/write" element={<DiaryPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/pixels" element={<YearInPixelsPage />} />
                        <Route path="/letters" element={<LettersPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/export" element={<ExportPage />} />
                        <Route path="/stories" element={<StoriesPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/checkin" element={<CheckInPage />} />
                        <Route path="/insights" element={<InsightsPage />} />
                        <Route path="/gratitude" element={<GratitudePage />} />
                        <Route path="/happy-box" element={<HappyBox />} />
                        <Route path="/calm" element={<CalmPage />} />
                        <Route path="/self-check" element={<SelfCheckPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/ask" element={<AskDiaryPage />} />
                        <Route path="/student" element={<StudentPage />} />
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

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
