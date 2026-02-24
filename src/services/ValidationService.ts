/**
 * Service de validation des données DPE
 * Implémente les règles de cohérence métier ADEME
 */

import {
  DPEDocument,
  ValidationResult,
  ValidationError,
  EnumPeriodeConstruction,
  EnumZoneClimatique,
  EnumMethodeApplicationDpeLog,
} from '../types';

// ============================================================================
// TYPES SPÉCIFIQUES VALIDATION
// ============================================================================

export interface StepValidationResult {
  step: number;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completedFields: string[];
  missingFields: string[];
}

export interface FieldValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array' | 'object';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enumValues?: (string | number)[];
  customValidator?: (value: unknown) => boolean;
  errorMessage: string;
}

// ============================================================================
// RÈGLES DE VALIDATION PAR ÉTAPE
// ============================================================================

const STEP_VALIDATION_RULES: Record<number, FieldValidationRule[]> = {
  1: [ // Étape 1: Administratif
    { field: 'administratif.date_visite_diagnostiqueur', required: true, type: 'date', errorMessage: 'Date de visite requise' },
    { field: 'administratif.date_etablissement_dpe', required: true, type: 'date', errorMessage: 'Date d\'établissement requise' },
    { field: 'administratif.nom_proprietaire', required: true, type: 'string', minLength: 2, maxLength: 200, errorMessage: 'Nom du propriétaire requis (2-200 caractères)' },
    { field: 'administratif.diagnostiqueur.nom_diagnostiqueur', required: true, type: 'string', minLength: 2, maxLength: 100, errorMessage: 'Nom du diagnostiqueur requis' },
    { field: 'administratif.diagnostiqueur.prenom_diagnostiqueur', required: true, type: 'string', minLength: 2, maxLength: 100, errorMessage: 'Prénom du diagnostiqueur requis' },
    { field: 'administratif.diagnostiqueur.mail_diagnostiqueur', required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMessage: 'Email du diagnostiqueur invalide' },
    { field: 'administratif.diagnostiqueur.telephone_diagnostiqueur', required: true, type: 'string', pattern: /^0[1-9](\d{8})$/, errorMessage: 'Téléphone invalide (format français requis)' },
    { field: 'administratif.diagnostiqueur.numero_certification_diagnostiqueur', required: true, type: 'string', minLength: 5, maxLength: 50, errorMessage: 'Numéro de certification requis' },
    { field: 'administratif.geolocalisation.adresses.adresse_bien.adresse_brut', required: true, type: 'string', minLength: 5, errorMessage: 'Adresse du bien requise' },
    { field: 'administratif.geolocalisation.adresses.adresse_bien.code_postal_brut', required: true, type: 'string', pattern: /^\d{5}$/, errorMessage: 'Code postal invalide (5 chiffres)' },
    { field: 'administratif.geolocalisation.adresses.adresse_bien.nom_commune_brut', required: true, type: 'string', minLength: 2, errorMessage: 'Commune requise' },
  ],
  2: [ // Étape 2: Caractéristiques générales
    { field: 'logement.caracteristique_generale.annee_construction', required: true, type: 'number', min: 1000, max: new Date().getFullYear() + 1, errorMessage: 'Année de construction invalide' },
    { field: 'logement.caracteristique_generale.enum_periode_construction_id', required: true, type: 'enum', enumValues: Object.values(EnumPeriodeConstruction).filter(v => typeof v === 'number'), errorMessage: 'Période de construction requise' },
    { field: 'logement.caracteristique_generale.enum_methode_application_dpe_log_id', required: true, type: 'enum', enumValues: Object.values(EnumMethodeApplicationDpeLog).filter(v => typeof v === 'number'), errorMessage: 'Méthode d\'application DPE requise' },
    { field: 'logement.caracteristique_generale.surface_habitable_logement', required: true, type: 'number', min: 1, max: 10000, errorMessage: 'Surface habitable invalide (1-10000 m²)' },
    { field: 'logement.caracteristique_generale.nombre_niveau_immeuble', required: true, type: 'number', min: 1, max: 100, errorMessage: 'Nombre de niveaux immeuble invalide' },
    { field: 'logement.caracteristique_generale.nombre_niveau_logement', required: true, type: 'number', min: 1, max: 100, errorMessage: 'Nombre de niveaux logement invalide' },
    { field: 'logement.caracteristique_generale.hsp', required: true, type: 'number', min: 1.5, max: 10, errorMessage: 'Hauteur sous plafond invalide (1.5-10m)' },
    { field: 'logement.meteo.enum_zone_climatique_id', required: true, type: 'enum', enumValues: Object.values(EnumZoneClimatique).filter(v => typeof v === 'number'), errorMessage: 'Zone climatique requise' },
  ],
  3: [ // Étape 3: Murs
    { field: 'logement.enveloppe.mur_collection.mur', required: true, type: 'array', minLength: 1, errorMessage: 'Au moins un mur requis' },
  ],
  4: [ // Étape 4: Baies vitrées
    { field: 'logement.enveloppe.baie_vitree_collection.baie_vitree', required: false, type: 'array', errorMessage: 'Baies vitrées invalides' },
  ],
  5: [ // Étape 5: Planchers bas
    { field: 'logement.enveloppe.plancher_bas_collection.plancher_bas', required: true, type: 'array', minLength: 1, errorMessage: 'Au moins un plancher bas requis' },
  ],
  6: [ // Étape 6: Planchers haut
    { field: 'logement.enveloppe.plancher_haut_collection.plancher_haut', required: true, type: 'array', minLength: 1, errorMessage: 'Au moins un plancher haut requis' },
  ],
  7: [ // Étape 7: Ventilation
    { field: 'logement.ventilation', required: true, type: 'object', errorMessage: 'Ventilation requise' },
  ],
  8: [ // Étape 8: Chauffage
    { field: 'logement.installation_chauffage_collection.installation_chauffage', required: true, type: 'array', minLength: 1, errorMessage: 'Au moins une installation de chauffage requise' },
  ],
  9: [ // Étape 9: ECS
    { field: 'logement.installation_ecs_collection.installation_ecs', required: true, type: 'array', minLength: 1, errorMessage: 'Au moins une installation ECS requise' },
  ],
};

