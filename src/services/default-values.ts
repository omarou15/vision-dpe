/**
 * DefaultValuesEngine — Valeurs forfaitaires par période de construction
 *
 * CDC v3 section 10 : Le DefaultValuesEngine propose automatiquement
 * des valeurs forfaitaires cohérentes selon la période de construction
 * et le type de logement. Le diagnostiqueur peut toujours surcharger.
 *
 * Source : Tables de valeurs observatoire-dpe (valeur_tables.xlsx)
 */

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export type PeriodeConstruction =
  | "avant_1948"
  | "1948_1974"
  | "1975_1981"
  | "1982_1989"
  | "1990_2000"
  | "2001_2005"
  | "2006_2012"
  | "apres_2012";

export interface DefaultValues {
  // Enveloppe
  materiaux_mur: string;
  type_isolation: string;
  epaisseur_isolation: number | null;
  resistance_isolation: number | null;
  type_vitrage: string;
  type_menuiserie: string;
  type_ventilation: string;
  // Systèmes
  categorie_chauffage: string;
  categorie_ecs: string;
  // Valeurs U
  umur_defaut: number;
  uw_defaut: number;
  uph_defaut: number;
  upb_defaut: number;
}

export interface DefaultValueWithSource {
  value: string | number | null;
  source: string;
}

// ════════════════════════════════════════════════════════════
// Table de valeurs par période
// ════════════════════════════════════════════════════════════

const DEFAULTS_PAR_PERIODE: Record<PeriodeConstruction, DefaultValues> = {
  avant_1948: {
    materiaux_mur: "pierre",
    type_isolation: "non_isole",
    epaisseur_isolation: null,
    resistance_isolation: null,
    type_vitrage: "simple_vitrage",
    type_menuiserie: "bois",
    type_ventilation: "naturelle",
    categorie_chauffage: "Chaudière",
    categorie_ecs: "Chaudière",
    umur_defaut: 2.5,
    uw_defaut: 4.95,
    uph_defaut: 2.5,
    upb_defaut: 2.0,
  },
  "1948_1974": {
    materiaux_mur: "beton_parpaing",
    type_isolation: "non_isole",
    epaisseur_isolation: null,
    resistance_isolation: null,
    type_vitrage: "simple_vitrage",
    type_menuiserie: "bois",
    type_ventilation: "naturelle",
    categorie_chauffage: "Chaudière",
    categorie_ecs: "Chaudière",
    umur_defaut: 2.5,
    uw_defaut: 4.95,
    uph_defaut: 2.5,
    upb_defaut: 2.0,
  },
  "1975_1981": {
    materiaux_mur: "beton_parpaing",
    type_isolation: "iti",
    epaisseur_isolation: 4,
    resistance_isolation: 1.0,
    type_vitrage: "simple_vitrage",
    type_menuiserie: "bois_metal",
    type_ventilation: "vmc_sf",
    categorie_chauffage: "Chaudière",
    categorie_ecs: "Chaudière",
    umur_defaut: 0.8,
    uw_defaut: 4.95,
    uph_defaut: 0.8,
    upb_defaut: 1.0,
  },
  "1982_1989": {
    materiaux_mur: "beton",
    type_isolation: "iti",
    epaisseur_isolation: 6,
    resistance_isolation: 1.5,
    type_vitrage: "double_vitrage_ancien",
    type_menuiserie: "pvc",
    type_ventilation: "vmc_sf",
    categorie_chauffage: "Chaudière",
    categorie_ecs: "Chaudière",
    umur_defaut: 0.6,
    uw_defaut: 2.8,
    uph_defaut: 0.6,
    upb_defaut: 0.8,
  },
  "1990_2000": {
    materiaux_mur: "beton_brique",
    type_isolation: "iti",
    epaisseur_isolation: 8,
    resistance_isolation: 2.0,
    type_vitrage: "double_vitrage",
    type_menuiserie: "pvc",
    type_ventilation: "vmc_sf",
    categorie_chauffage: "Chaudière",
    categorie_ecs: "Ballon électrique",
    umur_defaut: 0.45,
    uw_defaut: 2.3,
    uph_defaut: 0.4,
    upb_defaut: 0.6,
  },
  "2001_2005": {
    materiaux_mur: "beton_brique",
    type_isolation: "iti_renforce",
    epaisseur_isolation: 10,
    resistance_isolation: 2.5,
    type_vitrage: "double_vitrage_lowe",
    type_menuiserie: "pvc",
    type_ventilation: "vmc_sf_hygro",
    categorie_chauffage: "Chaudière condensation",
    categorie_ecs: "Ballon électrique",
    umur_defaut: 0.36,
    uw_defaut: 1.8,
    uph_defaut: 0.3,
    upb_defaut: 0.45,
  },
  "2006_2012": {
    materiaux_mur: "tout_type",
    type_isolation: "iti_renforce",
    epaisseur_isolation: 12,
    resistance_isolation: 3.2,
    type_vitrage: "double_vitrage_hr",
    type_menuiserie: "pvc_alu",
    type_ventilation: "vmc_df",
    categorie_chauffage: "PAC",
    categorie_ecs: "Thermodynamique",
    umur_defaut: 0.28,
    uw_defaut: 1.4,
    uph_defaut: 0.25,
    upb_defaut: 0.36,
  },
  apres_2012: {
    materiaux_mur: "tout_type",
    type_isolation: "ite_ou_iti_fort",
    epaisseur_isolation: 16,
    resistance_isolation: 4.0,
    type_vitrage: "double_triple_vitrage",
    type_menuiserie: "pvc_alu",
    type_ventilation: "vmc_df_hygro_b",
    categorie_chauffage: "PAC",
    categorie_ecs: "Thermodynamique",
    umur_defaut: 0.2,
    uw_defaut: 1.1,
    uph_defaut: 0.2,
    upb_defaut: 0.27,
  },
};

