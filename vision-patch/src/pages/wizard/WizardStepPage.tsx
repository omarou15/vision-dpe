import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function WizardStepPage() {
  const { t } = useTranslation();
  const { projetId, stepNumber } = useParams();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Étape {stepNumber}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Projet : {projetId} — Formulaire de l'étape à implémenter Phase 1-3.
      </p>
    </div>
  );
}
