import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import {
  getChampsVisibles, isChampRequis, ENERGIE_PAR_DEFAUT,
  type InstallationChauffage, type GenerateurChauffage,
  type CfgInstallationCh, type CategorieGenerateurCh, type TypeEnergie,
  type TypeEmissionDistribution, type ChampGenerateurCh,
} from "@/types/steps/step9-11";
import { Input, Select, Card, Button, Toggle, Alert } from "@/components/ui";

const CFG_OPTIONS: { value: CfgInstallationCh; label: string }[] = [
  { value: "installation_unique", label: "Installation unique" },
  { value: "deux_generateurs_base_appoint", label: "Base + appoint" },
  { value: "chauffage_electrique_base", label: "Chauffage électrique" },
  { value: "pompe_chaleur_base_appoint", label: "PAC + appoint" },
  { value: "insert_base_appoint", label: "Insert + appoint" },
  { value: "poele_base_appoint", label: "Poêle + appoint" },
  { value: "generateur_collectif", label: "Collectif" },
];

const CATEGORIE_OPTIONS: { value: CategorieGenerateurCh; label: string }[] = [
  { value: "chaudiere_gaz_condensation", label: "Chaudière gaz condensation" },
  { value: "chaudiere_gaz", label: "Chaudière gaz" },
  { value: "chaudiere_fioul", label: "Chaudière fioul" },
  { value: "chaudiere_fioul_condensation", label: "Chaudière fioul condensation" },
  { value: "pac_air_eau", label: "PAC air/eau" },
  { value: "pac_air_air", label: "PAC air/air" },
  { value: "pac_geothermique", label: "PAC géothermique" },
  { value: "radiateur_electrique", label: "Radiateur électrique" },
  { value: "convecteur_electrique", label: "Convecteur électrique" },
  { value: "panneau_rayonnant", label: "Panneau rayonnant" },
  { value: "plancher_chauffant_electrique", label: "Plancher chauffant élec." },
  { value: "poele_granules", label: "Poêle granulés" },
  { value: "poele_bois_buches", label: "Poêle bois bûches" },
  { value: "insert_bois", label: "Insert bois" },
  { value: "chaudiere_bois_granules", label: "Chaudière bois granulés" },
  { value: "chaudiere_bois_buches", label: "Chaudière bois bûches" },
  { value: "reseau_chaleur", label: "Réseau de chaleur" },
  { value: "autre_generateur_ch", label: "Autre" },
];

const ENERGIE_OPTIONS: { value: TypeEnergie; label: string }[] = [
  { value: "electricite", label: "Électricité" },
  { value: "gaz_naturel", label: "Gaz naturel" },
  { value: "gaz_propane_butane", label: "GPL" },
  { value: "fioul_domestique", label: "Fioul" },
  { value: "bois_buches", label: "Bois bûches" },
  { value: "bois_granules", label: "Bois granulés" },
  { value: "reseau_chaleur", label: "Réseau de chaleur" },
];

const EMETTEUR_OPTIONS: { value: TypeEmissionDistribution; label: string }[] = [
  { value: "radiateur_haute_temperature", label: "Radiateur haute temp." },
  { value: "radiateur_basse_temperature", label: "Radiateur basse temp." },
  { value: "plancher_chauffant", label: "Plancher chauffant" },
  { value: "convecteur", label: "Convecteur" },
  { value: "ventilo_convecteur", label: "Ventilo-convecteur" },
  { value: "split_gainable", label: "Split / gainable" },
];

const CHAMP_LABELS: Record<ChampGenerateurCh, string> = {
  puissance_nominale: "Puissance nominale (kW)",
  rpn: "Rendement pleine charge (%)",
  rpint: "Rendement charge intermédiaire (%)",
  rendement_generation: "Rendement de génération (%)",
  scop: "SCOP",
  cop: "COP",
  rendement_combustion: "Rendement combustion (%)",
  presence_veilleuse: "Présence veilleuse",
  annee_installation: "Année d'installation",
};

function createEmptyGen(priorite: "base" | "appoint" = "base"): GenerateurChauffage {
  return {
    id: generateEnveloppeId("gen_ch"), description: "",
    categorie: "chaudiere_gaz_condensation", type_generateur_ch_id: null,
    energie: "gaz_naturel", puissance_nominale: null,
    rpn: null, rpint: null, rendement_generation: null,
    scop: null, cop: null, rendement_combustion: null,
    presence_veilleuse: false, priorite, surface_chauffee: null,
    part_surface: null, annee_installation: null,
  };
}

function createEmpty(): InstallationChauffage {
  return {
    id: generateEnveloppeId("inst_ch"), description: "",
    cfg_installation: "installation_unique", surface_chauffee: 0,
    generateurs: [createEmptyGen()],
    emetteurs: [{ id: generateEnveloppeId("em"), type_emission: "radiateur_haute_temperature", annee_installation: null, reseau_isole: false, longueur_reseau_hors_volume: null }],
    regulation: { equipement_intermittence: "thermostat_central", regulation_pied_colonne: false, comptage_individuel: false },
  };
}

