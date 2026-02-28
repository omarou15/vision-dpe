/**
 * Types DPE - Diagnostic de Performance Énergétique
 * Basé sur la méthode 3CL et XSD ADEME v2.6
 * CORRIGÉ après validation contre XML ADEME réel
 * 
 * NEXUS - Phase 2: Enveloppe (étapes 4-8)
 * Enums vérifiés et corrigés selon enums.json
 */

// ============================================================================
// ENUMS ADEME - BASE
// ============================================================================

export enum EnumModeleDpe {
  LOGEMENT_EXISTANT = 1,
  LOGEMENT_NEUF = 2,
  TERTIAIRE = 3,
}

export enum EnumVersionDpe {
  V1 = "1",
  V1_1 = "1.1",
  V2 = "2",
  V2_1 = "2.1",
  V2_2 = "2.2",
  V2_3 = "2.3",
  V2_4 = "2.4",
  V2_5 = "2.5",
  V2_6 = "2.6",
}

export enum EnumPeriodeConstruction {
  AVANT_1948 = 1,
  PERIODE_1948_1974 = 2,
  PERIODE_1975_1977 = 3,
  PERIODE_1978_1982 = 4,
  PERIODE_1983_1988 = 5,
  PERIODE_1989_2000 = 6,
  PERIODE_2001_2005 = 7,
  PERIODE_2006_2012 = 8,
  PERIODE_2013_2021 = 9,
  APRES_2021 = 10,
}

export enum EnumMethodeApplicationDpeLog {
  MAISON_INDIVIDUELLE = 1,
  APPARTEMENT_CHAUFFAGE_ECS_INDIVIDUEL = 2,
  APPARTEMENT_CHAUFFAGE_COLLECTIF_ECS_INDIVIDUEL = 3,
  APPARTEMENT_CHAUFFAGE_INDIVIDUEL_ECS_COLLECTIF = 4,
  APPARTEMENT_CHAUFFAGE_COLLECTIF_ECS_COLLECTIF = 5,
  IMMEUBLE_CHAUFFAGE_INDIVIDUEL_ECS_INDIVIDUEL = 6,
  IMMEUBLE_CHAUFFAGE_COLLECTIF_ECS_INDIVIDUEL = 7,
  IMMEUBLE_CHAUFFAGE_INDIVIDUEL_ECS_COLLECTIF = 8,
  IMMEUBLE_CHAUFFAGE_COLLECTIF_ECS_COLLECTIF = 9,
}

export enum EnumZoneClimatique {
  H1A = 1,
  H1B = 2,
  H1C = 3,
  H2A = 4,
  H2B = 5,
  H2C = 6,
  H2D = 7,
  H3 = 8,
}

export enum EnumClasseAltitude {
  INF_400M = 1,
  ENTRE_400_800M = 2,
  SUP_800M = 3,
}

export enum EnumTypeAdjacence {
  EXTERIEUR = 1,
  PAROI_ENTERREE = 2,
  VIDE_SANITAIRE = 3,
  LOCAL_AUTRE_USAGE = 4,
  TERRE_PLEIN = 5,
  SOUS_SOL_NON_CHAUFFE = 6,
  LOCAL_NON_CHAUFFE_NON_ACCESSIBLE = 7,
  GARAGE = 8,
  CELLIER = 9,
  ESPACE_TAMPON_SOLARISE = 10,
  COMBLE_FORTEMENT_VENTILE = 11,
  COMBLE_FAIBLEMENT_VENTILE = 12,
  COMBLE_TRES_FAIBLEMENT_VENTILE = 13,
  CIRCULATION_SANS_OUVERTURE = 14,
  CIRCULATION_AVEC_OUVERTURE = 15,
  CIRCULATION_DESENFUMAGE = 16,
  HALL_FERMETURE_AUTO = 17,
  HALL_SANS_FERMETURE_AUTO = 18,
  GARAGE_PRIVE_COLLECTIF = 19,
  LOCAL_TERTIAIRE = 20,
  AUTRES_DEPENDANCES = 21,
  LOCAL_NON_DEPERDITIF = 22,
}

export enum EnumOrientation {
  SUD = 1,
  NORD = 2,
  EST = 3,
  OUEST = 4,
  HORIZONTAL = 5,
}

export enum EnumEtiquetteDpe {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}

