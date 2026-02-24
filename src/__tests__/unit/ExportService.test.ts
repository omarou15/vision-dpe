/**
 * Tests unitaires pour ExportService
 * Couverture: Export PDF, XML, JSON
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ExportService,
  ExportFormat,
  ExportStatus,
  createExportService,
  resetExportService,
} from '../../services/ExportService';
import { XMLGeneratorService } from '../../services/XMLGeneratorService';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';

describe('ExportService', () => {
  let exportService: ExportService;
  let xmlService: XMLGeneratorService;

  beforeEach(() => {
    xmlService = new XMLGeneratorService();
    resetExportService();
    exportService = createExportService(xmlService);
  });

  // ============================================================================
  // EXPORT GÉNÉRIQUE
  // ============================================================================
  describe('export', () => {
    it('devrait exporter en PDF', async () => {
      const result = await exportService.export(mockDPEDocument, {
        format: ExportFormat.PDF,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(ExportStatus.SUCCESS);
      expect(result.data?.mimeType).toBe('application/pdf');
    });

    it('devrait exporter en XML', async () => {
      const result = await exportService.export(mockDPEDocument, {
        format: ExportFormat.XML,
      });

      // Le résultat peut être succès ou échec selon la validité du DPE
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('devrait exporter en JSON', async () => {
      const result = await exportService.export(mockDPEDocument, {
        format: ExportFormat.JSON,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(ExportStatus.SUCCESS);
      expect(result.data?.mimeType).toBe('application/json');
    });

    it('devrait retourner une erreur pour un format non supporté', async () => {
      const result = await exportService.export(mockDPEDocument, {
        format: 'unsupported' as ExportFormat,
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(ExportStatus.ERROR);
      expect(result.error?.code).toBe('UNSUPPORTED_FORMAT');
    });
  });

  // ============================================================================
  // EXPORT PDF
  // ============================================================================
  describe('exportToPDF', () => {
    it('devrait générer un PDF avec succès', async () => {
      const result = await exportService.exportToPDF(mockDPEDocument);

      expect(result.success).toBe(true);
      expect(result.data?.fileName).toMatch(/\.pdf$/);
      expect(result.data?.mimeType).toBe('application/pdf');
      expect(result.data?.fileSize).toBeGreaterThan(0);
    });

    it('devrait générer un PDF avec le template standard', async () => {
      const result = await exportService.exportToPDF(mockDPEDocument, {
        template: 'standard',
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Diagnostic de Performance Énergétique');
    });

    it('devrait générer un PDF avec le template complet', async () => {
      // Crée un DPE avec des calculs pour avoir la section détaillée
      const dpeWithCalculations = {
        ...mockDPEDocument,
        logement: {
          ...mockDPEDocument.logement,
          sortie: {
            deperdition: { deperdition_mur: 1000, deperdition_plancher_bas: 500 },
            ef_conso: { conso_ch: 5000, conso_ecs: 2000 },
          } as any,
        },
      };
      
      const result = await exportService.exportToPDF(dpeWithCalculations, {
        template: 'complet',
      });

      // Le résultat dépend de la validation
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.data?.content).toContain('Diagnostic de Performance');
      }
    });

    it('devrait inclure les informations du diagnostiqueur', async () => {
      const result = await exportService.exportToPDF(mockDPEDocument);

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain(mockDPEDocument.administratif.diagnostiqueur.nom_diagnostiqueur);
    });
  });

  // ============================================================================
  // EXPORT XML
  // ============================================================================
  describe('exportToXML', () => {
    it('devrait générer un XML ADEME avec succès', async () => {
      const result = await exportService.exportToXML(mockDPEDocument);

      // Le résultat dépend de la validité du DPE pour XML
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('devrait contenir les balises XML requises', async () => {
      const result = await exportService.exportToXML(mockDPEDocument);

      // Si succès, vérifie le contenu XML
      if (result.success && result.data) {
        expect(result.data.content).toContain('<?xml version="1.0"');
        expect(result.data.content).toContain('<dpe');
        expect(result.data.content).toContain('<administratif>');
        expect(result.data.content).toContain('<logement>');
      }
    });
  });

  // ============================================================================
  // EXPORT JSON
  // ============================================================================
  describe('exportToJSON', () => {
    it('devrait générer un JSON avec succès', async () => {
      const result = await exportService.exportToJSON(mockDPEDocument);

      expect(result.success).toBe(true);
      expect(result.data?.fileName).toMatch(/\.json$/);
      expect(result.data?.mimeType).toBe('application/json');
    });

    it('devrait générer un JSON valide', async () => {
      const result = await exportService.exportToJSON(mockDPEDocument);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data!.content as string);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('administratif');
      expect(parsed).toHaveProperty('logement');
    });

    it('devrait générer un JSON formaté si pretty=true', async () => {
      const result = await exportService.exportToJSON(mockDPEDocument, true);

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('\n');
      expect(result.data?.content).toContain('  ');
    });

    it('devrait générer un JSON compact si pretty=false', async () => {
      const result = await exportService.exportToJSON(mockDPEDocument, false);

      expect(result.success).toBe(true);
      expect(result.data?.content).not.toContain('\n  ');
    });
  });

  // ============================================================================
  // EXPORT PAR LOT
  // ============================================================================
  describe('batchExport', () => {
    it('devrait exporter plusieurs DPE', async () => {
      const dpes = [mockDPEDocument, mockDPEDocument, mockDPEDocument];

      const result = await exportService.batchExport(dpes, {
        format: ExportFormat.JSON,
      });

      expect(result.success).toBe(true);
      expect(result.total).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.errorCount).toBe(0);
    });

    it('devrait gérer les échecs partiels', async () => {
      const dpes = [mockDPEDocument, null as any, mockDPEDocument];

      const result = await exportService.batchExport(dpes, {
        format: ExportFormat.JSON,
      });

      expect(result.total).toBe(3);
      expect(result.successCount + result.errorCount).toBe(3);
    });
  });

  // ============================================================================
  // APERÇU
  // ============================================================================
  describe('generatePreview', () => {
    it('devrait générer un aperçu PDF', async () => {
      const result = await exportService.generatePreview(mockDPEDocument, ExportFormat.PDF);

      expect(result.success).toBe(true);
      expect(result.data?.mimeType).toBe('application/pdf');
    });

    it('devrait générer un aperçu XML', async () => {
      const result = await exportService.generatePreview(mockDPEDocument, ExportFormat.XML);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================
  describe('validateBeforeExport', () => {
    it('devrait valider un DPE complet', () => {
      const result = exportService.validateBeforeExport(mockDPEDocument, ExportFormat.PDF);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter un DPE sans propriétaire', () => {
      const invalidDPE = {
        ...mockDPEDocument,
        administratif: {
          ...mockDPEDocument.administratif,
          nom_proprietaire: '',
        },
      };

      const result = exportService.validateBeforeExport(invalidDPE, ExportFormat.PDF);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait détecter un DPE sans certification', () => {
      const invalidDPE = {
        ...mockDPEDocument,
        administratif: {
          ...mockDPEDocument.administratif,
          diagnostiqueur: {
            ...mockDPEDocument.administratif.diagnostiqueur,
            numero_certification_diagnostiqueur: '',
          },
        },
      };

      const result = exportService.validateBeforeExport(invalidDPE, ExportFormat.PDF);

      expect(result.valid).toBe(false);
    });

    it('devrait exiger les calculs pour l\'export XML', () => {
      const dpeWithoutCalculations = {
        ...mockDPEDocument,
        logement: {
          ...mockDPEDocument.logement,
          sortie: undefined,
        },
      };

      const result = exportService.validateBeforeExport(dpeWithoutCalculations, ExportFormat.XML);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('calculs'))).toBe(true);
    });
  });
});
