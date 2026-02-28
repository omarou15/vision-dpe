import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layouts
const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const WizardLayout = lazy(() => import("@/components/layout/WizardLayout"));

// Pages auth
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const AcceptInvitationPage = lazy(() => import("@/pages/auth/AcceptInvitationPage"));

// Pages app
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProjetsPage = lazy(() => import("@/pages/ProjetsPage"));
const ProfilPage = lazy(() => import("@/pages/ProfilPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Wizard
const WizardStepPage = lazy(() => import("@/pages/wizard/WizardStepPage"));
const Step1Page = lazy(() => import("@/pages/wizard/Step1Page"));
const Step2Page = lazy(() => import("@/pages/wizard/Step2Page"));
const Step3Page = lazy(() => import("@/pages/wizard/Step3Page"));
const Step4Page = lazy(() => import("@/pages/wizard/Step4Page"));
const Step5Page = lazy(() => import("@/pages/wizard/Step5Page"));
const Step6Page = lazy(() => import("@/pages/wizard/Step6Page"));
const Step7Page = lazy(() => import("@/pages/wizard/Step7Page"));
const Step8Page = lazy(() => import("@/pages/wizard/Step8Page"));
const Step9Page = lazy(() => import("@/pages/wizard/Step9Page"));
const Step10Page = lazy(() => import("@/pages/wizard/Step10Page"));
const Step11Page = lazy(() => import("@/pages/wizard/Step11Page"));
const Step12Page = lazy(() => import("@/pages/wizard/Step12Page"));
const Step13Page = lazy(() => import("@/pages/wizard/Step13Page"));
const Step14Page = lazy(() => import("@/pages/wizard/Step14Page"));

/** Loading fallback pendant le chargement lazy */
function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* PWA : bandeau hors-ligne */}
      <OfflineBanner />

      {/* PWA : notification de mise à jour */}
      <UpdatePrompt />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ── Auth (pas de layout) ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/invite" element={<AcceptInvitationPage />} />

          {/* ── App (layout avec sidebar/bottom nav) ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projets" element={<ProjetsPage />} />
            <Route path="/profil" element={<ProfilPage />} />
          </Route>

          {/* ── Wizard (layout spécifique plein écran) ── */}
          <Route
            path="/projet/:projetId"
            element={
              <ProtectedRoute>
                <WizardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="etape/1" element={<Step1Page />} />
            <Route path="etape/2" element={<Step2Page />} />
            <Route path="etape/3" element={<Step3Page />} />
            <Route path="etape/4" element={<Step4Page />} />
            <Route path="etape/5" element={<Step5Page />} />
            <Route path="etape/6" element={<Step6Page />} />
            <Route path="etape/7" element={<Step7Page />} />
            <Route path="etape/8" element={<Step8Page />} />
            <Route path="etape/9" element={<Step9Page />} />
            <Route path="etape/10" element={<Step10Page />} />
            <Route path="etape/11" element={<Step11Page />} />
            <Route path="etape/12" element={<Step12Page />} />
            <Route path="etape/13" element={<Step13Page />} />
            <Route path="etape/14" element={<Step14Page />} />
            <Route path="etape/:stepNumber" element={<WizardStepPage />} />
            <Route index element={<Navigate to="etape/1" replace />} />
          </Route>

          {/* ── Redirects ── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* PWA : prompt d'installation */}
      <InstallPrompt />
    </BrowserRouter>
  );
}
