/**
 * Types TypeScript — Flux Audit Énergétique Réglementaire
 *
 * Étapes 1-11 : mutualisées avec le DPE (mêmes composants)
 * Étape 12 : Bilan état initial (synthèse auto depuis données saisies)
 * Étape 13-14 : Parcours 1 — travaux par étapes + DPE projeté (classe C min)
 * Étape 15-16 : Parcours 2 — rénovation globale + DPE projeté (classe B min)
 * Étape 17 : Analyse économique (MaPrimeRénov, CEE, reste à charge)
 * Étape 18 : Synthèse audit
 * Étape 19 : Validation audit (/controle_coherence_audit)
 * Étape 20 : Export XML audit
 */

import { ClasseDpe, PosteTravaux, Travail } from "./step12-14";

// ════════════════════════════════════════════════════════════
// ÉTAPE 12 AUDIT — BILAN ÉTAT INITIAL
// ════════════════════════════════════════════════════════════

/** Consommation par usage (kWhEP/m²/an) */
export interface ConsommationParUsage {
  chauffage: number;
  ecs: number;
  refroidissement: number;
  eclairage: number;
  auxiliaires: number;
  total: number;
}

/** Déperditions par poste (W/K) */
export interface DeperditionsParPoste {
  murs: number;
  planchers_bas: number;
  planchers_hauts: number;
  baies: number;
  portes: number;
  ponts_thermiques: number;
  renouvellement_air: number;
  total: number;
}

/** Émissions GES par usage (kgCO2/m²/an) */
export interface EmissionsParUsage {
  chauffage: number;
  ecs: number;
  refroidissement: number;
  total: number;
}

/** Bilan état initial complet */
export interface BilanEtatInitial {
  /** Étiquette énergie (A-G) */
  etiquette_energie: ClasseDpe;
  /** Étiquette climat (A-G) */
  etiquette_climat: ClasseDpe;
  /** Consommation énergie primaire totale (kWhEP/m²/an) */
  cep: number;
  /** Émissions GES totales (kgCO2/m²/an) */
  eges: number;
  /** Détail par usage */
  consommations: ConsommationParUsage;
  /** Détail déperditions */
  deperditions: DeperditionsParPoste;
  /** Détail émissions */
  emissions: EmissionsParUsage;
  /** Estimation facture annuelle (€) */
  estimation_facture: number | null;
}

/** Étape 12 Audit */
export interface AuditStep12Data {
  bilan: BilanEtatInitial;
}

// ════════════════════════════════════════════════════════════
// ÉTAPES 13-14 AUDIT — PARCOURS 1 (PROGRESSIF)
// ════════════════════════════════════════════════════════════

/** Détail d'un travail audit (plus complet que le DPE) */
export interface TravailAudit extends Travail {
  /** Produit / solution technique préconisée */
  produit_preconise: string;
  /** Marque / référence (optionnel) */
  reference_produit: string | null;
  /** Performance attendue (ex: R=4.5 m².K/W) */
  performance_attendue: string | null;
  /** Durée de vie estimée (années) */
  duree_vie: number | null;
}

/** Étape de travaux audit avec recalcul */
export interface EtapeTravauxAudit {
  id: string;
  numero: number;
  description: string;
  travaux: TravailAudit[];
  /** Coût HT estimé (€) */
  cout_ht: number | null;
  /** Coût TTC estimé (€) */
  cout_ttc: number | null;
  /** Classe atteinte après cette étape */
  classe_atteinte: ClasseDpe | null;
  /** Cep après cette étape (kWhEP/m²/an) */
  cep_apres: number | null;
  /** Eges après cette étape (kgCO2/m²/an) */
  eges_apres: number | null;
}

/** DPE projeté après travaux (recalcul 3CL) */
export interface DpeProjecte {
  etiquette_energie: ClasseDpe;
  etiquette_climat: ClasseDpe;
  cep: number;
  eges: number;
  consommations: ConsommationParUsage;
  gain_cep: number;
  gain_eges: number;
  /** % de réduction Cep */
  pourcentage_reduction_cep: number;
}

