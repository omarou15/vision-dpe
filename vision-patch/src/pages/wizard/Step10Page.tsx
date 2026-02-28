import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import type { Orientation } from "@/types";
import {
  type InstallationEcs, type GenerateurEcs, type InstallationSolaire,
  type CfgInstallationEcs, type CategorieGenerateurEcs, type TypeEnergie,
  type TypeInstallationSolaire,
} from "@/types/steps/step9-11";
import { Input, Select, ChipGroup, Card, Button, Toggle, Alert } from "@/components/ui";

const CFG_ECS_OPTIONS: { value: CfgInstallationEcs; label: string }[] = [
  { value: "ecs_seule", label: "ECS seule (production indépendante)" },
  { value: "ecs_liee_chauffage", label: "Liée au chauffage (chaudière mixte)" },
  { value: "ecs_collective", label: "ECS collective" },
];

const CAT_ECS_OPTIONS: { value: CategorieGenerateurEcs; label: string }[] = [
  { value: "chauffe_eau_electrique", label: "Chauffe-eau électrique" },
  { value: "chauffe_eau_gaz_instantane", label: "Chauffe-eau gaz instantané" },
  { value: "chauffe_eau_gaz_accumulation", label: "Chauffe-eau gaz accumulation" },
  { value: "chauffe_eau_thermodynamique", label: "Chauffe-eau thermodynamique" },
  { value: "chaudiere_gaz_ecs", label: "Chaudière gaz (production ECS)" },
  { value: "chaudiere_fioul_ecs", label: "Chaudière fioul (production ECS)" },
  { value: "pac_ecs", label: "PAC ECS" },
  { value: "ballon_solaire_cesi", label: "Ballon solaire (CESI)" },
  { value: "systeme_solaire_combine", label: "Système solaire combiné (SSC)" },
  { value: "reseau_chaleur_ecs", label: "Réseau de chaleur" },
  { value: "generateur_chauffage_mixte", label: "Générateur chauffage mixte" },
  { value: "autre_generateur_ecs", label: "Autre" },
];

const ENERGIE_OPTIONS: { value: TypeEnergie; label: string }[] = [
  { value: "electricite", label: "Électricité" },
  { value: "gaz_naturel", label: "Gaz naturel" },
  { value: "fioul_domestique", label: "Fioul" },
  { value: "solaire", label: "Solaire" },
  { value: "reseau_chaleur", label: "Réseau de chaleur" },
];

const STOCKAGE_OPTIONS = [
  { value: "sans_stockage", label: "Sans stockage" },
  { value: "ballon_vertical", label: "Ballon vertical" },
  { value: "ballon_horizontal", label: "Ballon horizontal" },
  { value: "accumulation", label: "Accumulation" },
];

const SOLAIRE_TYPE_OPTIONS: { value: TypeInstallationSolaire; label: string }[] = [
  { value: "cesi", label: "CESI (individuel)" },
  { value: "ssc", label: "SSC (combiné)" },
  { value: "collectif_appoint_individuel", label: "Collectif appoint individuel" },
  { value: "collectif_appoint_collectif", label: "Collectif appoint collectif" },
];

const ORI_CHIPS = [
  { value: "nord", label: "N" }, { value: "est", label: "E" },
  { value: "sud", label: "S" }, { value: "ouest", label: "O" },
];

function createEmptyGenEcs(): GenerateurEcs {
  return {
    id: generateEnveloppeId("gen_ecs"), description: "",
    categorie: "chauffe_eau_electrique", type_generateur_ecs_id: null,
    energie: "electricite", puissance_nominale: null,
    volume_stockage: null, type_stockage: "ballon_vertical",
    pertes_stockage: null, rpn: null, rpint: null, cop: null, scop: null,
    rendement_generation: null, presence_veilleuse: false, annee_installation: null,
  };
}

function createEmpty(): InstallationEcs {
  return {
    id: generateEnveloppeId("inst_ecs"), description: "",
    cfg_installation: "ecs_seule", reference_installation_chauffage: null,
    generateurs: [createEmptyGenEcs()], solaire: null,
    reseau_isole: false, longueur_reseau_hors_volume: null,
  };
}

