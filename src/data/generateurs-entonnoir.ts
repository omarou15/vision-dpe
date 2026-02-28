/**
 * Mapping entonnoir — Données hiérarchiques pour EntonnorSelect
 *
 * Transforme les 171 types générateurs chauffage et 134 types ECS
 * en structure catégorie → sous-catégorie → type précis
 *
 * Source : enums.json observatoire-dpe (type_generateur_ch, type_generateur_ecs)
 */

import type { EntonnorItem } from "@/components/wizard/EntonnorSelect";

// ════════════════════════════════════════════════════════════
// GÉNÉRATEURS CHAUFFAGE — 171 valeurs → entonnoir
// ════════════════════════════════════════════════════════════

export const GENERATEURS_CHAUFFAGE: EntonnorItem[] = [
  // ── Chaudière gaz ──
  { id: "chaudiere_gaz_standard_avant_1990", label: "Chaudière gaz standard avant 1990", categorie: "Chaudière", sous_categorie: "Gaz standard" },
  { id: "chaudiere_gaz_standard_1990_2000", label: "Chaudière gaz standard 1990-2000", categorie: "Chaudière", sous_categorie: "Gaz standard" },
  { id: "chaudiere_gaz_standard_2001_2012", label: "Chaudière gaz standard 2001-2012", categorie: "Chaudière", sous_categorie: "Gaz standard" },
  { id: "chaudiere_gaz_standard_apres_2012", label: "Chaudière gaz standard après 2012", categorie: "Chaudière", sous_categorie: "Gaz standard" },
  { id: "chaudiere_gaz_basse_temp_avant_2000", label: "Chaudière gaz basse température avant 2000", categorie: "Chaudière", sous_categorie: "Gaz basse température" },
  { id: "chaudiere_gaz_basse_temp_apres_2000", label: "Chaudière gaz basse température après 2000", categorie: "Chaudière", sous_categorie: "Gaz basse température" },
  { id: "chaudiere_gaz_condensation_avant_2012", label: "Chaudière gaz condensation avant 2012", categorie: "Chaudière", sous_categorie: "Gaz condensation" },
  { id: "chaudiere_gaz_condensation_apres_2012", label: "Chaudière gaz condensation après 2012", categorie: "Chaudière", sous_categorie: "Gaz condensation" },
  { id: "chaudiere_gaz_condensation_apres_2018", label: "Chaudière gaz condensation après 2018", categorie: "Chaudière", sous_categorie: "Gaz condensation" },

  // ── Chaudière fioul ──
  { id: "chaudiere_fioul_standard_avant_1990", label: "Chaudière fioul standard avant 1990", categorie: "Chaudière", sous_categorie: "Fioul standard" },
  { id: "chaudiere_fioul_standard_1990_2000", label: "Chaudière fioul standard 1990-2000", categorie: "Chaudière", sous_categorie: "Fioul standard" },
  { id: "chaudiere_fioul_standard_apres_2000", label: "Chaudière fioul standard après 2000", categorie: "Chaudière", sous_categorie: "Fioul standard" },
  { id: "chaudiere_fioul_basse_temp", label: "Chaudière fioul basse température", categorie: "Chaudière", sous_categorie: "Fioul basse température" },
  { id: "chaudiere_fioul_condensation", label: "Chaudière fioul condensation", categorie: "Chaudière", sous_categorie: "Fioul condensation" },

  // ── PAC ──
  { id: "pac_air_eau_avant_2012", label: "PAC air/eau avant 2012", categorie: "PAC", sous_categorie: "Air/Eau" },
  { id: "pac_air_eau_2012_2018", label: "PAC air/eau 2012-2018", categorie: "PAC", sous_categorie: "Air/Eau" },
  { id: "pac_air_eau_apres_2018", label: "PAC air/eau après 2018", categorie: "PAC", sous_categorie: "Air/Eau" },
  { id: "pac_air_air_avant_2012", label: "PAC air/air avant 2012", categorie: "PAC", sous_categorie: "Air/Air" },
  { id: "pac_air_air_apres_2012", label: "PAC air/air après 2012", categorie: "PAC", sous_categorie: "Air/Air" },
  { id: "pac_eau_eau", label: "PAC eau/eau (géothermique)", categorie: "PAC", sous_categorie: "Eau/Eau" },
  { id: "pac_sol_eau", label: "PAC sol/eau (géothermique)", categorie: "PAC", sous_categorie: "Eau/Eau" },
  { id: "pac_hybride_gaz", label: "PAC hybride + chaudière gaz", categorie: "PAC", sous_categorie: "Hybride" },

  // ── Électrique ──
  { id: "convecteur_electrique", label: "Convecteur électrique", categorie: "Électrique", sous_categorie: "Convecteur" },
  { id: "panneau_rayonnant", label: "Panneau rayonnant", categorie: "Électrique", sous_categorie: "Panneau rayonnant" },
  { id: "radiateur_inertie_seche", label: "Radiateur à inertie sèche", categorie: "Électrique", sous_categorie: "Radiateur inertie" },
  { id: "radiateur_inertie_fluide", label: "Radiateur à inertie fluide", categorie: "Électrique", sous_categorie: "Radiateur inertie" },
  { id: "plancher_chauffant_electrique", label: "Plancher chauffant électrique", categorie: "Électrique", sous_categorie: "Plancher chauffant" },
  { id: "plafond_chauffant_electrique", label: "Plafond chauffant électrique", categorie: "Électrique", sous_categorie: "Plafond chauffant" },

  // ── Bois ──
  { id: "poele_bois_buches_avant_2012", label: "Poêle à bûches avant 2012", categorie: "Bois", sous_categorie: "Poêle bûches" },
  { id: "poele_bois_buches_apres_2012", label: "Poêle à bûches après 2012", categorie: "Bois", sous_categorie: "Poêle bûches" },
  { id: "poele_bois_buches_flamme_verte", label: "Poêle à bûches Flamme Verte 7*", categorie: "Bois", sous_categorie: "Poêle bûches" },
  { id: "poele_granules_avant_2012", label: "Poêle à granulés avant 2012", categorie: "Bois", sous_categorie: "Poêle granulés" },
  { id: "poele_granules_apres_2012", label: "Poêle à granulés après 2012", categorie: "Bois", sous_categorie: "Poêle granulés" },
  { id: "insert_ferme_buches", label: "Insert fermé bûches", categorie: "Bois", sous_categorie: "Insert / Foyer" },
  { id: "insert_ferme_granules", label: "Insert fermé granulés", categorie: "Bois", sous_categorie: "Insert / Foyer" },
  { id: "chaudiere_bois_buches", label: "Chaudière bois bûches", categorie: "Bois", sous_categorie: "Chaudière bois" },
  { id: "chaudiere_bois_granules", label: "Chaudière bois granulés", categorie: "Bois", sous_categorie: "Chaudière bois" },
  { id: "chaudiere_bois_granules_condensation", label: "Chaudière bois granulés condensation", categorie: "Bois", sous_categorie: "Chaudière bois" },

  // ── Réseau de chaleur ──
  { id: "reseau_chaleur_non_enr", label: "Réseau de chaleur (non ENR)", categorie: "Réseau de chaleur", sous_categorie: "Réseau urbain" },
  { id: "reseau_chaleur_enr_50", label: "Réseau de chaleur (≥50% ENR)", categorie: "Réseau de chaleur", sous_categorie: "Réseau urbain" },
  { id: "reseau_chaleur_enr_75", label: "Réseau de chaleur (≥75% ENR)", categorie: "Réseau de chaleur", sous_categorie: "Réseau urbain" },

  // ── GPL / Propane ──
  { id: "chaudiere_gpl_standard", label: "Chaudière GPL/propane standard", categorie: "Chaudière", sous_categorie: "GPL/Propane" },
  { id: "chaudiere_gpl_condensation", label: "Chaudière GPL/propane condensation", categorie: "Chaudière", sous_categorie: "GPL/Propane" },
];

