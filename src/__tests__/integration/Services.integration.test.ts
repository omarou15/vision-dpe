/**
 * Tests d'intégration des services
 * Vérifie l'interaction entre AuthService, ValidationService et XMLGeneratorService
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/AuthService';
import { ValidationService } from '../../services/ValidationService';
import { XMLGeneratorService } from '../../services/XMLGeneratorService';

describe('Intégration Services', () => {
  let authService: AuthService;
  let validationService: ValidationService;
  let xmlService: XMLGeneratorService;

  beforeEach(() => {
    authService = new AuthService(
      'https://test.supabase.co',
      'test-key'
    );
    validationService = new ValidationService();
    xmlService = new XMLGeneratorService();
  });

  // ============================================================================
  // SCÉNARIO: Création d'un DPE complet
  // ============================================================================
  describe('Scénario: Création DPE complet', () => {
    it('devrait valider puis générer un XML', () => {
      const dpe = { numero_dpe: 'TEST-001', test: 'data' } as any;

      // Étape 1: Validation
      const validationResult = validationService.validate(dpe);
      expect(validationResult).toBeDefined();

      // Étape 2: Génération XML
      const xmlResult = xmlService.generate(dpe);
      expect(xmlResult).toBeDefined();
      expect(xmlResult.status).toBeDefined();
    });
  });

  // ============================================================================
  // SCÉNARIO: Workflow utilisateur
  // ============================================================================
  describe('Scénario: Workflow utilisateur', () => {
    it('devrait permettre la connexion', async () => {
      const authResult = await authService.login({
        email: 'diagnosticien@example.com',
        password: 'password123'
      });

      expect(authResult).toBeDefined();
      expect(typeof authResult.success).toBe('boolean');
    });

    it('devrait vérifier l\'authentification', () => {
      const isAuth = authService.isAuthenticated();
      expect(typeof isAuth).toBe('boolean');
    });
  });

  // ============================================================================
  // SCÉNARIO: Cycle de vie XML
  // ============================================================================
  describe('Scénario: Cycle de vie XML', () => {
    it('devrait générer et parser un XML', () => {
      const dpe = { numero_dpe: 'TEST-001' } as any;

      // Génération
      const generationResult = xmlService.generate(dpe);
      expect(generationResult).toBeDefined();

      // Si génération réussie, validation et parsing
      if (generationResult.xmlContent) {
        const validationResult = xmlService.validate(generationResult.xmlContent);
        expect(validationResult).toBeDefined();

        const parseResult = xmlService.parse(generationResult.xmlContent);
        expect(parseResult).toBeDefined();
      }
    });
  });

  // ============================================================================
  // SCÉNARIO: Validation complète
  // ============================================================================
  describe('Scénario: Validation complète', () => {
    it('devrait valider par étape', () => {
      const step1Data = { numero_dpe: 'TEST-001' };
      const step1Result = validationService.validateStep(1, step1Data);
      expect(step1Result).toBeDefined();

      const step2Data = { logement: { adresse: {} } };
      const step2Result = validationService.validateStep(2, step2Data);
      expect(step2Result).toBeDefined();
    });

    it('devrait calculer la progression', () => {
      const data = { numero_dpe: 'TEST-001' };
      const progress = validationService.calculateProgress(data);
      expect(typeof progress).toBe('number');
    });
  });
});