// ============================================================================
// ENUMS ENVELOPPE - PHASE 2
// ============================================================================

/**
 * EnumMateriauxStructureMur - 27 valeurs
 * Source: enums.json -> materiaux_structure_mur
 */
export enum EnumMateriauxStructureMur {
  INCONNU = 1,
  PIERRE_TAILLE_MOELLONS_SEUL = 2,
  PIERRE_TAILLE_MOELLONS_REMPLISSAGE = 3,
  PISE_TERRE_STABILISEE = 4,
  PAN_BOIS_SANS_REMPLISSAGE = 5,
  PAN_BOIS_AVEC_REMPLISSAGE = 6,
  BOIS_RONDIN = 7,
  BRIQUES_PLEINES_SIMPLES = 8,
  BRIQUES_PLEINES_DOUBLES_LAME_AIR = 9,
  BRIQUES_CREUSES = 10,
  BLOCS_BETON_PLEINS = 11,
  BLOCS_BETON_CREUX = 12,
  BETON_BANCHE = 13,
  BETON_MACHEFER = 14,
  BRIQUE_TERRE_CUITE_ALVEOLAIRE = 15,
  BETON_CELLULAIRE_AVANT_2013 = 16,
  BETON_CELLULAIRE_A_PARTIR_2013 = 17,
  OSSATURE_BOIS_ISOLANT_REMPLISSAGE_SUP_2006 = 18,
  MUR_SANDWICH_BETON_ISOLANT_BETON = 19,
  CLOISON_PLATRE = 20,
  AUTRE_MATERIAU_TRADITIONNEL_ANCIEN = 21,
  AUTRE_MATERIAU_INNOVANT_RECENT = 22,
  AUTRE_MATERIAU_NON_REPERTORIE = 23,
  OSSATURE_BOIS_ISOLANT_REMPLISSAGE_2001_2005 = 24,
  OSSATURE_BOIS_SANS_REMPLISSAGE = 25,
  OSSATURE_BOIS_ISOLANT_REMPLISSAGE_INF_2001 = 26,
  OSSATURE_BOIS_REMPLISSAGE_TOUT_VENANT = 27,
}

/**
 * EnumTypeIsolation - 9 valeurs
 * Source: enums.json -> type_isolation
 */
export enum EnumTypeIsolation {
  INCONNU = 1,
  NON_ISOLE = 2,
  ITI = 3,
  ITE = 4,
  ITR = 5,
  ITI_ITE = 6,
  ITI_ITR = 7,
  ITE_ITR = 8,
  ISOLE_TYPE_INCONNU = 9,
}

/**
 * EnumTypeDoublage - 5 valeurs
 * Source: enums.json -> type_doublage
 */
export enum EnumTypeDoublage {
  INCONNU = 1,
  ABSENCE_DOUBLAGE = 2,
  DOUBLAGE_INDETERMINE_LAME_AIR_INF_15MM = 3,
  DOUBLAGE_INDETERMINE_LAME_AIR_SUP_15MM = 4,
  DOUBLAGE_CONNU = 5,
}

/**
 * EnumMethodeSaisieU - 10 valeurs
 * Source: enums.json -> methode_saisie_u
 */
export enum EnumMethodeSaisieU {
  NON_ISOLE = 1,
  ISOLATION_INCONNUE_TABLE_FORFAITAIRE = 2,
  EPAISSEUR_ISOLATION_SAISIE_MESURE_OBSERVATION = 3,
  EPAISSEUR_ISOLATION_SAISIE_DOCUMENTS_JUSTIFICATIFS = 4,
  RESISTANCE_ISOLATION_SAISIE_OBSERVATION_MESURE = 5,
  RESISTANCE_ISOLATION_SAISIE_DOCUMENTS_JUSTIFICATIFS = 6,
  ANNEE_ISOLATION_DIFFERENTE_CONSTRUCTION_SAISIE_JUSTIFIEE = 7,
  ANNEE_CONSTRUCTION_SAISIE_TABLE_FORFAITAIRE = 8,
  SAISIE_DIRECT_U_JUSTIFIEE = 9,
  SAISIE_DIRECT_U_RSET_RSEE = 10,
}

/**
 * EnumTypePlancherBas - 13 valeurs
 * Source: enums.json -> type_plancher_bas
 */
