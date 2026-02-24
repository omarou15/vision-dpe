/**
 * Types DPE - Diagnostic de Performance Énergétique
 * Basé sur la méthode 3CL et XSD ADEME v2.6
 */

// ============================================================================
// ENUMS ADEME
// ============================================================================

export enum EnumTypeBatiment {
  MAISON = "maison",
  APPARTEMENT = "appartement",
}

export enum EnumPeriodeConstruction {
  AVANT_1948 = "avant_1948",
  PERIODE_1948_1974 = "1948_1974",
  PERIODE_1975_1977 = "1975_1977",
  PERIODE_1978_1982 = "1978_1982",
  PERIODE_1983_1988 = "1983_1988",
  PERIODE_1989_1999 = "1989_1999",
  PERIODE_2000_2005 = "2000_2005",
  PERIODE_2006_2012 = "2006_2012",
  PERIODE_2013_2021 = "2013_2021",
  APRES_2021 = "apres_2021",
}

export enum EnumTypeParoi {
  MUR_DONNANT_SUR_EXTERIEUR = "mur_donnant_sur_exterieur",
  MUR_DONNANT_SUR_LOCAL_NON_CHAUFFE = "mur_donnant_sur_local_non_chauffe",
  MUR_DONNANT_SUR_LOCAL_CHAUFFE = "mur_donnant_sur_local_chauffe",
  PLANCHER_BAS_DONNANT_SUR_EXTERIEUR = "plancher_bas_donnant_sur_exterieur",
  PLANCHER_BAS_DONNANT_SUR_LOCAL_NON_CHAUFFE = "plancher_bas_donnant_sur_local_non_chauffe",
  PLANCHER_HAUT_DONNANT_SUR_EXTERIEUR = "plancher_haut_donnant_sur_exterieur",
  PLANCHER_HAUT_DONNANT_SUR_LOCAL_NON_CHAUFFE = "plancher_haut_donnant_sur_local_non_chauffe",
}

export enum EnumMateriauParoi {
  BETON = "beton",
  BRIQUE = "brique",
  PARPAING = "parpaing",
  BOIS = "bois",
  PIERRE = "pierre",
  TERRE = "terre",
  AUTRE = "autre",
}

export enum EnumTypeVitrage {
  SIMPLE_VITRAGE = "simple_vitrage",
  DOUBLE_VITRAGE = "double_vitrage",
  TRIPLE_VITRAGE = "triple_vitrage",
}

export enum EnumTypeMenuiserie {
  PVC = "pvc",
  BOIS = "bois",
  ALUMINIUM = "aluminium",
  ACIER = "acier",
  MIXTE = "mixte",
}

export enum EnumTypeVmc {
  VMC_AUTOREGLABLE = "vmc_autoreglable",
  VMC_HYGROREGLABLE_B = "vmc_hygroreglable_b",
  VMC_HYGROREGLABLE_A = "vmc_hygroreglable_a",
  VMC_DOUBLE_FLUX = "vmc_double_flux",
  VMC_SIMPLE_FLUX_HYGROREGLABLE = "vmc_simple_flux_hygroreglable",
  VMC_SIMPLE_FLUX_AUTOREGLABLE = "vmc_simple_flux_autoreglable",
}

export enum EnumTypeGenerateurChauffage {
  CHAUDIERE_GAZ = "chaudiere_gaz",
  CHAUDIERE_FIOUL = "chaudiere_fioul",
  CHAUDIERE_ELECTRIQUE = "chaudiere_electrique",
  CHAUDIERE_BOIS = "chaudiere_bois",
  POMPE_A_CHALEUR_AIR_AIR = "pac_air_air",
  POMPE_A_CHALEUR_AIR_EAU = "pac_air_eau",
  POMPE_A_CHALEUR_EAU_EAU = "pac_eau_eau",
  POELE_BOIS = "poele_bois",
  POELE_GRANULES = "poele_granules",
  RADIATEUR_ELECTRIQUE = "radiateur_electrique",
  RADIATEUR_INERTIE = "radiateur_inertie",
  PLANCHER_CHAUFFANT_ELECTRIQUE = "plancher_chauffant_electrique",
  PLANCHER_CHAUFFANT_HYDRAULIQUE = "plancher_chauffant_hydraulique",
}

export enum EnumTypeGenerateurEcs {
  CHAUDIERE_GAZ = "chaudiere_gaz",
  CHAUDIERE_FIOUL = "chaudiere_fioul",
  CHAUDIERE_ELECTRIQUE = "chaudiere_electrique",
  CHAUDIERE_BOIS = "chaudiere_bois",
  POMPE_A_CHALEUR = "pac",
  CHAUFFE_EAU_ELECTRIQUE = "chauffe_eau_electrique",
  CHAUFFE_EAU_SOLAIRE = "chauffe_eau_solaire",
  CHAUFFE_EAU_GAZ = "chauffe_eau_gaz",
  CUMULUS = "cumulus",
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
// INTERFACES PRINCIPALES
// ============================================================================

export interface DPEDocument {
  id: string;
  numero_dpe: string;
  date_visite: string;
  date_etablissement: string;
  
