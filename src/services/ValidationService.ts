/**
 * ValidationService - Service de validation des données DPE
 * Valide les données selon les règles métier et réglementaires 3CL
 */

import { z } from 'zod';
import {
  DPE,
  Mur,
  Fenetre,
  InstallationChauffage,
  InstallationECS,
  DPEValidationError,
  ZoneClimatique,
  TypeBatiment,
  TypeMur,
  TypeVitrage,
  TypeMenuiserie,
  TypeChauffage,
  TypeECS,
  TypeVentilation
} from '../types/dpe';

// ============================================================================
// SCHEMAS ZOD DE VALIDATION
// ============================================================================

const ZoneClimatiqueSchema = z.enum(['H1', 'H2', 'H3']);
const AltitudeSchema = z.enum(['moins_400m', '400_800m', 'plus_800m']);
const TypeBatimentSchema = z.enum(['maison', 'appartement', 'immeuble']);

const MurSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  description: z.string().min(1),
  type_mur: z.enum([
    'pierre_taille_seul', 'pierre_taille_remplissage', 'pise_terre',
    'pan_bois_sans_remplissage', 'pan_bois_avec_remplissage', 'bois_rondins',
    'briques_pleines', 'briques_doubles_lame_air', 'briques_creuses',
    'blocs_beton_pleins', 'ossature_bois_isolant_avant_2001', 'cloison_platre',
    'beton_cellulaire', 'inconnu'
  ]),
  surface_totale: z.number().positive(),
  isolation: z.boolean(),
  u_mur: z.number().positive(),
  methode_calcul: z.string().min(1),
  localisation: z.enum(['exterieur', 'local_non_chauffe', 'terre_plein', 'sous_sol']),
  epaisseur_cm: z.number().positive().optional(),
  type_isolant: z.string().optional(),
  epaisseur_isolant_cm: z.number().positive().optional(),
  resistance_isolant: z.number().positive().optional(),
  annee_isolation: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  orientation: z.enum(['nord', 'sud', 'est', 'ouest', 'nord_est', 'nord_ouest', 'sud_est', 'sud_ouest']).optional(),
  u_mur_nu: z.number().positive().optional()
});

const FenetreSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  description: z.string().min(1),
  surface_totale: z.number().positive(),
  type_vitrage: z.enum(['simple', 'double', 'triple']),
  lame_air_mm: z.number().int().min(4).max(25),
  traitement_pe: z.boolean().optional(),
  type_gaz_lame: z.enum(['air', 'argon', 'krypton']).optional(),
  ug: z.number().positive(),
  type_menuiserie: z.enum(['pvc', 'bois', 'aluminium', 'mixte_bois_alu', 'mixte_pvc_alu']),
  presence_joint: z.boolean().optional(),
  uw: z.number().positive(),
  type_volet: z.enum([
    'aucun', 'volet_roulant_bois', 'volet_roulant_pvc', 'volet_roulant_alu',
    'persienne_pleine', 'persienne_orientable', 'jalousie', 'store_enrouleur'
  ]),
  ujn: z.number().positive().optional(),
  orientation: z.enum(['nord', 'sud', 'est', 'ouest', 'nord_est', 'nord_ouest', 'sud_est', 'sud_ouest']),
  u_final: z.number().positive(),
  sw: z.number().positive().optional()
});

const PlancherBasSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  description: z.string().min(1),
  type_plancher: z.enum(['dalle_beton', 'plancher_bois', 'plancher_hourdis', 'inconnu']),
  surface_totale: z.number().positive(),
  isolation: z.boolean(),
  u_plancher: z.number().positive(),
  methode_calcul: z.string().min(1),
  localisation: z.enum(['terre_plein', 'vide_sanitaire', 'local_non_chauffe', 'sous_sol']),
  type_isolant: z.string().optional(),
  epaisseur_isolant_cm: z.number().positive().optional(),
  resistance_isolant: z.number().positive().optional(),
  annee_isolation: z.number().int().min(1800).max(new Date().getFullYear()).optional()
});

const PlancherHautSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  description: z.string().min(1),
  type_plancher: z.enum(['combles_perdus', 'combles_amenages', 'toiture_terrasse', 'sous_toiture', 'inconnu']),
  surface_totale: z.number().positive(),
  isolation: z.boolean(),
  u_plancher: z.number().positive(),
  methode_calcul: z.string().min(1),
  type_isolant: z.string().optional(),
  epaisseur_isolant_cm: z.number().positive().optional(),
  resistance_isolant: z.number().positive().optional(),
  annee_isolation: z.number().int().min(1800).max(new Date().getFullYear()).optional()
});

const InstallationChauffageSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  description: z.string().min(1),
  type_chauffage: z.enum([
    'chaudiere_standard', 'chaudiere_bassee_temperature', 'chaudiere_condensation',
    'chaudiere_bois', 'poele_bois', 'insert_cheminee',
    'pompe_a_chaleur_air_air', 'pompe_a_chaleur_air_eau', 'pompe_a_chaleur_eau_eau',
    'radiateur_electrique', 'radiateur_electrique_inertie', 'plancher_chauffant_electrique',
    'poele_gaz', 'poele_fioul', 'reseau_chaleur', 'autre'
  ]),
  type_energie: z.enum([
    'electricite', 'gaz_naturel', 'fioul', 'propane', 'bois_buches',
    'bois_pellets', 'bois_plaquettes', 'reseau_chaleur', 'charbon', 'autre'
  ]),
  surface_chauffee: z.number().positive(),
  puissance_nominale_kw: z.number().positive().optional(),
  rendement: z.number().positive().max(1.5).optional(),
  annee_installation: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  collectif: z.boolean().optional(),
  comptage_individuel: z.boolean().optional(),
  repartition: z.enum(['radiateur', 'plancher_chauffant', 'air_pulse']).optional(),
  regulation: z.enum(['sans', 'thermostat_simple', 'programmation', 'regulation_optimisee']).optional(),
  presence_robinets_thermostatiques: z.boolean().optional()
});

const InstallationECSSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  description: z.string().min(1),
  type_ecs: z.enum([
    'cumulus_electrique', 'cumulus_gaz', 'chaudiere_multi_batiment',
    'chaudiere_mono_batiment', 'chaudiere_individuelle', 'pompe_a_chaleur',
    'solaire_individuel', 'solaire_collectif', 'reseau_chaleur',
    'instantane_gaz', 'cumulus_thermodynamique', 'autre'
  ]),
  type_energie: z.enum([
    'electricite', 'gaz_naturel', 'fioul', 'propane', 'bois_buches',
    'bois_pellets', 'bois_plaquettes', 'reseau_chaleur', 'charbon', 'autre'
  ]),
  nombre_personnes: z.number().int().positive(),
  volume_ballon_litres: z.number().positive().optional(),
  puissance_nominale_kw: z.number().positive().optional(),
  rendement: z.number().positive().max(2).optional(),
  annee_installation: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  collectif: z.boolean().optional(),
  comptage_individuel: z.boolean().optional()
});

const InstallationVentilationSchema = z.object({
  id: z.string().min(1),
  dpe_id: z.string().min(1),
  type_ventilation: z.enum([
    'naturelle', 'autoreglable', 'hygro_a', 'hygro_b', 'double_flux',
    'simple_flux_haute_performance', 'vmc_collective', 'vmc_individuelle', 'vmi', 'autre'
  ]),
  annee_installation: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  debit_ventilation_m3_h: z.number().positive().optional(),
  presence_echangeur_thermique: z.boolean().optional(),
  rendement_echangeur: z.number().positive().max(1).optional()
});

