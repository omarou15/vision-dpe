/**
 * Index des types DPE
 * Export centralisé de tous les types
 */

// Types DPE principaux
export type {
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
  XMLExportOptions,
  XMLValidationResult,
} from "./dpe";

// Enums DPE
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
} from "./dpe";

export type {
  ValidationError,
  ValidationResult,
  StepProgress,
  FormProgress,
  CoherenceConstraint,
} from "./validation";

export {
  REQUIRED_FIELDS_BY_STEP,
  COHERENCE_CONSTRAINTS,
} from "./validation";

// Types des services
export type {
  AuthUser,
  LoginCredentials,
  OTPRequest,
  OTPVerify,
  AuthSession,
  PasswordResetRequest,
  PasswordUpdate,
  AuthResult,
  AuthError,
  IAuthService,
  ValidationRule,
  ValidationContext,
  ValidationOptions,
  CoherenceRule,
  IValidationService,
  XMLGenerationResult,
  XMLValidationOptions,
  XMLExportConfig,
  IXMLGeneratorService,
} from "./services";