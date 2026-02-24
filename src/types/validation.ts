/**
 * Types pour la validation des données DPE
 * Règles de cohérence et contraintes métier
 */

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
// CONTRAINTES DE COHÉRENCE
// ============================================================================

export interface CoherenceConstraint {
  id: string;
  description: string;
  check: (data: unknown) => boolean;
  message: string;
  severity: "error" | "warning";
}

export const COHERENCE_CONSTRAINTS: CoherenceConstraint[] = [
  {
    id: "surface_positive",
    description: "La surface habitable doit être positive",
    check: (data: unknown): boolean => {
      const d = data as Record<string, unknown>;
      const cg = d.caracteristiques_generales as Record<string, number> | undefined;
      const surface = cg?.surface_habitable;
      return typeof surface === "number" && surface > 0;
    },
    message: "La surface habitable doit être supérieure à 0 m²",
    severity: "error",
  },
  {
    id: "surface_max",
    description: "La surface habitable semble anormalement élevée",
    check: (data: unknown): boolean => {
      const d = data as Record<string, unknown>;
      const cg = d.caracteristiques_generales as Record<string, number> | undefined;
      const surface = cg?.surface_habitable;
      return typeof surface === "number" && surface < 10000;
    },
    message: "La surface habitable semble anormalement élevée (> 10000 m²)",
    severity: "warning",
  },
  {
    id: "nombre_niveaux_coherent",
    description: "Le nombre de niveaux doit être cohérent",
    check: (data: unknown): boolean => {
      const d = data as Record<string, unknown>;
      const cg = d.caracteristiques_generales as Record<string, number> | undefined;
      const niveaux = cg?.nombre_niveaux;
      return typeof niveaux === "number" && niveaux >= 1 && niveaux <= 50;
    },
    message: "Le nombre de niveaux doit être compris entre 1 et 50",
    severity: "error",
  },
  {
    id: "baies_surface_coherente",
    description: "La surface des baies ne doit pas dépasser la surface habitable",
    check: (data: unknown): boolean => {
      const d = data as Record<string, unknown>;
      const cg = d.caracteristiques_generales as Record<string, number> | undefined;
      const surfaceHabitable = cg?.surface_habitable || 0;
      const env = d.enveloppe as Record<string, Array<{ surface?: number }>> | undefined;
      const baies = env?.baies_vitrees || [];
      const surfaceBaies = baies.reduce((sum: number, b) => sum + (b.surface || 0), 0);
      return surfaceBaies <= surfaceHabitable * 1.5;
    },
    message: "La surface totale des baies vitrées semble incohérente avec la surface habitable",
    severity: "warning",
  },
  {
    id: "ventilation_q4pa_coherent",
    description: "Le Q4Pa doit être cohérent avec le type de ventilation",
    check: (data: unknown): boolean => {
      const d = data as Record<string, unknown>;
      const inst = d.installations as Record<string, Record<string, number>> | undefined;
      const q4pa = inst?.ventilation?.q4pa;
      if (q4pa === undefined || q4pa === null) return true;
      return q4pa >= 0.5 && q4pa <= 15;
    },
    message: "Le Q4Pa doit être compris entre 0.5 et 15 m³/(h·m²)",
    severity: "error",
  },
  {
    id: "generateur_chauffage_age",
    description: "L'âge du générateur de chauffage doit être cohérent",
    check: (data: unknown): boolean => {
      const d = data as Record<string, unknown>;
      const inst = d.installations as Record<string, unknown> | undefined;
      const chauffage = inst?.chauffage as Record<string, Array<Record<string, number>>> | undefined;
      const generateurs = chauffage?.generateurs;
      if (!Array.isArray(generateurs) || generateurs.length === 0) return true;
      
      const anneeInstall = generateurs[0]?.annee_installation;
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
