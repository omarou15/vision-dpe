/**
 * Index des types DPE
 * Export centralisé de tous les types
 */

// Types DPE principaux
export {
  EnumModeleDpe,
  EnumVersionDpe,
  EnumPeriodeConstruction,
  EnumMethodeApplicationDpeLog,
  EnumZoneClimatique,
  EnumClasseAltitude,
  EnumTypeAdjacence,
  EnumOrientation,
  EnumEtiquetteDpe,
  DPEDocument,
  Administratif,
  Diagnostiqueur,
  Geolocalisation,
  Adresses,
  AdresseDetail,
  Logement,
  CaracteristiqueGenerale,
  Meteo,
  Enveloppe,
  Inertie,
  MurCollection,
  Mur,
  MurDonneeEntree,
  MurDonneeIntermediaire,
  BaieVitreeCollection,
  BaieVitree,
  BaieVitreeDonneeEntree,
  BaieVitreeDonneeIntermediaire,
  PlancherBasCollection,
  PlancherBas,
  PlancherBasDonneeEntree,
  PlancherBasDonneeIntermediaire,
  PlancherHautCollection,
  PlancherHaut,
  PlancherHautDonneeEntree,
  PlancherHautDonneeIntermediaire,
  InstallationChauffageCollection,
  InstallationChauffage,
  InstallationECSCollection,
  InstallationECS,
  Ventilation,
  // ValidationError et ValidationResult sont exportés depuis validation.ts
  XMLExportOptions,
  XMLValidationResult,
} from "./dpe";

export * from "./tables-valeurs";

// Exporte tout sauf ValidationRule qui est aussi dans services.ts
export {
  CoherenceConstraint,
  REQUIRED_FIELDS_BY_STEP,
  COHERENCE_CONSTRAINTS,
  ValidationError,
  ValidationResult,
  StepProgress,
  FormProgress,
} from "./validation";

export * from "./api-ademe";
export * from "./services";
export * from "./utils";
