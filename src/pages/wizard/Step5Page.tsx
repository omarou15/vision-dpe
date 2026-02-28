import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import type {
  BaieVitree, Porte, ETS,
  TypeAdjacence, Orientation, TypeBaie, TypeVitrage,
  TypeMateriauxMenuiserie, TypePose, TypeFermeture, TypePorte,
  MethodeSaisieVitrage,
} from "@/types";
import { Input, Select, ChipGroup, Card, Button, Toggle } from "@/components/ui";

// ── Options ──
const ORIENTATION_CHIPS = [
  { value: "nord", label: "N" }, { value: "est", label: "E" },
  { value: "sud", label: "S" }, { value: "ouest", label: "O" },
];

const TYPE_BAIE_OPTIONS: { value: TypeBaie; label: string }[] = [
  { value: "fenetre_battante", label: "Fenêtre battante" },
  { value: "fenetre_coulissante", label: "Fenêtre coulissante" },
  { value: "porte_fenetre_battante", label: "Porte-fenêtre battante" },
  { value: "porte_fenetre_coulissante", label: "Porte-fenêtre coulissante" },
  { value: "fenetre_toit", label: "Fenêtre de toit" },
  { value: "baie_fixe", label: "Baie fixe" },
  { value: "brique_verre", label: "Brique de verre" },
];

const VITRAGE_OPTIONS: { value: TypeVitrage; label: string }[] = [
  { value: "simple_vitrage", label: "Simple vitrage" },
  { value: "double_vitrage", label: "Double vitrage" },
  { value: "double_vitrage_fe", label: "Double vitrage FE" },
  { value: "triple_vitrage", label: "Triple vitrage" },
  { value: "survitrage", label: "Survitrage" },
];

const MENUISERIE_OPTIONS: { value: TypeMateriauxMenuiserie; label: string }[] = [
  { value: "pvc", label: "PVC" }, { value: "bois", label: "Bois" },
  { value: "aluminium", label: "Aluminium" }, { value: "mixte_bois_alu", label: "Mixte bois/alu" },
  { value: "acier", label: "Acier" },
];

const POSE_OPTIONS: { value: TypePose; label: string }[] = [
  { value: "nu_interieur", label: "Nu intérieur" }, { value: "nu_exterieur", label: "Nu extérieur" },
  { value: "tunnel", label: "Tunnel" }, { value: "menuiserie_avancee", label: "Menuiserie avancée" },
];

const FERMETURE_OPTIONS: { value: TypeFermeture; label: string }[] = [
  { value: "sans_fermeture", label: "Sans fermeture" },
  { value: "volet_roulant_alu", label: "Volet roulant alu" },
  { value: "volet_roulant_pvc", label: "Volet roulant PVC" },
  { value: "volet_battant_bois", label: "Volet battant bois" },
  { value: "persienne_bois", label: "Persienne bois" },
];

const METHODE_VITRAGE_OPTIONS: { value: MethodeSaisieVitrage; label: string }[] = [
  { value: "forfaitaire_double", label: "Forfaitaire" },
  { value: "saisie_uw", label: "Saisie directe Uw" },
  { value: "justificatif_fabricant", label: "Justificatif fabricant" },
];

const TYPE_PORTE_OPTIONS: { value: TypePorte; label: string }[] = [
  { value: "porte_opaque_pleine", label: "Opaque pleine" },
  { value: "porte_opaque_isolee", label: "Opaque isolée" },
  { value: "porte_vitree_simple", label: "Vitrée simple" },
  { value: "porte_vitree_double", label: "Vitrée double vitrage" },
  { value: "porte_paliere", label: "Palière" },
  { value: "porte_garage", label: "Garage" },
];

function createEmptyBaie(): BaieVitree {
  return {
    id: generateEnveloppeId("baie"),
    donnee_entree: {
      description: "", reference: "", reference_paroi: "",
      type_adjacence: "exterieur", orientation: "sud",
      surface: 0, type_baie: "fenetre_battante",
      type_vitrage: "double_vitrage", materiaux_menuiserie: "pvc",
      type_pose: "nu_interieur", type_fermeture: "volet_roulant_pvc",
      double_fenetre: false,
      masque_proche_avance: null, masque_proche_depassement: null,
      masque_lointain_hauteur: null, masque_lointain_orientation: null,
      methode_saisie: "forfaitaire_double",
      uw_saisi: null, tv_uw_id: null, ug: null, uf: null,
    },
    uw: null, sw: null,
  };
}

function createEmptyPorte(): Porte {
  return {
    id: generateEnveloppeId("porte"),
    donnee_entree: {
      description: "", reference: "", reference_paroi: "",
      type_adjacence: "exterieur", orientation: "nord",
      surface: 0, type_porte: "porte_opaque_pleine",
      uporte_saisi: null, tv_uporte_id: null,
    },
    uporte: null,
  };
}