export enum EnumTypePlancherBas {
  INCONNU = 1,
  PLANCHER_AVEC_SANS_REMPLISSAGE = 2,
  PLANCHER_ENTRE_SOLIVES_METALLIQUES = 3,
  PLANCHER_ENTRE_SOLIVES_BOIS = 4,
  PLANCHER_BOIS_SUR_SOLIVES_METALLIQUES = 5,
  BARDEAUX_ET_REMPLISSAGE = 6,
  VOUTAINS_SUR_SOLIVES_METALLIQUES = 7,
  VOUTAINS_BRIQUES_MOELLONS = 8,
  DALLE_BETON = 9,
  PLANCHER_BOIS_SUR_SOLIVES_BOIS = 10,
  PLANCHER_LOURD_ENTREVOUS_TERRE_CUITE = 11,
  PLANCHER_ENTREVOUS_ISOLANT = 12,
  AUTRE_TYPE_PLANCHER_NON_REPERTORIE = 13,
}

/**
 * EnumTypePlancherHaut - 16 valeurs
 * Source: enums.json -> type_plancher_haut
 */
export enum EnumTypePlancherHaut {
  INCONNU = 1,
  PLAFOND_AVEC_SANS_REMPLISSAGE = 2,
  PLAFOND_ENTRE_SOLIVES_METALLIQUES = 3,
  PLAFOND_ENTRE_SOLIVES_BOIS = 4,
  PLAFOND_BOIS_SUR_SOLIVES_METALLIQUES = 5,
  PLAFOND_BOIS_SOUS_SOLIVES_METALLIQUES = 6,
  BARDEAUX_ET_REMPLISSAGE = 7,
  DALLE_BETON = 8,
  PLAFOND_BOIS_SUR_SOLIVES_BOIS = 9,
  PLAFOND_BOIS_SOUS_SOLIVES_BOIS = 10,
  PLAFOND_LOURD_ENTREVOUS_TERRE_CUITE = 11,
  COMBLES_AMENAGES_SOUS_RAMPANT = 12,
  TOITURE_CHAUME = 13,
  PLAFOND_PLAQUE_PLATRE = 14,
  AUTRE_TYPE_PLAFOND_NON_REPERTORIE = 15,
  TOITURES_BAC_ACIER = 16,
}

/**
 * EnumTypeLiaison - 5 valeurs (ponts thermiques)
 * Source: enums.json -> type_liaison
 */
export enum EnumTypeLiaison {
  PLANCHER_BAS_MUR = 1,
  PLANCHER_INTERMEDIAIRE_LOURD_MUR = 2,
  PLANCHER_HAUT_LOURD_MUR = 3,
  REFEND_MUR = 4,
  MENUISERIE_MUR = 5,
}

/**
 * EnumMethodeSaisieU0 - 5 valeurs
 * Source: enums.json -> methode_saisie_u0
 */
export enum EnumMethodeSaisieU0 {
  TYPE_PAROI_INCONNU = 1,
  DETERMINE_SELON_MATERIAU_EPAISSEUR = 2,
  SAISIE_DIRECT_U0_JUSTIFIEE = 3,
  SAISIE_DIRECT_U0_PERFORMANCE_ITI = 4,
  U0_NON_SAISI_U_CONNU_JUSTIFIE = 5,
}

/**
 * EnumMethodeSaisiePerfVitrage - 15 valeurs
 * Source: enums.json -> methode_saisie_perf_vitrage
 */
export enum EnumMethodeSaisiePerfVitrage {
  UG_UW_UJN_SW_TABLES_FORFAITAIRES = 1,
  UG_DIRECT_DOCUMENTS_AUTRES_TABLES = 2,
  UG_UW_DIRECT_DOCUMENTS_AUTRES_TABLES = 3,
  UG_UW_SW_DIRECT_DOCUMENTS_UJN_TABLES = 4,
  UG_UW_UJN_DIRECT_DOCUMENTS_AUTRES_TABLES = 5,
  UG_UW_SW_UJN_DIRECT_DOCUMENTS = 6,
  UJN_SW_RSET_RSEE = 7,
  UW_SW_DIRECT_DOCUMENTS_UJN_TABLES = 8,
  UW_UJN_DIRECT_DOCUMENTS_SW_TABLES = 9,
  UW_UJN_SW_DIRECT_DOCUMENTS = 10,
  UJN_SW_DIRECT_DOCUMENTS = 11,
  UJN_DIRECT_DOCUMENTS_SW_TABLES = 12,
  UW_DIRECT_DOCUMENTS_UJN_SW_TABLES = 13,
  SW_DIRECT_DOCUMENTS_UJN_UW_TABLES = 14,
  UG_SW_DIRECT_DOCUMENTS_UJN_UW_TABLES = 15,
}

