/**
 * RAPPORT DE VÉRIFICATION DES ENUMS DPE
 * Généré le: 2025-02-25
 * 
 * Comparaison: src/types/dpe.ts vs enums.json (ADEME officiel)
 */

// ============================================================================
// ENUM TYPE_ENERGIE - CRITIQUE
// ============================================================================

// REFERENCE (enums.json):
const type_energie_ref = {
  "1": "électricité",
  "2": "gaz naturel",
  "3": "fioul domestique",
  "4": "bois – bûches",
  "5": "bois – granulés (pellets) ou briquettes",
  "6": "bois – plaquettes forestières",
  "7": "bois – plaquettes d'industrie",
  "8": "réseau de chauffage urbain",
  "9": "propane",
  "10": "butane",
  "11": "charbon",
  "12": "électricité d'origine renouvelable utilisée dans le bâtiment",
  "13": "gpl",
  "14": "autre combustible fossile",
  "15": "réseau de froid urbain"
};

// ACTUEL (dpe.ts):
// export enum EnumTypeEnergie {
//   ELECTRICITE = 1,                    // ✅ OK - ID 1
//   GAZ_NATUREL = 2,                    // ✅ OK - ID 2
//   GPL = 3,                            // 🔴 ERREUR - ID 3 devrait être "fioul domestique"
//   FIOUL = 4,                          // 🔴 ERREUR - ID 4 devrait être "bois - bûches"
//   BOIS_BUCHE = 5,                     // 🔴 ERREUR - ID 5 devrait être "bois - granulés"
//   BOIS_GRANULE = 6,                   // 🔴 ERREUR - ID 6 devrait être "bois - plaquettes forestières"
//   BOIS_PLAQUETTE = 7,                 // 🔴 ERREUR - ID 7 devrait être "bois - plaquettes d'industrie"
//   CHARBON = 8,                        // 🔴 ERREUR - ID 8 devrait être "réseau de chauffage urbain"
//   RESEAU_CHALEUR = 9,                 // 🔴 ERREUR - ID 9 devrait être "propane"
//   RESEAU_FROID = 10,                  // 🔴 ERREUR - ID 10 devrait être "butane"
//   ELECTRICITE_VERTE = 11,             // 🔴 ERREUR - ID 11 devrait être "charbon"
//   AUTRE = 12,                         // 🔴 ERREUR - ID 12 devrait être "électricité d'origine renouvelable"
//   AUCUN = 13,                         // 🔴 ERREUR - ID 13 devrait être "gpl"
//   ELECTRICITE_PAC = 14,               // 🔴 ERREUR - ID 14 devrait être "autre combustible fossile"
//   ELECTRICITE_DIRECTE = 15            // 🔴 ERREUR - ID 15 devrait être "réseau de froid urbain"
// }

// ============================================================================
// CORRECTION REQUISE POUR EnumTypeEnergie
// ============================================================================

export enum EnumTypeEnergie_CORRECTED {
  ELECTRICITE = 1,
  GAZ_NATUREL = 2,
  FIOUL_DOMESTIQUE = 3,
  BOIS_BUCHES = 4,
  BOIS_GRANULES = 5,
  BOIS_PLAQUETTES_FORESTIERES = 6,
  BOIS_PLAQUETTES_INDUSTRIE = 7,
  RESEAU_CHAUFFAGE_URBAIN = 8,
  PROPANE = 9,
  BUTANE = 10,
  CHARBON = 11,
  ELECTRICITE_ORIGINE_RENOUVELABLE = 12,
  GPL = 13,
  AUTRE_COMBUSTIBLE_FOSSILE = 14,
  RESEAU_FROID_URBAIN = 15
}

// ============================================================================
// VÉRIFICATION DES AUTRES ENUMS
// ============================================================================

// --- EnumPeriodeConstruction ---
// ✅ OK - Parfaitement aligné
// Ref: 1-10 avec mêmes périodes
// TS: AVANT_1948=1, PERIODE_1948_1974=2, etc.

// --- EnumZoneClimatique ---
// ✅ OK - Parfaitement aligné
// Ref: 1=h1a, 2=h1b, 3=h1c, 4=h2a, 5=h2b, 6=h2c, 7=h2d, 8=h3
// TS: H1A=1, H1B=2, H1C=3, H2A=4, H2B=5, H2C=6, H2D=7, H3=8

// --- EnumTypeVentilation ---
// 🔴 DIVERGENCE MAJEURE - Noms et valeurs différents
// Ref a 38 entrées (1-38), TS n'en a que 34
// Les IDs ne correspondent pas!

// --- EnumTypeGenerateurCh ---
// 🔴 DIVERGENCE MAJEURE - TS a des valeurs inventées
// Ref a 171 entrées avec des chaudières, PAC, poêles détaillés
// TS a des valeurs génériques qui ne correspondent pas à la spec

