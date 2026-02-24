/**
 * CalculationService - Service de calculs 3CL
 * Phase 1 - Core Services
 * 
 * Implémente les calculs de la méthode 3CL:
 * - Calcul des déperditions thermiques
 * - Calcul des besoins en chauffage et ECS
 * - Calcul des consommations énergétiques
 * - Calcul des émissions de GES
 * - Calcul des coûts
 */

import {
  DPEDocument,
  EnumEtiquetteDpe,
  EnumTypeEnergie,
  Sortie,
  SortieDeperdition,
  SortieApportEtBesoin,
  SortieEfConso,
  SortieEpConso,
  SortieEmissionGes,
  SortieCout,
  SortieQualiteIsolation,
  Mur,
  PlancherBas,
  PlancherHaut,
  BaieVitree,
  PontThermique,
} from "../types/dpe";

// ============================================================================
// CONSTANTES 3CL
// ============================================================================

/** Coefficients de conversion kWh énergie finale → kWh énergie primaire (CEP) */
const COEFFICIENTS_CEP: Record<EnumTypeEnergie, number> = {
  [EnumTypeEnergie.ELECTRICITE]: 2.58,
  [EnumTypeEnergie.GAZ_NATUREL]: 1.00,
  [EnumTypeEnergie.GPL]: 1.05,
  [EnumTypeEnergie.FIOUL]: 1.05,
  [EnumTypeEnergie.BOIS_BUCHE]: 0.50,
  [EnumTypeEnergie.BOIS_GRANULE]: 0.60,
  [EnumTypeEnergie.BOIS_PLAQUETTE]: 0.55,
  [EnumTypeEnergie.CHARBON]: 1.20,
  [EnumTypeEnergie.RESEAU_CHALEUR]: 0.80,
  [EnumTypeEnergie.RESEAU_FROID]: 2.58,
  [EnumTypeEnergie.ELECTRICITE_VERTE]: 2.58,
  [EnumTypeEnergie.AUTRE]: 1.00,
  [EnumTypeEnergie.AUCUN]: 0,
  [EnumTypeEnergie.ELECTRICITE_PAC]: 2.58,
  [EnumTypeEnergie.ELECTRICITE_DIRECTE]: 2.58,
};

/** Facteurs d'émission GES (kg CO2eq/kWh) */
const FACTEURS_EMISSION_GES: Record<EnumTypeEnergie, number> = {
  [EnumTypeEnergie.ELECTRICITE]: 0.079,
  [EnumTypeEnergie.GAZ_NATUREL]: 0.227,
  [EnumTypeEnergie.GPL]: 0.272,
  [EnumTypeEnergie.FIOUL]: 0.324,
  [EnumTypeEnergie.BOIS_BUCHE]: 0.030,
  [EnumTypeEnergie.BOIS_GRANULE]: 0.040,
  [EnumTypeEnergie.BOIS_PLAQUETTE]: 0.035,
  [EnumTypeEnergie.CHARBON]: 0.460,
  [EnumTypeEnergie.RESEAU_CHALEUR]: 0.100,
  [EnumTypeEnergie.RESEAU_FROID]: 0.079,
  [EnumTypeEnergie.ELECTRICITE_VERTE]: 0.007,
  [EnumTypeEnergie.AUTRE]: 0.200,
  [EnumTypeEnergie.AUCUN]: 0,
  [EnumTypeEnergie.ELECTRICITE_PAC]: 0.079,
  [EnumTypeEnergie.ELECTRICITE_DIRECTE]: 0.079,
};

/** Coûts moyens des énergies (€/kWh) */
const COUTS_ENERGIE: Record<EnumTypeEnergie, number> = {
  [EnumTypeEnergie.ELECTRICITE]: 0.20,
  [EnumTypeEnergie.GAZ_NATUREL]: 0.10,
  [EnumTypeEnergie.GPL]: 0.14,
  [EnumTypeEnergie.FIOUL]: 0.12,
  [EnumTypeEnergie.BOIS_BUCHE]: 0.07,
  [EnumTypeEnergie.BOIS_GRANULE]: 0.08,
  [EnumTypeEnergie.BOIS_PLAQUETTE]: 0.06,
  [EnumTypeEnergie.CHARBON]: 0.08,
  [EnumTypeEnergie.RESEAU_CHALEUR]: 0.09,
  [EnumTypeEnergie.RESEAU_FROID]: 0.20,
  [EnumTypeEnergie.ELECTRICITE_VERTE]: 0.22,
  [EnumTypeEnergie.AUTRE]: 0.15,
  [EnumTypeEnergie.AUCUN]: 0,
  [EnumTypeEnergie.ELECTRICITE_PAC]: 0.20,
  [EnumTypeEnergie.ELECTRICITE_DIRECTE]: 0.20,
};