/**
 * EnumTypeVitrage - 6 valeurs
 * Source: enums.json -> type_vitrage
 */
export enum EnumTypeVitrage {
  SIMPLE_VITRAGE = 1,
  DOUBLE_VITRAGE = 2,
  TRIPLE_VITRAGE = 3,
  SURVITRAGE = 4,
  BRIQUE_DE_VERRE = 5,
  POLYCARBONATE = 6,
}

/**
 * EnumTypeMenuiserie - 7 valeurs
 * Source: enums.json -> type_materiaux_menuiserie
 */
export enum EnumTypeMenuiserie {
  BRIQUE_DE_VERRE = 1,
  POLYCARBONATE = 2,
  BOIS = 3,
  BOIS_METAL = 4,
  PVC = 5,
  METAL_AVEC_RUPTURE_PT = 6,
  METAL_SANS_RUPTURE_PT = 7,
}

/**
 * EnumTypeBaie - 8 valeurs
 * Source: enums.json -> type_baie
 */
export enum EnumTypeBaie {
  BRIQUE_VERRE_PLEINE = 1,
  BRIQUE_VERRE_CREUSE = 2,
  POLYCARBONATE = 3,
  FENETRES_BATTANTES = 4,
  FENETRES_COULISSANTES = 5,
  PORTES_FENETRES_COULISSANTES = 6,
  PORTES_FENETRES_BATTANTES_SANS_SOUBASSEMENT = 7,
  PORTES_FENETRES_BATTANTES_AVEC_SOUBASSEMENT = 8,
}

/**
 * EnumTypePose - 4 valeurs
 * Source: enums.json -> type_pose
 */
export enum EnumTypePose {
  NU_EXTERIEUR = 1,
  NU_INTERIEUR = 2,
  TUNNEL = 3,
  SANS_OBJET = 4,
}

/**
 * EnumTypeFermeture - 8 valeurs
 * Source: enums.json -> type_fermeture
 */
export enum EnumTypeFermeture {
  ABSENCE_FERMETURE = 1,
  JALOUSIE_ACCORDEON_LAMES_ORIENTABLES = 2,
  FERMETURE_SANS_AJOURS_VOLETS_ROULANTS_ALU = 3,
  VOLETS_ROULANTS_PVC_BOIS_E_INF_12 = 4,
  PERSIENNE_COULISSANTE_VOLET_BATTANT_PVC_BOIS_E_INF_22 = 5,
  VOLETS_ROULANTS_PVC_BOIS_E_SUP_12 = 6,
  PERSIENNE_COULISSANTE_VOLET_BATTANT_PVC_BOIS_E_SUP_22 = 7,
  FERMETURE_ISOLEE_SANS_AJOURS = 8,
}

/**
 * EnumTypePorte - 16 valeurs
 * Source: enums.json -> type_porte
 */
export enum EnumTypePorte {
  BOIS_OPAQUE_PLEINE = 1,
  BOIS_MOINS_30_VITRAGE_SIMPLE = 2,
  BOIS_30_60_VITRAGE_SIMPLE = 3,
  BOIS_DOUBLE_VITRAGE = 4,
  PVC_OPAQUE_PLEINE = 5,
  PVC_MOINS_30_VITRAGE_SIMPLE = 6,
  PVC_30_60_VITRAGE_SIMPLE = 7,
  PVC_DOUBLE_VITRAGE = 8,
  METAL_OPAQUE_PLEINE = 9,
  METAL_VITRAGE_SIMPLE = 10,
  METAL_MOINS_30_DOUBLE_VITRAGE = 11,
  METAL_30_60_DOUBLE_VITRAGE = 12,
  TOUTE_MENUISERIE_OPAQUE_PLEINE_ISOLEE = 13,
  TOUTE_MENUISERIE_PORTE_SAS = 14,
  TOUTE_MENUISERIE_ISOLEE_DOUBLE_VITRAGE = 15,
  AUTRE_TYPE_PORTE = 16,
}

