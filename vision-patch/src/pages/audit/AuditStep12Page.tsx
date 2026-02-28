import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { BilanEtatInitial, ConsommationParUsage, DeperditionsParPoste, EmissionsParUsage } from "@/types/steps/audit";
import { calculerEtiquette, SEUILS_ETIQUETTE, type ClasseDpe } from "@/types/steps/audit";
import { Card, Button, Alert } from "@/components/ui";

const ETIQUETTE_COLORS: Record<ClasseDpe, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-green-500", text: "text-white", border: "border-green-600" },
  B: { bg: "bg-lime-500", text: "text-white", border: "border-lime-600" },
  C: { bg: "bg-yellow-400", text: "text-gray-900", border: "border-yellow-500" },
  D: { bg: "bg-orange-400", text: "text-white", border: "border-orange-500" },
  E: { bg: "bg-orange-600", text: "text-white", border: "border-orange-700" },
  F: { bg: "bg-red-500", text: "text-white", border: "border-red-600" },
  G: { bg: "bg-red-700", text: "text-white", border: "border-red-800" },
};

function EtiquetteBadge({ classe, label }: { classe: ClasseDpe; label: string }) {
  const c = ETIQUETTE_COLORS[classe];
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <div className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 ${c.bg} ${c.text} ${c.border}`}>
        <span className="text-2xl font-bold">{classe}</span>
      </div>
    </div>
  );
}

function BarreDeperditions({ deperditions }: { deperditions: DeperditionsParPoste }) {
  const postes = [
    { label: "Murs", value: deperditions.murs, color: "bg-blue-500" },
    { label: "Planchers bas", value: deperditions.planchers_bas, color: "bg-cyan-500" },
    { label: "Planchers hauts", value: deperditions.planchers_hauts, color: "bg-teal-500" },
    { label: "Baies", value: deperditions.baies, color: "bg-amber-500" },
    { label: "Portes", value: deperditions.portes, color: "bg-orange-500" },
    { label: "Ponts th.", value: deperditions.ponts_thermiques, color: "bg-red-500" },
    { label: "Renouvellement air", value: deperditions.renouvellement_air, color: "bg-purple-500" },
  ];
  const total = deperditions.total || postes.reduce((s, p) => s + p.value, 0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">Déperditions par poste (W/K)</p>
      {postes.map((p) => (
        <div key={p.label} className="flex items-center gap-2">
          <span className="w-28 text-xs text-gray-500">{p.label}</span>
          <div className="flex-1 rounded-full bg-gray-100 h-4">
            <div className={`h-4 rounded-full ${p.color}`} style={{ width: `${total > 0 ? (p.value / total) * 100 : 0}%` }} />
          </div>
          <span className="w-12 text-right text-xs font-medium">{p.value.toFixed(1)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t pt-1 text-sm font-semibold">
        <span>Total</span>
        <span>{total.toFixed(1)} W/K</span>
      </div>
    </div>
  );
}

function TableConsommations({ conso }: { conso: ConsommationParUsage }) {
  const usages = [
    { label: "Chauffage", value: conso.chauffage },
    { label: "ECS", value: conso.ecs },
    { label: "Refroidissement", value: conso.refroidissement },
    { label: "Éclairage", value: conso.eclairage },
    { label: "Auxiliaires", value: conso.auxiliaires },
  ];

  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-gray-700">Consommations (kWhEP/m²/an)</p>
      {usages.map((u) => (
        <div key={u.label} className="flex justify-between text-sm">
          <span className="text-gray-500">{u.label}</span>
          <span className="font-medium">{u.value.toFixed(1)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t pt-1 text-sm font-bold">
        <span>Total (Cep)</span>
        <span>{conso.total.toFixed(1)}</span>
      </div>
    </div>
  );
}

function createBilanVide(): BilanEtatInitial {
  return {
    etiquette_energie: "G", etiquette_climat: "G", cep: 0, eges: 0,
    consommations: { chauffage: 0, ecs: 0, refroidissement: 0, eclairage: 0, auxiliaires: 0, total: 0 },
    deperditions: { murs: 0, planchers_bas: 0, planchers_hauts: 0, baies: 0, portes: 0, ponts_thermiques: 0, renouvellement_air: 0, total: 0 },
    emissions: { chauffage: 0, ecs: 0, refroidissement: 0, total: 0 },
    estimation_facture: null,
  };
}

export default function AuditStep12Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [bilan, setBilan] = useState<BilanEtatInitial>(createBilanVide());
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "audit_step_12");
    if (d.bilan) setBilan(d.bilan as BilanEtatInitial);
  }, [activeProjet]);

  async function handleCalculer() {
    setIsCalculating(true);
    // En prod : appel au moteur 3CL pour calculer depuis les données étapes 1-11
    await new Promise((r) => setTimeout(r, 1500));

    // Simulation réaliste — maison F
    const simBilan: BilanEtatInitial = {
      etiquette_energie: "F",
      etiquette_climat: "E",
      cep: 380,
      eges: 65,
      consommations: { chauffage: 280, ecs: 55, refroidissement: 0, eclairage: 15, auxiliaires: 30, total: 380 },
      deperditions: { murs: 95, planchers_bas: 35, planchers_hauts: 55, baies: 45, portes: 10, ponts_thermiques: 25, renouvellement_air: 40, total: 305 },
      emissions: { chauffage: 48, ecs: 12, refroidissement: 0, total: 65 },
      estimation_facture: 2850,
    };
    simBilan.etiquette_energie = calculerEtiquette(simBilan.cep, simBilan.eges);
    simBilan.etiquette_climat = calculerEtiquette(simBilan.cep, simBilan.eges);

    setBilan(simBilan);
    setIsCalculating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "audit_step_12", { bilan: simBilan });
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Bilan état initial</h2>

      <Alert variant="info">
        Le bilan est calculé automatiquement depuis les données saisies aux étapes 1 à 11 (méthode 3CL).
      </Alert>

      <Button onClick={handleCalculer} loading={isCalculating} fullWidth>
        {bilan.cep > 0 ? "Recalculer le bilan" : "Calculer le bilan état initial"}
      </Button>

      {bilan.cep > 0 && (
        <>
          {/* Étiquettes DPE */}
          <Card>
            <div className="flex items-center justify-around p-4">
              <EtiquetteBadge classe={bilan.etiquette_energie} label="Énergie" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{bilan.cep}</p>
                <p className="text-xs text-gray-500">kWhEP/m²/an</p>
              </div>
              <EtiquetteBadge classe={bilan.etiquette_climat} label="Climat" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{bilan.eges}</p>
                <p className="text-xs text-gray-500">kgCO₂/m²/an</p>
              </div>
            </div>
          </Card>

          {/* Consommations */}
          <Card>
            <div className="p-4">
              <TableConsommations conso={bilan.consommations} />
            </div>
          </Card>

          {/* Déperditions */}
          <Card>
            <div className="p-4">
              <BarreDeperditions deperditions={bilan.deperditions} />
            </div>
          </Card>

          {/* Estimation facture */}
          {bilan.estimation_facture && (
            <Card>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-500">Estimation facture annuelle</p>
                  <p className="text-2xl font-bold text-gray-800">{bilan.estimation_facture.toLocaleString("fr-FR")} €/an</p>
                </div>
                <span className="text-3xl">💰</span>
              </div>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleCalculer} loading={isCalculating} className="flex-1">Recalculer</Button>
            <Button onClick={() => completeStep(12)} className="flex-1">Valider le bilan</Button>
          </div>
        </>
      )}
    </div>
  );
}