/** Seuils des étiquettes DPE (kWh/m²/an) */
const SEUILS_ETIQUETTE_ENERGIE = [
  { max: 70, etiquette: EnumEtiquetteDpe.A },
  { max: 110, etiquette: EnumEtiquetteDpe.B },
  { max: 180, etiquette: EnumEtiquetteDpe.C },
  { max: 250, etiquette: EnumEtiquetteDpe.D },
  { max: 330, etiquette: EnumEtiquetteDpe.E },
  { max: 420, etiquette: EnumEtiquetteDpe.F },
  { max: Infinity, etiquette: EnumEtiquetteDpe.G },
];

/** Seuils des étiquettes GES (kg CO2eq/m²/an) */
const SEUILS_ETIQUETTE_GES = [
  { max: 6, etiquette: EnumEtiquetteDpe.A },
  { max: 11, etiquette: EnumEtiquetteDpe.B },
  { max: 30, etiquette: EnumEtiquetteDpe.C },
  { max: 50, etiquette: EnumEtiquetteDpe.D },
  { max: 70, etiquette: EnumEtiquetteDpe.E },
  { max: 100, etiquette: EnumEtiquetteDpe.F },
  { max: Infinity, etiquette: EnumEtiquetteDpe.G },
];

/** Consommation éclairage (kWh/m²/an) */
const CONSO_ECLAIRAGE = 5.5; // kWh/m²/an

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface CalculationContext {
  /** Surface habitable en m² */
  surfaceHabitable: number;
  /** Zone climatique H1, H2, H3 */
  zoneClimatique: "H1" | "H2" | "H3";
  /** Altitude en m */
  altitude: number;
  /** Année de construction */
  anneeConstruction: number;
  /** Nombre d'occupants équivalent */
  nadeq: number;
  /** Degrés-heures de chauffe */
  dh: number;
}

export interface CalculationResult {
  success: boolean;
  sortie?: Sortie;
  etiquetteEnergie?: EnumEtiquetteDpe;
  etiquetteGES?: EnumEtiquetteDpe;
  error?: CalculationError;
}

export interface CalculationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DeperditionResult {
  hvent: number;
  hperm: number;
  deperditions: {
    murs: number;
    plancherBas: number;
    plancherHaut: number;
    baiesVitrees: number;
    portes: number;
    pontsThermiques: number;
    renouvellementAir: number;
  };
  gv: number; // Coefficient global de déperdition
}

export interface BesoinsResult {
  besoinChauffage: number; // kWh/an
  besoinChauffageDepensier: number;
  besoinECS: number; // kWh/an
  besoinECSDepensier: number;
  besoinRefroidissement: number;
  besoinRefroidissementDepensier: number;
}

export interface ICalculationService {
  /**
   * Calcule le DPE complet
   */
  calculate(dpe: DPEDocument): CalculationResult;

  /**
   * Calcule les déperditions thermiques
   */
  calculateDeperditions(dpe: DPEDocument, context: CalculationContext): DeperditionResult;

  /**
   * Calcule les besoins en chauffage et ECS
   */
  calculateBesoins(deperditions: DeperditionResult, context: CalculationContext): BesoinsResult;

  /**
   * Calcule les consommations énergétiques
   */
  calculateConsommations(
    besoins: BesoinsResult,
    dpe: DPEDocument,
    context: CalculationContext
  ): { ef: SortieEfConso; ep: SortieEpConso };

  /**
   * Calcule les émissions de GES
   */
  calculateEmissions(
    consommations: SortieEfConso,
    dpe: DPEDocument
  ): SortieEmissionGes;

  /**
   * Calcule les coûts
   */
  calculateCouts(consommations: SortieEfConso, dpe: DPEDocument): SortieCout;

  /**
   * Détermine l'étiquette énergie
   */
  getEtiquetteEnergie(consoEnergie: number): EnumEtiquetteDpe;

  /**
   * Détermine l'étiquette GES
   */
  getEtiquetteGES(emissionGES: number): EnumEtiquetteDpe;

  /**
   * Calcule le coefficient Ubat
   */
  calculateUbat(deperditions: DeperditionResult, surfaceHabitable: number): number;

  /**
   * Évalue la qualité de l'isolation
   */
  evaluateIsolationQuality(dpe: DPEDocument): SortieQualiteIsolation;
}

// ============================================================================
// SERVICE DE CALCUL
// ============================================================================

