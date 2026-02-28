import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId, isMethodeSaisieDirecte, isMethodeAvecIsolation } from "@/types";
import type { PlancherHaut, TypeAdjacence, TypePlancherHaut, TypeIsolation, MethodeSaisieU } from "@/types";
import { Input, Select, Card, Button } from "@/components/ui";

const ADJACENCE_PH_OPTIONS: { value: TypeAdjacence; label: string }[] = [
  { value: "exterieur", label: "Extérieur (terrasse)" },
  { value: "comble_perdu", label: "Combles perdus" },
  { value: "comble_amenage_non_chauffe", label: "Combles aménagés non chauffés" },
];

const TYPE_PH_OPTIONS: { value: TypePlancherHaut; label: string }[] = [
  { value: "combles_perdus_bois", label: "Combles perdus — bois" },
  { value: "combles_perdus_beton", label: "Combles perdus — béton" },
  { value: "combles_amenages_bois", label: "Combles aménagés — bois" },
  { value: "combles_amenages_beton", label: "Combles aménagés — béton" },
  { value: "terrasse_beton", label: "Terrasse béton" },
  { value: "terrasse_bois", label: "Terrasse bois" },
  { value: "toiture_bac_acier", label: "Bac acier" },
  { value: "autre_plancher_haut", label: "Autre" },
];

const ISOLATION_OPTIONS: { value: TypeIsolation; label: string }[] = [
  { value: "non_isole", label: "Non isolé" },
  { value: "iti", label: "Isolé par-dessous (plafond)" },
  { value: "ite", label: "Isolé par-dessus (toiture)" },
  { value: "isolation_inconnue", label: "Isolation inconnue" },
];

const METHODE_U_OPTIONS: { value: MethodeSaisieU; label: string }[] = [
  { value: "non_isole_forfaitaire", label: "Non isolé — forfaitaire" },
  { value: "isole_forfaitaire_recent", label: "Isolé — forfaitaire" },
  { value: "saisie_directe_u", label: "Saisie directe Uph" },
  { value: "saisie_epaisseur_isolation", label: "Épaisseur isolation" },
  { value: "saisie_resistance_isolation", label: "Résistance isolation" },
];

function createEmpty(): PlancherHaut {
  return {
    id: generateEnveloppeId("ph"), donnee_entree: {
      description: "", reference: "", type_adjacence: "comble_perdu", surface: 0,
      type_plancher: "combles_perdus_bois", type_isolation: "non_isole",
      methode_saisie_u: "non_isole_forfaitaire", uph_saisi: null, tv_uph_id: null,
      epaisseur_isolation: null, resistance_isolation: null, reference_lnc: null,
    }, uph: null, b: null,
  };
}

function PHForm({ ph, index, onChange, onRemove }: {
  ph: PlancherHaut; index: number; onChange: (p: PlancherHaut) => void; onRemove: () => void;
}) {
  const d = ph.donnee_entree;
  const upd = (p: Partial<typeof d>) => onChange({ ...ph, donnee_entree: { ...d, ...p } });

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Plancher haut {index + 1}</p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>
        </div>
        <Input label="Description" value={d.description} onChange={(e) => upd({ description: e.target.value })} placeholder="Toiture terrasse" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Adjacence" value={d.type_adjacence} onChange={(e) => upd({ type_adjacence: e.target.value as TypeAdjacence })} options={ADJACENCE_PH_OPTIONS} />
          <Input label="Surface (m²)" type="number" value={d.surface || ""} onChange={(e) => upd({ surface: parseFloat(e.target.value) || 0 })} required />
        </div>
        <Select label="Type" value={d.type_plancher} onChange={(e) => upd({ type_plancher: e.target.value as TypePlancherHaut })} options={TYPE_PH_OPTIONS} />
        <Select label="Isolation" value={d.type_isolation} onChange={(e) => upd({ type_isolation: e.target.value as TypeIsolation })} options={ISOLATION_OPTIONS} />
        <Select label="Méthode saisie U" value={d.methode_saisie_u} onChange={(e) => upd({ methode_saisie_u: e.target.value as MethodeSaisieU })} options={METHODE_U_OPTIONS} />
        {isMethodeSaisieDirecte(d.methode_saisie_u) && (
          <Input label="Uph (W/m².K)" type="number" value={d.uph_saisi || ""} onChange={(e) => upd({ uph_saisi: parseFloat(e.target.value) || null })} placeholder="0.25" />
        )}
        {isMethodeAvecIsolation(d.methode_saisie_u) && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Épaisseur (cm)" type="number" value={d.epaisseur_isolation || ""} onChange={(e) => upd({ epaisseur_isolation: parseFloat(e.target.value) || null })} />
            <Input label="Résistance (m².K/W)" type="number" value={d.resistance_isolation || ""} onChange={(e) => upd({ resistance_isolation: parseFloat(e.target.value) || null })} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Step7Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [items, setItems] = useState<PlancherHaut[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => { if (activeProjet) { const d = syncService.getStepValues(activeProjet, "step_7"); if (d.planchers_hauts) setItems(d.planchers_hauts as PlancherHaut[]); } }, [activeProjet]);

  async function handleSave() { if (!projetId) return; setIsSaving(true); await syncService.saveStepFields(projetId, "step_7", { planchers_hauts: items }); setIsSaving(false); }
  async function handleComplete() { await handleSave(); completeStep(7); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.7")}</h2>
        <span className="text-sm text-gray-500">{items.length} plancher(s)</span>
      </div>
      {items.length === 0 && <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"><p className="text-sm text-gray-500">Aucun plancher haut.</p></div>}
      {items.map((ph, i) => <PHForm key={ph.id} ph={ph} index={i} onChange={(u) => { const n = [...items]; n[i] = u; setItems(n); }} onRemove={() => setItems(items.filter((_, j) => j !== i))} />)}
      <Button variant="secondary" onClick={() => setItems([...items, createEmpty()])} fullWidth>+ Ajouter un plancher haut</Button>
      {items.length > 0 && <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button><Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button></div>}
    </div>
  );
}
