import '../mocks/supabase.mock'
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DPEService } from '../../services/DPEService';
import { createMockSupabaseClient } from '../mocks/supabase.mock';

describe('DPEService', () => {
  let dpeService: DPEService;

  beforeEach(() => {
    const mockSupabase = createMockSupabaseClient();
    dpeService = new DPEService(mockSupabase as any);
  });

  describe('CRUD', () => {
    it('devrait exister', () => {
      expect(dpeService).toBeDefined();
    });
  });
});