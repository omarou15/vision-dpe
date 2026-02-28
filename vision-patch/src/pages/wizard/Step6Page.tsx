import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId, isMethodeSaisieDirecte, isMethodeAvecIsolation, isAdjacenceLNC } from "@/types";
import type { PlancherBas, TypeAdjacence, TypePlancherBas, TypeIsolation, MethodeSaisieU } from "@/types";
import { Input, Select, Card, Button, Alert } from "@/components/ui";

const ADJACENCE_PB_OPTIONS: { value: TypeAdjacence; label: string }[] = [
  { value: "terre_plein", label: "Terre-plein" },
  { value: "vide_sanitaire", label: "Vide sanitaire" },
  { value: "sous_sol_non_chauffe", label: "Sous-sol non chauffé" },
  { value: "exterieur", label: "Extérieur (sur pilotis)" },
  { value: "garage", label: "Garage" },
  { value: "parc_stationnement", label: "Parc de stationnement" },
];

const TYPE_PB_OPTIONS: { value: TypePlancherBas; label: string }[] = [
  { value: "dalle_beton", label: "Dalle béton" },
  { value: "dalle_beton_entrevous", label: "Dalle béton + entrevous" },
  { value: "plancher_bois", label: "Plancher bois" },
  { value: "plancher_metal", label: "Plancher métal" },
  { value: "plancher_mixte_bois_beton", label: "Mixte bois/béton" },
  { value: "autre_plancher_bas", label: "Autre" },
];

const ISOLATION_OPTIONS: { value: TypeIsolation; label: string }[] = [
  { value: "non_isole", label: "Non isolé" },
  { value: "iti", label: "Isolé par-dessus" },
  { value: "ite", label: "Isolé par-dessous" },
  { value: "isolation_inconnue", label: "Isolation inconnue" },
];

const METHODE_U_OPTIONS: { value: MethodeSaisieU; label: string }[] = [
  { value: "non_isole_forfaitaire", label: "Non isolé — forfaitaire" },
  { value: "isole_forfaitaire_recent", label: "Isolé — forfaitaire" },
  { value: "saisie_directe_u", label: "Saisie directe Upb" },
  { value: "saisie_epaisseur_isolation", label: "Épaisseur isolation" },
  { value: "saisie_resistance_isolation", label: "Résistance isolation" },
];

function createEmpty(): PlancherBas {
  return {
    id: generateEnveloppeId("pb"), donnee_entree: {
      description: "", reference: "", type_adjacence: "terre_plein", surface: 0,
      type_plancher: "dalle_beton", type_isolation: "non_isole",
      methode_saisie_u: "non_isole_forfaitaire", upb_saisi: null, tv_upb_id: null,
      epaisseur_isolation: null, resistance_isolation: null,
      perimetre: null, surface_ue: null, ue: null, reference_lnc: null,
    }, upb: null, b: null,
  };
}

function PBForm({ pb, index, onChange, onRemove }: {
  pb: PlancherBas; index: number; onChange: (p: PlancherBas) => void; onRemove: () => void;
}) {
  const d = pb.donnee_entree;
  const upd = (p: Partial<typeof d>) => onChange({ ...pb, donnee_entree: { ...d, ...p } });
  const isTerPlein = d.type_adjacence === "terre_plein";

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Plancher bas {index + 1}</p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>
        </div>
        <Input label="Description" value={d.description} onChange={(e) => upd({ description: e.target.value })} placeholder="Plancher sur vide sanitaire" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Adjacence" value={d.type_adjacence} onChange={(e) => upd({ type_adjacence: e.target.value as TypeAdjacence })} options={ADJACENCE_PB_OPTIONS} />
          <Input label="Surface (m²)" type="number" value={d.surface || ""} onChange={(e) => upd({ surface: parseFloat(e.target.value) || 0 })} required />
        </div>
        <Select label="Type plancher" value={d.type_plancher} onChange={(e) => upd({ type_plancher: e.target.value as TypePlancherBas })} options={TYPE_PB_OPTIONS} />
        <Select label="Isolation" value={d.type_isolation} onChange={(e) => upd({ type_isolation: e.target.value as TypeIsolation })} options={ISOLATION_OPTIONS} />
        <Select label="Méthode saisie U" value={d.methode_saisie_u} onChange={(e) => upd({ methode_saisie_u: e.target.value as MethodeSaisieU })} options={METHODE_U_OPTIONS} />

        {isMethodeSaisieDirecte(d.methode_saisie_u) && (
          <Input label="Upb (W/m².K)" type="number" value={d.upb_saisi || ""} onChange={(e) => upd({ upb_saisi: parseFloat(e.target.value) || null })} placeholder="0.40" />
        )}
        {isMethodeAvecIsolation(d.methode_saisie_u) && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Épaisseur (cm)" type="number" value={d.epaisseur_isolation || ""} onChange={(e) => upd({ epaisseur_isolation: parseFloat(e.target.value) || null })} />
            <Input label="Résistance (m².K/W)" type="number" value={d.resistance_isolation || ""} onChange={(e) => upd({ resistance_isolation: parseFloat(e.target.value) || null })} />
          </div>
        )}
        {isTerPlein && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Périmètre (m)" type="number" value={d.perimetre || ""} onChange={(e) => upd({ perimetre: parseFloat(e.target.value) || null })} hint="Périmètre du plancher" />
            <Input label="Surface Ue (m²)" type="number" value={d.surface_ue || ""} onChange={(e) => upd({ surface_ue: parseFloat(e.target.value) || null })} />
          </div>
        )}
        {isAdjacenceLNC(d.type_adjacence) && <Alert variant="info">Adjacence LNC — coefficient b appliqué.</Alert>}
      </div>
    </Card>
  );
}

export default function Step6Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [items, setItems] = useState<PlancherBas[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => { if (activeProjet) { const d = syncService.getStepValues(activeProjet, "step_6"); if (d.planchers_bas) setItems(d.planchers_bas as PlancherBas[]); } }, [activeProjet]);

  async function handleSave() { if (!projetId) return; setIsSaving(true); await syncService.saveStepFields(projetId, "step_6", { planchers_bas: items }); setIsSaving(false); }
  async function handleComplete() { await handleSave(); completeStep(6); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.6")}</h2>
        <span className="text-sm text-gray-500">{items.length} plancher(s)</span>
      </div>
      {items.length === 0 && <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"><p className="text-sm text-gray-500">Aucun plancher bas.</p></div>}
      {items.map((pb, i) => <PBForm key={pb.id} pb={pb} index={i} onChange={(u) => { const n = [...items]; n[i] = u; setItems(n); }} onRemove={() => setItems(items.filter((_, j) => j !== i))} />)}
      <Button variant="secondary" onClick={() => setItems([...items, createEmpty()])} fullWidth>+ Ajouter un plancher bas</Button>
      {items.length > 0 && <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button><Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button></div>}
    </div>
  );
}
