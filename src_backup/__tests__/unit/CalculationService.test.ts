import '../mocks/supabase.mock'
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CalculationService } from '../../services/CalculationService';

describe('CalculationService', () => {
  let calcService: CalculationService;

  beforeEach(() => {
    calcService = new CalculationService();
  });

  describe('calculs thermiques', () => {
    it('devrait exister', () => {
      expect(calcService).toBeDefined();
    });
  });
});