/** Parcours 1 audit — progressif */
export interface Parcours1Audit {
  etapes: EtapeTravauxAudit[];
  /** DPE projeté après toutes les étapes */
  dpe_projete: DpeProjecte | null;
  /** Coût total TTC cumulé */
  cout_total_ttc: number | null;
  /** Obligation : classe C minimum */
  classe_objectif: "C";
  conforme: boolean;
}

/** Étape 13 Audit */
export interface AuditStep13Data {
  parcours1: Parcours1Audit;
}

/** Étape 14 Audit — DPE projeté parcours 1 */
export interface AuditStep14Data {
  dpe_projete_p1: DpeProjecte;
}

// ════════════════════════════════════════════════════════════
// ÉTAPES 15-16 AUDIT — PARCOURS 2 (RÉNOVATION GLOBALE)
// ════════════════════════════════════════════════════════════

/** Parcours 2 audit — rénovation globale en 1 intervention */
export interface Parcours2Audit {
  /** Travaux en une seule intervention */
  travaux: TravailAudit[];
  /** DPE projeté après rénovation globale */
  dpe_projete: DpeProjecte | null;
  /** Coût total TTC */
  cout_total_ttc: number | null;
  /** Planning estimé (mois) */
  planning_mois: number | null;
  /** Obligation : classe B minimum */
  classe_objectif: "B";
  conforme: boolean;
}

/** Étape 15 Audit */
export interface AuditStep15Data {
  parcours2: Parcours2Audit;
}

