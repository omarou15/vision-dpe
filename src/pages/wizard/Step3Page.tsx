import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { getZoneClimatique, getClasseAltitude, STEP3_DEFAULTS } from "@/types";
import type { PeriodeConstruction, ZoneClimatique, ClasseAltitude } from "@/types";
import { Input, Select, ChipGroup, Card, Button, Toggle } from "@/components/ui";

const PERIODE_OPTIONS: { value: PeriodeConstruction; label: string }[] = [
  { value: "avant_1948", label: "Avant 1948" },
  { value: "1948_1974", label: "1948 — 1974" },
  { value: "1975_1977", label: "1975 — 1977" },
  { value: "1978_1982", label: "1978 — 1982" },
  { value: "1983_1988", label: "1983 — 1988" },
  { value: "1989_2000", label: "1989 — 2000" },
  { value: "2001_2005", label: "2001 — 2005" },
  { value: "2006_2012", label: "2006 — 2012" },
  { value: "2013_2021", label: "2013 — 2021" },
  { value: "apres_2021", label: "Après 2021" },
];

const INERTIE_CHIPS = [
  { value: "legere", label: "Légère" },
  { value: "moyenne", label: "Moyenne" },
  { value: "lourde", label: "Lourde" },
];

const POSITION_OPTIONS = [
  { value: "", label: "— Non applicable —" },
  { value: "rez_de_chaussee", label: "Rez-de-chaussée" },
  { value: "etage_intermediaire", label: "Étage intermédiaire" },
  { value: "dernier_etage", label: "Dernier étage" },
];

const MITOYENNETE_CHIPS = [
  { value: "non_mitoyen", label: "Non mitoyen" },
  { value: "mitoyen_1_cote", label: "1 côté" },
  { value: "mitoyen_2_cotes", label: "2 côtés" },
];

