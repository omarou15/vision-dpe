import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import { POSTE_LABELS, type PosteTravaux, type ClasseDpe } from "@/types/steps/step12-14";
import type { Parcours2Audit, TravailAudit } from "@/types/steps/audit";
import { Input, Select, Card, Button, Alert } from "@/components/ui";

const POSTE_OPTIONS = Object.entries(POSTE_LABELS).map(([v, l]) => ({ value: v as PosteTravaux, label: l }));

function createTravailAudit(): TravailAudit {
  return {
    id: generateEnveloppeId("ta2"), poste: "isolation_murs", description: "",
    cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null,
    produit_preconise: "", reference_produit: null, performance_attendue: null, duree_vie: null,
  };
}

function TravailForm({ t, onChange, onRemove }: { t: TravailAudit; onChange: (t: TravailAudit) => void; onRemove: () => void }) {
  return (
    <div className="space-y-2 rounded border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <Select label="Poste" value={t.poste} onChange={(e) => onChange({ ...t, poste: e.target.value as PosteTravaux })} options={POSTE_OPTIONS} className="flex-1" />
        <button onClick={onRemove} className="mt-6 text-xs text-red-500 hover:underline">×</button>
      </div>
      <Input label="Description" value={t.description} onChange={(e) => onChange({ ...t, description: e.target.value })} placeholder="Isolation complète par l'extérieur + remplacement menuiseries" />
      <Input label="Produit préconisé *" value={t.produit_preconise} onChange={(e) => onChange({ ...t, produit_preconise: e.target.value })} placeholder="ITE + menuiseries PVC triple vitrage" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Performance" value={t.performance_attendue || ""} onChange={(e) => onChange({ ...t, performance_attendue: e.target.value || null })} placeholder="R=6.0 / Uw=0.9" />
        <Input label="Durée vie (ans)" type="number" value={t.duree_vie || ""} onChange={(e) => onChange({ ...t, duree_vie: parseInt(e.target.value) || null })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Coût TTC (€)" type="number" value={t.cout_estime || ""} onChange={(e) => onChange({ ...t, cout_estime: parseFloat(e.target.value) || null })} />
        <Input label="Gain EP (kWhEP/m²/an)" type="number" value={t.gain_energetique_estime || ""} onChange={(e) => onChange({ ...t, gain_energetique_estime: parseFloat(e.target.value) || null })} />
      </div>
    </div>
  );
}

export default function AuditStep15Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [parcours, setParcours] = useState<Parcours2Audit>({
    travaux: [createTravailAudit()],
    dpe_projete: null, cout_total_ttc: null, planning_mois: null,
    classe_objectif: "B", conforme: false,
  });

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "audit_step_15");
    if (d.parcours2) setParcours(d.parcours2 as Parcours2Audit);
  }, [activeProjet]);

  function updateTravail(i: number, t: TravailAudit) {
    const n = [...parcours.travaux]; n[i] = t;
    setParcours({ ...parcours, travaux: n });
  }
  function removeTravail(i: number) {
    if (parcours.travaux.length > 1) setParcours({ ...parcours, travaux: parcours.travaux.filter((_, j) => j !== i) });
  }

  async function handleSave() {
    if (!projetId) return;
    await syncService.saveStepFields(projetId, "audit_step_15", { parcours2: parcours });
  }

  const coutTotal = parcours.travaux.reduce((s, t) => s + (t.cout_estime || 0), 0);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Parcours 2 — Rénovation globale</h2>

      <Alert variant="info">
        Le parcours 2 est une intervention unique et globale. Tous les postes sont traités simultanément. Objectif : classe B minimum.
      </Alert>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
        <p className="text-sm font-semibold text-blue-800">🎯 Objectif : Classe B minimum</p>
        <p className="text-xs text-blue-600 mt-1">Intervention unique, plus ambitieuse que le parcours 1</p>
      </div>

      {parcours.travaux.map((t, i) => (
        <TravailForm key={t.id} t={t} onChange={(u) => updateTravail(i, u)} onRemove={() => removeTravail(i)} />
      ))}

      <button onClick={() => setParcours({ ...parcours, travaux: [...parcours.travaux, createTravailAudit()] })} className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-sm text-blue-600 hover:bg-blue-100">
        + Ajouter un poste de travaux
      </button>

      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Récapitulatif parcours 2</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500">Coût total TTC</p>
              <p className="text-lg font-bold text-gray-800">{coutTotal.toLocaleString("fr-FR")} €</p>
            </div>
            <Input label="Planning (mois)" type="number" value={parcours.planning_mois || ""} onChange={(e) => setParcours({ ...parcours, planning_mois: parseInt(e.target.value) || null })} />
          </div>
        </div>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={handleSave} className="flex-1">Enregistrer</Button>
        <Button onClick={() => { handleSave(); completeStep(15); }} className="flex-1">Valider le parcours 2</Button>
      </div>
    </div>
  );
}
