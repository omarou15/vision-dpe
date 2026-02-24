/**
 * ValidationService - Service de validation des données DPE
 * Phase 1 - Module Administratif
 * 
 * Valide les données selon les règles métier de la méthode 3CL ADEME
 */

import {
  IValidationService,
  ValidationRule,
  ValidationOptions,
  CoherenceRule,
} from "../types/services";
import {
  ValidationResult,
  ValidationError,
} from "../types/validation";

// ============================================================================
// RÈGLES DE VALIDATION PAR ÉTAPE
// ============================================================================

const STEP_VALIDATION_RULES: Record<number, ValidationRule[]> = {
  // Étape 1: Informations administratives
  1: [
    {
      id: "numero_dpe",
      field: "numero_dpe",
      required: true,
      type: "string",
      pattern: /^DPE-\d{2}-\d{3}-\d{3}-[A-Z]$/,
      message: "Le numéro DPE doit être au format DPE-XX-XXX-XXX-X",
    },
    {
      id: "date_visite",
      field: "date_visite",
      required: true,
      type: "date",
      message: "La date de visite est requise",
    },
    {
      id: "proprietaire.nom",
      field: "proprietaire.nom",
      required: true,
      type: "string",
      minLength: 2,
      maxLength: 255,
      message: "Le nom du propriétaire est requis (2-255 caractères)",
    },
    {
      id: "adresse_logement.adresse",
      field: "adresse_logement.adresse",
      required: true,
      type: "string",
      minLength: 5,
      maxLength: 500,
      message: "L'adresse du logement est requise (5-500 caractères)",
    },
  ],

  // Étape 2: Caractéristiques générales
  2: [
    {
      id: "type_batiment",
      field: "type_batiment",
      required: true,
      type: "enum",
      enumValues: ["maison", "appartement", "immeuble"],
      message: "Le type de bâtiment est requis",
    },
    {
      id: "periode_construction",
      field: "periode_construction",
      required: true,
      type: "enum",
      enumValues: [
        "avant_1948",
        "1948-1974",
        "1975-1977",
        "1978-1982",
        "1983-1988",
        "1989-2000",
        "2001-2005",
        "2006-2012",
        "2013-2021",
        "apres_2021",
      ],
      message: "La période de construction est requise",
    },
    {
      id: "surface_habitable",
      field: "surface_habitable",
      required: true,
      type: "number",
      min: 1,
      max: 10000,
      message: "La surface habitable doit être comprise entre 1 et 10000 m²",
    },
    {
      id: "nombre_niveaux",
      field: "nombre_niveaux",
      required: true,
      type: "number",
      min: 1,
      max: 50,
      message: "Le nombre de niveaux doit être compris entre 1 et 50",
    },
  ],

  // Étape 3: Murs
  3: [
    {
      id: "murs",
      field: "murs",
      required: true,
      type: "array",
      minLength: 1,
      message: "Au moins un mur doit être défini",
    },
  ],

  // Étape 4: Baies vitrées
  4: [
    {
      id: "baies_vitrees",
      field: "baies_vitrees",
      required: true,
      type: "array",
      minLength: 0,
      message: "Les baies vitrées doivent être définies (peut être vide)",
    },
  ],

  // Étape 5: Planchers bas
  5: [
    {
      id: "planchers_bas",
      field: "planchers_bas",
      required: true,
      type: "array",
      minLength: 1,
      message: "Au moins un plancher bas doit être défini",
    },
  ],

  // Étape 6: Ponts thermiques
  6: [
    {
      id: "ponts_thermiques",
      field: "ponts_thermiques",
      required: true,
      type: "array",
      minLength: 0,
      message: "Les ponts thermiques doivent être définis (peut être vide)",
    },
  ],

  // Étape 7: Ventilation
  7: [
    {
      id: "ventilation.type_ventilation",
      field: "ventilation.type_ventilation",
      required: true,
      type: "string",
      message: "Le type de ventilation est requis",
    },
  ],

  // Étape 8: Chauffage
  8: [
    {
      id: "chauffage.generateurs",
      field: "chauffage.generateurs",
      required: true,
      type: "array",
      minLength: 1,
      message: "Au moins un générateur de chauffage doit être défini",
    },
  ],

  // Étape 9: ECS
  9: [
    {
      id: "ecs.generateurs",
      field: "ecs.generateurs",
      required: true,
      type: "array",
      minLength: 1,
      message: "Au moins un générateur d'ECS doit être défini",
    },
  ],

  // Étape 10-13: Optionnelles ou validation finale
  10: [],
  11: [],
  12: [],
  13: [],
};

