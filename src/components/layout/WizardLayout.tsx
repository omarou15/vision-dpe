import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks";
import { DPE_STEPS_COUNT, AUDIT_STEPS_COUNT } from "@/utils/constants";

/** Statut visuel d'une étape */
type StepStatus = "done" | "current" | "error" | "upcoming";

interface WizardLayoutProps {
  /** "dpe" ou "audit" — conditionne le nombre d'étapes */
  projectType?: "dpe" | "audit";
  /** Étapes complétées */
  stepsCompleted?: number[];
  /** Étape actuelle (1-indexed) */
  currentStep?: number;
  /** Étapes avec erreurs de validation */
  stepsWithErrors?: number[];
}

function getStepStatus(
  stepNum: number,
  currentStep: number,
  stepsCompleted: number[],
  stepsWithErrors: number[]
): StepStatus {
  if (stepsWithErrors.includes(stepNum)) return "error";
  if (stepNum === currentStep) return "current";
  if (stepsCompleted.includes(stepNum)) return "done";
  return "upcoming";
}

const statusColors: Record<StepStatus, string> = {
  done: "bg-green-500 text-white",
  current: "bg-blue-500 text-white ring-2 ring-blue-200",
  error: "bg-red-500 text-white",
  upcoming: "bg-gray-200 text-gray-500",
};

const statusBarColors: Record<StepStatus, string> = {
  done: "bg-green-500",
  current: "bg-blue-500",
  error: "bg-red-500",
  upcoming: "bg-gray-200",
};

/**
 * Barre de progression wizard.
 * - Mobile : pastilles compactes scrollables horizontalement
 * - Desktop : barre complète avec labels
 */
function WizardProgressBar({
  totalSteps,
  currentStep,
  stepsCompleted,
  stepsWithErrors,
  projectType,
  onStepClick,
}: {
  totalSteps: number;
  currentStep: number;
  stepsCompleted: number[];
  stepsWithErrors: number[];
  projectType: "dpe" | "audit";
  onStepClick: (step: number) => void;
}) {
  const { t } = useTranslation();
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Header : titre étape + progression */}
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-sm font-semibold text-gray-900">
          {t(`wizard.steps.${projectType}.${currentStep}`)}
        </h2>
        <span className="text-xs text-gray-500">
          {stepsCompleted.length}/{totalSteps}
        </span>
      </div>

      {/* Pastilles scrollables */}
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {steps.map((stepNum) => {
          const status = getStepStatus(stepNum, currentStep, stepsCompleted, stepsWithErrors);
          const canNavigate = status === "done" || status === "error" || status === "current";

          return (
            <button
              key={stepNum}
              onClick={() => canNavigate && onStepClick(stepNum)}
              disabled={!canNavigate}
              className={`flex h-7 min-w-7 items-center justify-center rounded-full text-[11px] font-medium transition-all ${statusColors[status]} ${
                canNavigate ? "cursor-pointer" : "cursor-default opacity-60"
              }`}
              title={t(`wizard.steps.${projectType}.${stepNum}`)}
            >
              {status === "done" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : status === "error" ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                </svg>
              ) : (
                stepNum
              )}
            </button>
          );
        })}
      </div>

      {/* Barre de progression globale */}
      <div className="flex h-1 w-full">
        {steps.map((stepNum) => {
          const status = getStepStatus(stepNum, currentStep, stepsCompleted, stepsWithErrors);
          return (
            <div key={stepNum} className={`flex-1 ${statusBarColors[status]}`} />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Layout du wizard DPE/Audit.
 * 
 * - Header : bouton retour + titre projet + statut online
 * - Barre de progression : pastilles navigables par étape
 * - Contenu : <Outlet /> = page étape courante
 * - Footer : boutons Précédent / Suivant
 */
export default function WizardLayout({
  projectType = "dpe",
  stepsCompleted = [],
  currentStep = 1,
  stepsWithErrors = [],
}: WizardLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projetId } = useParams();
  const isOnline = useOnlineStatus();

  const totalSteps = projectType === "audit" ? AUDIT_STEPS_COUNT : DPE_STEPS_COUNT;

  const handleStepClick = (step: number) => {
    navigate(`/projet/${projetId}/etape/${step}`);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      navigate(`/projet/${projetId}/etape/${currentStep - 1}`);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      navigate(`/projet/${projetId}/etape/${currentStep + 1}`);
    }
  };

  const handleBack = () => {
    navigate("/projets");
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header wizard */}
      <header className="flex h-12 items-center gap-3 border-b border-gray-200 bg-white px-4">
        <button onClick={handleBack} className="text-gray-500 hover:text-gray-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {projectType === "audit" ? "Audit" : "DPE"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Hors ligne
            </span>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <WizardProgressBar
        totalSteps={totalSteps}
        currentStep={currentStep}
        stepsCompleted={stepsCompleted}
        stepsWithErrors={stepsWithErrors}
        projectType={projectType}
        onStepClick={handleStepClick}
      />

      {/* Contenu étape */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 safe-area-bottom">
        <button
          onClick={handlePrevious}
          disabled={currentStep <= 1}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("wizard.previous")}
        </button>

        <span className="text-xs text-gray-400">
          {currentStep}/{totalSteps}
        </span>

        <button
          onClick={handleNext}
          disabled={currentStep >= totalSteps}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-30 disabled:cursor-default"
        >
          {currentStep >= totalSteps ? t("wizard.finish") : t("wizard.next")}
          {currentStep < totalSteps && (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
