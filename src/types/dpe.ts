/**
 * Types DPE - Diagnostic de Performance Énergétique
 * Basé sur la méthode 3CL et XSD ADEME v2.6
 * CORRIGÉ après validation contre XML ADEME réel
 */

// ============================================================================
// ENUMS ADEME
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
  enum_materiaux_structure_mur_id?: number;
  enum_methode_saisie_u0_id?: number;
  enum_type_doublage_id?: number;
  paroi_ancienne: number; // 0 ou 1
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
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
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
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
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
}

export interface PlancherHautDonneeIntermediaire {
  b: number;
  uph: number;
}

export interface InstallationChauffageCollection {
  installation_chauffage: InstallationChauffage | InstallationChauffage[];
}

export interface InstallationChauffage {
  // À compléter selon XSD
}

export interface InstallationECSCollection {
  installation_ecs: InstallationECS | InstallationECS[];
}

export interface InstallationECS {
  // À compléter selon XSD
}

export interface Ventilation {
  // À compléter selon XSD
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