// --- EnumTypeGenerateurEcs ---
// 🔴 DIVERGENCE - TS a 33 valeurs, Ref en a 134
// Les IDs ne correspondent pas

// --- EnumCfgInstallationCh ---
// 🔴 ERREUR DE NOM - TS utilise EnumCfgInstallationEcs au lieu de EnumCfgInstallationCh
// Ref: cfg_installation_ch avec 11 valeurs
// TS: Mêmes valeurs mais nom de variable incorrect

// --- EnumCfgInstallationEcs ---
// 🔴 ERREUR - TS a copié les valeurs de cfg_installation_ch au lieu de cfg_installation_ecs
// Ref: cfg_installation_ecs avec 3 valeurs (1, 2, 3)
// TS: a les valeurs de cfg_installation_ch!

// --- EnumTypeInstallation ---
// ✅ OK - Parfaitement aligné
// Ref: 1=individuelle, 2=collective, 3=collective multi-bâtiment, 4=hybride
// TS: INDIVIDUELLE=1, COLLECTIVE=2, COLLECTIVE_MULTI_BATIMENT=3, HYBRIDE_COLLECTIVE_INDIVIDUELLE=4

// --- EnumMethodeCalculConso ---
// ✅ OK - Parfaitement aligné
// Ref: 1-6
// TS: CALCUL_SIMPLE=1, etc.

// --- EnumTypeAdjacence ---
// ✅ OK - Parfaitement aligné (22 valeurs)

// --- EnumOrientation ---
// ✅ OK - Parfaitement aligné

// --- EnumClasseAltitude ---
// ✅ OK - Parfaitement aligné

// --- EnumMethodeApplicationDpeLog ---
// ✅ OK - Parfaitement aligné (40 valeurs)

// --- EnumCfgIsolationLnc ---
// ✅ OK - Parfaitement aligné (11 valeurs)

// --- EnumTypeEmissionDistribution ---
// 🔴 DIVERGENCE - TS a 53 valeurs inventées
// Ref a 50 valeurs avec une structure complètement différente

// --- EnumEquipementIntermittence ---
// 🔴 DIVERGENCE - TS a 8 valeurs, Ref n'a pas cet enum directement
// Cet enum semble être une combinaison de plusieurs concepts

// --- EnumTypeRegulation ---
// 🔴 DIVERGENCE - TS a 4 valeurs, structure différente de la référence

// --- EnumTypeChauffage ---
// 🔴 DIVERGENCE - TS a PRINCIPAL=1, SECONDAIRE=2
// Ref n'a pas cet enum exact, mais a des concepts similaires

// --- EnumTempDistributionCh ---
// 🔴 DIVERGENCE - TS a 4 valeurs, Ref a une structure différente

// --- EnumPeriodeInstallationEmetteur ---
// 🔴 DIVERGENCE - TS a 3 valeurs, Ref n'a pas cet enum exact

// --- EnumLienGenerateurEmetteur ---
// 🔴 DIVERGENCE - TS a 10 valeurs génériques (LIEN_1 à LIEN_10)
// Ref a 3 valeurs avec des significations précises

// --- EnumMethodeSaisieQ4paConv ---
// 🔴 DIVERGENCE - TS a 3 valeurs, Ref a une structure différente

// --- EnumTypeStockageEcs ---
// 🔴 DIVERGENCE - TS a 3 valeurs, Ref a 3 valeurs mais IDs différents!
// Ref: 1=abscence de stockage, 2=stockage indépendant, 3=stockage intégré
// TS: SANS_STOCKAGE=1, STOCKAGE_INTEGRE=2, STOCKAGE_INDEPENDANT=3
// ERREUR: STOCKAGE_INTEGRE et STOCKAGE_INDEPENDANT sont inversés!

// --- EnumBouclageReseauEcs ---
// 🔴 DIVERGENCE - TS a 3 valeurs, Ref a 3 valeurs mais textes différents
// À vérifier si les IDs correspondent

// --- EnumMethodeSaisieCaracSys ---
// 🔴 DIVERGENCE - TS a 3 valeurs génériques
// Ref a 8 valeurs détaillées

// --- EnumMethodeSaisieFactCouvSol ---
// ✅ OK - Parfaitement aligné

// --- EnumUsageGenerateur ---
// ✅ OK - Parfaitement aligné

// --- EnumTypeInstallationSolaire ---
// 🔴 DIVERGENCE - TS a 4 valeurs inventées
// Ref n'a pas cet enum exact dans la section solaire

// --- EnumEtiquetteDpe ---
// ✅ OK - Parfaitement aligné (A à G)