// ============================================================================
// INTERFACES PRINCIPALES - CORRIGÉES
// ============================================================================

export interface DPEDocument {
  // Attributs
  version: string; // "8.0.4"
  
  // Sections principales
  administratif: Administratif;
  logement: Logement;
}

export interface Administratif {
  date_visite_diagnostiqueur: string; // ISO date
  date_etablissement_dpe: string; // ISO date
  nom_proprietaire: string;
  nom_proprietaire_installation_commune?: string;
  enum_modele_dpe_id: EnumModeleDpe;
  enum_version_id: EnumVersionDpe;
  diagnostiqueur: Diagnostiqueur;
  geolocalisation: Geolocalisation;
}

export interface Diagnostiqueur {
  usr_logiciel_id: number;
  version_logiciel: string;
  nom_diagnostiqueur: string;
  prenom_diagnostiqueur: string;
  mail_diagnostiqueur: string;
  telephone_diagnostiqueur: string;
  adresse_diagnostiqueur: string;
  entreprise_diagnostiqueur: string;
  numero_certification_diagnostiqueur: string;
  organisme_certificateur: string;
}

export interface Geolocalisation {
  numero_fiscal_local?: string;
  idpar?: string;
  immatriculation_copropriete?: string;
  adresses: Adresses;
}

export interface Adresses {
  adresse_proprietaire: AdresseDetail;
  adresse_bien: AdresseDetail;
  adresse_proprietaire_installation_commune?: AdresseDetail;
}

export interface AdresseDetail {
  adresse_brut: string;
  code_postal_brut: string;
  nom_commune_brut: string;
  label_brut: string;
  label_brut_avec_complement: string;
  enum_statut_geocodage_ban_id: number;
  ban_date_appel: string;
  compl_nom_residence?: string;
  compl_ref_batiment?: string;
  compl_etage_appartement?: string;
  compl_ref_cage_escalier?: string;
  compl_ref_logement?: string;
  ban_id: string;
  ban_label: string;
  ban_housenumber: string;
  ban_street: string;
  ban_citycode: string;
  ban_postcode: string;
  ban_city: string;
  ban_type: string;
  ban_score: number;
  ban_x: number;
  ban_y: number;
}

export interface Logement {
  caracteristique_generale: CaracteristiqueGenerale;
  meteo: Meteo;
  enveloppe: Enveloppe;
  installation_chauffage_collection?: InstallationChauffageCollection;
  installation_ecs_collection?: InstallationECSCollection;
  ventilation: Ventilation;
}

export interface CaracteristiqueGenerale {
  annee_construction: number;
  enum_periode_construction_id: EnumPeriodeConstruction;
  enum_methode_application_dpe_log_id: EnumMethodeApplicationDpeLog;
  surface_habitable_logement: number;
  nombre_niveau_immeuble: number;
  nombre_niveau_logement: number;
  hsp: number; // Hauteur sous plafond
}

export interface Meteo {
  enum_zone_climatique_id: EnumZoneClimatique;
  enum_classe_altitude_id: EnumClasseAltitude;
  batiment_materiaux_anciens: number; // 0 ou 1
}

export interface Enveloppe {
  inertie: Inertie;
  mur_collection: MurCollection;
  baie_vitree_collection: BaieVitreeCollection;
  plancher_bas_collection: PlancherBasCollection;
  plancher_haut_collection: PlancherHautCollection;
}

export interface Inertie {
  inertie_plancher_bas_lourd: number; // 0 ou 1
  inertie_plancher_haut_lourd: number; // 0 ou 1
  inertie_paroi_verticale_lourd: number; // 0 ou 1
  enum_classe_inertie_id: number; // 1-4
}

export interface MurCollection {
  mur: Mur | Mur[];
}

export interface Mur {
  donnee_entree: MurDonneeEntree;
  donnee_intermediaire: MurDonneeIntermediaire;
}

