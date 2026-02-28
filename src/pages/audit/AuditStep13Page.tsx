import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import { POSTE_LABELS, type PosteTravaux, type ClasseDpe } from "@/types/steps/step12-14";
import type { Parcours1Audit, EtapeTravauxAudit, TravailAudit } from "@/types/steps/audit";
import { Input, Select, Card, Button, Alert } from "@/components/ui";

const CLASSE_OPTIONS: { value: ClasseDpe; label: string }[] = [
  { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
  { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
];
const POSTE_OPTIONS = Object.entries(POSTE_LABELS).map(([v, l]) => ({ value: v as PosteTravaux, label: l }));

function createTravailAudit(): TravailAudit {
  return {
    id: generateEnveloppeId("ta"), poste: "isolation_murs", description: "",
    cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null,
    produit_preconise: "", reference_produit: null, performance_attendue: null, duree_vie: null,
  };
}

function createEtapeAudit(num: number): EtapeTravauxAudit {
  return {
    id: generateEnveloppeId("ea"), numero: num, description: "",
    travaux: [createTravailAudit()],
    cout_ht: null, cout_ttc: null, classe_atteinte: null, cep_apres: null, eges_apres: null,
  };
}

function TravailAuditForm({ t, onChange, onRemove }: { t: TravailAudit; onChange: (t: TravailAudit) => void; onRemove: () => void }) {
  return (
    <div className="space-y-2 rounded border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <Select label="Poste" value={t.poste} onChange={(e) => onChange({ ...t, poste: e.target.value as PosteTravaux })} options={POSTE_OPTIONS} className="flex-1" />
        <button onClick={onRemove} className="mt-6 text-xs text-red-500 hover:underline">×</button>
      </div>
      <Input label="Description travaux" value={t.description} onChange={(e) => onChange({ ...t, description: e.target.value })} placeholder="Isolation thermique par l'extérieur polystyrène 160mm" />
      <Input label="Produit préconisé *" value={t.produit_preconise} onChange={(e) => onChange({ ...t, produit_preconise: e.target.value })} placeholder="ITE PSE graphité R=5.0 m².K/W" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Référence produit" value={t.reference_produit || ""} onChange={(e) => onChange({ ...t, reference_produit: e.target.value || null })} placeholder="Marque / Réf" />
        <Input label="Performance attendue" value={t.performance_attendue || ""} onChange={(e) => onChange({ ...t, performance_attendue: e.target.value || null })} placeholder="R=5.0 m².K/W" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="Coût TTC (€)" type="number" value={t.cout_estime || ""} onChange={(e) => onChange({ ...t, cout_estime: parseFloat(e.target.value) || null })} />
        <Input label="Gain EP" type="number" value={t.gain_energetique_estime || ""} onChange={(e) => onChange({ ...t, gain_energetique_estime: parseFloat(e.target.value) || null })} hint="kWhEP/m²/an" />
        <Input label="Durée vie" type="number" value={t.duree_vie || ""} onChange={(e) => onChange({ ...t, duree_vie: parseInt(e.target.value) || null })} hint="années" />
      </div>
    </div>
  );
}

function EtapeAuditForm({ etape, onChange, onRemove, canRemove }: {
  etape: EtapeTravauxAudit; onChange: (e: EtapeTravauxAudit) => void; onRemove: () => void; canRemove: boolean;
}) {
  function updateTravail(i: number, t: TravailAudit) { const n = [...etape.travaux]; n[i] = t; onChange({ ...etape, travaux: n }); }
  function removeTravail(i: number) { if (etape.travaux.length > 1) onChange({ ...etape, travaux: etape.travaux.filter((_, j) => j !== i) }); }

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy-700">Étape {etape.numero}</p>
          <div className="flex items-center gap-2">
            <Select value={etape.classe_atteinte || ""} onChange={(e) => onChange({ ...etape, classe_atteinte: (e.target.value || null) as ClasseDpe | null })} options={[{ value: "", label: "Classe atteinte" }, ...CLASSE_OPTIONS]} className="w-36" />
            {canRemove && <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>}
          </div>
        </div>

        <Input label="Description de l'étape" value={etape.description} onChange={(e) => onChange({ ...etape, description: e.target.value })} placeholder="Première étape : isolation enveloppe" />

        {etape.travaux.map((t, i) => (
          <TravailAuditForm key={t.id} t={t} onChange={(u) => updateTravail(i, u)} onRemove={() => removeTravail(i)} />
        ))}

        <button onClick={() => onChange({ ...etape, travaux: [...etape.travaux, createTravailAudit()] })} className="text-sm text-blue-600 hover:underline">
          + Ajouter un travail
        </button>

        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <Input label="Coût HT (€)" type="number" value={etape.cout_ht || ""} onChange={(e) => onChange({ ...etape, cout_ht: parseFloat(e.target.value) || null })} />
          <Input label="Coût TTC (€)" type="number" value={etape.cout_ttc || ""} onChange={(e) => onChange({ ...etape, cout_ttc: parseFloat(e.target.value) || null })} />
          <Input label="Cep après (kWhEP/m²/an)" type="number" value={etape.cep_apres || ""} onChange={(e) => onChange({ ...etape, cep_apres: parseFloat(e.target.value) || null })} />
          <Input label="Eges après (kgCO₂/m²/an)" type="number" value={etape.eges_apres || ""} onChange={(e) => onChange({ ...etape, eges_apres: parseFloat(e.target.value) || null })} />
        </div>
      </div>
    </Card>
  );
}

export default function AuditStep13Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [parcours, setParcours] = useState<Parcours1Audit>({
    etapes: [createEtapeAudit(1), createEtapeAudit(2)],
    dpe_projete: null, cout_total_ttc: null, classe_objectif: "C", conforme: false,
  });

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "audit_step_13");
    if (d.parcours1) setParcours(d.parcours1 as Parcours1Audit);
  }, [activeProjet]);

  function updateEtape(i: number, e: EtapeTravauxAudit) {
    const n = [...parcours.etapes]; n[i] = e;
    setParcours({ ...parcours, etapes: n });
  }
  function removeEtape(i: number) {
    if (parcours.etapes.length > 2) {
      setParcours({ ...parcours, etapes: parcours.etapes.filter((_, j) => j !== i).map((e, j) => ({ ...e, numero: j + 1 })) });
    }
  }

  async function handleSave() {
    if (!projetId) return;
    await syncService.saveStepFields(projetId, "audit_step_13", { parcours1: parcours });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Parcours 1 — Travaux par étapes</h2>

      <Alert variant="info">
        Le parcours 1 est progressif : minimum 2 étapes de travaux. Objectif réglementaire : atteindre la classe C minimum.
      </Alert>

      <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
        <p className="text-sm font-semibold text-green-800">🎯 Objectif : Classe C minimum</p>
      </div>

      {parcours.etapes.map((et, i) => (
        <EtapeAuditForm
          key={et.id} etape={et}
          onChange={(u) => updateEtape(i, u)}
          onRemove={() => removeEtape(i)}
          canRemove={parcours.etapes.length > 2}
        />
      ))}

      <button onClick={() => setParcours({ ...parcours, etapes: [...parcours.etapes, createEtapeAudit(parcours.etapes.length + 1)] })} className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-sm text-blue-600 hover:bg-blue-100">
        + Ajouter une étape au parcours
      </button>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={handleSave} className="flex-1">Enregistrer</Button>
        <Button onClick={() => { handleSave(); completeStep(13); }} className="flex-1">Valider le parcours 1</Button>
      </div>
    </div>
  );
}