// ════════════════════════════════════════════════════════════
// Labels lisibles
// ════════════════════════════════════════════════════════════

const PERIODE_LABELS: Record<PeriodeConstruction, string> = {
  avant_1948: "Avant 1948",
  "1948_1974": "1948–1974",
  "1975_1981": "1975–1981",
  "1982_1989": "1982–1989",
  "1990_2000": "1990–2000",
  "2001_2005": "2001–2005",
  "2006_2012": "2006–2012",
  apres_2012: "Après 2012",
};

const MATERIAUX_LABELS: Record<string, string> = {
  pierre: "Pierre / Brique ancienne",
  beton_parpaing: "Béton / Parpaing",
  beton: "Béton",
  beton_brique: "Béton / Brique",
  tout_type: "Tout type",
};

const ISOLATION_LABELS: Record<string, string> = {
  non_isole: "Non isolé",
  iti: "ITI (Isolation Thermique Intérieure)",
  iti_renforce: "ITI renforcé",
  ite_ou_iti_fort: "ITE ou ITI fort",
};

const VITRAGE_LABELS: Record<string, string> = {
  simple_vitrage: "Simple vitrage",
  double_vitrage_ancien: "Double vitrage ancien",
  double_vitrage: "Double vitrage",
  double_vitrage_lowe: "Double vitrage low-e",
  double_vitrage_hr: "Double vitrage haute performance",
  double_triple_vitrage: "Double / Triple vitrage",
};

const VENTILATION_LABELS: Record<string, string> = {
  naturelle: "Ventilation naturelle",
  vmc_sf: "VMC simple flux",
  vmc_sf_hygro: "VMC simple flux hygro",
  vmc_df: "VMC double flux",
  vmc_df_hygro_b: "VMC double flux hygro B",
};

// ════════════════════════════════════════════════════════════
// API publique
// ════════════════════════════════════════════════════════════

/**
 * Détermine la période de construction à partir de l'année
 */
export function getPeriodeFromAnnee(annee: number): PeriodeConstruction {
  if (annee < 1948) return "avant_1948";
  if (annee <= 1974) return "1948_1974";
  if (annee <= 1981) return "1975_1981";
  if (annee <= 1989) return "1982_1989";
  if (annee <= 2000) return "1990_2000";
  if (annee <= 2005) return "2001_2005";
  if (annee <= 2012) return "2006_2012";
  return "apres_2012";
}

/**
 * Retourne les valeurs par défaut pour une période donnée
 */
export function getDefaults(periode: PeriodeConstruction): DefaultValues {
  return DEFAULTS_PAR_PERIODE[periode];
}

/**
 * Retourne les valeurs par défaut depuis une année de construction
 */
