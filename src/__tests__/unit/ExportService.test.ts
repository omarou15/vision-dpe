import '../mocks/supabase.mock'
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  ExportService,
  ExportFormat,
  ExportStatus,
  createExportService,
  resetExportService,
} from '../../services/ExportService';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    resetExportService();
    exportService = createExportService();
  });

  describe('export', () => {
    it('devrait exister', () => {
      expect(exportService).toBeDefined();
    });

    it('devrait avoir les formats d\'export', () => {
      expect(ExportFormat.XML).toBe('xml');
      expect(ExportFormat.PDF).toBe('pdf');
      expect(ExportFormat.JSON).toBe('json');
    });

    it('devrait avoir les statuts d\'export', () => {
      expect(ExportStatus.PENDING).toBe('pending');
      expect(ExportStatus.SUCCESS).toBe('success');
      expect(ExportStatus.ERROR).toBe('error');
    });
  });

  describe('Singleton pattern', () => {
    it('devrait retourner la même instance avec createExportService', () => {
      const service1 = createExportService();
      const service2 = createExportService();
      
      expect(service1).toBe(service2);
    });

    it('devrait créer une nouvelle instance après resetExportService', () => {
      const service1 = createExportService();
      resetExportService();
      const service2 = createExportService();
      
      expect(service1).not.toBe(service2);
    });
  });
});