const DPESchema = z.object({
  id: z.string().min(1),
  numero_dpe: z.string().min(1),
  user_id: z.string().min(1),
  adresse: z.string().min(5),
  code_postal: z.string().regex(/^\d{5}$/),
  commune: z.string().min(2),
  departement: z.string().min(2),
  type_batiment: TypeBatimentSchema,
  annee_construction: z.number().int().min(1000).max(new Date().getFullYear()),
  epoque_construction: z.enum([
    'avant_1948', '1948_1968', '1969_1974', '1975_1977', '1978_1982',
    '1983_1988', '1989_1999', '2000_2005', '2006_2012', 'apres_2012'
  ]),
  surface_habitable: z.number().positive().max(10000),
  nombre_niveaux: z.number().int().positive().max(50),
  nombre_logements: z.number().int().positive().optional(),
  zone_climatique: ZoneClimatiqueSchema,
  altitude: AltitudeSchema,
  murs: z.array(MurSchema).min(1),
  planchers_bas: z.array(PlancherBasSchema),
  planchers_hauts: z.array(PlancherHautSchema),
  fenetres: z.array(FenetreSchema),
  portes: z.array(z.object({
    id: z.string().min(1),
    dpe_id: z.string().min(1),
    description: z.string().min(1),
    surface_totale: z.number().positive(),
    u_porte: z.number().positive(),
    orientation: z.string().optional()
  })),
  ponts_thermiques: z.array(z.object({
    id: z.string().min(1),
    dpe_id: z.string().min(1),
    type_pont: z.enum(['mur_plancher_bas', 'mur_plancher_haut', 'mur_refend', 'menuiserie', 'angle']),
    longueur: z.number().positive(),
    k_pont: z.number().positive(),
    deperdition_w_k: z.number().positive()
  })),
  installations_chauffage: z.array(InstallationChauffageSchema),
  installations_ecs: z.array(InstallationECSSchema),
  installations_ventilation: z.array(InstallationVentilationSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  statut: z.enum(['brouillon', 'valide', 'signe', 'annule']),
  version_methode: z.string().min(1)
});

// ============================================================================
// INTERFACE DE RÉSULTAT DE VALIDATION
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// SERVICE DE VALIDATION
// ============================================================================

export class ValidationService {
  
  /**
   * Valide un objet DPE complet
   */
  validateDPE(dpe: unknown): ValidationResult {
    const result = DPESchema.safeParse(dpe);
    
    if (result.success) {
      // Validation métier additionnelle
      const businessValidation = this.validateBusinessRules(result.data);
      return businessValidation;
    }

    const errors: ValidationError[] = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: 'VALIDATION_ERROR'
    }));

    return {
      valid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Valide un mur spécifique
   */
  validateMur(mur: unknown): ValidationResult {
    const result = MurSchema.safeParse(mur);
    
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR'
        })),
        warnings: []
      };
    }

    const warnings: ValidationWarning[] = [];
    
    // Avertissements métier
    if (result.data.isolation && !result.data.annee_isolation && !result.data.resistance_isolant) {
      warnings.push({
        field: 'isolation',
        message: 'Mur isolé mais sans année ni résistance d\'isolation précisée',
        code: 'MISSING_ISOLATION_DETAILS'
      });
    }

    return {
      valid: true,
      errors: [],
      warnings
    };
  }

  /**
   * Valide une fenêtre
   */
  validateFenetre(fenetre: unknown): ValidationResult {
    const result = FenetreSchema.safeParse(fenetre);
    
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR'
        })),
        warnings: []
      };
    }

    const warnings: ValidationWarning[] = [];
    const data = result.data;

    // Vérification cohérence Ug/Uw
    if (data.uw < data.ug) {
      warnings.push({
        field: 'uw',
        message: 'Uw ne devrait pas être inférieur à Ug (la menuiserie dégrade le vitrage)',
        code: 'UW_UG_INCOHERENCE'
      });
    }

    return {
      valid: true,
      errors: [],
      warnings
    };
  }

  /**
   * Valide une installation de chauffage
   */
  validateInstallationChauffage(installation: unknown): ValidationResult {
    const result = InstallationChauffageSchema.safeParse(installation);
    
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR'
        })),
        warnings: []
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Valide une installation ECS
   */
  validateInstallationECS(installation: unknown): ValidationResult {
    const result = InstallationECSSchema.safeParse(installation);
    
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR'
        })),
        warnings: []
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Validation des règles métier complexes
   */
  private validateBusinessRules(dpe: DPE): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Surface habitable cohérente avec les surfaces des parois
    const surfaceMurs = dpe.murs.reduce((sum, m) => sum + m.surface_totale, 0);
    const surfacePlanchersBas = dpe.planchers_bas.reduce((sum, p) => sum + p.surface_totale, 0);
    const surfacePlanchersHauts = dpe.planchers_hauts.reduce((sum, p) => sum + p.surface_totale, 0);

    if (surfacePlanchersBas > 0 && surfacePlanchersHauts > 0) {
      const ratio = Math.max(surfacePlanchersBas, surfacePlanchersHauts) / Math.min(surfacePlanchersBas, surfacePlanchersHauts);
      if (ratio > 1.3) {
        warnings.push({
          field: 'planchers',
          message: `Incohérence surface planchers bas (${surfacePlanchersBas}) vs hauts (${surfacePlanchersHauts})`,
          code: 'SURFACE_PLANCHERS_INCOHERENT'
        });
      }
    }

    // 2. Au moins un système de chauffage ou ECS
    if (dpe.installations_chauffage.length === 0 && dpe.installations_ecs.length === 0) {
      errors.push({
        field: 'installations',
        message: 'Au moins une installation de chauffage ou ECS est requise',
        code: 'NO_INSTALLATION'
      });
    }

    // 3. Vérification des surfaces chauffées
    const totalSurfaceChauffee = dpe.installations_chauffage.reduce((sum, i) => sum + i.surface_chauffee, 0);
    if (totalSurfaceChauffee > dpe.surface_habitable * 1.5) {
      warnings.push({
        field: 'installations_chauffage.surface_chauffee',
        message: `Surface chauffée totale (${totalSurfaceChauffee}) supérieure à 150% de la surface habitable (${dpe.surface_habitable})`,
        code: 'SURFACE_CHAUFFEE_EXCESSIVE'
      });
    }

    // 4. Cohérence année construction / époque
    const epoqueFromAnnee = this.getEpoqueFromAnnee(dpe.annee_construction);
    if (epoqueFromAnnee !== dpe.epoque_construction) {
      warnings.push({
        field: 'epoque_construction',
        message: `Époque de construction (${dpe.epoque_construction}) incohérente avec l'année (${dpe.annee_construction})`,
        code: 'EPOQUE_ANNEE_INCOHERENT'
      });
    }

    // 5. Vérification des U cohérents
    dpe.murs.forEach((mur, index) => {
      if (mur.u_mur > 4.0) {
        warnings.push({
          field: `murs[${index}].u_mur`,
          message: `U mur (${mur.u_mur}) très élevé, vérifier la saisie`,
          code: 'U_MUR_ELEVE'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Détermine l'époque de construction à partir de l'année
   */
  private getEpoqueFromAnnee(annee: number): string {
    if (annee < 1948) return 'avant_1948';
    if (annee <= 1968) return '1948_1968';
    if (annee <= 1974) return '1969_1974';
    if (annee <= 1977) return '1975_1977';
    if (annee <= 1982) return '1978_1982';
    if (annee <= 1988) return '1983_1988';
    if (annee <= 1999) return '1989_1999';
    if (annee <= 2005) return '2000_2005';
    if (annee <= 2012) return '2006_2012';
    return 'apres_2012';
  }

  /**
   * Valide un numéro de DPE selon le format ADEME
   * Format attendu: DPE-YYYY-NNNNNN ou similaire
   */
  validateNumeroDPE(numero: string): boolean {
    const dpeRegex = /^DPE-\d{4}-\d{6,}$/i;
    return dpeRegex.test(numero);
  }

  /**
   * Valide un code postal français
   */
  validateCodePostal(codePostal: string): boolean {
    return /^\d{5}$/.test(codePostal);
  }

  /**
   * Valide une adresse email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Vérifie si une valeur U est conforme à la RT existante
   */
  isUValueCompliant(uValue: number, element: 'mur' | 'plancher_bas' | 'plancher_haut' | 'fenetre', zoneClimatique: ZoneClimatique): boolean {
    const seuils = {
      H1: { mur: 0.36, plancher_bas: 0.27, plancher_haut: 0.27, fenetre: 2.0 },
      H2: { mur: 0.40, plancher_bas: 0.30, plancher_haut: 0.30, fenetre: 2.3 },
      H3: { mur: 0.45, plancher_bas: 0.35, plancher_haut: 0.35, fenetre: 2.6 }
    };

    return uValue <= seuils[zoneClimatique][element];
  }
}
