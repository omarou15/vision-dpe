import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { DpeProjecte } from "@/types/steps/audit";
import { calculerEtiquette, type ClasseDpe } from "@/types/steps/audit";
import { Card, Button, Alert } from "@/components/ui";

const ETIQUETTE_COLORS: Record<ClasseDpe, string> = {
  A: "bg-green-500 text-white", B: "bg-lime-500 text-white", C: "bg-yellow-400 text-gray-900",
  D: "bg-orange-400 text-white", E: "bg-orange-600 text-white", F: "bg-red-500 text-white", G: "bg-red-700 text-white",
};

export default function AuditStep16Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [dpeProjecte, setDpeProjecte] = useState<DpeProjecte | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [cepInitial, setCepInitial] = useState(380);
  const [egesInitial, setEgesInitial] = useState(65);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d16 = syncService.getStepValues(activeProjet, "audit_step_16");
    if (d16.dpe_projete_p2) setDpeProjecte(d16.dpe_projete_p2 as DpeProjecte);
    const d12 = syncService.getStepValues(activeProjet, "audit_step_12");
    if (d12.bilan) { setCepInitial((d12.bilan as any).cep || 380); setEgesInitial((d12.bilan as any).eges || 65); }
  }, [activeProjet]);

  async function handleCalculer() {
    setIsCalculating(true);
    await new Promise((r) => setTimeout(r, 1500));

    // Simulation : parcours 2 global atteint classe B
    const cep = 95;
    const eges = 9;
    const projete: DpeProjecte = {
      etiquette_energie: calculerEtiquette(cep, eges),
      etiquette_climat: calculerEtiquette(cep, eges),
      cep, eges,
      consommations: { chauffage: 55, ecs: 20, refroidissement: 0, eclairage: 8, auxiliaires: 12, total: cep },
      gain_cep: cepInitial - cep,
      gain_eges: egesInitial - eges,
      pourcentage_reduction_cep: Math.round(((cepInitial - cep) / cepInitial) * 100),
    };
    setDpeProjecte(projete);
    setIsCalculating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "audit_step_16", { dpe_projete_p2: projete });
    }
  }

  const conforme = dpeProjecte && (dpeProjecte.etiquette_energie <= "B");

  // Récupérer DPE projeté parcours 1 pour comparaison
  const [dpeP1, setDpeP1] = useState<DpeProjecte | null>(null);
  useEffect(() => {
    if (!activeProjet) return;
    const d14 = syncService.getStepValues(activeProjet, "audit_step_14");
    if (d14.dpe_projete_p1) setDpeP1(d14.dpe_projete_p1 as DpeProjecte);
  }, [activeProjet]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">DPE projeté — Parcours 2</h2>

      <Alert variant="info">
        Recalcul 3CL après rénovation globale. L'étiquette projetée doit atteindre B minimum (plus ambitieux que le parcours 1).
      </Alert>

      <Button onClick={handleCalculer} loading={isCalculating} fullWidth>
        {dpeProjecte ? "Recalculer le DPE projeté" : "Calculer le DPE projeté"}
      </Button>

      {dpeProjecte && (
        <>
          {/* Comparaison 3 colonnes : Initial → P1 → P2 */}
          <Card>
            <div className="p-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">Comparaison des scénarios</p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-gray-500">État initial</p>
                  <div className={`mt-1 flex h-12 w-12 items-center justify-center rounded-lg ${ETIQUETTE_COLORS[calculerEtiquette(cepInitial, egesInitial)]}`}>
                    <span className="text-lg font-bold">{calculerEtiquette(cepInitial, egesInitial)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{cepInitial} kWhEP</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
                {dpeP1 && (
                  <>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Parcours 1</p>
                      <div className={`mt-1 flex h-12 w-12 items-center justify-center rounded-lg ${ETIQUETTE_COLORS[dpeP1.etiquette_energie]}`}>
                        <span className="text-lg font-bold">{dpeP1.etiquette_energie}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{dpeP1.cep} kWhEP</p>
                    </div>
                    <span className="text-xl text-gray-300">→</span>
                  </>
                )}
                <div className="text-center">
                  <p className="text-xs font-semibold text-blue-600">Parcours 2</p>
                  <div className={`mt-1 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-blue-400 ${ETIQUETTE_COLORS[dpeProjecte.etiquette_energie]}`}>
                    <span className="text-xl font-bold">{dpeProjecte.etiquette_energie}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-600">{dpeProjecte.cep} kWhEP</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Conformité */}
          {conforme ? (
            <div className="rounded-lg bg-green-50 border-2 border-green-300 p-3 text-center">
              <p className="text-sm font-semibold text-green-800">✅ Objectif atteint — Classe {dpeProjecte.etiquette_energie} ≥ B</p>
            </div>
          ) : (
            <div className="rounded-lg bg-red-50 border-2 border-red-300 p-3 text-center">
              <p className="text-sm font-semibold text-red-800">❌ Objectif non atteint — Classe {dpeProjecte.etiquette_energie} &lt; B requis</p>
            </div>
          )}

          {/* Gains */}
          <Card>
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-gray-700">Gains énergétiques</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-xl font-bold text-green-700">-{dpeProjecte.pourcentage_reduction_cep}%</p>
                  <p className="text-xs text-green-600">Réduction Cep</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-xl font-bold text-green-700">{dpeProjecte.gain_cep}</p>
                  <p className="text-xs text-green-600">kWhEP/m²/an</p>
                </div>
                <div className="rounded-lg bg-green-50 p-2">
                  <p className="text-xl font-bold text-green-700">{dpeProjecte.gain_eges}</p>
                  <p className="text-xs text-green-600">kgCO₂/m²/an</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleCalculer} loading={isCalculating} className="flex-1">Recalculer</Button>
            <Button onClick={() => completeStep(16)} className="flex-1" disabled={!conforme}>Valider</Button>
          </div>
        </>
      )}
    </div>
  );
}
