/**
 * Types TypeScript — Étapes 9 à 11 du Wizard DPE
 * 
 * Mapping XSD DPEv2.6 :
 *   Étape 9  : <installation_chauffage_collection>  (ligne 4817)
 *   Étape 10 : <installation_ecs_collection>         (ligne 3929)
 *   Étape 11 : <ventilation_collection> + <climatisation_collection> + <production_elec_enr> (lignes 3212, 3460, 3737)
 * 
 * CRITIQUE : Les enums type_generateur_ch (171 val) et type_generateur_ecs (134 val)
 * pilotent les champs dynamiques via variables_requises/interdites (enum_tables.xlsx).
 */

import type { Orientation } from "./step4-8";

// ════════════════════════════════════════════════════════════
// ENUMS COMMUNS INSTALLATIONS
// ════════════════════════════════════════════════════════════

/** Type d'énergie (enum "type_energie" — 15 valeurs) */
export type TypeEnergie =
  | "electricite"
  | "gaz_naturel"
  | "gaz_propane_butane"
  | "fioul_domestique"
  | "bois_buches"
  | "bois_granules"
  | "bois_plaquettes"
  | "charbon"
  | "reseau_chaleur"
  | "reseau_froid"
  | "electricite_heure_pleine"
  | "electricite_heure_creuse"
  | "bioethanol"
  | "autre_combustible"
  | "solaire";

// ════════════════════════════════════════════════════════════
// ÉTAPE 9 — CHAUFFAGE (<installation_chauffage_collection>)
// ════════════════════════════════════════════════════════════

/** Config installation chauffage (enum "cfg_installation_ch" — 11 valeurs, sélection) */
export type CfgInstallationCh =
  | "installation_unique"
  | "deux_generateurs_base_appoint"
  | "deux_generateurs_par_surface"
  | "generateur_collectif"
  | "mixte_individuel_collectif"
  | "chauffage_electrique_base"
  | "pompe_chaleur_base_appoint"
  | "insert_base_appoint"
  | "poele_base_appoint"
  | "systeme_solaire_appoint"
  | "autre_configuration";

/**
 * Type de générateur chauffage — ENUM CRITIQUE (171 valeurs dans le XSD)
 * Ici : catégories principales avec sous-types courants.
 * Le mapping complet generateur → variables_requises/interdites
 * est dans GENERATEUR_CH_FIELDS.
 */
export type CategorieGenerateurCh =
  | "chaudiere_gaz"
  | "chaudiere_gaz_condensation"
  | "chaudiere_fioul"
  | "chaudiere_fioul_condensation"
  | "chaudiere_bois_buches"
  | "chaudiere_bois_granules"
  | "pac_air_air"
  | "pac_air_eau"
  | "pac_eau_eau"
  | "pac_geothermique"
  | "radiateur_electrique"
  | "convecteur_electrique"
  | "panneau_rayonnant"
  | "plancher_chauffant_electrique"
  | "insert_bois"
  | "poele_bois_buches"
  | "poele_granules"
  | "reseau_chaleur"
  | "autre_generateur_ch";

/** Type émission/distribution (enum "type_emission_distribution" — 50 valeurs, sélection) */
export type TypeEmissionDistribution =
  | "radiateur_haute_temperature"
  | "radiateur_basse_temperature"
  | "plancher_chauffant"
  | "plafond_rayonnant"
  | "convecteur"
  | "ventilo_convecteur"
  | "split_gainable"
  | "bouche_insufflation"
  | "autre_emetteur";

/** Données d'un générateur chauffage */
export interface GenerateurChauffage {
  id: string;
  description: string;
  /** Catégorie du générateur */
  categorie: CategorieGenerateurCh;
  /** ID enum exact XSD (pour le XML final) */
  type_generateur_ch_id: number | null;
  /** Énergie utilisée */
  energie: TypeEnergie;
  /** Puissance nominale (kW) — REQUIS pour la plupart */
  puissance_nominale: number | null;

  // ── Champs dynamiques (variables_requises / interdites) ──
  /** Rendement PCI à pleine charge (%) — chaudières */
  rpn: number | null;
  /** Rendement PCI à charge intermédiaire (%) — chaudières */
  rpint: number | null;
  /** Rendement de génération (%) — anciens systèmes */
  rendement_generation: number | null;
  /** SCOP — PAC */
  scop: number | null;
  /** COP — PAC (ancien) */
  cop: number | null;
  /** Rendement combustion (%) — chaudières */
  rendement_combustion: number | null;
  /** Présence veilleuse — anciennes chaudières */
  presence_veilleuse: boolean;
  /** Priorité dans l'installation (base / appoint) */
  priorite: "base" | "appoint";
  /** Surface chauffée par ce générateur (m²) */
  surface_chauffee: number | null;
  /** Part de la surface chauffée (%) — si 2 générateurs */
  part_surface: number | null;
  /** Année d'installation */
  annee_installation: number | null;
}