export interface MurDonneeEntree {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: EnumTypeAdjacence;
  enum_orientation_id: EnumOrientation;
  surface_paroi_totale?: number;
  surface_paroi_opaque: number;
  paroi_lourde: number; // 0 ou 1
  tv_umur0_id?: number;
  tv_umur_id?: number;
  epaisseur_structure?: number;
  enum_materiaux_structure_mur_id?: EnumMateriauxStructureMur;
  enum_methode_saisie_u0_id?: EnumMethodeSaisieU0;
  enum_type_doublage_id?: EnumTypeDoublage;
  paroi_ancienne: number; // 0 ou 1
  enum_type_isolation_id: EnumTypeIsolation;
  enum_methode_saisie_u_id: EnumMethodeSaisieU;
}

export interface MurDonneeIntermediaire {
  b: number; // Coefficient de réduction
  umur: number; // Coefficient U
  umur0?: number; // Coefficient U non isolé
}

export interface BaieVitreeCollection {
  baie_vitree: BaieVitree | BaieVitree[];
}

export interface BaieVitree {
  donnee_entree: BaieVitreeDonneeEntree;
  donnee_intermediaire?: BaieVitreeDonneeIntermediaire;
}

export interface BaieVitreeDonneeEntree {
  reference: string;
  description?: string;
  reference_paroi?: string;
  enum_type_adjacence_id: EnumTypeAdjacence;
  enum_orientation_id: EnumOrientation;
  surface_totale_baie: number;
  enum_type_vitrage_id?: EnumTypeVitrage;
  enum_type_materiaux_menuiserie_id?: EnumTypeMenuiserie;
  enum_type_baie_id?: EnumTypeBaie;
  enum_type_pose_id?: EnumTypePose;
  enum_type_fermeture_id?: EnumTypeFermeture;
  enum_methode_saisie_perf_vitrage_id?: EnumMethodeSaisiePerfVitrage;
}

export interface BaieVitreeDonneeIntermediaire {
  sw: number; // Facteur solaire
  ubat: number;
}

export interface PlancherBasCollection {
  plancher_bas: PlancherBas | PlancherBas[];
}

export interface PlancherBas {
  donnee_entree: PlancherBasDonneeEntree;
  donnee_intermediaire: PlancherBasDonneeIntermediaire;
}

export interface PlancherBasDonneeEntree {
  reference: string;
  description?: string;
  enum_type_adjacence_id: EnumTypeAdjacence;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  tv_upb0_id?: number;
  tv_upb_id?: number;
  enum_type_plancher_bas_id?: EnumTypePlancherBas;
  enum_type_isolation_id: EnumTypeIsolation;
  enum_methode_saisie_u_id: EnumMethodeSaisieU;
  enum_methode_saisie_u0_id?: EnumMethodeSaisieU0;
}

export interface PlancherBasDonneeIntermediaire {
  b: number;
  upb: number;
  upb_final: number;
}

export interface PlancherHautCollection {
  plancher_haut: PlancherHaut | PlancherHaut[];
}

export interface PlancherHaut {
  donnee_entree: PlancherHautDonneeEntree;
  donnee_intermediaire: PlancherHautDonneeIntermediaire;
}

export interface PlancherHautDonneeEntree {
  reference: string;
  description?: string;
  enum_type_adjacence_id: EnumTypeAdjacence;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  tv_uph0_id?: number;
  tv_uph_id?: number;
  enum_type_plancher_haut_id?: EnumTypePlancherHaut;
  enum_type_isolation_id: EnumTypeIsolation;
  enum_methode_saisie_u_id: EnumMethodeSaisieU;
  enum_methode_saisie_u0_id?: EnumMethodeSaisieU0;
}

export interface PlancherHautDonneeIntermediaire {
  b: number;
  uph: number;
}

export interface InstallationChauffageCollection {
  installation_chauffage: InstallationChauffage | InstallationChauffage[];
}

export interface InstallationChauffage {
  // TODO: À compléter selon XSD ADEME
  id?: string;
}

export interface InstallationECSCollection {
  installation_ecs: InstallationECS | InstallationECS[];
}

export interface InstallationECS {
  // TODO: À compléter selon XSD ADEME
  id?: string;
}

export interface Ventilation {
  // TODO: À compléter selon XSD ADEME
  id?: string;
}

// ============================================================================
// TYPES POUR XML
// ============================================================================

export interface XMLExportOptions {
  include_validation: boolean;
  format: "standard" | "complet";
}

export interface XMLValidationResult {
  valid: boolean;
  schema_errors: string[];
  coherence_errors: string[];
}
