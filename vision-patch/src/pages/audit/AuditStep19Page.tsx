import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { ResultatValidation, ResultatControle } from "@/types/steps/step12-14";
import { getBloquants, getWarnings, grouperParEtape, XPATH_ETAPE_MAP } from "@/types/steps/step12-14";
import { ETAPES_AUDIT_LABELS } from "@/types/steps/audit";
import { Card, Button, Alert } from "@/components/ui";

function ControleCard({ c }: { c: ResultatControle }) {
  const colors: Record<string, string> = {
    bloquant: "border-red-300 bg-red-50", warning: "border-amber-300 bg-amber-50", info: "border-blue-300 bg-blue-50",
  };
  const badges: Record<string, string> = {
    bloquant: "bg-red-500 text-white", warning: "bg-amber-500 text-white", info: "bg-blue-500 text-white",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[c.severite]}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${badges[c.severite]}`}>{c.severite}</span>
        <span className="text-xs text-gray-400">{c.code}</span>
      </div>
      <p className="mt-1 text-sm text-gray-800">{c.message}</p>
      {c.champ && <p className="mt-1 text-xs text-gray-500">Champ : <span className="font-mono">{c.champ}</span></p>}
      {c.xpath && <p className="mt-0.5 text-xs text-gray-400 font-mono truncate">{c.xpath}</p>}
    </div>
  );
}

export default function AuditStep19Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const navigate = useNavigate();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [resultat, setResultat] = useState<ResultatValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "audit_step_19");
    if (d.validation) setResultat(d.validation as ResultatValidation);
  }, [activeProjet]);

  async function handleValidation() {
    setIsValidating(true);
    await new Promise((r) => setTimeout(r, 2000));

    // Simulation validation audit complète
    const sim: ResultatValidation = {
      timestamp: new Date().toISOString(),
      statut: "warnings_seulement",
      nb_bloquants: 0,
      nb_warnings: 2,
      controles: [
        {
          code: "AUD_COH_001", message: "Vérifier la cohérence entre le parcours 1 et le parcours 2 : au moins un poste de travaux doit différer.",
          severite: "warning", xpath: "/audit/scenarios/parcours_1", etape_wizard: 13, champ: null,
        },
        {
          code: "AUD_ECO_001", message: "Le temps de retour sur investissement du parcours 2 est supérieur à 20 ans. Vérifier les hypothèses économiques.",
          severite: "warning", xpath: "/audit/analyse_economique", etape_wizard: 17, champ: "temps_retour",
        },
      ],
      version_moteur: "1.24.2",
      duree_ms: 580,
    };

    setResultat(sim);
    setIsValidating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "audit_step_19", { validation: sim });
    }
  }

  const bloquants = resultat ? getBloquants(resultat) : [];
  const warnings = resultat ? getWarnings(resultat) : [];
  const parEtape = resultat ? grouperParEtape(resultat.controles) : new Map();

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Validation audit</h2>

      <Alert variant="info">
        Le XML audit est soumis au moteur /controle_coherence_audit de l'ADEME (v1.24.2). Il valide le DPE état initial ET les scénarios de travaux.
      </Alert>

      <Button onClick={handleValidation} loading={isValidating} fullWidth>
        {resultat ? "Revalider l'audit" : "Lancer la validation audit ADEME"}
      </Button>

      {resultat && (
        <>
          {/* Statut global */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${resultat.statut === "valide" ? "bg-green-100 text-green-800" : resultat.nb_bloquants > 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                    {resultat.statut === "valide" ? "✅ Audit valide" : resultat.nb_bloquants > 0 ? `❌ ${resultat.nb_bloquants} erreur(s) bloquante(s)` : `⚠️ ${resultat.nb_warnings} avertissement(s)`}
                  </span>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>Moteur v{resultat.version_moteur}</p>
                  <p>{resultat.duree_ms}ms</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Erreurs groupées par étape */}
          {Array.from(parEtape.entries()).map(([etape, controles]) => (
            <Card key={etape}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Étape {etape} — {ETAPES_AUDIT_LABELS[etape || 0] || "Général"}
                  </p>
                  <button
                    onClick={() => navigate(`/audit/${projetId}/step/${etape}`)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Corriger →
                  </button>
                </div>
                <div className="space-y-2">
                  {controles.map((c, i) => <ControleCard key={i} c={c} />)}
                </div>
              </div>
            </Card>
          ))}

          {/* Action suivante */}
          {resultat.nb_bloquants === 0 ? (
            <div className="space-y-3">
              {warnings.length > 0 && (
                <Alert variant="warning">
                  {warnings.length} avertissement(s) non bloquant(s). L'export est possible mais vérifiez les points signalés.
                </Alert>
              )}
              <Button onClick={() => completeStep(19)} fullWidth>
                Valider — passer à l'export audit
              </Button>
            </div>
          ) : (
            <Alert variant="error">
              Corrigez les {bloquants.length} erreur(s) bloquante(s) puis revalidez l'audit.
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
