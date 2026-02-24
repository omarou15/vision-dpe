/**
 * Types pour la validation des données DPE
 * Règles de cohérence et contraintes métier
 */

import {
  EnumTypeBatiment,
  EnumPeriodeConstruction,
  EnumTypeParoi,
  EnumTypeVitrage,
  EnumTypeMenuiserie,
  EnumTypeVmc,
  EnumTypeGenerateurChauffage,
  EnumTypeGenerateurEcs,
} from "./dpe";

// ============================================================================
// RÈGLES DE VALIDATION
// ============================================================================

export interface ValidationRule {
  field: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "enum";
  enumValues?: string[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  message: string;
}

// ============================================================================
// CHAMPS REQUIS PAR ÉTAPE
// ============================================================================

export const REQUIRED_FIELDS_BY_STEP: Record<number, string[]> = {
  1: ["numero_dpe", "date_visite", "proprietaire.nom", "adresse_logement.adresse"],
  2: ["type_batiment", "periode_construction", "surface_habitable", "nombre_niveaux"],
  3: ["murs"],
  4: ["baies_vitrees"],
  5: ["planchers_bas"],
  6: ["ponts_thermiques"],
  7: ["ventilation.type_ventilation"],
  8: ["chauffage.generateurs"],
  9: ["ecs.generateurs"],
  10: [], // Climatisation optionnelle
  11: [], // ENR optionnel
  12: [], // Validation
  13: [], // Export
};

// ============================================================================
// TYPES POUR DONNÉES DPE (évite les any)
// ============================================================================

interface BaieVitreeData {
  surface?: number;
}

interface CaracteristiquesGeneralesData {
  surface_habitable?: number;
  nombre_niveaux?: number;
}

interface EnveloppeData {
  baies_vitrees?: BaieVitreeData[];
}

interface InstallationsData {
  ventilation?: {
    q4pa?: number;
  };
  chauffage?: {
    generateurs?: Array<{
      annee_installation?: number;
    }>;
  };
}

interface DPEDonneesValidation {
  caracteristiques_generales?: CaracteristiquesGeneralesData;
  enveloppe?: EnveloppeData;
  installations?: InstallationsData;
}

// ============================================================================
// CONTRAINTES DE COHÉRENCE
// ============================================================================

export interface CoherenceConstraint {
  id: string;
  description: string;
  check: (data: DPEDonneesValidation) => boolean;
  message: string;
  severity: "error" | "warning";
}

export const COHERENCE_CONSTRAINTS: CoherenceConstraint[] = [
  {
    id: "surface_positive",
    description: "La surface habitable doit être positive",
    check: (data: DPEDonneesValidation) => (data.caracteristiques_generales?.surface_habitable || 0) > 0,
    message: "La surface habitable doit être supérieure à 0 m²",
    severity: "error",
  },
  {
    id: "surface_max",
    description: "La surface habitable semble anormalement élevée",
    check: (data: DPEDonneesValidation) => (data.caracteristiques_generales?.surface_habitable || 0) < 10000,
    message: "La surface habitable semble anormalement élevée (> 10000 m²)",
    severity: "warning",
  },
  {
    id: "nombre_niveaux_coherent",
    description: "Le nombre de niveaux doit être cohérent",
    check: (data: DPEDonneesValidation) => {
      const niveaux = data.caracteristiques_generales?.nombre_niveaux;
      return niveaux !== undefined && niveaux >= 1 && niveaux <= 50;
    },
    message: "Le nombre de niveaux doit être compris entre 1 et 50",
    severity: "error",
  },
  {
    id: "baies_surface_coherente",
    description: "La surface des baies ne doit pas dépasser la surface habitable",
    check: (data: DPEDonneesValidation) => {
      const surfaceHabitable = data.caracteristiques_generales?.surface_habitable || 0;
      const surfaceBaies = data.enveloppe?.baies_vitrees?.reduce(
        (sum: number, b: BaieVitreeData) => sum + (b.surface || 0), 0
      ) || 0;
      return surfaceBaies <= surfaceHabitable * 1.5; // Tolérance pour plusieurs façades
    },
    message: "La surface totale des baies vitrées semble incohérente avec la surface habitable",
    severity: "warning",
  },
  {
    id: "ventilation_q4pa_coherent",
    description: "Le Q4Pa doit être cohérent avec le type de ventilation",
    check: (data: DPEDonneesValidation) => {
      const q4pa = data.installations?.ventilation?.q4pa;
      if (!q4pa) return true;
      return q4pa >= 0.5 && q4pa <= 15;
    },
    message: "Le Q4Pa doit être compris entre 0.5 et 15 m³/(h·m²)",
    severity: "error",
  },
  {
    id: "generateur_chauffage_age",
    description: "L'âge du générateur de chauffage doit être cohérent",
    check: (data: DPEDonneesValidation) => {
      const anneeInstall = data.installations?.chauffage?.generateurs?.[0]?.annee_installation;
      if (!anneeInstall) return true;
      const currentYear = new Date().getFullYear();
      return anneeInstall >= 1900 && anneeInstall <= currentYear;
    },
    message: "L'année d'installation du générateur de chauffage est incohérente",
    severity: "error",
  },
];

// ============================================================================
// TYPES POUR ERREURS DE VALIDATION
// ============================================================================

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: "error" | "warning";
  step?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completedSteps: number[];
  currentStep: number;
}

// ============================================================================
// TYPES POUR PROGRESSION
// ============================================================================

export interface StepProgress {
  step: number;
  completed: boolean;
  valid: boolean;
  errors: ValidationError[];
  lastModified: string;
}

export interface FormProgress {
  currentStep: number;
  steps: StepProgress[];
  overallProgress: number; // 0-100
}