// ============================================================================
// RÈGLES DE COHÉRENCE MÉTIER
// ============================================================================

const BUSINESS_COHERENCE_RULES: CoherenceRule[] = [
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
    applicableSteps: [2],
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
    applicableSteps: [2],
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
    applicableSteps: [2],
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
    applicableSteps: [4],
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
    applicableSteps: [7],
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
    applicableSteps: [8],
  },
];

export class ValidationService implements IValidationService {
  private customRules: ValidationRule[] = [];
  private customCoherenceRules: CoherenceRule[] = [];

  /**
   * Récupère une valeur imbriquée dans un objet
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }

  /**
   * Valide une règle sur une valeur
   */
  private validateRule(rule: ValidationRule, value: unknown, data: unknown): ValidationError | null {
    // Vérification required
    if (rule.required && (value === undefined || value === null || value === "")) {
      return {
        code: "required",
        field: rule.field,
        message: rule.message,
        severity: "error",
      };
    }

    // Si non requis et valeur vide, pas d'erreur
    if (!rule.required && (value === undefined || value === null || value === "")) {
      return null;
    }

    // Vérification du type
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      
      if (rule.type === "date") {
        const dateValue = value instanceof Date ? value : new Date(value as string);
        if (isNaN(dateValue.getTime())) {
          return {
            code: "invalid_date",
            field: rule.field,
            message: `${rule.field} doit être une date valide`,
            severity: "error",
          };
        }
      } else if (rule.type !== actualType) {
        return {
          code: "invalid_type",
          field: rule.field,
          message: `${rule.field} doit être de type ${rule.type}`,
          severity: "error",
        };
      }

      // Vérification enum - traité comme string avec valeurs contraintes
      if (rule.enumValues && rule.enumValues.length > 0) {
        const strValue = String(value);
        if (!rule.enumValues.map(String).includes(strValue)) {
          return {
            code: "invalid_enum",
            field: rule.field,
            message: `${rule.field} doit être l'une des valeurs: ${String(rule.enumValues.join(", "))}`,
            severity: "error",
          };
        }
      }

      // Vérification number (min/max)
      if (rule.type === "number" && typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          return {
            code: "min_value",
            field: rule.field,
            message: `${rule.field} doit être supérieur ou égal à ${rule.min}`,
            severity: "error",
          };
        }
        if (rule.max !== undefined && value > rule.max) {
          return {
            code: "max_value",
            field: rule.field,
            message: `${rule.field} doit être inférieur ou égal à ${rule.max}`,
            severity: "error",
          };
        }
      }

