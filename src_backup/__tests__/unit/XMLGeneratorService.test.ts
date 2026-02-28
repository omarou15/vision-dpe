import '../mocks/supabase.mock'
import { vi, describe, it, expect, beforeEach } from "vitest";
import { XMLGeneratorService } from '../../services/XMLGeneratorService';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';

describe('XMLGeneratorService', () => {
  let xmlService: XMLGeneratorService;

  beforeEach(() => {
    xmlService = new XMLGeneratorService();
  });

  describe('generateXML', () => {
    it('devrait générer un résultat', () => {
      const result = xmlService.generate(mockDPEDocument);
      
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('devrait avoir un fileName', () => {
      const result = xmlService.generate(mockDPEDocument);
      
      expect(result.fileName).toBeDefined();
    });
  });
});