export default function Step3Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();

  // Champs caractéristiques
  const [periode, setPeriode] = useState<PeriodeConstruction>("1989_2000");
  const [annee, setAnnee] = useState("");
  const [surface, setSurface] = useState("");
  const [hsp, setHsp] = useState(String(STEP3_DEFAULTS.hauteur_sous_plafond));
  const [niveaux, setNiveaux] = useState(String(STEP3_DEFAULTS.nombre_niveaux));
  const [inertie, setInertie] = useState(STEP3_DEFAULTS.inertie || "moyenne");
  const [materiauxAnciens, setMateriauxAnciens] = useState(false);
  const [sousSol, setSousSol] = useState(false);
  const [position, setPosition] = useState("");
  const [mitoyennete, setMitoyennete] = useState("non_mitoyen");

  // Champs météo (déduits automatiquement)
  const [altitude, setAltitude] = useState("0");
  const [zoneClim, setZoneClim] = useState<ZoneClimatique | null>(null);
  const [classeAlt, setClasseAlt] = useState<ClasseAltitude>("inf_400m");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projetId && !activeProjet) loadProjet(projetId);
  }, [projetId, activeProjet, loadProjet]);

  // Charger données existantes + déduire zone clim depuis étape 1
  useEffect(() => {
    if (!activeProjet) return;

    // Données étape 3
    const data = syncService.getStepValues(activeProjet, "step_3");
    if (data.periode_construction) setPeriode(data.periode_construction as PeriodeConstruction);
    if (data.annee_construction) setAnnee(String(data.annee_construction));
    if (data.surface_habitable) setSurface(String(data.surface_habitable));
    if (data.hauteur_sous_plafond) setHsp(String(data.hauteur_sous_plafond));
    if (data.nombre_niveaux) setNiveaux(String(data.nombre_niveaux));
    if (data.inertie) setInertie(data.inertie as "lourde" | "moyenne" | "legere");
    if (data.materiaux_anciens) setMateriauxAnciens(data.materiaux_anciens as boolean);
    if (data.presence_sous_sol) setSousSol(data.presence_sous_sol as boolean);
    if (data.position_appartement) setPosition(data.position_appartement as string);
    if (data.mitoyennete) setMitoyennete(data.mitoyennete as string);
    if (data.altitude) setAltitude(String(data.altitude));

    // Déduire zone climatique depuis le code postal (étape 1)
    const step1 = syncService.getStepValues(activeProjet, "step_1");
    if (step1.geocodage) {
      const geo = step1.geocodage as { postcode: string };
      const zone = getZoneClimatique(geo.postcode);
      if (zone) setZoneClim(zone);
    }

    // Reprendre la surface de l'étape 2
    const step2 = syncService.getStepValues(activeProjet, "step_2");
    if (step2.surface_habitable_lot && !data.surface_habitable) {
      setSurface(String(step2.surface_habitable_lot));
    }
  }, [activeProjet]);

  // Recalculer classe altitude quand altitude change
  useEffect(() => {
    const alt = parseFloat(altitude) || 0;
    setClasseAlt(getClasseAltitude(alt));
  }, [altitude]);

  const isAppart = activeProjet?.logement_type === "appartement";
  const isMaison = activeProjet?.logement_type === "maison";

  async function handleSave() {
    if (!projetId) return;
    setIsSaving(true);

    const alt = parseFloat(altitude) || 0;

    await syncService.saveStepFields(projetId, "step_3", {
      periode_construction: periode,
      annee_construction: annee ? parseInt(annee) : null,
      surface_habitable: parseFloat(surface) || 0,
      hauteur_sous_plafond: parseFloat(hsp) || 2.5,
      nombre_niveaux: parseInt(niveaux) || 1,
      type_batiment: activeProjet?.logement_type || "maison",
      position_appartement: isAppart && position ? position : null,
      mitoyennete: isMaison ? mitoyennete : null,
      presence_sous_sol: sousSol,
      inertie,
      materiaux_anciens: materiauxAnciens,
      zone_climatique: zoneClim,
      altitude: alt,
      classe_altitude: classeAlt,
    });

    setIsSaving(false);
  }

  async function handleComplete() {
    await handleSave();
    completeStep(3);
  }

  const canComplete = surface && parseFloat(surface) > 0 && zoneClim;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">
        {t("wizard.steps.dpe.3")}
      </h2>

      {/* ── Construction ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Construction</p>
          <Select
            label="Période de construction"
            value={periode}
            onChange={(e) => setPeriode(e.target.value as PeriodeConstruction)}
            options={PERIODE_OPTIONS}
            required
          />
          <Input
            label="Année exacte (optionnel)"
            type="number"
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            placeholder="1985"
            hint="Si connue, affine les valeurs forfaitaires"
          />
          {periode === "avant_1948" && (
            <Toggle
              checked={materiauxAnciens}
              onChange={setMateriauxAnciens}
              label="Matériaux anciens"
              description="Bâtiment avec enduits à base de chaux, pierre apparente"
            />
          )}
        </div>
      </Card>

      {/* ── Dimensions ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Dimensions</p>
          <Input
            label="Surface habitable (m²)"
            type="number"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            placeholder="85"
            required
            isDefault={Boolean(activeProjet && syncService.getStepValues(activeProjet, "step_2").surface_habitable_lot)}
            hint={activeProjet?.logement_type === "appartement" ? "Surface du lot (pas du bâtiment)" : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hauteur sous plafond (m)"
              type="number"
              value={hsp}
              onChange={(e) => setHsp(e.target.value)}
              placeholder="2.50"
              isDefault={hsp === "2.5"}
            />
            <Input
              label="Nombre de niveaux"
              type="number"
              value={niveaux}
              onChange={(e) => setNiveaux(e.target.value)}
              placeholder="1"
            />
          </div>

          <Toggle
            checked={sousSol}
            onChange={setSousSol}
            label="Présence d'un sous-sol"
          />
        </div>
      </Card>

      {/* ── Position / Mitoyenneté ── */}
      {(isAppart || isMaison) && (
        <Card>
          <div className="space-y-3 p-4">
            {isAppart && (
              <Select
                label="Position dans l'immeuble"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                options={POSITION_OPTIONS}
              />
            )}
            {isMaison && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Mitoyenneté</p>
                <ChipGroup
                  options={MITOYENNETE_CHIPS}
                  value={mitoyennete}
                  onChange={setMitoyennete}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Inertie ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Inertie du bâtiment</p>
          <ChipGroup
            options={INERTIE_CHIPS}
            value={inertie}
            onChange={(v) => setInertie(v as "lourde" | "moyenne" | "legere")}
          />
        </div>
      </Card>

      {/* ── Météo (auto-déduite) ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Données météorologiques</p>
          {zoneClim ? (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm">
              <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-700">
                Zone climatique <strong>{zoneClim}</strong> — déduite du code postal
              </span>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Zone climatique non déterminée. Complétez l'adresse à l'étape 1.
            </div>
          )}

          <Input
            label="Altitude (m)"
            type="number"
            value={altitude}
            onChange={(e) => setAltitude(e.target.value)}
            placeholder="150"
            hint={`Classe d'altitude : ${classeAlt === "inf_400m" ? "< 400m" : classeAlt === "400_800m" ? "400-800m" : "> 800m"}`}
          />
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">
          Enregistrer
        </Button>
        <Button
          onClick={handleComplete}
          loading={isSaving}
          disabled={!canComplete}
          className="flex-1"
        >
          Valider l'étape
        </Button>
      </div>
    </div>
  );
}
