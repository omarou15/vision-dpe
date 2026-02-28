import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import {
  createEmptyMur,
  isMethodeSaisieDirecte,
  isMethodeForfaitaire,
  isMethodeAvecIsolation,
  isAdjacenceLNC,
} from "@/types";
import type {
  Mur,
  TypeAdjacence,
  Orientation,
  MateriauxStructureMur,
  TypeIsolation,
  MethodeSaisieU,
  TypeDoublage,
} from "@/types";
import { Input, Select, ChipGroup, Card, Button, Toggle, Alert } from "@/components/ui";

// ── Options Select ──
const ADJACENCE_OPTIONS: { value: TypeAdjacence; label: string }[] = [
  { value: "exterieur", label: "Extérieur" },
  { value: "terre_plein", label: "Terre-plein" },
  { value: "vide_sanitaire", label: "Vide sanitaire" },
  { value: "sous_sol_non_chauffe", label: "Sous-sol non chauffé" },
  { value: "garage", label: "Garage" },
  { value: "comble_perdu", label: "Combles perdus" },
  { value: "circulation_commune", label: "Circulation commune" },
  { value: "autre_logement_chauffe", label: "Autre logement chauffé" },
  { value: "local_commercial", label: "Local commercial" },
  { value: "parc_stationnement", label: "Parc de stationnement" },
];

const ORIENTATION_CHIPS = [
  { value: "nord", label: "N" },
  { value: "est", label: "E" },
  { value: "sud", label: "S" },
  { value: "ouest", label: "O" },
];

const MATERIAUX_OPTIONS: { value: MateriauxStructureMur; label: string }[] = [
  { value: "beton_bloc_parpaing", label: "Béton / Parpaing" },
  { value: "brique_pleine", label: "Brique pleine" },
  { value: "brique_creuse", label: "Brique creuse" },
  { value: "pierre_moellon", label: "Pierre / Moellon" },
  { value: "pierre_taille", label: "Pierre de taille" },
  { value: "beton_banche", label: "Béton banché" },
  { value: "beton_cellulaire", label: "Béton cellulaire" },
  { value: "bois_massif", label: "Bois massif" },
  { value: "ossature_bois", label: "Ossature bois" },
  { value: "pisé", label: "Pisé / Terre crue" },
  { value: "metal", label: "Métal" },
  { value: "autre", label: "Autre" },
];

const ISOLATION_OPTIONS: { value: TypeIsolation; label: string }[] = [
  { value: "non_isole", label: "Non isolé" },
  { value: "iti", label: "ITI (par l'intérieur)" },
  { value: "ite", label: "ITE (par l'extérieur)" },
  { value: "itr", label: "ITR (répartie)" },
  { value: "isolation_inconnue", label: "Isolation inconnue" },
];

const METHODE_U_OPTIONS: { value: MethodeSaisieU; label: string }[] = [
  { value: "non_isole_forfaitaire", label: "Non isolé — forfaitaire" },
  { value: "isole_forfaitaire_recent", label: "Isolé — forfaitaire récent" },
  { value: "isole_forfaitaire_ancien", label: "Isolé — forfaitaire ancien" },
  { value: "saisie_directe_u", label: "Saisie directe U" },
  { value: "saisie_epaisseur_isolation", label: "Épaisseur isolation connue" },
  { value: "saisie_resistance_isolation", label: "Résistance isolation connue" },
  { value: "donnee_certifiee", label: "Donnée certifiée" },
];

const DOUBLAGE_OPTIONS: { value: TypeDoublage; label: string }[] = [
  { value: "sans_doublage", label: "Sans doublage" },
  { value: "doublage_colle", label: "Doublage collé" },
  { value: "doublage_sur_rail", label: "Doublage sur rail" },
  { value: "doublage_independant", label: "Doublage indépendant" },
  { value: "contre_cloison", label: "Contre-cloison" },
];