/** Données d'un émetteur */
export interface Emetteur {
  id: string;
  type_emission: TypeEmissionDistribution;
  /** Année d'installation des émetteurs */
  annee_installation: number | null;
  /** Réseau de distribution isolé */
  reseau_isole: boolean;
  /** Longueur réseau hors volume chauffé (m) */
  longueur_reseau_hors_volume: number | null;
}

/** Régulation / intermittence */
export interface Regulation {
  /** Type d'équipement d'intermittence */
  equipement_intermittence: "aucun" | "thermostat_central" | "robinet_thermostatique" | "programmation" | "regulation_pièce_par_pièce" | "regulation_terminale" | "gestion_active";
  /** Régulation en pied de colonne (collectif) */
  regulation_pied_colonne: boolean;
  /** Comptage individuel (collectif) */
  comptage_individuel: boolean;
}

/** Installation chauffage complète */
export interface InstallationChauffage {
  id: string;
  description: string;
  /** Configuration de l'installation */
  cfg_installation: CfgInstallationCh;
  /** Surface chauffée par cette installation (m²) */
  surface_chauffee: number;
  /** Générateurs (1 ou 2 selon config) */
  generateurs: GenerateurChauffage[];
  /** Émetteurs */
  emetteurs: Emetteur[];
  /** Régulation */
  regulation: Regulation;
}

