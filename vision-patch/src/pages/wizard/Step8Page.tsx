import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import type { PontThermique, TypeLiaison } from "@/types";
import { Input, Select, ChipGroup, Card, Button, Alert } from "@/components/ui";

const TYPE_LIAISON_OPTIONS: { value: TypeLiaison; label: string }[] = [
  { value: "mur_plancher_bas", label: "Mur / Plancher bas" },
  { value: "mur_plancher_haut", label: "Mur / Plancher haut" },
  { value: "mur_mur", label: "Mur / Mur (angle)" },
  { value: "mur_menuiserie", label: "Mur / Menuiserie" },
  { value: "plancher_refend", label: "Plancher / Refend" },
];

const METHODE_CHIPS = [
  { value: "forfaitaire", label: "Forfaitaire" },
  { value: "expert", label: "Expert" },
  { value: "mesure", label: "Mesure" },
];

function createEmpty(): PontThermique {
  return {
    id: generateEnveloppeId("pt"), donnee_entree: {
      description: "", reference: "", type_liaison: "mur_plancher_bas",
      reference_1: "", reference_2: "", longueur: 0,
      kpt_saisi: null, tv_kpt_id: null, methode_saisie: "forfaitaire",
    }, kpt: null,
  };
}

function PTForm({ pt, index, onChange, onRemove }: {
  pt: PontThermique; index: number; onChange: (p: PontThermique) => void; onRemove: () => void;
}) {
  const d = pt.donnee_entree;
  const upd = (p: Partial<typeof d>) => onChange({ ...pt, donnee_entree: { ...d, ...p } });
  const showKpt = d.methode_saisie === "expert" || d.methode_saisie === "mesure";

  return (
    <Card>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-navy-700">Pont thermique {index + 1}</p>
          <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Supprimer</button>
        </div>
        <Input label="Description" value={d.description} onChange={(e) => upd({ description: e.target.value })} placeholder="Liaison mur/plancher bas façade nord" />
        <Select label="Type de liaison" value={d.type_liaison} onChange={(e) => upd({ type_liaison: e.target.value as TypeLiaison })} options={TYPE_LIAISON_OPTIONS} />
        <Input label="Longueur (m)" type="number" value={d.longueur || ""} onChange={(e) => upd({ longueur: parseFloat(e.target.value) || 0 })} placeholder="12" required />
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Méthode de saisie</p>
          <ChipGroup
            options={METHODE_CHIPS}
            value={d.methode_saisie}
            onChange={(v) => upd({ methode_saisie: v as "forfaitaire" | "expert" | "mesure" })}
          />
        </div>
        {d.methode_saisie === "forfaitaire" && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Valeur kpt déterminée par les tables forfaitaires ADEME selon le type de liaison et les isolations déclarées.
          </div>
        )}
        {showKpt && (
          <Input label="kpt (W/m.K)" type="number" value={d.kpt_saisi || ""} onChange={(e) => upd({ kpt_saisi: parseFloat(e.target.value) || null })} placeholder="0.6" hint="Coefficient linéique" />
        )}
      </div>
    </Card>
  );
}

export default function Step8Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [items, setItems] = useState<PontThermique[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => { if (activeProjet) { const d = syncService.getStepValues(activeProjet, "step_8"); if (d.ponts_thermiques) setItems(d.ponts_thermiques as PontThermique[]); } }, [activeProjet]);

  async function handleSave() { if (!projetId) return; setIsSaving(true); await syncService.saveStepFields(projetId, "step_8", { ponts_thermiques: items }); setIsSaving(false); }
  async function handleComplete() { await handleSave(); completeStep(8); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.8")}</h2>
        <span className="text-sm text-gray-500">{items.length} pont(s)</span>
      </div>

      <Alert variant="info">
        Les ponts thermiques doivent être cohérents avec les isolations et poses déclarées aux étapes 4 à 7.
      </Alert>

      {items.length === 0 && <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"><p className="text-sm text-gray-500">Aucun pont thermique.</p></div>}
      {items.map((pt, i) => <PTForm key={pt.id} pt={pt} index={i} onChange={(u) => { const n = [...items]; n[i] = u; setItems(n); }} onRemove={() => setItems(items.filter((_, j) => j !== i))} />)}
      <Button variant="secondary" onClick={() => setItems([...items, createEmpty()])} fullWidth>+ Ajouter un pont thermique</Button>
      {items.length > 0 && <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button><Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button></div>}
    </div>
  );
}
