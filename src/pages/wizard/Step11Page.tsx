import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { generateEnveloppeId } from "@/types";
import type { Orientation } from "@/types";
import {
  type Ventilation, type Climatisation, type ProductionElecENR,
  type TypeVentilation, type TypeEnergie,
} from "@/types/steps/step9-11";
import { Input, Select, ChipGroup, Card, Button, Toggle } from "@/components/ui";

const VENTIL_OPTIONS: { value: TypeVentilation; label: string }[] = [
  { value: "ventilation_naturelle_conduit", label: "Naturelle par conduit" },
  { value: "ventilation_naturelle_entrees_air", label: "Naturelle entrées d'air" },
  { value: "vmc_simple_flux_auto", label: "VMC simple flux auto" },
  { value: "vmc_simple_flux_hygro_a", label: "VMC simple flux Hygro A" },
  { value: "vmc_simple_flux_hygro_b", label: "VMC simple flux Hygro B" },
  { value: "vmc_double_flux", label: "VMC double flux" },
  { value: "vmc_double_flux_thermodynamique", label: "VMC double flux thermodynamique" },
  { value: "ventilation_mecanique_repartie", label: "VMR (répartie)" },
  { value: "autre_ventilation", label: "Autre" },
];

const CLIM_TYPE_OPTIONS = [
  { value: "split", label: "Split" }, { value: "multi_split", label: "Multi-split" },
  { value: "gainable", label: "Gainable" }, { value: "vrv", label: "VRV" },
  { value: "centralisee", label: "Centralisée" }, { value: "autre", label: "Autre" },
];

const ORI_CHIPS = [
  { value: "nord", label: "N" }, { value: "est", label: "E" },
  { value: "sud", label: "S" }, { value: "ouest", label: "O" },
];

function createVentil(): Ventilation {
  return { id: generateEnveloppeId("ventil"), description: "", type_ventilation: "vmc_simple_flux_hygro_b", q4pa: null, debit: null, individuelle: true, annee_installation: null };
}
function createClim(): Climatisation {
  return { id: generateEnveloppeId("clim"), description: "", type_climatisation: "split", seer: null, surface_climatisee: 0, energie: "electricite", annee_installation: null };
}
function createENR(): ProductionElecENR {
  return { id: generateEnveloppeId("enr"), description: "", type_enr: "panneaux_photovoltaiques", surface: 0, orientation: "sud", inclinaison: 30, puissance_crete: null, production_annuelle: null };
}

export default function Step11Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [ventils, setVentils] = useState<Ventilation[]>([]);
  const [clims, setClims] = useState<Climatisation[]>([]);
  const [enrs, setEnrs] = useState<ProductionElecENR[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "step_11");
    if (d.ventilations) setVentils(d.ventilations as Ventilation[]);
    if (d.climatisations) setClims(d.climatisations as Climatisation[]);
    if (d.productions_enr) setEnrs(d.productions_enr as ProductionElecENR[]);
  }, [activeProjet]);

  async function handleSave() {
    if (!projetId) return; setIsSaving(true);
    await syncService.saveStepFields(projetId, "step_11", { ventilations: ventils, climatisations: clims, productions_enr: enrs });
    setIsSaving(false);
  }
  async function handleComplete() { await handleSave(); completeStep(11); }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.11")}</h2>

      {/* ── Ventilation ── */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm font-semibold text-gray-700">Ventilation ({ventils.length})</p>
      </div>
      {ventils.map((v, i) => (
        <Card key={v.id}>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-700">Ventilation {i + 1}</p>
              <button onClick={() => setVentils(ventils.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
            <Select label="Type" value={v.type_ventilation} onChange={(e) => { const n = [...ventils]; n[i] = { ...v, type_ventilation: e.target.value as TypeVentilation }; setVentils(n); }} options={VENTIL_OPTIONS} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Q4Pa (m³/h/m²)" type="number" value={v.q4pa || ""} onChange={(e) => { const n = [...ventils]; n[i] = { ...v, q4pa: parseFloat(e.target.value) || null }; setVentils(n); }} hint="Perméabilité à l'air" />
              <Input label="Débit (m³/h)" type="number" value={v.debit || ""} onChange={(e) => { const n = [...ventils]; n[i] = { ...v, debit: parseFloat(e.target.value) || null }; setVentils(n); }} />
            </div>
            <Toggle checked={v.individuelle} label="Ventilation individuelle" onChange={(val) => { const n = [...ventils]; n[i] = { ...v, individuelle: val }; setVentils(n); }} />
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => setVentils([...ventils, createVentil()])} fullWidth>+ Ajouter ventilation</Button>

      {/* ── Climatisation ── */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm font-semibold text-gray-700">Climatisation ({clims.length})</p>
      </div>
      {clims.map((c, i) => (
        <Card key={c.id}>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-700">Climatisation {i + 1}</p>
              <button onClick={() => setClims(clims.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
            <Select label="Type" value={c.type_climatisation} onChange={(e) => { const n = [...clims]; n[i] = { ...c, type_climatisation: e.target.value as any }; setClims(n); }} options={CLIM_TYPE_OPTIONS} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="SEER" type="number" value={c.seer || ""} onChange={(e) => { const n = [...clims]; n[i] = { ...c, seer: parseFloat(e.target.value) || null }; setClims(n); }} />
              <Input label="Surface (m²)" type="number" value={c.surface_climatisee || ""} onChange={(e) => { const n = [...clims]; n[i] = { ...c, surface_climatisee: parseFloat(e.target.value) || 0 }; setClims(n); }} required />
            </div>
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => setClims([...clims, createClim()])} fullWidth>+ Ajouter climatisation</Button>

      {/* ── ENR ── */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm font-semibold text-gray-700">Production ENR ({enrs.length})</p>
      </div>
      {enrs.map((e, i) => (
        <Card key={e.id}>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-700">Production ENR {i + 1}</p>
              <button onClick={() => setEnrs(enrs.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Supprimer</button>
            </div>
            <Input label="Description" value={e.description} onChange={(ev) => { const n = [...enrs]; n[i] = { ...e, description: ev.target.value }; setEnrs(n); }} placeholder="Panneaux PV toiture sud" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Surface (m²)" type="number" value={e.surface || ""} onChange={(ev) => { const n = [...enrs]; n[i] = { ...e, surface: parseFloat(ev.target.value) || 0 }; setEnrs(n); }} required />
              <Input label="Puissance crête (kWc)" type="number" value={e.puissance_crete || ""} onChange={(ev) => { const n = [...enrs]; n[i] = { ...e, puissance_crete: parseFloat(ev.target.value) || null }; setEnrs(n); }} />
            </div>
            <div><p className="mb-1.5 text-sm font-medium text-gray-700">Orientation</p><ChipGroup options={ORI_CHIPS} value={e.orientation} onChange={(v) => { const n = [...enrs]; n[i] = { ...e, orientation: v as Orientation }; setEnrs(n); }} /></div>
            <Input label="Inclinaison (°)" type="number" value={e.inclinaison || ""} onChange={(ev) => { const n = [...enrs]; n[i] = { ...e, inclinaison: parseFloat(ev.target.value) || 0 }; setEnrs(n); }} />
          </div>
        </Card>
      ))}
      <Button variant="secondary" onClick={() => setEnrs([...enrs, createENR()])} fullWidth>+ Ajouter production ENR</Button>

      {(ventils.length > 0 || clims.length > 0 || enrs.length > 0) && (
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">Enregistrer</Button>
          <Button onClick={handleComplete} loading={isSaving} className="flex-1">Valider l'étape</Button>
        </div>
      )}
    </div>
  );
}
