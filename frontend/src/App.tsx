import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from './store/authStore';
import { HelmetProvider } from 'react-helmet-async';

// Layout & Core
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import NovaBot from './components/nova/NovaBot';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Pages (Synchronous for initial load)
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Pages (Lazy Loaded)
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const ProgramsPage = lazy(() => import('./pages/Programs/ProgramsPage'));
const ProgramDetailPage = lazy(() => import('./pages/Programs/ProgramDetailPage'));
const UniversitiesPage = lazy(() => import('./pages/Universities/UniversitiesPage'));
const UniversityDetailPage = lazy(() => import('./pages/Universities/UniversityDetailPage'));
const RecommendationsPage = lazy(() => import('./pages/Recommendations/RecommendationsPage'));
const ApplicationsPage = lazy(() => import('./pages/Applications/ApplicationsPage'));
const ApplicationTrackerPage = lazy(() => import('./pages/Applications/ApplicationTrackerPage'));
const AdminPage = lazy(() => import('./pages/Admin/AdminPage'));
const ScholarshipsPage = lazy(() => import('./pages/Scholarships/ScholarshipsPage'));
const ScholarshipDetailPage = lazy(() => import('./pages/Scholarships/ScholarshipDetailPage'));
// @ts-ignore
const CostOfLiving = lazy(() => import('./pages/CostOfLiving/CostOfLiving'));
const VisaGuidePage = lazy(() => import('./pages/VisaGuide/VisaGuidePage'));
const NotificationSettingsPage = lazy(() => import('./pages/Settings/NotificationSettingsPage'));
const CommunityPage = lazy(() => import('./pages/Community/CommunityPage'));
const PostDetailPage = lazy(() => import('./pages/Community/PostDetailPage'));
const GermanGradeCalculator = lazy(() => import('./pages/GermanGradeCalculator/GermanGradeCalculator'));
const SOPGeneratorPage = lazy(() => import('./pages/Tools/SOPGeneratorPage'));
const CVGeneratorPage = lazy(() => import('./pages/Tools/CVGeneratorPage'));
const SurvivalGuidesPage = lazy(() => import('./pages/Tools/SurvivalGuidesPage'));
const CountryGuidePage = lazy(() => import('./pages/CountryGuide/CountryGuidePage'));
const VaultPage = lazy(() => import('./pages/Vault/VaultPage'));

const PrivacyPolicyPage = lazy(() => import('./pages/Legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/Legal/TermsOfServicePage'));
const AboutUsPage = lazy(() => import('./pages/AboutUs/AboutUsPage'));

export default function App() {
  const { checkAuth, isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <Routes>
            {/* Public routes without layout */}
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
            } />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } />
            <Route path="/register" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            } />
            <Route path="/forgot-password" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />
            } />
            <Route path="/reset-password" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />
            } />

            {/* Routes with layout */}
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/programs/:id" element={<ProgramDetailPage />} />
              <Route path="/universities" element={<UniversitiesPage />} />
              <Route path="/universities/:name" element={<UniversityDetailPage />} />
              <Route path="/scholarships" element={<ScholarshipsPage />} />
              <Route path="/scholarships/:id" element={<ScholarshipDetailPage />} />
              <Route path="/costofliving" element={<CostOfLiving />} />
              <Route path="/cost-of-living" element={<CostOfLiving />} />
              <Route path="/cost-of-living/:city" element={<CostOfLiving />} />
              <Route path="/visa-guide" element={<VisaGuidePage />} />
              <Route path="/german-grade-calculator" element={<GermanGradeCalculator />} />
              <Route path="/tools/cv-generator" element={<CVGeneratorPage />} />
              <Route path="/tools/survival-guides" element={<SurvivalGuidesPage />} />
              <Route path="/tools/sop-generator" element={<SOPGeneratorPage />} />
              <Route path="/study-in-germany/from/:country" element={<CountryGuidePage />} />

              {/* Legal Pages */}

              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/about" element={<AboutUsPage />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/recommendations" element={
                <ProtectedRoute>
                  <RecommendationsPage />
                </ProtectedRoute>
              } />
              <Route path="/applications" element={
                <ProtectedRoute>
                  <ApplicationsPage />
                </ProtectedRoute>
              } />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/community/posts/:id" element={<PostDetailPage />} />

              <Route path="/vault" element={
                <ProtectedRoute>
                  <VaultPage />
                </ProtectedRoute>
              } />

              <Route path="/applications/:id" element={
                <ProtectedRoute>
                  <ApplicationTrackerPage />
                </ProtectedRoute>
              } />
              <Route path="/settings/notifications" element={
                <ProtectedRoute>
                  <NotificationSettingsPage />
                </ProtectedRoute>
              } />



              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <NovaBot />
    </HelmetProvider >
  );
}