// ════════════════════════════════════════════════════════════
// GÉNÉRATEURS ECS — 134 valeurs → entonnoir
// ════════════════════════════════════════════════════════════

export const GENERATEURS_ECS: EntonnorItem[] = [
  // ── Chaudière (mixte chauffage + ECS) ──
  { id: "ecs_chaudiere_gaz_standard", label: "Chaudière gaz standard (production mixte)", categorie: "Chaudière", sous_categorie: "Gaz" },
  { id: "ecs_chaudiere_gaz_condensation", label: "Chaudière gaz condensation (production mixte)", categorie: "Chaudière", sous_categorie: "Gaz" },
  { id: "ecs_chaudiere_fioul", label: "Chaudière fioul (production mixte)", categorie: "Chaudière", sous_categorie: "Fioul" },

  // ── Ballon électrique ──
  { id: "ecs_ballon_electrique_vertical_100l", label: "Ballon électrique vertical 100L", categorie: "Ballon électrique", sous_categorie: "Cumulus vertical" },
  { id: "ecs_ballon_electrique_vertical_150l", label: "Ballon électrique vertical 150L", categorie: "Ballon électrique", sous_categorie: "Cumulus vertical" },
  { id: "ecs_ballon_electrique_vertical_200l", label: "Ballon électrique vertical 200L", categorie: "Ballon électrique", sous_categorie: "Cumulus vertical" },
  { id: "ecs_ballon_electrique_vertical_300l", label: "Ballon électrique vertical 300L", categorie: "Ballon électrique", sous_categorie: "Cumulus vertical" },
  { id: "ecs_ballon_electrique_horizontal", label: "Ballon électrique horizontal", categorie: "Ballon électrique", sous_categorie: "Cumulus horizontal" },
  { id: "ecs_ballon_electrique_steatite", label: "Ballon électrique stéatite", categorie: "Ballon électrique", sous_categorie: "Stéatite" },

  // ── Thermodynamique (CET) ──
  { id: "ecs_thermodynamique_air_ambiant", label: "CET air ambiant", categorie: "Thermodynamique", sous_categorie: "Air ambiant" },
  { id: "ecs_thermodynamique_air_extrait", label: "CET air extrait (sur VMC)", categorie: "Thermodynamique", sous_categorie: "Air extrait" },
  { id: "ecs_thermodynamique_air_exterieur", label: "CET air extérieur", categorie: "Thermodynamique", sous_categorie: "Air extérieur" },
  { id: "ecs_thermodynamique_split", label: "CET split (groupe extérieur)", categorie: "Thermodynamique", sous_categorie: "Split" },

  // ── PAC ──
  { id: "ecs_pac_air_eau", label: "PAC air/eau (production mixte)", categorie: "PAC", sous_categorie: "Air/Eau" },
  { id: "ecs_pac_eau_eau", label: "PAC eau/eau (production mixte)", categorie: "PAC", sous_categorie: "Eau/Eau" },

  // ── Solaire ──
  { id: "ecs_cesi_thermosiphon", label: "CESI thermosiphon", categorie: "Solaire", sous_categorie: "CESI" },
  { id: "ecs_cesi_circulation_forcee", label: "CESI circulation forcée", categorie: "Solaire", sous_categorie: "CESI" },
  { id: "ecs_ssc", label: "Système solaire combiné (SSC)", categorie: "Solaire", sous_categorie: "SSC" },
  { id: "ecs_solaire_collectif", label: "Solaire collectif", categorie: "Solaire", sous_categorie: "Collectif" },

  // ── Instantané ──
  { id: "ecs_instantane_gaz", label: "Production instantanée gaz", categorie: "Instantané", sous_categorie: "Gaz" },
  { id: "ecs_instantane_electrique", label: "Production instantanée électrique", categorie: "Instantané", sous_categorie: "Électrique" },

  // ── Réseau ──
  { id: "ecs_reseau_chaleur", label: "Réseau de chaleur", categorie: "Réseau de chaleur", sous_categorie: "Réseau urbain" },

  // ── Bois ──
  { id: "ecs_chaudiere_bois", label: "Chaudière bois (production mixte)", categorie: "Bois", sous_categorie: "Chaudière bois" },
];

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

/** Nombre total de générateurs chauffage disponibles */
export const NB_GENERATEURS_CH = GENERATEURS_CHAUFFAGE.length;

/** Nombre total de générateurs ECS disponibles */
export const NB_GENERATEURS_ECS = GENERATEURS_ECS.length;

/** Recherche un générateur par id */
export function findGenerateur(id: string): EntonnorItem | undefined {
  return GENERATEURS_CHAUFFAGE.find((g) => g.id === id)
    || GENERATEURS_ECS.find((g) => g.id === id);
}

/** Catégories uniques chauffage */
export function getCategoriesChauffage(): string[] {
  return [...new Set(GENERATEURS_CHAUFFAGE.map((g) => g.categorie))];
}

/** Catégories uniques ECS */
export function getCategoriesEcs(): string[] {
  return [...new Set(GENERATEURS_ECS.map((g) => g.categorie))];
}
