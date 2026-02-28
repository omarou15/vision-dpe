import '../mocks/supabase.mock'
import { describe, it, expect } from 'vitest';
import type { DPEDocument } from '../../types/dpe';

describe('DPETypes', () => {
  describe('validation des types', () => {
    it('devrait valider la structure DPEDocument', () => {
      const dpe: Partial<DPEDocument> = {
        administratif: {
          numero_dpe: 'DPE-2024-001',
          date_visite: new Date().toISOString(),
        },
      };
      
      expect(dpe.administratif?.numero_dpe).toBe('DPE-2024-001');
    });
  });
});