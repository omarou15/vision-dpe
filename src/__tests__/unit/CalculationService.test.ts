/**
 * Tests unitaires pour CalculationService
 * Couverture: Calculs 3CL, déperditions, besoins, consommations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  CalculationService,
  createCalculationService,
  resetCalculationService,
} from '../../services/CalculationService';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';
import { EnumEtiquetteDpe } from '../../types/dpe';

describe('CalculationService', () => {
  let calculationService: CalculationService;

  beforeEach(() => {
    resetCalculationService();
    calculationService = createCalculationService();
  });

  // ============================================================================
  // CALCUL COMPLET
  // ============================================================================
  describe('calculate', () => {
    it('devrait calculer un DPE complet avec succès', () => {
      const result = calculationService.calculate(mockDPEDocument);

      expect(result.success).toBe(true);
      expect(result.sortie).toBeDefined();
      expect(result.etiquetteEnergie).toBeDefined();
      expect(result.etiquetteGES).toBeDefined();
    });

    it('devrait retourner une structure de sortie complète', () => {
      const result = calculationService.calculate(mockDPEDocument);

      expect(result.sortie).toHaveProperty('deperdition');
      expect(result.sortie).toHaveProperty('apport_et_besoin');
      expect(result.sortie).toHaveProperty('ef_conso');
      expect(result.sortie).toHaveProperty('ep_conso');
      expect(result.sortie).toHaveProperty('emission_ges');
      expect(result.sortie).toHaveProperty('cout');
      expect(result.sortie).toHaveProperty('qualite_isolation');
    });

    it('devrait calculer des valeurs positives', () => {
      const result = calculationService.calculate(mockDPEDocument);

      expect(result.sortie!.ef_conso.conso_5_usages).toBeGreaterThan(0);
      expect(result.sortie!.ep_conso.ep_conso_5_usages).toBeGreaterThan(0);
      expect(result.sortie!.emission_ges.emission_ges_5_usages).toBeGreaterThan(0);
      expect(result.sortie!.cout.cout_5_usages).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DÉPERDITIONS
  // ============================================================================
  describe('calculateDeperditions', () => {
    it('devrait calculer les déperditions thermiques', () => {
      const context = {
        surfaceHabitable: 100,
        zoneClimatique: "H2" as const,
        altitude: 100,
        anneeConstruction: 1980,
        nadeq: 2.5,
        dh: 2400,
      };

      const result = calculationService.calculateDeperditions(mockDPEDocument, context);

      expect(result.hvent).toBeGreaterThan(0);
      expect(result.hperm).toBeGreaterThan(0);
      expect(result.gv).toBeGreaterThan(0);
      expect(result.deperditions.murs).toBeGreaterThanOrEqual(0);
    });

    it('devrait calculer les déperditions par type de paroi', () => {
      const context = {
        surfaceHabitable: 100,
        zoneClimatique: "H2" as const,
        altitude: 100,
        anneeConstruction: 1980,
        nadeq: 2.5,
        dh: 2400,
      };

      const result = calculationService.calculateDeperditions(mockDPEDocument, context);

      expect(result.deperditions).toHaveProperty('murs');
      expect(result.deperditions).toHaveProperty('plancherBas');
      expect(result.deperditions).toHaveProperty('plancherHaut');
      expect(result.deperditions).toHaveProperty('baiesVitrees');
      expect(result.deperditions).toHaveProperty('renouvellementAir');
    });
  });

  // ============================================================================
  // BESOINS
  // ============================================================================
  describe('calculateBesoins', () => {
    it('devrait calculer les besoins en chauffage et ECS', () => {
      const deperditions = {
        hvent: 0.5,
        hperm: 0.8,
        deperditions: {
          murs: 1000,
          plancherBas: 500,
          plancherHaut: 600,
          baiesVitrees: 800,
          portes: 100,
          pontsThermiques: 200,
          renouvellementAir: 1200,
        },
        gv: 4400,
      };

      const context = {
        surfaceHabitable: 100,
        zoneClimatique: "H2" as const,
        altitude: 100,
        anneeConstruction: 1980,
        nadeq: 2.5,
        dh: 2400,
      };

      const result = calculationService.calculateBesoins(deperditions, context);

      expect(result.besoinChauffage).toBeGreaterThanOrEqual(0);
      expect(result.besoinECS).toBeGreaterThan(0);
      expect(result.besoinChauffageDepensier).toBeGreaterThanOrEqual(result.besoinChauffage);
      expect(result.besoinECSDepensier).toBeGreaterThanOrEqual(result.besoinECS);
    });
  });

  // ============================================================================
  // CONSOMMATIONS
  // ============================================================================
  describe('calculateConsommations', () => {
    it('devrait calculer les consommations énergétiques', () => {
      const besoins = {
        besoinChauffage: 5000,
        besoinChauffageDepensier: 5750,
        besoinECS: 2000,
        besoinECSDepensier: 2200,
        besoinRefroidissement: 0,
        besoinRefroidissementDepensier: 0,
      };

      const context = {
        surfaceHabitable: 100,
        zoneClimatique: "H2" as const,
        altitude: 100,
        anneeConstruction: 1980,
        nadeq: 2.5,
        dh: 2400,
      };

      const result = calculationService.calculateConsommations(besoins, mockDPEDocument, context);

      expect(result.ef.conso_ch).toBeGreaterThan(0);
      expect(result.ef.conso_ecs).toBeGreaterThan(0);
      expect(result.ef.conso_5_usages).toBeGreaterThan(0);
      expect(result.ef.conso_5_usages_m2).toBeGreaterThan(0);
      expect(result.ep.ep_conso_5_usages).toBeGreaterThan(0);
    });

    it('devrait calculer la consommation par usage', () => {
      const besoins = {
        besoinChauffage: 5000,
        besoinChauffageDepensier: 5750,
        besoinECS: 2000,
        besoinECSDepensier: 2200,
        besoinRefroidissement: 0,
        besoinRefroidissementDepensier: 0,
      };

      const context = {
        surfaceHabitable: 100,
        zoneClimatique: "H2" as const,
        altitude: 100,
        anneeConstruction: 1980,
        nadeq: 2.5,
        dh: 2400,
      };

      const result = calculationService.calculateConsommations(besoins, mockDPEDocument, context);

      expect(result.ef.conso_eclairage).toBeGreaterThan(0);
      expect(result.ef.conso_totale_auxiliaire).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // ÉMISSIONS GES
  // ============================================================================
  describe('calculateEmissions', () => {
    it('devrait calculer les émissions de GES', () => {
      const consommations = {
        conso_ch: 5000,
        conso_ch_depensier: 5750,
        conso_ecs: 2000,
        conso_ecs_depensier: 2200,
        conso_eclairage: 550,
        conso_auxiliaire_generation_ch: 1.2,
        conso_auxiliaire_generation_ch_depensier: 1.32,
        conso_auxiliaire_distribution_ch: 0.8,
        conso_auxiliaire_generation_ecs: 0.9,
        conso_auxiliaire_generation_ecs_depensier: 0.99,
        conso_auxiliaire_distribution_ecs: 0.3,
        conso_auxiliaire_ventilation: 2,
        conso_totale_auxiliaire: 5.2,
        conso_fr: 0,
        conso_fr_depensier: 0,
        conso_5_usages: 7555.2,
        conso_5_usages_m2: 75.55,
      };

      const result = calculationService.calculateEmissions(consommations as any, mockDPEDocument);

      expect(result.emission_ges_ch).toBeGreaterThan(0);
      expect(result.emission_ges_ecs).toBeGreaterThan(0);
      expect(result.emission_ges_5_usages).toBeGreaterThan(0);
      expect(result.emission_ges_5_usages_m2).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // COÛTS
  // ============================================================================
  describe('calculateCouts', () => {
    it('devrait calculer les coûts estimés', () => {
      const consommations = {
        conso_ch: 5000,
        conso_ch_depensier: 5750,
        conso_ecs: 2000,
        conso_ecs_depensier: 2200,
        conso_eclairage: 550,
        conso_auxiliaire_generation_ch: 1.2,
        conso_auxiliaire_generation_ch_depensier: 1.32,
        conso_auxiliaire_distribution_ch: 0.8,
        conso_auxiliaire_generation_ecs: 0.9,
        conso_auxiliaire_generation_ecs_depensier: 0.99,
        conso_auxiliaire_distribution_ecs: 0.3,
        conso_auxiliaire_ventilation: 2,
        conso_totale_auxiliaire: 5.2,
        conso_fr: 0,
        conso_fr_depensier: 0,
        conso_5_usages: 7555.2,
        conso_5_usages_m2: 75.55,
      };

      const result = calculationService.calculateCouts(consommations as any, mockDPEDocument);

      expect(result.cout_ch).toBeGreaterThan(0);
      expect(result.cout_ecs).toBeGreaterThan(0);
      expect(result.cout_5_usages).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // ÉTIQUETTES
  // ============================================================================
  describe('getEtiquetteEnergie', () => {
    it('devrait retourner l\'étiquette A pour une consommation faible', () => {
      expect(calculationService.getEtiquetteEnergie(50)).toBe(EnumEtiquetteDpe.A);
      expect(calculationService.getEtiquetteEnergie(70)).toBe(EnumEtiquetteDpe.A);
    });

    it('devrait retourner l\'étiquette B pour une consommation modérée', () => {
      expect(calculationService.getEtiquetteEnergie(71)).toBe(EnumEtiquetteDpe.B);
      expect(calculationService.getEtiquetteEnergie(110)).toBe(EnumEtiquetteDpe.B);
    });

    it('devrait retourner l\'étiquette G pour une consommation élevée', () => {
      expect(calculationService.getEtiquetteEnergie(500)).toBe(EnumEtiquetteDpe.G);
      expect(calculationService.getEtiquetteEnergie(1000)).toBe(EnumEtiquetteDpe.G);
    });
  });

  describe('getEtiquetteGES', () => {
    it('devrait retourner l\'étiquette A pour des émissions faibles', () => {
      expect(calculationService.getEtiquetteGES(5)).toBe(EnumEtiquetteDpe.A);
      expect(calculationService.getEtiquetteGES(6)).toBe(EnumEtiquetteDpe.A);
    });

    it('devrait retourner l\'étiquette D pour des émissions moyennes', () => {
      expect(calculationService.getEtiquetteGES(30)).toBe(EnumEtiquetteDpe.C);
      expect(calculationService.getEtiquetteGES(50)).toBe(EnumEtiquetteDpe.D);
    });

    it('devrait retourner l\'étiquette G pour des émissions élevées', () => {
      expect(calculationService.getEtiquetteGES(150)).toBe(EnumEtiquetteDpe.G);
    });
  });

  // ============================================================================
  // QUALITÉ ISOLATION
  // ============================================================================
  describe('evaluateIsolationQuality', () => {
    it('devrait évaluer la qualité de l\'isolation', () => {
      const result = calculationService.evaluateIsolationQuality(mockDPEDocument);

      expect(result.ubat).toBeGreaterThanOrEqual(0);
      expect(result.qualite_isol_enveloppe).toBeGreaterThanOrEqual(1);
      expect(result.qualite_isol_enveloppe).toBeLessThanOrEqual(5);
      expect(result.qualite_isol_mur).toBeGreaterThanOrEqual(1);
      expect(result.qualite_isol_mur).toBeLessThanOrEqual(5);
    });
  });

  // ============================================================================
  // COEFFICIENT UBAT
  // ============================================================================
  describe('calculateUbat', () => {
    it('devrait calculer le coefficient Ubat', () => {
      const deperditions = {
        hvent: 0.5,
        hperm: 0.8,
        deperditions: {
          murs: 1000,
          plancherBas: 500,
          plancherHaut: 600,
          baiesVitrees: 800,
          portes: 100,
          pontsThermiques: 200,
          renouvellementAir: 1200,
        },
        gv: 4400,
      };

      const result = calculationService.calculateUbat(deperditions, 100);

      expect(result).toBe(44);
    });
  });
});