      // Vérification string (minLength/maxLength/pattern)
      if (rule.type === "string" && typeof value === "string") {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          return {
            code: "min_length",
            field: rule.field,
            message: `${rule.field} doit contenir au moins ${rule.minLength} caractères`,
            severity: "error",
          };
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          return {
            code: "max_length",
            field: rule.field,
            message: `${rule.field} doit contenir au plus ${rule.maxLength} caractères`,
            severity: "error",
          };
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return {
            code: "pattern_mismatch",
            field: rule.field,
            message: rule.message,
            severity: "error",
          };
        }
      }

      // Vérification array (minLength)
      if (rule.type === "array" && Array.isArray(value)) {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
          return {
            code: "min_items",
            field: rule.field,
            message: `${rule.field} doit contenir au moins ${rule.minLength} élément(s)`,
            severity: "error",
          };
        }
      }

      // Validateur personnalisé
      if (rule.customValidator) {
        const customError = rule.customValidator(value, data);
        if (customError) {
          return customError;
        }
      }
    }

    return null;
  }

  /**
   * Valide un DPE complet ou partiel
   */
  validate(dpeData: unknown, options: ValidationOptions = {}): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const completedSteps: number[] = [];

    const { context, includeWarnings = true, stopOnFirstError = false } = options;

    // Détermine les étapes à valider
    const stepsToValidate = context?.step 
      ? [context.step] 
      : Array.from({ length: 13 }, (_, i) => i + 1);

    // Valide chaque étape
    for (const step of stepsToValidate) {
      const stepRules = this.getRulesForStep(step);
      let stepValid = true;

      for (const rule of stepRules) {
        const value = this.getNestedValue(dpeData, rule.field);
        const error = this.validateRule(rule, value, dpeData);

        if (error) {
          stepValid = false;
          errors.push({ ...error, step });
          
          if (stopOnFirstError) {
            break;
          }
        }
      }

      // Vérifie les règles de cohérence pour cette étape
      const coherenceRules = this.getCoherenceRulesForStep(step);
      for (const rule of coherenceRules) {
        const isValid = rule.check(dpeData);
        
        if (!isValid) {
          const error: ValidationError = {
            code: rule.id,
            field: "coherence",
            message: rule.message,
            severity: rule.severity,
            step,
          };

          if (rule.severity === "error") {
            stepValid = false;
            errors.push(error);
          } else if (includeWarnings) {
            warnings.push(error);
          }
        }
      }

      if (stepValid) {
        completedSteps.push(step);
      }

      if (stopOnFirstError && errors.length > 0) {
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      completedSteps,
      currentStep: context?.step ?? Math.max(...completedSteps, 0) + 1,
    };
  }

  /**
   * Valide une étape spécifique du wizard
   */
  validateStep(step: number, data: unknown): ValidationResult {
    return this.validate(data, { context: { step }, includeWarnings: true });
  }

  /**
   * Valide un champ spécifique
   */
  validateField(field: string, value: unknown, data?: unknown): ValidationError | null {
    // Cherche la règle correspondante
    for (const stepRules of Object.values(STEP_VALIDATION_RULES)) {
      const rule = stepRules.find((r) => r.field === field);
      if (rule) {
        return this.validateRule(rule, value, data ?? {});
      }
    }

    // Cherche dans les règles personnalisées
    const customRule = this.customRules.find((r) => r.field === field);
    if (customRule) {
      return this.validateRule(customRule, value, data ?? {});
    }

    // Aucune règle trouvée, considère comme valide
    return null;
  }

  /**
   * Ajoute une règle de validation personnalisée
   */
  addRule(rule: ValidationRule): void {
    this.customRules.push(rule);
  }

  /**
   * Ajoute une règle de cohérence
   */
  addCoherenceRule(rule: CoherenceRule): void {
    this.customCoherenceRules.push(rule);
  }

  /**
   * Récupère les règles pour une étape
   */
  getRulesForStep(step: number): ValidationRule[] {
    const baseRules = STEP_VALIDATION_RULES[step] ?? [];
    return [...baseRules, ...this.customRules];
  }

  /**
   * Récupère les règles de cohérence pour une étape
   */
  private getCoherenceRulesForStep(step: number): CoherenceRule[] {
    const baseRules = BUSINESS_COHERENCE_RULES.filter(
      (r) => !r.applicableSteps || r.applicableSteps.includes(step)
    );
    const customRules = this.customCoherenceRules.filter(
      (r) => !r.applicableSteps || r.applicableSteps.includes(step)
    );
    return [...baseRules, ...customRules];
  }

  /**
   * Vérifie si une étape est complète
   */
  isStepComplete(step: number, data: unknown): boolean {
    const result = this.validateStep(step, data);
    return result.valid;
  }

  /**
   * Calcule la progression globale
   */
  calculateProgress(data: unknown): number {
    const result = this.validate(data);
    const completedSteps = result.completedSteps.length;
    const totalSteps = 13;
    return Math.round((completedSteps / totalSteps) * 100);
  }
}

// Export singleton factory
let validationServiceInstance: ValidationService | null = null;

export function createValidationService(): ValidationService {
  if (!validationServiceInstance) {
    validationServiceInstance = new ValidationService();
  }
  return validationServiceInstance;
}

export function getValidationService(): ValidationService | null {
  return validationServiceInstance;
}
