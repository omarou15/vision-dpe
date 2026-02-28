import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { DpeProjecte, ConsommationParUsage } from "@/types/steps/audit";
import { calculerEtiquette, type ClasseDpe } from "@/types/steps/audit";
import { Card, Button, Alert } from "@/components/ui";

const ETIQUETTE_COLORS: Record<ClasseDpe, string> = {
  A: "bg-green-500 text-white", B: "bg-lime-500 text-white", C: "bg-yellow-400 text-gray-900",
  D: "bg-orange-400 text-white", E: "bg-orange-600 text-white", F: "bg-red-500 text-white", G: "bg-red-700 text-white",
};

function ComparaisonCard({ label, avant, apres, unite, invert }: { label: string; avant: number; apres: number; unite: string; invert?: boolean }) {
  const diff = avant - apres;
  const pct = avant > 0 ? Math.round((diff / avant) * 100) : 0;
  const isGood = invert ? diff < 0 : diff > 0;

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-gray-400 line-through">{avant.toFixed(0)}</span>
          <span className="text-lg font-bold text-gray-800">{apres.toFixed(0)}</span>
          <span className="text-xs text-gray-400">{unite}</span>
        </div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isGood ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {isGood ? "↓" : "↑"} {Math.abs(pct)}%
      </span>
    </div>
  );
}

export default function AuditStep14Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [dpeProjecte, setDpeProjecte] = useState<DpeProjecte | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Récupérer le bilan initial pour comparaison
  const [cepInitial, setCepInitial] = useState(380);
  const [egesInitial, setEgesInitial] = useState(65);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d14 = syncService.getStepValues(activeProjet, "audit_step_14");
    if (d14.dpe_projete_p1) setDpeProjecte(d14.dpe_projete_p1 as DpeProjecte);
    const d12 = syncService.getStepValues(activeProjet, "audit_step_12");
    if (d12.bilan) { setCepInitial((d12.bilan as any).cep || 380); setEgesInitial((d12.bilan as any).eges || 65); }
  }, [activeProjet]);

  async function handleCalculer() {
    setIsCalculating(true);
    await new Promise((r) => setTimeout(r, 1500));

    // Simulation : parcours 1 atteint classe C
    const cep = 165;
    const eges = 28;
    const projete: DpeProjecte = {
      etiquette_energie: calculerEtiquette(cep, eges),
      etiquette_climat: calculerEtiquette(cep, eges),
      cep, eges,
      consommations: { chauffage: 110, ecs: 30, refroidissement: 0, eclairage: 10, auxiliaires: 15, total: cep },
      gain_cep: cepInitial - cep,
      gain_eges: egesInitial - eges,
      pourcentage_reduction_cep: Math.round(((cepInitial - cep) / cepInitial) * 100),
    };
    setDpeProjecte(projete);
    setIsCalculating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "audit_step_14", { dpe_projete_p1: projete });
    }
  }

  const conforme = dpeProjecte && (dpeProjecte.etiquette_energie <= "C");

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">DPE projeté — Parcours 1</h2>

      <Alert variant="info">
        Recalcul 3CL complet après application de tous les travaux du parcours 1. L'étiquette projetée doit atteindre C minimum.
      </Alert>

      <Button onClick={handleCalculer} loading={isCalculating} fullWidth>
        {dpeProjecte ? "Recalculer le DPE projeté" : "Calculer le DPE projeté"}
      </Button>

      {dpeProjecte && (
        <>
          {/* Étiquettes avant/après */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Avant</p>
                  <div className={`mt-1 flex h-14 w-14 items-center justify-center rounded-lg ${ETIQUETTE_COLORS[calculerEtiquette(cepInitial, egesInitial)]}`}>
                    <span className="text-xl font-bold">{calculerEtiquette(cepInitial, egesInitial)}</span>
                  </div>
                </div>
                <span className="text-2xl text-gray-300">→</span>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Après travaux</p>
                  <div className={`mt-1 flex h-14 w-14 items-center justify-center rounded-lg ${ETIQUETTE_COLORS[dpeProjecte.etiquette_energie]}`}>
                    <span className="text-xl font-bold">{dpeProjecte.etiquette_energie}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
                  <p className="text-2xl font-bold text-green-700">-{dpeProjecte.pourcentage_reduction_cep}%</p>
                  <p className="text-xs text-green-600">réduction</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Conformité */}
          {conforme ? (
            <div className="rounded-lg bg-green-50 border-2 border-green-300 p-3 text-center">
              <p className="text-sm font-semibold text-green-800">✅ Objectif atteint — Classe {dpeProjecte.etiquette_energie} ≥ C</p>
            </div>
          ) : (
            <div className="rounded-lg bg-red-50 border-2 border-red-300 p-3 text-center">
              <p className="text-sm font-semibold text-red-800">❌ Objectif non atteint — Classe {dpeProjecte.etiquette_energie} &lt; C requis</p>
            </div>
          )}

          {/* Comparaisons */}
          <div className="space-y-2">
            <ComparaisonCard label="Énergie primaire" avant={cepInitial} apres={dpeProjecte.cep} unite="kWhEP/m²/an" />
            <ComparaisonCard label="Émissions GES" avant={egesInitial} apres={dpeProjecte.eges} unite="kgCO₂/m²/an" />
            <ComparaisonCard label="Gain énergie" avant={0} apres={dpeProjecte.gain_cep} unite="kWhEP/m²/an" invert />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleCalculer} loading={isCalculating} className="flex-1">Recalculer</Button>
            <Button onClick={() => completeStep(14)} className="flex-1" disabled={!conforme}>Valider</Button>
          </div>
        </>
      )}
    </div>
  );
}