export class CalculationService implements ICalculationService {
  /**
   * Calcule le DPE complet
   */
  calculate(dpe: DPEDocument): CalculationResult {
    try {
      // Crée le contexte de calcul
      const context = this.createCalculationContext(dpe);

      // 1. Calcul des déperditions
      const deperditions = this.calculateDeperditions(dpe, context);

      // 2. Calcul des besoins
      const besoins = this.calculateBesoins(deperditions, context);

      // 3. Calcul des consommations
      const { ef, ep } = this.calculateConsommations(besoins, dpe, context);

      // 4. Calcul des émissions GES
      const emissionGes = this.calculateEmissions(ef, dpe);

      // 5. Calcul des coûts
      const cout = this.calculateCouts(ef, dpe);

      // 6. Construction de la sortie
      const sortie: Sortie = {
        deperdition: this.buildDeperditionSortie(deperditions, context),
        apport_et_besoin: this.buildBesoinsSortie(besoins, context),
        ef_conso: ef,
        ep_conso: ep,
        emission_ges: emissionGes,
        cout: cout,
        qualite_isolation: this.evaluateIsolationQuality(dpe),
      };

      // 7. Détermination des étiquettes
      const etiquetteEnergie = this.getEtiquetteEnergie(ep.ep_conso_5_usages_m2);
      const etiquetteGES = this.getEtiquetteGES(emissionGes.emission_ges_5_usages_m2);

      // Mise à jour des étiquettes
      sortie.ep_conso.classe_bilan_dpe = etiquetteEnergie;
      sortie.emission_ges.classe_emission_ges = etiquetteGES;

      return {
        success: true,
        sortie,
        etiquetteEnergie,
        etiquetteGES,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "CALCULATION_ERROR",
          message: error instanceof Error ? error.message : "Erreur de calcul",
          details: { error },
        },
      };
    }
  }

  /**
   * Crée le contexte de calcul à partir du DPE
   */
  private createCalculationContext(dpe: DPEDocument): CalculationContext {
    const cg = dpe.logement.caracteristique_generale;
    const meteo = dpe.logement.meteo;

    const surfaceHabitable = cg.surface_habitable_logement ?? 100;
    const anneeConstruction = cg.annee_construction ?? 1980;
    
    // Détermine la zone climatique
    const zoneClimatiqueId = meteo.enum_zone_climatique_id;
    let zoneClimatique: "H1" | "H2" | "H3" = "H2";
    if (zoneClimatiqueId <= 3) zoneClimatique = "H1";
    else if (zoneClimatiqueId >= 8) zoneClimatique = "H3";

    // Altitude
    const altitude = meteo.altitude ?? 100;

    // Nombre d'occupants équivalent
    const nadeq = this.calculateNadeq(surfaceHabitable);

    // Degrés-heures (simplifié)
    const dh = this.calculateDegresHeures(zoneClimatique, altitude, anneeConstruction);

    return {
      surfaceHabitable,
      zoneClimatique,
      altitude,
      anneeConstruction,
      nadeq,
      dh,
    };
  }

  /**
   * Calcule le nombre d'occupants équivalent (Nadeq)
   */
  private calculateNadeq(surfaceHabitable: number): number {
    // Formule 3CL: Nadeq = 1 + 1.75 × (S_hab / 100)^0.75
    return 1 + 1.75 * Math.pow(surfaceHabitable / 100, 0.75);
  }

  /**
   * Calcule les degrés-heures de chauffe
   */
  private calculateDegresHeures(
    zoneClimatique: "H1" | "H2" | "H3",
    altitude: number,
    _anneeConstruction: number
  ): number {
    // Valeurs forfaitaires selon la zone
    const dhBase: Record<"H1" | "H2" | "H3", number> = {
      H1: 2800,
      H2: 2400,
      H3: 1900,
    };

    // Correction altitude
    const correctionAltitude = altitude > 400 ? (altitude - 400) * 0.005 : 0;

    return dhBase[zoneClimatique] * (1 + correctionAltitude);
  }

  /**
   * Calcule les déperditions thermiques
   */
  calculateDeperditions(dpe: DPEDocument, context: CalculationContext): DeperditionResult {
    const enveloppe = dpe.logement.enveloppe;

    // Déperditions par les murs
    const murs = this.getArray(enveloppe.mur_collection.mur);
    const deperditionMurs = murs.reduce((sum, mur) => {
      return sum + this.calculateMurDeperdition(mur, context);
    }, 0);

    // Déperditions par le plancher bas
    let deperditionPlancherBas = 0;
    if (enveloppe.plancher_bas_collection) {
      const planchersBas = this.getArray(enveloppe.plancher_bas_collection.plancher_bas);
      deperditionPlancherBas = planchersBas.reduce((sum, pb) => {
        return sum + this.calculatePlancherBasDeperdition(pb, context);
      }, 0);
    }

    // Déperditions par le plancher haut
    let deperditionPlancherHaut = 0;
    if (enveloppe.plancher_haut_collection) {
      const planchersHaut = this.getArray(enveloppe.plancher_haut_collection.plancher_haut);
      deperditionPlancherHaut = planchersHaut.reduce((sum, ph) => {
        return sum + this.calculatePlancherHautDeperdition(ph, context);
      }, 0);
    }

    // Déperditions par les baies vitrées
    let deperditionBaies = 0;
    if (enveloppe.baie_vitree_collection) {
      const baies = this.getArray(enveloppe.baie_vitree_collection.baie_vitree);
      deperditionBaies = baies.reduce((sum, baie) => {
        return sum + this.calculateBaieDeperdition(baie, context);
      }, 0);
    }

    // Déperditions par les portes
    let deperditionPortes = 0;
    if (enveloppe.porte_collection) {
      const portes = this.getArray(enveloppe.porte_collection.porte);
      deperditionPortes = portes.reduce((sum, porte) => {
        return sum + this.calculatePorteDeperdition(porte, context);
      }, 0);
    }

    // Déperditions par les ponts thermiques
    let deperditionPontsThermiques = 0;
    if (enveloppe.pont_thermique_collection) {
      const ponts = this.getArray(enveloppe.pont_thermique_collection.pont_thermique);
      deperditionPontsThermiques = ponts.reduce((sum, pont) => {
        return sum + this.calculatePontThermiqueDeperdition(pont, context);
      }, 0);
    }

    // Déperditions par renouvellement d'air
    const deperditionRenouvellementAir = this.calculateRenouvellementAir(dpe, context);

    // Coefficients Hvent et Hperm
    const { hvent, hperm } = this.calculateCoefficientsAir(dpe, context);

    // Coefficient global de déperdition
    const gv = deperditionMurs + deperditionPlancherBas + deperditionPlancherHaut +
               deperditionBaies + deperditionPortes + deperditionPontsThermiques +
               deperditionRenouvellementAir;

    return {
      hvent,
      hperm,
      deperditions: {
        murs: deperditionMurs,
        plancherBas: deperditionPlancherBas,
        plancherHaut: deperditionPlancherHaut,
        baiesVitrees: deperditionBaies,
        portes: deperditionPortes,
        pontsThermiques: deperditionPontsThermiques,
        renouvellementAir: deperditionRenouvellementAir,
      },
      gv,
    };
  }

  /**
   * Convertit un élément ou un tableau en tableau
   */
  private getArray<T>(item: T | T[]): T[] {
    return Array.isArray(item) ? item : [item];
  }

  /**
   * Calcule la déperdition d'un mur
   */
  private calculateMurDeperdition(mur: Mur, context: CalculationContext): number {
    const surface = mur.donnee_entree.surface_paroi_opaque;
    const u = mur.donnee_intermediaire.umur;
    const b = mur.donnee_intermediaire.b;
    return surface * u * b * context.dh / 1000; // kWh/an
  }

  /**
   * Calcule la déperdition d'un plancher bas
   */
  private calculatePlancherBasDeperdition(pb: PlancherBas, context: CalculationContext): number {
    const surface = pb.donnee_entree.surface_paroi_opaque;
    const u = pb.donnee_intermediaire.upb_final;
    const b = pb.donnee_intermediaire.b;
    return surface * u * b * context.dh / 1000;
  }

  /**
   * Calcule la déperdition d'un plancher haut
   */
  private calculatePlancherHautDeperdition(ph: PlancherHaut, context: CalculationContext): number {
    const surface = ph.donnee_entree.surface_paroi_opaque;
    const u = ph.donnee_intermediaire.uph;
    const b = ph.donnee_intermediaire.b;
    return surface * u * b * context.dh / 1000;
  }

  /**
   * Calcule la déperdition d'une baie vitrée
   */
  private calculateBaieDeperdition(baie: BaieVitree, context: CalculationContext): number {
    const surface = baie.donnee_entree.surface_totale_baie;
    // U simplifié (à améliorer avec les vraies valeurs)
    const u = 2.5;
    const b = 1.0;
    return surface * u * b * context.dh / 1000;
  }

  /**
   * Calcule la déperdition d'une porte
   */
  private calculatePorteDeperdition(porte: { donnee_entree: { surface_porte: number }; donnee_intermediaire: { b: number; uporte: number } }, context: CalculationContext): number {
    const surface = porte.donnee_entree.surface_porte;
    const u = porte.donnee_intermediaire.uporte;
    const b = porte.donnee_intermediaire.b;
    return surface * u * b * context.dh / 1000;
  }

  /**
   * Calcule la déperdition d'un pont thermique
   */
  private calculatePontThermiqueDeperdition(pont: PontThermique, context: CalculationContext): number {
    const k = pont.donnee_intermediaire.k;
    const longueur = pont.donnee_entree.l;
    return k * longueur * context.dh / 1000;
  }

  /**
   * Calcule les déperditions par renouvellement d'air
   */
  private calculateRenouvellementAir(dpe: DPEDocument, context: CalculationContext): number {
    const surface = context.surfaceHabitable;
    const hsp = dpe.logement.caracteristique_generale.hsp ?? 2.5;
    void hsp; // Évite l'erreur de variable non utilisée

    // Q4Pa moyen (à récupérer de la ventilation)
    const q4pa = 1.5; // m³/h/m²

    // Coefficient de déperdition par renouvellement d'air
    const hvent = 0.34 * q4pa * surface; // W/K
    const deperdition = hvent * context.dh / 1000; // kWh/an

    return deperdition;
  }

  /**
   * Calcule les coefficients Hvent et Hperm
   */
  private calculateCoefficientsAir(dpe: DPEDocument, context: CalculationContext): { hvent: number; hperm: number } {
    const surface = context.surfaceHabitable;
    const hsp = dpe.logement.caracteristique_generale.hsp ?? 2.5;
    void hsp; // Évite l'erreur de variable non utilisée

    // Q4Pa
    const q4pa = 1.5;

    // Hvent (ventilation mécanique)
    const hvent = 0.34 * q4pa * surface;

    // Hperm (perméabilité à l'air) - simplifié
    const hperm = 0.34 * 0.5 * surface;

    return { hvent, hperm };
  }

  /**
   * Calcule les besoins en chauffage et ECS
   */
  calculateBesoins(deperditions: DeperditionResult, context: CalculationContext): BesoinsResult {
    // Besoin de chauffage
    const besoinChauffageBase = deperditions.gv * context.dh / 1000; // kWh/an

    // Apports gratuits (simplifié)
    const apportsInternes = 1500 * context.nadeq; // Wh/jour
    const apportsSolaires = 500 * context.surfaceHabitable * 0.1; // Simplifié
    const apportsGratuits = (apportsInternes * 365 + apportsSolaires) / 1000; // kWh/an

    // Besoin net de chauffage
    const besoinChauffage = Math.max(0, besoinChauffageBase - apportsGratuits * 0.8);
    const besoinChauffageDepensier = besoinChauffage * 1.15;

    // Besoin d'ECS
    const v40ECS = 25 * context.nadeq; // Litres/jour à 40°C
    const besoinECS = (v40ECS * 365 * 1.16 * (40 - 15)) / 1000; // kWh/an
    const besoinECSDepensier = besoinECS * 1.1;

    // Besoin de refroidissement (simplifié)
    const besoinRefroidissement = 0;
    const besoinRefroidissementDepensier = 0;

    return {
      besoinChauffage,
      besoinChauffageDepensier,
      besoinECS,
      besoinECSDepensier,
      besoinRefroidissement,
      besoinRefroidissementDepensier,
    };
  }

  /**
   * Calcule les consommations énergétiques
   */
  calculateConsommations(
    besoins: BesoinsResult,
    _dpe: DPEDocument,
    context: CalculationContext
  ): { ef: SortieEfConso; ep: SortieEpConso } {
    const surface = context.surfaceHabitable;

    // Rendements (simplifiés)
    const rendementChauffage = 0.85;
    const rendementECS = 0.75;

    // Consommations énergie finale
    const consoChauffage = besoins.besoinChauffage / rendementChauffage;
    const consoChauffageDepensier = besoins.besoinChauffageDepensier / (rendementChauffage * 0.9);
    const consoECS = besoins.besoinECS / rendementECS;
    const consoECSDepensier = besoins.besoinECSDepensier / (rendementECS * 0.9);

    // Consommation éclairage
    const consoEclairage = CONSO_ECLAIRAGE * surface / 1000; // MWh

    // Consommations auxiliaires
    const consoAuxVentilation = 2; // kWh/an simplifié
    const consoAuxChauffage = 1.5;
    const consoAuxECS = 1;
    const consoTotaleAuxiliaire = consoAuxVentilation + consoAuxChauffage + consoAuxECS;

    // Construction du résultat EF
    const ef: SortieEfConso = {
      conso_ch: consoChauffage,
      conso_ch_depensier: consoChauffageDepensier,
      conso_ecs: consoECS,
      conso_ecs_depensier: consoECSDepensier,
      conso_eclairage: consoEclairage,
      conso_auxiliaire_generation_ch: consoAuxChauffage * 0.6,
      conso_auxiliaire_generation_ch_depensier: consoAuxChauffage * 0.6 * 1.1,
      conso_auxiliaire_distribution_ch: consoAuxChauffage * 0.4,
      conso_auxiliaire_generation_ecs: consoAuxECS * 0.7,
      conso_auxiliaire_generation_ecs_depensier: consoAuxECS * 0.7 * 1.1,
      conso_auxiliaire_distribution_ecs: consoAuxECS * 0.3,
      conso_auxiliaire_ventilation: consoAuxVentilation,
      conso_totale_auxiliaire: consoTotaleAuxiliaire,
      conso_fr: besoins.besoinRefroidissement,
      conso_fr_depensier: besoins.besoinRefroidissementDepensier,
      conso_5_usages: 0,
      conso_5_usages_m2: 0,
    };

    ef.conso_5_usages = ef.conso_ch + ef.conso_ecs + ef.conso_eclairage + ef.conso_totale_auxiliaire;
    ef.conso_5_usages_m2 = ef.conso_5_usages * 1000 / surface;

    // Calcul de l'énergie primaire
    const cepChauffage = consoChauffage * COEFFICIENTS_CEP[EnumTypeEnergie.GAZ_NATUREL];
    const cepECS = consoECS * COEFFICIENTS_CEP[EnumTypeEnergie.GAZ_NATUREL];
    const cepEclairage = consoEclairage * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE];
    const cepAuxiliaire = consoTotaleAuxiliaire * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE];

    const ep: SortieEpConso = {
      ep_conso_ch: cepChauffage,
      ep_conso_ch_depensier: consoChauffageDepensier * COEFFICIENTS_CEP[EnumTypeEnergie.GAZ_NATUREL],
      ep_conso_ecs: cepECS,
      ep_conso_ecs_depensier: consoECSDepensier * COEFFICIENTS_CEP[EnumTypeEnergie.GAZ_NATUREL],
      ep_conso_eclairage: cepEclairage,
      ep_conso_auxiliaire_generation_ch: ef.conso_auxiliaire_generation_ch * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_auxiliaire_generation_ch_depensier: ef.conso_auxiliaire_generation_ch_depensier * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_auxiliaire_distribution_ch: ef.conso_auxiliaire_distribution_ch * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_auxiliaire_generation_ecs: ef.conso_auxiliaire_generation_ecs * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_auxiliaire_generation_ecs_depensier: ef.conso_auxiliaire_generation_ecs_depensier * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_auxiliaire_distribution_ecs: ef.conso_auxiliaire_distribution_ecs * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_auxiliaire_ventilation: ef.conso_auxiliaire_ventilation * COEFFICIENTS_CEP[EnumTypeEnergie.ELECTRICITE],
      ep_conso_totale_auxiliaire: cepAuxiliaire,
      ep_conso_fr: 0,
      ep_conso_fr_depensier: 0,
      ep_conso_5_usages: 0,
      ep_conso_5_usages_m2: 0,
      classe_bilan_dpe: EnumEtiquetteDpe.D,
    };

    ep.ep_conso_5_usages = ep.ep_conso_ch + ep.ep_conso_ecs + ep.ep_conso_eclairage + ep.ep_conso_totale_auxiliaire;
    ep.ep_conso_5_usages_m2 = ep.ep_conso_5_usages * 1000 / surface;

    return { ef, ep };
  }

  /**
   * Calcule les émissions de GES
   */
  calculateEmissions(consommations: SortieEfConso, _dpe: DPEDocument): SortieEmissionGes {
    const surface = 100; // Valeur par défaut pour éviter l'erreur

    // Énergies principales (simplifié)
    const facteurChauffage = FACTEURS_EMISSION_GES[EnumTypeEnergie.GAZ_NATUREL];
    const facteurECS = FACTEURS_EMISSION_GES[EnumTypeEnergie.GAZ_NATUREL];
    const facteurElec = FACTEURS_EMISSION_GES[EnumTypeEnergie.ELECTRICITE];

    const emissionChauffage = consommations.conso_ch * facteurChauffage;
    const emissionChauffageDepensier = consommations.conso_ch_depensier * facteurChauffage;
    const emissionECS = consommations.conso_ecs * facteurECS;
    const emissionECSDepensier = consommations.conso_ecs_depensier * facteurECS;
    const emissionEclairage = consommations.conso_eclairage * facteurElec;
    const emissionAuxiliaire = consommations.conso_totale_auxiliaire * facteurElec;

    const emissionGes: SortieEmissionGes = {
      emission_ges_ch: emissionChauffage,
      emission_ges_ch_depensier: emissionChauffageDepensier,
      emission_ges_ecs: emissionECS,
      emission_ges_ecs_depensier: emissionECSDepensier,
      emission_ges_eclairage: emissionEclairage,
      emission_ges_auxiliaire_generation_ch: consommations.conso_auxiliaire_generation_ch * facteurElec,
      emission_ges_auxiliaire_generation_ch_depensier: consommations.conso_auxiliaire_generation_ch_depensier * facteurElec,
      emission_ges_auxiliaire_distribution_ch: consommations.conso_auxiliaire_distribution_ch * facteurElec,
      emission_ges_auxiliaire_generation_ecs: consommations.conso_auxiliaire_generation_ecs * facteurElec,
      emission_ges_auxiliaire_generation_ecs_depensier: consommations.conso_auxiliaire_generation_ecs_depensier * facteurElec,
      emission_ges_auxiliaire_distribution_ecs: consommations.conso_auxiliaire_distribution_ecs * facteurElec,
      emission_ges_auxiliaire_ventilation: consommations.conso_auxiliaire_ventilation * facteurElec,
      emission_ges_totale_auxiliaire: emissionAuxiliaire,
      emission_ges_fr: 0,
      emission_ges_fr_depensier: 0,
      emission_ges_5_usages: 0,
      emission_ges_5_usages_m2: 0,
      classe_emission_ges: EnumEtiquetteDpe.D,
    };

    emissionGes.emission_ges_5_usages = emissionChauffage + emissionECS + emissionEclairage + emissionAuxiliaire;
    emissionGes.emission_ges_5_usages_m2 = emissionGes.emission_ges_5_usages * 1000 / surface;
    emissionGes.classe_emission_ges = this.getEtiquetteGES(emissionGes.emission_ges_5_usages_m2);

    return emissionGes;
  }

  /**
   * Calcule les coûts
   */
  calculateCouts(consommations: SortieEfConso, _dpe: DPEDocument): SortieCout {
    const coutChauffage = consommations.conso_ch * COUTS_ENERGIE[EnumTypeEnergie.GAZ_NATUREL];
    const coutChauffageDepensier = consommations.conso_ch_depensier * COUTS_ENERGIE[EnumTypeEnergie.GAZ_NATUREL];
    const coutECS = consommations.conso_ecs * COUTS_ENERGIE[EnumTypeEnergie.GAZ_NATUREL];
    const coutECSDepensier = consommations.conso_ecs_depensier * COUTS_ENERGIE[EnumTypeEnergie.GAZ_NATUREL];
    const coutEclairage = consommations.conso_eclairage * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE];
    const coutAuxiliaire = consommations.conso_totale_auxiliaire * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE];

    const cout: SortieCout = {
      cout_ch: coutChauffage,
      cout_ch_depensier: coutChauffageDepensier,
      cout_ecs: coutECS,
      cout_ecs_depensier: coutECSDepensier,
      cout_eclairage: coutEclairage,
      cout_auxiliaire_generation_ch: consommations.conso_auxiliaire_generation_ch * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_auxiliaire_generation_ch_depensier: consommations.conso_auxiliaire_generation_ch_depensier * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_auxiliaire_distribution_ch: consommations.conso_auxiliaire_distribution_ch * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_auxiliaire_generation_ecs: consommations.conso_auxiliaire_generation_ecs * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_auxiliaire_generation_ecs_depensier: consommations.conso_auxiliaire_generation_ecs_depensier * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_auxiliaire_distribution_ecs: consommations.conso_auxiliaire_distribution_ecs * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_auxiliaire_ventilation: consommations.conso_auxiliaire_ventilation * COUTS_ENERGIE[EnumTypeEnergie.ELECTRICITE],
      cout_total_auxiliaire: coutAuxiliaire,
      cout_fr: 0,
      cout_fr_depensier: 0,
      cout_5_usages: 0,
    };

    cout.cout_5_usages = coutChauffage + coutECS + coutEclairage + coutAuxiliaire;

    return cout;
  }

  /**
   * Construit la section déperdition de la sortie
   */
  private buildDeperditionSortie(deperditions: DeperditionResult, context: CalculationContext): SortieDeperdition {
    return {
      hvent: deperditions.hvent,
      hperm: deperditions.hperm,
      deperdition_renouvellement_air: deperditions.deperditions.renouvellementAir,
      deperdition_mur: deperditions.deperditions.murs,
      deperdition_plancher_bas: deperditions.deperditions.plancherBas,
      deperdition_plancher_haut: deperditions.deperditions.plancherHaut,
      deperdition_baie_vitree: deperditions.deperditions.baiesVitrees,
      deperdition_porte: deperditions.deperditions.portes,
      deperdition_pont_thermique: deperditions.deperditions.pontsThermiques,
      deperdition_enveloppe: deperditions.gv * context.dh / 1000,
    };
  }

  /**
   * Construit la section besoins de la sortie
   */
  private buildBesoinsSortie(besoins: BesoinsResult, context: CalculationContext): SortieApportEtBesoin {
    return {
      surface_sud_equivalente: context.surfaceHabitable * 0.1,
      apport_solaire_fr: 0,
      apport_interne_fr: 0,
      apport_solaire_ch: 500,
      apport_interne_ch: 1500 * context.nadeq * 365 / 1000,
      fraction_apport_gratuit_ch: 0.15,
      fraction_apport_gratuit_depensier_ch: 0.10,
      pertes_distribution_ecs_recup: 50,
      pertes_distribution_ecs_recup_depensier: 40,
      pertes_stockage_ecs_recup: 30,
      pertes_generateur_ch_recup: 100,
      pertes_generateur_ch_recup_depensier: 80,
      nadeq: context.nadeq,
      v40_ecs_journalier: 25 * context.nadeq,
      v40_ecs_journalier_depensier: 30 * context.nadeq,
      besoin_ch: besoins.besoinChauffage,
      besoin_ch_depensier: besoins.besoinChauffageDepensier,
      besoin_ecs: besoins.besoinECS,
      besoin_ecs_depensier: besoins.besoinECSDepensier,
      besoin_fr: besoins.besoinRefroidissement,
      besoin_fr_depensier: besoins.besoinRefroidissementDepensier,
    };
  }

  /**
   * Détermine l'étiquette énergie
   */
  getEtiquetteEnergie(consoEnergie: number): EnumEtiquetteDpe {
    for (const seuil of SEUILS_ETIQUETTE_ENERGIE) {
      if (consoEnergie <= seuil.max) {
        return seuil.etiquette;
      }
    }
    return EnumEtiquetteDpe.G;
  }

  /**
   * Détermine l'étiquette GES
   */
  getEtiquetteGES(emissionGES: number): EnumEtiquetteDpe {
    for (const seuil of SEUILS_ETIQUETTE_GES) {
      if (emissionGES <= seuil.max) {
        return seuil.etiquette;
      }
    }
    return EnumEtiquetteDpe.G;
  }

  /**
   * Calcule le coefficient Ubat
   */
  calculateUbat(deperditions: DeperditionResult, surfaceHabitable: number): number {
    return deperditions.gv / surfaceHabitable;
  }

  /**
   * Évalue la qualité de l'isolation
   */
  evaluateIsolationQuality(dpe: DPEDocument): SortieQualiteIsolation {
    const enveloppe = dpe.logement.enveloppe;

    // Calcul des U moyens
    const murs = this.getArray(enveloppe.mur_collection.mur);
    const surfaceMurs = murs.reduce((sum, m) => sum + m.donnee_entree.surface_paroi_opaque, 0);
    const umurMoyen = surfaceMurs > 0
      ? murs.reduce((sum, m) => sum + m.donnee_intermediaire.umur * m.donnee_entree.surface_paroi_opaque, 0) / surfaceMurs
      : 0;

    let upbMoyen = 0;
    if (enveloppe.plancher_bas_collection) {
      const pb = this.getArray(enveloppe.plancher_bas_collection.plancher_bas);
      const surfacePb = pb.reduce((sum, p) => sum + p.donnee_entree.surface_paroi_opaque, 0);
      upbMoyen = surfacePb > 0
        ? pb.reduce((sum, p) => sum + p.donnee_intermediaire.upb_final * p.donnee_entree.surface_paroi_opaque, 0) / surfacePb
        : 0;
    }

    let uphMoyen = 0;
    if (enveloppe.plancher_haut_collection) {
      const ph = this.getArray(enveloppe.plancher_haut_collection.plancher_haut);
      const surfacePh = ph.reduce((sum, p) => sum + p.donnee_entree.surface_paroi_opaque, 0);
      uphMoyen = surfacePh > 0
        ? ph.reduce((sum, p) => sum + p.donnee_intermediaire.uph * p.donnee_entree.surface_paroi_opaque, 0) / surfacePh
        : 0;
    }

    // Ubat estimé
    const ubat = (umurMoyen + upbMoyen + uphMoyen) / 3;

    // Qualité d'isolation (0-5)
    let qualiteIsolEnveloppe = 3;
    if (ubat < 0.4) qualiteIsolEnveloppe = 5;
    else if (ubat < 0.6) qualiteIsolEnveloppe = 4;
    else if (ubat < 0.9) qualiteIsolEnveloppe = 3;
    else if (ubat < 1.2) qualiteIsolEnveloppe = 2;
    else qualiteIsolEnveloppe = 1;

    return {
      ubat,
      qualite_isol_enveloppe: qualiteIsolEnveloppe,
      qualite_isol_mur: umurMoyen < 0.5 ? 4 : umurMoyen < 0.8 ? 3 : 2,
      qualite_isol_plancher_haut_toit_terrasse: uphMoyen < 0.4 ? 4 : uphMoyen < 0.6 ? 3 : 2,
      qualite_isol_plancher_bas: upbMoyen < 0.4 ? 4 : upbMoyen < 0.6 ? 3 : 2,
      qualite_isol_menuiserie: 3, // Simplifié
    };
  }
}

// Export singleton factory
let calculationServiceInstance: CalculationService | null = null;

export function createCalculationService(): CalculationService {
  if (!calculationServiceInstance) {
    calculationServiceInstance = new CalculationService();
  }
  return calculationServiceInstance;
}

export function getCalculationService(): CalculationService | null {
  return calculationServiceInstance;
}

export function resetCalculationService(): void {
  calculationServiceInstance = null;
}