/** Étape 16 Audit — DPE projeté parcours 2 */
export interface AuditStep16Data {
  dpe_projete_p2: DpeProjecte;
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 17 AUDIT — ANALYSE ÉCONOMIQUE
// ════════════════════════════════════════════════════════════

/** Tranche de revenu MaPrimeRénov */
export type TrancheRevenu = "tres_modeste" | "modeste" | "intermediaire" | "superieur";

/** Zone géographique pour aides */
export type ZoneAide = "idf" | "hors_idf";

/** Détail d'une aide financière */
export interface AideFinanciere {
  type: "maprimerénov" | "cee" | "eco_ptz" | "tva_reduite" | "aide_locale" | "autre";
  libelle: string;
  montant_estime: number;
  /** Conditions d'éligibilité */
  conditions: string | null;
}

/** Analyse économique d'un parcours */
export interface AnalyseEconomiqueParcours {
  numero_parcours: 1 | 2;
  cout_total_ttc: number;
  aides: AideFinanciere[];
  total_aides: number;
  reste_a_charge: number;
  /** Économie annuelle sur facture (€/an) */
  economie_annuelle: number | null;
  /** Temps de retour sur investissement (années) */
  temps_retour: number | null;
}

/** Étape 17 Audit */
export interface AuditStep17Data {
  tranche_revenu: TrancheRevenu;
  zone_aide: ZoneAide;
  /** Revenu fiscal de référence (€) */
  revenu_fiscal: number | null;
  /** Nombre de personnes dans le ménage */
  nb_personnes: number;
  analyses: AnalyseEconomiqueParcours[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 18 AUDIT — SYNTHÈSE
// ════════════════════════════════════════════════════════════

/** Synthèse audit complète */
export interface SyntheseAudit {
  bilan_initial: BilanEtatInitial;
  parcours1_classe_atteinte: ClasseDpe | null;
  parcours2_classe_atteinte: ClasseDpe | null;
  parcours1_cout_reste_charge: number | null;
  parcours2_cout_reste_charge: number | null;
  recommandation_auditeur: string;
}

export interface AuditStep18Data {
  synthese: SyntheseAudit;
}

// ════════════════════════════════════════════════════════════
// ÉTAPES 19-20 AUDIT — VALIDATION + EXPORT
// ════════════════════════════════════════════════════════════
// Réutilisent les types Step13Data et Step14Data du DPE
// avec l'endpoint /controle_coherence_audit

// ════════════════════════════════════════════════════════════
// CONSTANTES AUDIT
// ════════════════════════════════════════════════════════════

/** Seuils étiquettes DPE (doubles seuils EP + GES) */
export const SEUILS_ETIQUETTE: Record<ClasseDpe, { cep_max: number; eges_max: number }> = {
  A: { cep_max: 70, eges_max: 6 },
  B: { cep_max: 110, eges_max: 11 },
  C: { cep_max: 180, eges_max: 30 },
  D: { cep_max: 250, eges_max: 50 },
  E: { cep_max: 330, eges_max: 70 },
  F: { cep_max: 420, eges_max: 100 },
  G: { cep_max: Infinity, eges_max: Infinity },
};

/** Calcule l'étiquette DPE depuis Cep et Eges (doubles seuils) */
export function calculerEtiquette(cep: number, eges: number): ClasseDpe {
  const classes: ClasseDpe[] = ["A", "B", "C", "D", "E", "F", "G"];
  for (const cls of classes) {
    const s = SEUILS_ETIQUETTE[cls];
    if (cep <= s.cep_max && eges <= s.eges_max) return cls;
  }
  return "G";
}

/** Plafonds revenus MaPrimeRénov 2026 (IDF) */
export const PLAFONDS_REVENUS_IDF: Record<TrancheRevenu, number[]> = {
  tres_modeste: [23541, 34551, 41493, 48447, 55427],
  modeste: [28657, 42058, 50513, 58981, 67473],
  intermediaire: [40018, 58827, 70382, 82839, 94844],
  superieur: [40019, 58828, 70383, 82840, 94845], // Au-dessus d'intermédiaire
};

/** Plafonds revenus MaPrimeRénov 2026 (hors IDF) */
export const PLAFONDS_REVENUS_HORS_IDF: Record<TrancheRevenu, number[]> = {
  tres_modeste: [17009, 24875, 29917, 34948, 40002],
  modeste: [21805, 31889, 38349, 44802, 51281],
  intermediaire: [30549, 44907, 54071, 63235, 72400],
  superieur: [30550, 44908, 54072, 63236, 72401],
};

/** Détermine la tranche de revenu */
export function determinerTrancheRevenu(
  revenu: number, nb_personnes: number, zone: ZoneAide
): TrancheRevenu {
  const plafonds = zone === "idf" ? PLAFONDS_REVENUS_IDF : PLAFONDS_REVENUS_HORS_IDF;
  const idx = Math.min(nb_personnes - 1, 4);

  if (revenu <= plafonds.tres_modeste[idx]) return "tres_modeste";
  if (revenu <= plafonds.modeste[idx]) return "modeste";
  if (revenu <= plafonds.intermediaire[idx]) return "intermediaire";
  return "superieur";
}

/** Nombre total d'étapes audit */
export const NB_ETAPES_AUDIT = 20;

/** Labels étapes audit */
export const ETAPES_AUDIT_LABELS: Record<number, string> = {
  1: "Informations générales",
  2: "Données administratives",
  3: "Caractéristiques générales",
  4: "Murs",
  5: "Baies et portes",
  6: "Planchers bas",
  7: "Planchers hauts",
  8: "Ponts thermiques",
  9: "Chauffage",
  10: "ECS",
  11: "Ventilation / Clim / ENR",
  12: "Bilan état initial",
  13: "Parcours 1 — Travaux",
  14: "Parcours 1 — DPE projeté",
  15: "Parcours 2 — Travaux",
  16: "Parcours 2 — DPE projeté",
  17: "Analyse économique",
  18: "Synthèse audit",
  19: "Validation audit",
  20: "Export XML audit",
};