  // Administratif
  administratif: Administratif;
  
  // Caractéristiques générales
  caracteristiques_generales: CaracteristiquesGenerales;
  
  // Enveloppe
  enveloppe: Enveloppe;
  
  // Installations
  installations: Installations;
  
  // Résultats
  resultats: Resultats;
}

export interface Administratif {
  proprietaire: {
    nom: string;
    prenom: string;
    adresse: string;
    code_postal: string;
    commune: string;
  };
  adresse_logement: {
    adresse: string;
    code_postal: string;
    commune: string;
    batiment: string;
    escalier: string;
    etage: string;
    porte: string;
  };
}

export interface CaracteristiquesGenerales {
  type_batiment: EnumTypeBatiment;
  periode_construction: EnumPeriodeConstruction;
  surface_habitable: number; // m²
  nombre_niveaux: number;
  hauteur_sous_plafond: number; // m
}

export interface Enveloppe {
  murs: Mur[];
  baies_vitrees: BaieVitree[];
  planchers_bas: Plancher[];
  planchers_hauts: Plancher[];
  ponts_thermiques: PontThermique[];
}

export interface Mur {
  id: string;
  type_paroi: EnumTypeParoi;
  materiau: EnumMateriauParoi;
  epaisseur: number; // cm
  surface: number; // m²
  isolation: {
    presence: boolean;
    epaisseur?: number; // cm
    materiau?: string;
    lambda?: number; // W/(m·K)
  };
  coefficient_u: number; // W/(m²·K)
  orientation: string; // Nord, Sud, Est, Ouest
}

export interface BaieVitree {
  id: string;
  type_menuiserie: EnumTypeMenuiserie;
  type_vitrage: EnumTypeVitrage;
  surface: number; // m²
  largeur: number; // m
  hauteur: number; // m
  orientation: string;
  coefficient_uw: number; // W/(m²·K)
  facteur_solaire_sw: number;
  presence_masque_proche: boolean;
  presence_masque_lointain: boolean;
}

export interface Plancher {
  id: string;
  type_paroi: EnumTypeParoi;
  surface: number; // m²
  isolation: {
    presence: boolean;
    epaisseur?: number;
    materiau?: string;
    lambda?: number;
  };
  coefficient_u: number;
}

export interface PontThermique {
  id: string;
  type_liaison: string;
  longueur: number; // m
  coefficient_psi: number; // W/(m·K)
}

export interface Installations {
  ventilation: Ventilation;
  chauffage: Chauffage;
  ecs: ECS;
  climatisation?: Climatisation;
  production_enr?: ProductionENR;
}

export interface Ventilation {
  type_ventilation: EnumTypeVmc;
  annee_installation: number;
  debit_ventilation: number; // m³/h
  presence_regulation_hygro: boolean;
  q4pa: number; // m³/(h·m²)
}

export interface Chauffage {
  generateurs: GenerateurChauffage[];
  emetteurs: EmetteurChauffage[];
  distribution: DistributionChauffage;
}

export interface GenerateurChauffage {
  id: string;
  type: EnumTypeGenerateurChauffage;
  annee_installation: number;
  puissance_nominale: number; // kW
  rendement: number;
  localisation: string;
}

export interface EmetteurChauffage {
  id: string;
  type: string; // radiateur, plancher chauffant, etc.
  surface: number; // m²
  localisation: string;
}

export interface DistributionChauffage {
  type: string; // eau chaude, air, électrique
  longueur: number; // m
  isolation: boolean;
}

export interface ECS {
  generateurs: GenerateurECS[];
  stockage: StockageECS;
}

export interface GenerateurECS {
  id: string;
  type: EnumTypeGenerateurEcs;
  annee_installation: number;
  puissance_nominale: number; // kW
}

export interface StockageECS {
  volume: number; // litres
  isolation_epaisseur: number; // mm
}

export interface Climatisation {
  surface_climatisee: number; // m²
  generateurs: GenerateurClimatisation[];
}

export interface GenerateurClimatisation {
  id: string;
  type: string; // split, pac réversible, etc.
  seer: number; // Seasonal Energy Efficiency Ratio
  puissance_nominale: number; // kW
}

export interface ProductionENR {
  photovoltaique?: InstallationPhotovoltaique;
}

export interface InstallationPhotovoltaique {
  surface: number; // m²
  puissance_crete: number; // kWc
  orientation: string;
  inclinaison: number; // degrés
}

export interface Resultats {
  consommation_energie_primaire: number; // kWh/m².an
  consommation_energie_finale: number; // kWh/m².an
  emission_ges: number; // kgCO2/m².an
  cout_chauffage: number; // €/an
  cout_ecs: number; // €/an
  cout_total: number; // €/an
  etiquette_energie: EnumEtiquetteDpe;
  etiquette_climat: EnumEtiquetteDpe;
}

// ============================================================================
// TYPES POUR VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
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