// ── Sous-formulaire Baie ──
function BaieForm({ baie, index, onChange, onRemove }: {
  baie: BaieVitree; index: number;
  onChange: (b: BaieVitree) => void; onRemove: () => void;
}) {
  const d = baie.donnee_entree;
  const upd = (p: Partial<typeof d>) => onChange({ ...baie, donnee_entree: { ...d, ...p } });
  const showUw = d.methode_saisie === "saisie_uw" || d.methode_saisie === "justificatif_fabricant";

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Baie {index + 1}</p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>
        </div>
        <Input label="Description" value={d.description} onChange={(e) => upd({ description: e.target.value })} placeholder="Fenêtre salon sud" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type de baie" value={d.type_baie} onChange={(e) => upd({ type_baie: e.target.value as TypeBaie })} options={TYPE_BAIE_OPTIONS} />
          <Input label="Surface (m²)" type="number" value={d.surface || ""} onChange={(e) => upd({ surface: parseFloat(e.target.value) || 0 })} placeholder="1.6" required />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Orientation</p>
          <ChipGroup options={ORIENTATION_CHIPS} value={d.orientation} onChange={(v) => upd({ orientation: v as Orientation })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Vitrage" value={d.type_vitrage} onChange={(e) => upd({ type_vitrage: e.target.value as TypeVitrage })} options={VITRAGE_OPTIONS} />
          <Select label="Menuiserie" value={d.materiaux_menuiserie} onChange={(e) => upd({ materiaux_menuiserie: e.target.value as TypeMateriauxMenuiserie })} options={MENUISERIE_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Pose" value={d.type_pose} onChange={(e) => upd({ type_pose: e.target.value as TypePose })} options={POSE_OPTIONS} />
          <Select label="Fermeture" value={d.type_fermeture} onChange={(e) => upd({ type_fermeture: e.target.value as TypeFermeture })} options={FERMETURE_OPTIONS} />
        </div>
        <Toggle checked={d.double_fenetre} onChange={(v) => upd({ double_fenetre: v })} label="Double fenêtre" />
        <Select label="Méthode saisie" value={d.methode_saisie} onChange={(e) => upd({ methode_saisie: e.target.value as MethodeSaisieVitrage })} options={METHODE_VITRAGE_OPTIONS} />
        {showUw && (
          <Input label="Uw (W/m².K)" type="number" value={d.uw_saisi || ""} onChange={(e) => upd({ uw_saisi: parseFloat(e.target.value) || null })} placeholder="1.4" />
        )}
      </div>
    </Card>
  );
}

// ── Sous-formulaire Porte ──
function PorteForm({ porte, index, onChange, onRemove }: {
  porte: Porte; index: number;
  onChange: (p: Porte) => void; onRemove: () => void;
}) {
  const d = porte.donnee_entree;
  const upd = (p: Partial<typeof d>) => onChange({ ...porte, donnee_entree: { ...d, ...p } });

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Porte {index + 1}</p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>
        </div>
        <Input label="Description" value={d.description} onChange={(e) => upd({ description: e.target.value })} placeholder="Porte d'entrée" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={d.type_porte} onChange={(e) => upd({ type_porte: e.target.value as TypePorte })} options={TYPE_PORTE_OPTIONS} />
          <Input label="Surface (m²)" type="number" value={d.surface || ""} onChange={(e) => upd({ surface: parseFloat(e.target.value) || 0 })} placeholder="2.1" required />
        </div>
        <Input label="U porte (W/m².K)" type="number" value={d.uporte_saisi || ""} onChange={(e) => upd({ uporte_saisi: parseFloat(e.target.value) || null })} placeholder="3.5" hint="Optionnel — sinon valeur forfaitaire" />
      </div>
    </Card>
  );
}

// ── Page principale ──
export default function Step5Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();

  const [baies, setBaies] = useState<BaieVitree[]>([]);
  const [portes, setPortes] = useState<Porte[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);

  useEffect(() => {
    if (!activeProjet) return;
    const data = syncService.getStepValues(activeProjet, "step_5");
    if (data.baies && Array.isArray(data.baies)) setBaies(data.baies as BaieVitree[]);
    if (data.portes && Array.isArray(data.portes)) setPortes(data.portes as Porte[]);
  }, [activeProjet]);

  async function handleSave() {
    if (!projetId) return;
    setIsSaving(true);
    await syncService.saveStepFields(projetId, "step_5", { baies, portes, ets: [] });
    setIsSaving(false);
  }

  async function handleComplete() { await handleSave(); completeStep(5); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.5")}</h2>

      {/* Baies */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Baies vitrées ({baies.length})</p>
      </div>
      {baies.map((b, i) => (
        <BaieForm key={b.id} baie={b} index={i}
          onChange={(u) => { const n = [...baies]; n[i] = u; setBaies(n); }}
          onRemove={() => setBaies(baies.filter((_, j) => j !== i))} />
      ))}
      <Button variant="secondary" onClick={() => setBaies([...baies, createEmptyBaie()])} fullWidth>
        + Ajouter une baie
      </Button>

      {/* Portes */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm font-semibold text-gray-700">Portes ({portes.length})</p>
      </div>
      {portes.map((p, i) => (
        <PorteForm key={p.id} porte={p} index={i}
          onChange={(u) => { const n = [...portes]; n[i] = u; setPortes(n); }}
          onRemove={() => setPortes(portes.filter((_, j) => j !== i))} />
      ))}
      <Button variant="secondary" onClick={() => setPortes([...portes, createEmptyPorte()])} fullWidth>
        + Ajouter une porte
      </Button>

      {(baies.length > 0 || portes.length > 0) && (
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button>
          <Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button>
        </div>
      )}
    </div>
  );
}