/** Étape 9 */
export interface Step9Data {
  installations_chauffage: InstallationChauffage[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 10 — ECS (<installation_ecs_collection>)
// ════════════════════════════════════════════════════════════

/** Config installation ECS (enum "cfg_installation_ecs" — 3 valeurs) */
export type CfgInstallationEcs =
  | "ecs_seule"
  | "ecs_liee_chauffage"
  | "ecs_collective";

/** Catégorie générateur ECS (134 valeurs XSD, regroupées) */
export type CategorieGenerateurEcs =
  | "chauffe_eau_electrique"
  | "chauffe_eau_gaz_instantane"
  | "chauffe_eau_gaz_accumulation"
  | "chauffe_eau_thermodynamique"
  | "chaudiere_gaz_ecs"
  | "chaudiere_fioul_ecs"
  | "pac_ecs"
  | "ballon_solaire_cesi"
  | "systeme_solaire_combine"
  | "reseau_chaleur_ecs"
  | "accumulateur_gaz"
  | "generateur_chauffage_mixte"
  | "autre_generateur_ecs";

/** Type installation solaire (enum "type_installation_solaire" — 4 valeurs) */
export type TypeInstallationSolaire =
  | "cesi"        // Chauffe-Eau Solaire Individuel
  | "ssc"         // Système Solaire Combiné
  | "collectif_appoint_individuel"
  | "collectif_appoint_collectif";

/** Générateur ECS */
export interface GenerateurEcs {
  id: string;
  description: string;
  categorie: CategorieGenerateurEcs;
  type_generateur_ecs_id: number | null;
  energie: TypeEnergie;
  puissance_nominale: number | null;
  /** Volume de stockage (litres) */
  volume_stockage: number | null;
  /** Type de stockage */
  type_stockage: "sans_stockage" | "ballon_vertical" | "ballon_horizontal" | "accumulation" | null;
  /** Pertes de stockage (W) */
  pertes_stockage: number | null;

  // Champs dynamiques
  rpn: number | null;
  rpint: number | null;
  cop: number | null;
  scop: number | null;
  rendement_generation: number | null;
  presence_veilleuse: boolean;
  annee_installation: number | null;
}

/** Installation solaire thermique */
export interface InstallationSolaire {
  type_installation: TypeInstallationSolaire;
  /** Surface de capteurs (m²) */
  surface_capteurs: number;
  orientation: Orientation;
  /** Inclinaison des capteurs (degrés) */
  inclinaison: number;
  /** Productivité (kWh/m²/an) */
  productivite: number | null;
}

/** Installation ECS complète */
export interface InstallationEcs {
  id: string;
  description: string;
  cfg_installation: CfgInstallationEcs;
  /** Liée à une installation chauffage (ref) */
  reference_installation_chauffage: string | null;
  generateurs: GenerateurEcs[];
  /** Installation solaire (optionnel) */
  solaire: InstallationSolaire | null;
  /** Réseau de distribution isolé */
  reseau_isole: boolean;
  longueur_reseau_hors_volume: number | null;
}

/** Étape 10 */
export interface Step10Data {
  installations_ecs: InstallationEcs[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 11 — VENTILATION / CLIM / ENR
// ════════════════════════════════════════════════════════════

// ── Ventilation ──

/** Type de ventilation (enum "type_ventilation" — 38 valeurs, sélection) */
export type TypeVentilation =
  | "ventilation_naturelle_conduit"
  | "ventilation_naturelle_entrees_air"
  | "vmc_simple_flux_auto"
  | "vmc_simple_flux_hygro_a"
  | "vmc_simple_flux_hygro_b"
  | "vmc_double_flux"
  | "vmc_double_flux_thermodynamique"
  | "vmc_gaz"
  | "ventilation_mecanique_repartie"
  | "puits_climatique"
  | "autre_ventilation";

export interface Ventilation {
  id: string;
  description: string;
  type_ventilation: TypeVentilation;
  /** Perméabilité à l'air Q4Pa (m³/h/m²) */
  q4pa: number | null;
  /** Débit spécifique (m³/h) */
  debit: number | null;
  /** Individuelle ou collective */
  individuelle: boolean;
  annee_installation: number | null;
}

// ── Climatisation ──

export interface Climatisation {
  id: string;
  description: string;
  /** Type de clim (split, gainable, VRV, etc.) */
  type_climatisation: "split" | "multi_split" | "gainable" | "vrv" | "centralisee" | "autre";
  /** SEER (coefficient de performance saisonnier) */
  seer: number | null;
  /** Surface climatisée (m²) */
  surface_climatisee: number;
  energie: TypeEnergie;
  annee_installation: number | null;
}

// ── Production ENR ──

export interface ProductionElecENR {
  id: string;
  description: string;
  /** Type d'ENR */
  type_enr: "panneaux_photovoltaiques" | "eolienne" | "autre_enr";
  /** Surface de panneaux (m²) */
  surface: number;
  orientation: Orientation;
  /** Inclinaison (degrés) */
  inclinaison: number;
  /** Puissance crête (kWc) */
  puissance_crete: number | null;
  /** Production annuelle estimée (kWh/an) */
  production_annuelle: number | null;
}

/** Étape 11 */
export interface Step11Data {
  ventilations: Ventilation[];
  climatisations: Climatisation[];
  productions_enr: ProductionElecENR[];
}

// ════════════════════════════════════════════════════════════
// MÉCANISME VARIABLES REQUISES / INTERDITES
// ════════════════════════════════════════════════════════════

/** Champs possibles d'un générateur chauffage */
export type ChampGenerateurCh =
  | "puissance_nominale" | "rpn" | "rpint" | "rendement_generation"
  | "scop" | "cop" | "rendement_combustion" | "presence_veilleuse"
  | "annee_installation";

/** Règle de champs dynamiques pour un type de générateur */
export interface RegleChampsDynamiques {
  /** Champs qui DOIVENT être remplis */
  requis: ChampGenerateurCh[];
  /** Champs qui sont INTERDITS */
  interdits: ChampGenerateurCh[];
}

/**
 * Mapping catégorie générateur → champs requis/interdits.
 * 
 * Source de vérité complète : enum_tables.xlsx du repo observatoire-dpe.
 * Ce mapping simplifié couvre les catégories principales.
 * En v2, NEXUS générera ce mapping automatiquement depuis le fichier Excel.
 */
export const GENERATEUR_CH_FIELDS: Record<CategorieGenerateurCh, RegleChampsDynamiques> = {
  chaudiere_gaz: {
    requis: ["puissance_nominale", "rpn", "rpint", "rendement_combustion"],
    interdits: ["scop", "cop"],
  },
  chaudiere_gaz_condensation: {
    requis: ["puissance_nominale", "rpn", "rpint"],
    interdits: ["scop", "cop"],
  },
  chaudiere_fioul: {
    requis: ["puissance_nominale", "rpn", "rpint", "rendement_combustion"],
    interdits: ["scop", "cop"],
  },
  chaudiere_fioul_condensation: {
    requis: ["puissance_nominale", "rpn", "rpint"],
    interdits: ["scop", "cop"],
  },
  chaudiere_bois_buches: {
    requis: ["puissance_nominale", "rpn"],
    interdits: ["scop", "cop"],
  },
  chaudiere_bois_granules: {
    requis: ["puissance_nominale", "rpn"],
    interdits: ["scop", "cop"],
  },
  pac_air_air: {
    requis: ["scop", "puissance_nominale"],
    interdits: ["rpn", "rpint", "rendement_generation", "rendement_combustion"],
  },
  pac_air_eau: {
    requis: ["scop", "puissance_nominale"],
    interdits: ["rpn", "rpint", "rendement_generation", "rendement_combustion"],
  },
  pac_eau_eau: {
    requis: ["scop", "puissance_nominale"],
    interdits: ["rpn", "rpint", "rendement_generation", "rendement_combustion"],
  },
  pac_geothermique: {
    requis: ["scop", "puissance_nominale"],
    interdits: ["rpn", "rpint", "rendement_generation", "rendement_combustion"],
  },
  radiateur_electrique: {
    requis: ["puissance_nominale"],
    interdits: ["rpn", "rpint", "scop", "cop", "rendement_combustion"],
  },
  convecteur_electrique: {
    requis: ["puissance_nominale"],
    interdits: ["rpn", "rpint", "scop", "cop", "rendement_combustion"],
  },
  panneau_rayonnant: {
    requis: ["puissance_nominale"],
    interdits: ["rpn", "rpint", "scop", "cop", "rendement_combustion"],
  },
  plancher_chauffant_electrique: {
    requis: ["puissance_nominale"],
    interdits: ["rpn", "rpint", "scop", "cop", "rendement_combustion"],
  },
  insert_bois: {
    requis: ["puissance_nominale", "rendement_generation"],
    interdits: ["scop", "cop", "rpint"],
  },
  poele_bois_buches: {
    requis: ["puissance_nominale", "rendement_generation"],
    interdits: ["scop", "cop", "rpint"],
  },
  poele_granules: {
    requis: ["puissance_nominale", "rendement_generation"],
    interdits: ["scop", "cop"],
  },
  reseau_chaleur: {
    requis: [],
    interdits: ["rpn", "rpint", "scop", "cop", "rendement_combustion", "puissance_nominale"],
  },
  autre_generateur_ch: {
    requis: ["puissance_nominale"],
    interdits: [],
  },
};

/** Vérifie si un champ est requis pour un type de générateur */
export function isChampRequis(categorie: CategorieGenerateurCh, champ: ChampGenerateurCh): boolean {
  return GENERATEUR_CH_FIELDS[categorie]?.requis.includes(champ) ?? false;
}

/** Vérifie si un champ est interdit pour un type de générateur */
export function isChampInterdit(categorie: CategorieGenerateurCh, champ: ChampGenerateurCh): boolean {
  return GENERATEUR_CH_FIELDS[categorie]?.interdits.includes(champ) ?? false;
}

/** Retourne les champs à afficher pour un générateur */
export function getChampsVisibles(categorie: CategorieGenerateurCh): ChampGenerateurCh[] {
  const regles = GENERATEUR_CH_FIELDS[categorie];
  if (!regles) return ["puissance_nominale"];

  const tousChamps: ChampGenerateurCh[] = [
    "puissance_nominale", "rpn", "rpint", "rendement_generation",
    "scop", "cop", "rendement_combustion", "presence_veilleuse", "annee_installation",
  ];

  return tousChamps.filter((c) => !regles.interdits.includes(c));
}

/** Énergie par défaut selon la catégorie de générateur */
export const ENERGIE_PAR_DEFAUT: Record<CategorieGenerateurCh, TypeEnergie> = {
  chaudiere_gaz: "gaz_naturel",
  chaudiere_gaz_condensation: "gaz_naturel",
  chaudiere_fioul: "fioul_domestique",
  chaudiere_fioul_condensation: "fioul_domestique",
  chaudiere_bois_buches: "bois_buches",
  chaudiere_bois_granules: "bois_granules",
  pac_air_air: "electricite",
  pac_air_eau: "electricite",
  pac_eau_eau: "electricite",
  pac_geothermique: "electricite",
  radiateur_electrique: "electricite",
  convecteur_electrique: "electricite",
  panneau_rayonnant: "electricite",
  plancher_chauffant_electrique: "electricite",
  insert_bois: "bois_buches",
  poele_bois_buches: "bois_buches",
  poele_granules: "bois_granules",
  reseau_chaleur: "reseau_chaleur",
  autre_generateur_ch: "electricite",
};
