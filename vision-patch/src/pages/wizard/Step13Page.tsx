import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import {
  getBloquants, getWarnings, grouperParEtape,
  type ResultatValidation, type ResultatControle,
} from "@/types/steps/step12-14";
import { Card, Button, Alert } from "@/components/ui";

const ETAPE_LABELS: Record<number, string> = {
  0: "Général", 1: "Informations", 2: "Admin DPE", 3: "Caractéristiques",
  4: "Murs", 5: "Baies/Portes", 6: "Planchers bas", 7: "Planchers hauts",
  8: "Ponts thermiques", 9: "Chauffage", 10: "ECS", 11: "Ventil/Clim/ENR", 12: "Travaux",
};

function SeveriteBadge({ severite }: { severite: "bloquant" | "warning" | "info" }) {
  const cls = severite === "bloquant" ? "bg-red-100 text-red-800"
    : severite === "warning" ? "bg-amber-100 text-amber-800"
    : "bg-blue-100 text-blue-700";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${cls}`}>{severite.toUpperCase()}</span>;
}

function ControleCard({ c }: { c: ResultatControle }) {
  return (
    <div className="flex items-start gap-2 rounded border border-gray-200 bg-white p-3">
      <SeveriteBadge severite={c.severite} />
      <div className="flex-1 text-sm">
        <p className="font-medium text-gray-800">{c.message}</p>
        {c.champ && <p className="text-xs text-gray-500">Champ : {c.champ}</p>}
        {c.xpath && <p className="text-xs font-mono text-gray-400 truncate">{c.xpath}</p>}
      </div>
      <span className="text-xs text-gray-400">{c.code}</span>
    </div>
  );
}

export default function Step13Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const navigate = useNavigate();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [resultat, setResultat] = useState<ResultatValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "step_13");
    if (d.derniere_validation_ok) setResultat(d.derniere_validation_ok as ResultatValidation);
    else if (d.validations && Array.isArray(d.validations) && d.validations.length > 0)
      setResultat(d.validations[0] as ResultatValidation);
  }, [activeProjet]);

  async function handleValidate() {
    setIsValidating(true);
    // Appel simulé — en prod, appelle /controle_coherence via FORGE
    await new Promise((r) => setTimeout(r, 1500));

    // Simulation résultat (en prod : parse la réponse API ADEME)
    const mock: ResultatValidation = {
      timestamp: new Date().toISOString(),
      statut: "valide",
      nb_bloquants: 0,
      nb_warnings: 1,
      controles: [
        { code: "COH_PT_001", message: "Pont thermique mur/plancher : vérifier cohérence avec isolation déclarée", severite: "warning", xpath: "/dpe/logement/enveloppe/pont_thermique_collection/pont_thermique[1]", etape_wizard: 8, champ: "kpt" },
      ],
      version_moteur: "1.24.2",
      duree_ms: 340,
    };
    setResultat(mock);
    setIsValidating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "step_13", {
        validations: [mock],
        derniere_validation_ok: mock.nb_bloquants === 0 ? mock : null,
      });
    }
  }

  const bloquants = resultat ? getBloquants(resultat) : [];
  const warnings = resultat ? getWarnings(resultat) : [];
  const parEtape = resultat ? grouperParEtape(resultat.controles) : new Map();
  const isOk = resultat && resultat.nb_bloquants === 0;

  async function handleComplete() {
    if (!projetId || !isOk) return;
    setIsSaving(true);
    completeStep(13);
    setIsSaving(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.13")}</h2>

      <Alert variant="info">
        Le XML est soumis au moteur de contrôle de cohérence ADEME (v1.24.2). Les erreurs bloquantes doivent être corrigées avant l'export.
      </Alert>

      <Button onClick={handleValidate} loading={isValidating} fullWidth>
        {resultat ? "Revalider le DPE" : "Lancer la validation ADEME"}
      </Button>

      {resultat && (
        <>
          {/* Status global */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${isOk ? "bg-green-500" : "bg-red-500"}`} />
                  <p className="font-semibold text-gray-800">
                    {isOk ? "DPE valide — prêt pour l'export" : `${bloquants.length} erreur(s) bloquante(s)`}
                  </p>
                </div>
                {resultat.duree_ms && <span className="text-xs text-gray-400">{resultat.duree_ms}ms</span>}
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-red-600">{bloquants.length} bloquant(s)</span>
                <span className="text-amber-600">{warnings.length} warning(s)</span>
                <span className="text-gray-400">v{resultat.version_moteur}</span>
              </div>
            </div>
          </Card>

          {/* Erreurs groupées par étape */}
          {Array.from(parEtape.entries())
            .sort(([a], [b]) => a - b)
            .map(([etape, controles]) => (
              <div key={etape} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    Étape {etape} — {ETAPE_LABELS[etape] || "Autre"}
                  </p>
                  {etape > 0 && (
                    <button
                      onClick={() => navigate(`/projet/${projetId}/etape/${etape}`)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Corriger →
                    </button>
                  )}
                </div>
                {controles.map((c) => <ControleCard key={c.code + c.xpath} c={c} />)}
              </div>
            ))}

          {isOk && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleComplete} loading={isSaving} fullWidth>
                Valider — passer à l'export
              </Button>
            </div>
          )}

          {!isOk && (
            <Alert variant="error">
              Corrigez les erreurs bloquantes dans les étapes concernées puis revalidez.
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
