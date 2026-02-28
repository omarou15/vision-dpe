import '../mocks/supabase.mock'
import { describe, it, expect, beforeEach } from 'vitest';
import { XMLGeneratorService } from '../../services/XMLGeneratorService';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';

describe('XMLGeneratorService', () => {
  let service: XMLGeneratorService;

  beforeEach(() => {
    service = new XMLGeneratorService();
  });

  describe('generate', () => {
    it('devrait générer un résultat', () => {
      const result = service.generate(mockDPEDocument);
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('devrait générer avec config par défaut', () => {
      const result = service.generate(mockDPEDocument);
      expect(result).toBeDefined();
    });

    it('devrait générer avec config personnalisée', () => {
      const result = service.generate(mockDPEDocument, { format: 'standard' });
      expect(result).toBeDefined();
    });
  });

  describe('generateAsync', () => {
    it('devrait générer async', async () => {
      const result = await service.generateAsync(mockDPEDocument);
      expect(result).toBeDefined();
    });
  });

  describe('validate', () => {
    it('devrait valider un XML', () => {
      const result = service.validate('<?xml version="1.0"?><dpe></dpe>');
      expect(result).toBeDefined();
    });
  });

  describe('parse', () => {
    it('devrait parser un XML', () => {
      const result = service.parse('<?xml version="1.0"?><dpe></dpe>');
      expect(result).toBeDefined();
    });
  });

  describe('exportToFile', () => {
    it('devrait exporter vers fichier', async () => {
      const result = await service.exportToFile('xml', 'test.xml', '/tmp');
      expect(result).toBeDefined();
    });
  });

  describe('getDefaultConfig', () => {
    it('devrait retourner la config par défaut', () => {
      const config = service.getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.version).toBe('2.6');
    });
  });

  describe('isVersionSupported', () => {
    it('devrait supporter la version 2.6', () => {
      expect(service.isVersionSupported('2.6')).toBe(true);
    });

    it('devrait rejeter une version invalide', () => {
      expect(service.isVersionSupported('1.0')).toBe(false);
    });
  });
});