/** Formulaire d'édition d'un mur */
function MurForm({
  mur,
  onChange,
  onRemove,
  index,
}: {
  mur: Mur;
  onChange: (updated: Mur) => void;
  onRemove: () => void;
  index: number;
}) {
  const d = mur.donnee_entree;

  function update(partial: Partial<typeof d>) {
    onChange({
      ...mur,
      donnee_entree: { ...d, ...partial },
    });
  }

  const showDirectU = isMethodeSaisieDirecte(d.methode_saisie_u);
  const showIsolationDetails = isMethodeAvecIsolation(d.methode_saisie_u);
  const showLNC = isAdjacenceLNC(d.type_adjacence);

  return (
    <Card className="relative">
      <div className="space-y-3 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">
            Mur {index + 1}
          </p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">
            Supprimer
          </button>
        </div>

        <Input
          label="Description"
          value={d.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Mur nord façade principale"
        />

        {/* Adjacence + Orientation */}
        <Select
          label="Type d'adjacence"
          value={d.type_adjacence}
          onChange={(e) => update({ type_adjacence: e.target.value as TypeAdjacence })}
          options={ADJACENCE_OPTIONS}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Orientation</p>
          <ChipGroup
            options={ORIENTATION_CHIPS}
            value={d.orientation}
            onChange={(v) => update({ orientation: v as Orientation })}
          />
        </div>

        {/* Surface */}
        <Input
          label="Surface opaque (m²)"
          type="number"
          value={d.surface_paroi_opaque || ""}
          onChange={(e) => update({ surface_paroi_opaque: parseFloat(e.target.value) || 0 })}
          placeholder="25"
          required
          hint="Hors surfaces de baies"
        />

        {/* Matériaux */}
        <Select
          label="Matériau de structure"
          value={d.materiaux_structure}
          onChange={(e) => update({ materiaux_structure: e.target.value as MateriauxStructureMur })}
          options={MATERIAUX_OPTIONS}
        />

        <Input
          label="Épaisseur structure (cm)"
          type="number"
          value={d.epaisseur_structure || ""}
          onChange={(e) => update({ epaisseur_structure: parseFloat(e.target.value) || null })}
          placeholder="20"
        />

        <Toggle
          checked={d.paroi_lourde}
          onChange={(v) => update({ paroi_lourde: v })}
          label="Paroi lourde"
          description="Influence l'inertie thermique du bâtiment"
        />

        {/* Isolation */}
        <Select
          label="Type d'isolation"
          value={d.type_isolation}
          onChange={(e) => update({ type_isolation: e.target.value as TypeIsolation })}
          options={ISOLATION_OPTIONS}
        />

        <Select
          label="Doublage"
          value={d.type_doublage}
          onChange={(e) => update({ type_doublage: e.target.value as TypeDoublage })}
          options={DOUBLAGE_OPTIONS}
        />

        {/* Méthode saisie U — CHAMPS DYNAMIQUES */}
        <Select
          label="Méthode de saisie U"
          value={d.methode_saisie_u}
          onChange={(e) => update({ methode_saisie_u: e.target.value as MethodeSaisieU })}
          options={METHODE_U_OPTIONS}
        />

        {/* Champs conditionnels selon methode_saisie_u */}
        {showDirectU && (
          <Input
            label="U mur (W/m².K)"
            type="number"
            value={d.umur_saisi || ""}
            onChange={(e) => update({ umur_saisi: parseFloat(e.target.value) || null })}
            placeholder="0.36"
            hint="Valeur U saisie directement"
          />
        )}

        {isMethodeForfaitaire(d.methode_saisie_u) && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Valeur U déterminée par les tables forfaitaires ADEME selon le matériau et la période.
          </div>
        )}

        {showIsolationDetails && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Épaisseur isolant (cm)"
              type="number"
              value={d.epaisseur_isolation || ""}
              onChange={(e) => update({ epaisseur_isolation: parseFloat(e.target.value) || null })}
              placeholder="10"
            />
            <Input
              label="Résistance (m².K/W)"
              type="number"
              value={d.resistance_isolation || ""}
              onChange={(e) => update({ resistance_isolation: parseFloat(e.target.value) || null })}
              placeholder="3.15"
            />
          </div>
        )}

        {/* LNC */}
        {showLNC && (
          <Alert variant="info">
            Adjacence avec un Local Non Chauffé — un coefficient b sera appliqué.
          </Alert>
        )}
      </div>
    </Card>
  );
}

// ── Page principale ──
export default function Step4Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();

  const [murs, setMurs] = useState<Mur[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projetId && !activeProjet) loadProjet(projetId);
  }, [projetId, activeProjet, loadProjet]);

  useEffect(() => {
    if (activeProjet) {
      const data = syncService.getStepValues(activeProjet, "step_4");
      if (data.murs && Array.isArray(data.murs)) {
        setMurs(data.murs as Mur[]);
      }
    }
  }, [activeProjet]);

  function handleAdd() {
    setMurs([...murs, createEmptyMur()]);
  }

  function handleUpdate(index: number, updated: Mur) {
    const next = [...murs];
    next[index] = updated;
    setMurs(next);
  }

  function handleRemove(index: number) {
    setMurs(murs.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!projetId) return;
    setIsSaving(true);
    await syncService.saveStepFields(projetId, "step_4", { murs });
    setIsSaving(false);
  }

  async function handleComplete() {
    await handleSave();
    completeStep(4);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700">
          {t("wizard.steps.dpe.4")}
        </h2>
        <span className="text-sm text-gray-500">{murs.length} mur(s)</span>
      </div>

      {murs.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-500">Aucun mur ajouté. Commencez par ajouter un mur.</p>
        </div>
      )}

      {murs.map((mur, i) => (
        <MurForm
          key={mur.id}
          mur={mur}
          index={i}
          onChange={(updated) => handleUpdate(i, updated)}
          onRemove={() => handleRemove(i)}
        />
      ))}

      <Button variant="secondary" onClick={handleAdd} fullWidth>
        + Ajouter un mur
      </Button>

      {murs.length > 0 && (
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">
            Enregistrer
          </Button>
          <Button onClick={handleComplete} loading={isSaving} className="flex-1">
            Valider l'étape
          </Button>
        </div>
      )}
    </div>
  );
}