export function getDefaultsFromAnnee(annee: number): DefaultValues {
  return getDefaults(getPeriodeFromAnnee(annee));
}

/**
 * Retourne une valeur par défaut avec sa source (pour DefaultField)
 */
export function getDefaultWithSource(
  periode: PeriodeConstruction,
  champ: keyof DefaultValues
): DefaultValueWithSource {
  const defaults = DEFAULTS_PAR_PERIODE[periode];
  const value = defaults[champ];
  const periodeLabel = PERIODE_LABELS[periode];

  const labelMap: Partial<Record<keyof DefaultValues, string>> = {
    materiaux_mur: MATERIAUX_LABELS[value as string] || String(value),
    type_isolation: ISOLATION_LABELS[value as string] || String(value),
    type_vitrage: VITRAGE_LABELS[value as string] || String(value),
    type_ventilation: VENTILATION_LABELS[value as string] || String(value),
  };

  return {
    value,
    source: `Période ${periodeLabel} — valeur forfaitaire méthode 3CL`,
  };
}

/**
 * Retourne le U mur par défaut pour une période
 */
export function getUmurDefaut(periode: PeriodeConstruction): DefaultValueWithSource {
  const d = DEFAULTS_PAR_PERIODE[periode];
  return {
    value: d.umur_defaut,
    source: `Période ${PERIODE_LABELS[periode]} — U mur forfaitaire = ${d.umur_defaut} W/m².K`,
  };
}

/**
 * Retourne le Uw (vitrage) par défaut pour une période
 */
export function getUwDefaut(periode: PeriodeConstruction): DefaultValueWithSource {
  const d = DEFAULTS_PAR_PERIODE[periode];
  return {
    value: d.uw_defaut,
    source: `Période ${PERIODE_LABELS[periode]} — Uw vitrage forfaitaire = ${d.uw_defaut} W/m².K`,
  };
}

/**
 * Retourne toutes les valeurs avec source pour l'affichage DefaultField
 */
export function getAllDefaultsWithSource(periode: PeriodeConstruction): Record<string, DefaultValueWithSource> {
  const d = DEFAULTS_PAR_PERIODE[periode];
  const pl = PERIODE_LABELS[periode];

  return {
    materiaux_mur: { value: d.materiaux_mur, source: `Période ${pl} — ${MATERIAUX_LABELS[d.materiaux_mur] || d.materiaux_mur}` },
    type_isolation: { value: d.type_isolation, source: `Période ${pl} — ${ISOLATION_LABELS[d.type_isolation] || d.type_isolation}` },
    epaisseur_isolation: { value: d.epaisseur_isolation, source: d.epaisseur_isolation ? `Période ${pl} — épaisseur ${d.epaisseur_isolation} cm` : `Période ${pl} — pas d'isolation` },
    resistance_isolation: { value: d.resistance_isolation, source: d.resistance_isolation ? `Période ${pl} — R = ${d.resistance_isolation} m².K/W` : `Période ${pl} — pas d'isolation` },
    type_vitrage: { value: d.type_vitrage, source: `Période ${pl} — ${VITRAGE_LABELS[d.type_vitrage] || d.type_vitrage}` },
    type_menuiserie: { value: d.type_menuiserie, source: `Période ${pl}` },
    type_ventilation: { value: d.type_ventilation, source: `Période ${pl} — ${VENTILATION_LABELS[d.type_ventilation] || d.type_ventilation}` },
    categorie_chauffage: { value: d.categorie_chauffage, source: `Période ${pl} — équipement standard` },
    categorie_ecs: { value: d.categorie_ecs, source: `Période ${pl} — équipement standard` },
    umur_defaut: { value: d.umur_defaut, source: `Période ${pl} — U = ${d.umur_defaut} W/m².K` },
    uw_defaut: { value: d.uw_defaut, source: `Période ${pl} — Uw = ${d.uw_defaut} W/m².K` },
    uph_defaut: { value: d.uph_defaut, source: `Période ${pl} — Uph = ${d.uph_defaut} W/m².K` },
    upb_defaut: { value: d.upb_defaut, source: `Période ${pl} — Upb = ${d.upb_defaut} W/m².K` },
  };
}

// Labels exportés pour les composants UI
export { PERIODE_LABELS, MATERIAUX_LABELS, ISOLATION_LABELS, VITRAGE_LABELS, VENTILATION_LABELS };