// ============================================================================
// SERVICE VALIDATION
// ============================================================================

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  // ============================================================================
  // VALIDATION COMPLÈTE
  // ============================================================================

  /**
   * Valide l'intégralité d'un document DPE
   */
  validateDocument(document: DPEDocument): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validation de toutes les étapes
    for (let step = 1; step <= 13; step++) {
      const stepResult = this.validateStep(document, step);
      errors.push(...stepResult.errors);
      warnings.push(...stepResult.warnings);
    }

    // Validation des contraintes de cohérence
    const coherenceResult = this.validateCoherence(document);
    errors.push(...coherenceResult.errors);
    warnings.push(...coherenceResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      completedSteps: this.getCompletedSteps(document),
      currentStep: this.getCurrentStep(document),
    };
  }

  /**
   * Valide une étape spécifique
   */
  validateStep(document: DPEDocument, step: number): StepValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const completedFields: string[] = [];
    const missingFields: string[] = [];

    const rules = STEP_VALIDATION_RULES[step];
    if (!rules) {
      return { step, valid: true, errors, warnings, completedFields, missingFields };
    }

    for (const rule of rules) {
      const value = this.getNestedValue(document, rule.field);
      const fieldResult = this.validateField(value, rule);

      if (fieldResult.valid) {
        completedFields.push(rule.field);
      } else {
        missingFields.push(rule.field);
        errors.push({
          code: `STEP_${step}_${rule.field.replace(/\./g, '_').toUpperCase()}`,
          field: rule.field,
          message: fieldResult.errorMessage || rule.errorMessage,
          severity: 'error',
          step,
        });
      }
    }

    // Validation spécifique selon l'étape
    const specificResult = this.validateStepSpecific(document, step);
    errors.push(...specificResult.errors);
    warnings.push(...specificResult.warnings);

    return {
      step,
      valid: errors.length === 0,
      errors,
      warnings,
      completedFields,
      missingFields,
    };
  }

  /**
   * Valide un champ spécifique
   */
  validateFieldValue(document: DPEDocument, fieldPath: string): { valid: boolean; error?: ValidationError } {
    // Trouver la règle correspondante
    for (const stepRules of Object.values(STEP_VALIDATION_RULES)) {
      const rule = stepRules.find(r => r.field === fieldPath);
      if (rule) {
        const value = this.getNestedValue(document, fieldPath);
        const result = this.validateField(value, rule);
        if (!result.valid) {
          return {
            valid: false,
            error: {
              code: `INVALID_${fieldPath.replace(/\./g, '_').toUpperCase()}`,
              field: fieldPath,
              message: result.errorMessage || rule.errorMessage,
              severity: 'error',
            },
          };
        }
        return { valid: true };
      }
    }

    return { valid: true };
  }

  // ============================================================================
  // VALIDATION COHÉRENCE
  // ============================================================================

  /**
   * Valide les contraintes de cohérence métier
   */
  validateCoherence(document: DPEDocument): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Surface habitable positive
    const surfaceHabitable = document.logement?.caracteristique_generale?.surface_habitable_logement;
    if (surfaceHabitable !== undefined && surfaceHabitable <= 0) {
      errors.push({
        code: 'COHERENCE_SURFACE_NEGATIVE',
        field: 'logement.caracteristique_generale.surface_habitable_logement',
        message: 'La surface habitable doit être positive',
        severity: 'error',
      });
    }

    // Surface habitable anormalement élevée
    if (surfaceHabitable && surfaceHabitable > 1000) {
      warnings.push({
        code: 'COHERENCE_SURFACE_ELEVÉE',
        field: 'logement.caracteristique_generale.surface_habitable_logement',
        message: 'La surface habitable semble anormalement élevée (> 1000 m²)',
        severity: 'warning',
      });
    }

    // Cohérence nombre de niveaux
    const niveauxImmeuble = document.logement?.caracteristique_generale?.nombre_niveau_immeuble;
    const niveauxLogement = document.logement?.caracteristique_generale?.nombre_niveau_logement;
    if (niveauxImmeuble && niveauxLogement && niveauxLogement > niveauxImmeuble) {
      errors.push({
        code: 'COHERENCE_NIVEAUX',
        field: 'logement.caracteristique_generale.nombre_niveau_logement',
        message: 'Le nombre de niveaux du logement ne peut pas dépasser celui de l\'immeuble',
        severity: 'error',
      });
    }

    // Cohérence dates
    const dateVisite = document.administratif?.date_visite_diagnostiqueur;
    const dateEtablissement = document.administratif?.date_etablissement_dpe;
    if (dateVisite && dateEtablissement) {
      const dateV = new Date(dateVisite);
      const dateE = new Date(dateEtablissement);
      if (dateE < dateV) {
        errors.push({
          code: 'COHERENCE_DATES',
          field: 'administratif.date_etablissement_dpe',
          message: 'La date d\'établissement ne peut pas être antérieure à la date de visite',
          severity: 'error',
        });
      }
    }

    // Cohérence année construction / période
    const anneeConstruction = document.logement?.caracteristique_generale?.annee_construction;
    const periodeConstruction = document.logement?.caracteristique_generale?.enum_periode_construction_id;
    if (anneeConstruction && periodeConstruction) {
      const periodeCohérente = this.checkPeriodeConstruction(anneeConstruction, periodeConstruction);
      if (!periodeCohérente) {
        warnings.push({
          code: 'COHERENCE_PERIODE',
          field: 'logement.caracteristique_generale.enum_periode_construction_id',
          message: 'L\'année de construction ne correspond pas à la période sélectionnée',
          severity: 'warning',
        });
      }
    }

    return { errors, warnings };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Récupère la valeur d'un champ imbriqué
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  /**
   * Valide un champ selon sa règle
   */
  private validateField(value: unknown, rule: FieldValidationRule): { valid: boolean; errorMessage?: string } {
    // Vérification requis
    if (rule.required && (value === undefined || value === null || value === '')) {
      return { valid: false, errorMessage: `${rule.field} est requis` };
    }

    // Si non requis et vide, c'est valide
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { valid: true };
    }

    // Validation par type
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, errorMessage: `${rule.field} doit être une chaîne` };
        }
        if (rule.minLength && value.length < rule.minLength) {
          return { valid: false, errorMessage: `${rule.field} doit avoir au moins ${rule.minLength} caractères` };
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return { valid: false, errorMessage: `${rule.field} doit avoir au plus ${rule.maxLength} caractères` };
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return { valid: false, errorMessage: `${rule.field} format invalide` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, errorMessage: `${rule.field} doit être un nombre` };
        }
        if (rule.min !== undefined && value < rule.min) {
          return { valid: false, errorMessage: `${rule.field} doit être ≥ ${rule.min}` };
        }
        if (rule.max !== undefined && value > rule.max) {
          return { valid: false, errorMessage: `${rule.field} doit être ≤ ${rule.max}` };
        }
        break;

      case 'date':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          return { valid: false, errorMessage: `${rule.field} doit être une date valide` };
        }
        break;

      case 'enum':
        if (rule.enumValues && !rule.enumValues.includes(value as string | number)) {
          return { valid: false, errorMessage: `${rule.field} valeur non valide` };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, errorMessage: `${rule.field} doit être un tableau` };
        }
        if (rule.minLength && value.length < rule.minLength) {
          return { valid: false, errorMessage: `${rule.field} doit contenir au moins ${rule.minLength} élément(s)` };
        }
        break;
    }

    // Validateur personnalisé
    if (rule.customValidator && !rule.customValidator(value)) {
      return { valid: false, errorMessage: `${rule.field} validation personnalisée échouée` };
    }

    return { valid: true };
  }

  /**
   * Validation spécifique par étape
   */
  private validateStepSpecific(document: DPEDocument, step: number): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    switch (step) {
      case 3: // Murs
        this.validateMurs(document, errors, warnings);
        break;
      case 4: // Baies vitrées
        this.validateBaiesVitrees(document, errors, warnings);
        break;
      case 5: // Planchers bas
        this.validatePlanchersBas(document, errors);
        break;
      case 6: // Planchers haut
        this.validatePlanchersHaut(document, errors);
        break;
    }

    return { errors, warnings };
  }

  private validateMurs(document: DPEDocument, errors: ValidationError[], warnings: ValidationError[]): void {
    const murs = document.logement?.enveloppe?.mur_collection?.mur;
    if (!murs) return;

    const murArray = Array.isArray(murs) ? murs : [murs];
    let surfaceTotale = 0;

    for (let i = 0; i < murArray.length; i++) {
      const mur = murArray[i];
      const surface = mur.donnee_entree?.surface_paroi_opaque;
      if (surface <= 0) {
        errors.push({
          code: `MUR_${i}_SURFACE_INVALIDE`,
          field: `logement.enveloppe.mur_collection.mur[${i}].donnee_entree.surface_paroi_opaque`,
          message: `Le mur ${i + 1} doit avoir une surface positive`,
          severity: 'error',
        });
      }
      surfaceTotale += surface || 0;
    }

    // Vérification surface totale des murs vs surface habitable
    const surfaceHabitable = document.logement?.caracteristique_generale?.surface_habitable_logement;
    if (surfaceHabitable && surfaceTotale > surfaceHabitable * 5) {
      warnings.push({
        code: 'MURS_SURFACE_TOTALE_ELEVEE',
        field: 'logement.enveloppe.mur_collection.mur',
        message: 'La surface totale des murs semble anormalement élevée par rapport à la surface habitable',
        severity: 'warning',
      });
    }
  }

  private validateBaiesVitrees(document: DPEDocument, errors: ValidationError[], warnings: ValidationError[]): void {
    const baies = document.logement?.enveloppe?.baie_vitree_collection?.baie_vitree;
    if (!baies) return;

    const baieArray = Array.isArray(baies) ? baies : [baies];
    let surfaceTotale = 0;

    for (let i = 0; i < baieArray.length; i++) {
      const baie = baieArray[i];
      const surface = baie.donnee_entree?.surface_totale_baie;
      if (surface <= 0) {
        errors.push({
          code: `BAIE_${i}_SURFACE_INVALIDE`,
          field: `logement.enveloppe.baie_vitree_collection.baie_vitree[${i}].donnee_entree.surface_totale_baie`,
          message: `La baie vitrée ${i + 1} doit avoir une surface positive`,
          severity: 'error',
        });
      }
      surfaceTotale += surface || 0;
    }

    // Ratio baies / surface habitable
    const surfaceHabitable = document.logement?.caracteristique_generale?.surface_habitable_logement;
    if (surfaceHabitable && surfaceTotale > surfaceHabitable * 1.5) {
      warnings.push({
        code: 'BAIES_SURFACE_TOTALE_ELEVEE',
        field: 'logement.enveloppe.baie_vitree_collection.baie_vitree',
        message: 'La surface totale des baies vitrées semble anormalement élevée',
        severity: 'warning',
      });
    }
  }

  private validatePlanchersBas(document: DPEDocument, errors: ValidationError[]): void {
    const planchers = document.logement?.enveloppe?.plancher_bas_collection?.plancher_bas;
    if (!planchers) return;

    const plancherArray = Array.isArray(planchers) ? planchers : [planchers];

    for (let i = 0; i < plancherArray.length; i++) {
      const plancher = plancherArray[i];
      const surface = plancher.donnee_entree?.surface_paroi_opaque;
      if (surface <= 0) {
        errors.push({
          code: `PLANCHER_BAS_${i}_SURFACE_INVALIDE`,
          field: `logement.enveloppe.plancher_bas_collection.plancher_bas[${i}].donnee_entree.surface_paroi_opaque`,
          message: `Le plancher bas ${i + 1} doit avoir une surface positive`,
          severity: 'error',
        });
      }
    }
  }

  private validatePlanchersHaut(document: DPEDocument, errors: ValidationError[]): void {
    const planchers = document.logement?.enveloppe?.plancher_haut_collection?.plancher_haut;
    if (!planchers) return;

    const plancherArray = Array.isArray(planchers) ? planchers : [planchers];

    for (let i = 0; i < plancherArray.length; i++) {
      const plancher = plancherArray[i];
      const surface = plancher.donnee_entree?.surface_paroi_opaque;
      if (surface <= 0) {
        errors.push({
          code: `PLANCHER_HAUT_${i}_SURFACE_INVALIDE`,
          field: `logement.enveloppe.plancher_haut_collection.plancher_haut[${i}].donnee_entree.surface_paroi_opaque`,
          message: `Le plancher haut ${i + 1} doit avoir une surface positive`,
          severity: 'error',
        });
      }
    }
  }

  private checkPeriodeConstruction(annee: number, periode: EnumPeriodeConstruction): boolean {
    const periodes: Record<EnumPeriodeConstruction, [number, number]> = {
      [EnumPeriodeConstruction.AVANT_1948]: [0, 1947],
      [EnumPeriodeConstruction.PERIODE_1948_1974]: [1948, 1974],
      [EnumPeriodeConstruction.PERIODE_1975_1977]: [1975, 1977],
      [EnumPeriodeConstruction.PERIODE_1978_1982]: [1978, 1982],
      [EnumPeriodeConstruction.PERIODE_1983_1988]: [1983, 1988],
      [EnumPeriodeConstruction.PERIODE_1989_2000]: [1989, 2000],
      [EnumPeriodeConstruction.PERIODE_2001_2005]: [2001, 2005],
      [EnumPeriodeConstruction.PERIODE_2006_2012]: [2006, 2012],
      [EnumPeriodeConstruction.PERIODE_2013_2021]: [2013, 2021],
      [EnumPeriodeConstruction.APRES_2021]: [2022, 9999],
    };

    const [min, max] = periodes[periode] || [0, 9999];
    return annee >= min && annee <= max;
  }

  private getCompletedSteps(document: DPEDocument): number[] {
    const completed: number[] = [];
    for (let step = 1; step <= 13; step++) {
      const result = this.validateStep(document, step);
      if (result.valid) {
        completed.push(step);
      }
    }
    return completed;
  }

  private getCurrentStep(document: DPEDocument): number {
    for (let step = 1; step <= 13; step++) {
      const result = this.validateStep(document, step);
      if (!result.valid) {
        return step;
      }
    }
    return 13;
  }
}

// Export singleton
export const validationService = ValidationService.getInstance();