function GenEcsForm({ gen, onChange }: { gen: GenerateurEcs; onChange: (g: GenerateurEcs) => void }) {
  const isCombustion = ["chaudiere_gaz_ecs", "chaudiere_fioul_ecs", "chauffe_eau_gaz_instantane", "chauffe_eau_gaz_accumulation"].includes(gen.categorie);
  const isPAC = ["chauffe_eau_thermodynamique", "pac_ecs"].includes(gen.categorie);
  const hasStockage = gen.categorie !== "chauffe_eau_gaz_instantane";

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase text-gray-500">Générateur ECS</p>
      <Input label="Description" value={gen.description} onChange={(e) => onChange({ ...gen, description: e.target.value })} placeholder="Cumulus salle de bain" />
      <Select label="Type" value={gen.categorie} onChange={(e) => onChange({ ...gen, categorie: e.target.value as CategorieGenerateurEcs })} options={CAT_ECS_OPTIONS} />
      <Select label="Énergie" value={gen.energie} onChange={(e) => onChange({ ...gen, energie: e.target.value as TypeEnergie })} options={ENERGIE_OPTIONS} />
      {isCombustion && <>
        <Input label="Rendement pleine charge (%)" type="number" value={gen.rpn || ""} onChange={(e) => onChange({ ...gen, rpn: parseFloat(e.target.value) || null })} />
        <Toggle checked={gen.presence_veilleuse} label="Présence veilleuse" onChange={(v) => onChange({ ...gen, presence_veilleuse: v })} />
      </>}
      {isPAC && <Input label="COP" type="number" value={gen.cop || ""} onChange={(e) => onChange({ ...gen, cop: parseFloat(e.target.value) || null })} />}
      {hasStockage && <>
        <Select label="Stockage" value={gen.type_stockage || "sans_stockage"} onChange={(e) => onChange({ ...gen, type_stockage: e.target.value as any })} options={STOCKAGE_OPTIONS} />
        {gen.type_stockage && gen.type_stockage !== "sans_stockage" && <Input label="Volume (litres)" type="number" value={gen.volume_stockage || ""} onChange={(e) => onChange({ ...gen, volume_stockage: parseFloat(e.target.value) || null })} />}
      </>}
      <Input label="Année d'installation" type="number" value={gen.annee_installation || ""} onChange={(e) => onChange({ ...gen, annee_installation: parseInt(e.target.value) || null })} />
    </div>
  );
}

function SolaireForm({ sol, onChange, onRemove }: { sol: InstallationSolaire; onChange: (s: InstallationSolaire) => void; onRemove: () => void }) {
  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-amber-700">Installation solaire</p>
        <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Retirer</button>
      </div>
      <Select label="Type" value={sol.type_installation} onChange={(e) => onChange({ ...sol, type_installation: e.target.value as TypeInstallationSolaire })} options={SOLAIRE_TYPE_OPTIONS} />
      <Input label="Surface capteurs (m²)" type="number" value={sol.surface_capteurs || ""} onChange={(e) => onChange({ ...sol, surface_capteurs: parseFloat(e.target.value) || 0 })} required />
      <div><p className="mb-1.5 text-sm font-medium text-gray-700">Orientation</p><ChipGroup options={ORI_CHIPS} value={sol.orientation} onChange={(v) => onChange({ ...sol, orientation: v as Orientation })} /></div>
      <Input label="Inclinaison (°)" type="number" value={sol.inclinaison || ""} onChange={(e) => onChange({ ...sol, inclinaison: parseFloat(e.target.value) || 0 })} />
    </div>
  );
}

export default function Step10Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [items, setItems] = useState<InstallationEcs[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => { if (activeProjet) { const d = syncService.getStepValues(activeProjet, "step_10"); if (d.installations_ecs) setItems(d.installations_ecs as InstallationEcs[]); } }, [activeProjet]);

  async function handleSave() { if (!projetId) return; setIsSaving(true); await syncService.saveStepFields(projetId, "step_10", { installations_ecs: items }); setIsSaving(false); }
  async function handleComplete() { await handleSave(); completeStep(10); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.10")}</h2>
      {items.length === 0 && <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"><p className="text-sm text-gray-500">Aucune installation ECS.</p></div>}
      {items.map((inst, i) => (
        <Card key={inst.id}>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-700">Installation ECS {i + 1}</p>
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
            <Select label="Configuration" value={inst.cfg_installation} onChange={(e) => { const n = [...items]; n[i] = { ...inst, cfg_installation: e.target.value as CfgInstallationEcs }; setItems(n); }} options={CFG_ECS_OPTIONS} />
            {inst.generateurs.map((gen, gi) => <GenEcsForm key={gen.id} gen={gen} onChange={(g) => { const gs = [...inst.generateurs]; gs[gi] = g; const n = [...items]; n[i] = { ...inst, generateurs: gs }; setItems(n); }} />)}
            <Toggle checked={inst.reseau_isole} label="Réseau de distribution isolé" onChange={(v) => { const n = [...items]; n[i] = { ...inst, reseau_isole: v }; setItems(n); }} />
            {inst.solaire ? <SolaireForm sol={inst.solaire} onChange={(s) => { const n = [...items]; n[i] = { ...inst, solaire: s }; setItems(n); }} onRemove={() => { const n = [...items]; n[i] = { ...inst, solaire: null }; setItems(n); }} /> : (
              <Button variant="secondary" onClick={() => { const n = [...items]; n[i] = { ...inst, solaire: { type_installation: "cesi", surface_capteurs: 0, orientation: "sud", inclinaison: 45, productivite: null } }; setItems(n); }} fullWidth>+ Ajouter installation solaire</Button>
            )}
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, createEmpty()])} fullWidth>+ Ajouter une installation ECS</Button>
      {items.length > 0 && <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button><Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button></div>}
    </div>
  );
}
