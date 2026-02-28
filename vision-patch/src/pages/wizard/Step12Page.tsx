import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import {
  POSTE_LABELS, CLASSE_MINIMALE_PARCOURS,
  type ParcoursTravaux, type EtapeTravaux, type Travail,
  type PosteTravaux, type ClasseDpe,
} from "@/types/steps/step12-14";
import { Input, Select, Card, Button, Alert } from "@/components/ui";

const CLASSE_OPTIONS: { value: ClasseDpe; label: string }[] = [
  { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
  { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
];

const POSTE_OPTIONS: { value: PosteTravaux; label: string }[] =
  Object.entries(POSTE_LABELS).map(([v, l]) => ({ value: v as PosteTravaux, label: l }));

const CLASSE_COLORS: Record<ClasseDpe, string> = {
  A: "bg-green-100 text-green-800", B: "bg-lime-100 text-lime-800",
  C: "bg-yellow-100 text-yellow-800", D: "bg-orange-100 text-orange-800",
  E: "bg-red-100 text-red-700", F: "bg-red-200 text-red-800", G: "bg-red-300 text-red-900",
};

function createTravail(): Travail {
  return { id: generateEnveloppeId("trav"), poste: "isolation_murs", description: "", cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null };
}

function createEtape(num: number): EtapeTravaux {
  return { id: generateEnveloppeId("et"), numero: num, description: "", travaux: [createTravail()], cout_cumule: null, classe_visee: null };
}

function createParcours(num: 1 | 2): ParcoursTravaux {
  return {
    id: generateEnveloppeId("parc"), numero_parcours: num,
    description: num === 1 ? "Parcours progressif (par étapes)" : "Rénovation globale",
    etapes: [createEtape(1)],
    classe_actuelle: null, classe_visee: null,
    cout_total: null, gain_total_ep: null, gain_total_ges: null,
  };
}

// ── Sous-formulaire travail ──
function TravailForm({ t, onChange, onRemove }: { t: Travail; onChange: (t: Travail) => void; onRemove: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <Select label="Poste" value={t.poste} onChange={(e) => onChange({ ...t, poste: e.target.value as PosteTravaux })} options={POSTE_OPTIONS} className="flex-1" />
        <button onClick={onRemove} className="mt-6 text-xs text-red-500 hover:underline">×</button>
      </div>
      <Input label="Description" value={t.description} onChange={(e) => onChange({ ...t, description: e.target.value })} placeholder="Isolation murs par l'extérieur R=4.5" />
      <div className="grid grid-cols-3 gap-2">
        <Input label="Coût (€)" type="number" value={t.cout_estime || ""} onChange={(e) => onChange({ ...t, cout_estime: parseFloat(e.target.value) || null })} />
        <Input label="Gain EP" type="number" value={t.gain_energetique_estime || ""} onChange={(e) => onChange({ ...t, gain_energetique_estime: parseFloat(e.target.value) || null })} hint="kWhEP/m²/an" />
        <Input label="Gain CO₂" type="number" value={t.gain_co2_estime || ""} onChange={(e) => onChange({ ...t, gain_co2_estime: parseFloat(e.target.value) || null })} hint="kgCO₂/m²/an" />
      </div>
    </div>
  );
}

// ── Sous-formulaire étape travaux ──
function EtapeTravauxForm({ etape, onChange }: { etape: EtapeTravaux; onChange: (e: EtapeTravaux) => void }) {
  function updateTravail(i: number, t: Travail) { const n = [...etape.travaux]; n[i] = t; onChange({ ...etape, travaux: n }); }
  function removeTravail(i: number) { onChange({ ...etape, travaux: etape.travaux.filter((_, j) => j !== i) }); }

  return (
    <div className="space-y-3 rounded-lg bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Étape {etape.numero}</p>
        <Select value={etape.classe_visee || ""} onChange={(e) => onChange({ ...etape, classe_visee: (e.target.value || null) as ClasseDpe | null })} options={[{ value: "", label: "Classe visée" }, ...CLASSE_OPTIONS]} className="w-28" />
      </div>
      {etape.travaux.map((t, i) => <TravailForm key={t.id} t={t} onChange={(u) => updateTravail(i, u)} onRemove={() => removeTravail(i)} />)}
      <button onClick={() => onChange({ ...etape, travaux: [...etape.travaux, createTravail()] })} className="text-sm text-blue-600 hover:underline">+ Ajouter un travail</button>
    </div>
  );
}

// ── Formulaire parcours ──
function ParcoursForm({ parcours, onChange }: { parcours: ParcoursTravaux; onChange: (p: ParcoursTravaux) => void }) {
  const classeMin = CLASSE_MINIMALE_PARCOURS[parcours.numero_parcours];

  return (
    <Card>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-navy-700">
            Parcours {parcours.numero_parcours} — {parcours.description}
          </p>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${CLASSE_COLORS[classeMin]}`}>
            Objectif : {classeMin}+
          </span>
        </div>

        <Alert variant="info">
          Obligation réglementaire : ce parcours doit atteindre au minimum la classe {classeMin}.
        </Alert>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Classe actuelle" value={parcours.classe_actuelle || ""} onChange={(e) => onChange({ ...parcours, classe_actuelle: (e.target.value || null) as ClasseDpe | null })} options={[{ value: "", label: "—" }, ...CLASSE_OPTIONS]} />
          <Select label="Classe visée" value={parcours.classe_visee || ""} onChange={(e) => onChange({ ...parcours, classe_visee: (e.target.value || null) as ClasseDpe | null })} options={[{ value: "", label: "—" }, ...CLASSE_OPTIONS]} />
        </div>

        {parcours.etapes.map((et, i) => (
          <EtapeTravauxForm key={et.id} etape={et} onChange={(u) => { const n = [...parcours.etapes]; n[i] = u; onChange({ ...parcours, etapes: n }); }} />
        ))}

        {parcours.numero_parcours === 1 && (
          <button onClick={() => onChange({ ...parcours, etapes: [...parcours.etapes, createEtape(parcours.etapes.length + 1)] })} className="text-sm text-blue-600 hover:underline">
            + Ajouter une étape au parcours
          </button>
        )}

        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          <Input label="Coût total (€)" type="number" value={parcours.cout_total || ""} onChange={(e) => onChange({ ...parcours, cout_total: parseFloat(e.target.value) || null })} />
          <Input label="Gain EP" type="number" value={parcours.gain_total_ep || ""} onChange={(e) => onChange({ ...parcours, gain_total_ep: parseFloat(e.target.value) || null })} hint="kWhEP/m²/an" />
          <Input label="Gain GES" type="number" value={parcours.gain_total_ges || ""} onChange={(e) => onChange({ ...parcours, gain_total_ges: parseFloat(e.target.value) || null })} hint="kgCO₂/m²/an" />
        </div>
      </div>
    </Card>
  );
}

// ── Page ──
export default function Step12Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [parcours, setParcours] = useState<ParcoursTravaux[]>([createParcours(1), createParcours(2)]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "step_12");
    if (d.parcours && Array.isArray(d.parcours) && d.parcours.length > 0) setParcours(d.parcours as ParcoursTravaux[]);
  }, [activeProjet]);

  function updateParcours(i: number, p: ParcoursTravaux) { const n = [...parcours]; n[i] = p; setParcours(n); }

  async function handleSave() {
    if (!projetId) return; setIsSaving(true);
    await syncService.saveStepFields(projetId, "step_12", { parcours });
    setIsSaving(false);
  }
  async function handleComplete() { await handleSave(); completeStep(12); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.12")}</h2>
      <Alert variant="warning">
        Depuis la réforme DPE 2021, 2 scénarios de travaux sont obligatoires dans tout DPE.
      </Alert>
      {parcours.map((p, i) => <ParcoursForm key={p.id} parcours={p} onChange={(u) => updateParcours(i, u)} />)}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button>
        <Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button>
      </div>
    </div>
  );
}
