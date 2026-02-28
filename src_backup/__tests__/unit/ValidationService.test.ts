import '../mocks/supabase.mock'
import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../services/ValidationService';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validate', () => {
    it('devrait exister', () => {
      expect(service.validate).toBeDefined();
    });

    it('devrait retourner un résultat', () => {
      const result = service.validate({});
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('validateStep', () => {
    it('devrait exister', () => {
      expect(service.validateStep).toBeDefined();
    });

    it('devrait valider l\'étape 1', () => {
      const result = service.validateStep(1, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 2', () => {
      const result = service.validateStep(2, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 3', () => {
      const result = service.validateStep(3, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 4', () => {
      const result = service.validateStep(4, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 5', () => {
      const result = service.validateStep(5, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 6', () => {
      const result = service.validateStep(6, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 7', () => {
      const result = service.validateStep(7, {});
      expect(result).toBeDefined();
    });

    it('devrait valider l\'étape 8', () => {
      const result = service.validateStep(8, {});
      expect(result).toBeDefined();
    });
  });

  describe('validateField', () => {
    it('devrait exister', () => {
      expect(service.validateField).toBeDefined();
    });
  });
});