function GenForm({ gen, onChange }: { gen: GenerateurChauffage; onChange: (g: GenerateurChauffage) => void }) {
  const visibles = getChampsVisibles(gen.categorie);
  function handleCat(cat: CategorieGenerateurCh) {
    onChange({ ...gen, categorie: cat, energie: ENERGIE_PAR_DEFAUT[cat], rpn: null, rpint: null, rendement_generation: null, scop: null, cop: null, rendement_combustion: null, presence_veilleuse: false });
  }
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase text-gray-500">Générateur — {gen.priorite}</p>
      <Input label="Description" value={gen.description} onChange={(e) => onChange({ ...gen, description: e.target.value })} placeholder="Chaudière murale cuisine" />
      <Select label="Type de générateur" value={gen.categorie} onChange={(e) => handleCat(e.target.value as CategorieGenerateurCh)} options={CATEGORIE_OPTIONS} />
      <Select label="Énergie" value={gen.energie} onChange={(e) => onChange({ ...gen, energie: e.target.value as TypeEnergie })} options={ENERGIE_OPTIONS} />
      {visibles.filter((c) => c !== "presence_veilleuse" && c !== "annee_installation").map((champ) => (
        <Input key={champ} label={`${CHAMP_LABELS[champ]}${isChampRequis(gen.categorie, champ) ? " *" : ""}`}
          type="number" value={(gen as any)[champ] || ""}
          onChange={(e) => onChange({ ...gen, [champ]: parseFloat(e.target.value) || null })}
          required={isChampRequis(gen.categorie, champ)} />
      ))}
      {visibles.includes("presence_veilleuse") && <Toggle checked={gen.presence_veilleuse} label="Présence veilleuse" onChange={(v) => onChange({ ...gen, presence_veilleuse: v })} />}
      {visibles.includes("annee_installation") && <Input label="Année d'installation" type="number" value={gen.annee_installation || ""} onChange={(e) => onChange({ ...gen, annee_installation: parseInt(e.target.value) || null })} />}
    </div>
  );
}

function InstForm({ inst, index, onChange, onRemove }: { inst: InstallationChauffage; index: number; onChange: (i: InstallationChauffage) => void; onRemove: () => void }) {
  function handleCfg(cfg: CfgInstallationCh) {
    const needs2 = ["deux_generateurs_base_appoint", "pompe_chaleur_base_appoint", "insert_base_appoint", "poele_base_appoint"].includes(cfg);
    let gens = [...inst.generateurs];
    if (needs2 && gens.length < 2) gens.push(createEmptyGen("appoint"));
    if (!needs2 && gens.length > 1) gens = [gens[0]];
    onChange({ ...inst, cfg_installation: cfg, generateurs: gens });
  }
  return (
    <Card>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Installation chauffage {index + 1}</p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>
        </div>
        <Input label="Description" value={inst.description} onChange={(e) => onChange({ ...inst, description: e.target.value })} placeholder="Chauffage principal" />
        <Select label="Configuration" value={inst.cfg_installation} onChange={(e) => handleCfg(e.target.value as CfgInstallationCh)} options={CFG_OPTIONS} />
        <Input label="Surface chauffée (m²)" type="number" value={inst.surface_chauffee || ""} onChange={(e) => onChange({ ...inst, surface_chauffee: parseFloat(e.target.value) || 0 })} required />
        {inst.generateurs.map((gen, gi) => <GenForm key={gen.id} gen={gen} onChange={(g) => { const gs = [...inst.generateurs]; gs[gi] = g; onChange({ ...inst, generateurs: gs }); }} />)}
        {inst.emetteurs[0] && <Select label="Type d'émetteur" value={inst.emetteurs[0].type_emission} onChange={(e) => { const ems = [...inst.emetteurs]; ems[0] = { ...ems[0], type_emission: e.target.value as TypeEmissionDistribution }; onChange({ ...inst, emetteurs: ems }); }} options={EMETTEUR_OPTIONS} />}
        <Select label="Régulation" value={inst.regulation.equipement_intermittence} onChange={(e) => onChange({ ...inst, regulation: { ...inst.regulation, equipement_intermittence: e.target.value as any } })} options={[
          { value: "thermostat_central", label: "Thermostat central" },
          { value: "robinet_thermostatique", label: "Robinets thermostatiques" },
          { value: "programmation", label: "Programmation" },
          { value: "regulation_pièce_par_pièce", label: "Pièce par pièce" },
          { value: "aucun", label: "Aucun" },
        ]} />
      </div>
    </Card>
  );
}

export default function Step9Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [items, setItems] = useState<InstallationChauffage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => { if (activeProjet) { const d = syncService.getStepValues(activeProjet, "step_9"); if (d.installations_chauffage) setItems(d.installations_chauffage as InstallationChauffage[]); } }, [activeProjet]);

  async function handleSave() { if (!projetId) return; setIsSaving(true); await syncService.saveStepFields(projetId, "step_9", { installations_chauffage: items }); setIsSaving(false); }
  async function handleComplete() { await handleSave(); completeStep(9); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.9")}</h2>
      <Alert variant="info">Les champs s'adaptent au type de générateur (variables requises/interdites ADEME).</Alert>
      {items.length === 0 && <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"><p className="text-sm text-gray-500">Aucune installation de chauffage.</p></div>}
      {items.map((inst, i) => <InstForm key={inst.id} inst={inst} index={i} onChange={(u) => { const n = [...items]; n[i] = u; setItems(n); }} onRemove={() => setItems(items.filter((_, j) => j !== i))} />)}
      <Button variant="secondary" onClick={() => setItems([...items, createEmpty()])} fullWidth>+ Ajouter une installation chauffage</Button>
      {items.length > 0 && <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button><Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button></div>}
    </div>
  );
}
