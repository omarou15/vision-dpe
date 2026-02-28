/** Couleurs des étiquettes DPE A-G */
export const DPE_COLORS = {
  A: "#009C6B",
  B: "#52B153",
  C: "#A0C853",
  D: "#F1E94E",
  E: "#F2A93B",
  F: "#EB6232",
  G: "#D42027",
} as const;

/** Seuils DPE (kWhEP/m².an) — arrêté du 31 mars 2021 */
export const DPE_THRESHOLDS_EP = {
  A: 70,
  B: 110,
  C: 180,
  D: 250,
  E: 330,
  F: 420,
  // G: > 420
} as const;

/** Seuils DPE (kgCO2/m².an) — double seuil GES */
export const DPE_THRESHOLDS_GES = {
  A: 6,
  B: 11,
  C: 30,
  D: 50,
  E: 70,
  F: 100,
  // G: > 100
} as const;

/** Types de projet */
export const PROJECT_TYPES = ["dpe", "audit"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Types de logement */
export const LOGEMENT_TYPES = ["maison", "appartement", "immeuble"] as const;
export type LogementType = (typeof LOGEMENT_TYPES)[number];

/** Statuts de projet */
export const PROJECT_STATUSES = [
  "draft",
  "inProgress",
  "validated",
  "exported",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Nombre d'étapes par type de projet */
export const STEPS_COUNT = {
  dpe: 14,
  audit: 20,
} as const;

/** PEF électricité (depuis janvier 2026, version 1.12.3) */
export const PEF_ELECTRICITE = 1.9;

/** URL API BAN géocodage */
export const BAN_API_URL = "https://api-adresse.data.gouv.fr";
