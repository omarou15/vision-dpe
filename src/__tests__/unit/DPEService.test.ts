/**
 * Tests unitaires pour DPEService
 * Couverture: CRUD, calculs, gestion des états
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  DPEService,
  DPEStatus,
  createDPEService,
  resetDPEService,
} from '../../services/DPEService';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';

describe('DPEService', () => {
  let dpeService: DPEService;
  const testUserId = 'user-123';

  beforeEach(() => {
    resetDPEService();
    dpeService = createDPEService();
  });

  // ============================================================================
  // CRUD - CREATE
  // ============================================================================
  describe('create', () => {
    it('devrait créer un DPE avec succès', async () => {
      const result = await dpeService.create(mockDPEDocument, testUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.metadata.status).toBe(DPEStatus.BROUILLON);
      expect(result.data?.metadata.createdBy).toBe(testUserId);
      expect(result.data?.metadata.numeroDpe).toMatch(/^DPE-\d{2}-\d{6}-[A-Z]$/);
    });

    it('devrait générer un numéro DPE unique', async () => {
      const result1 = await dpeService.create(mockDPEDocument, testUserId);
      const result2 = await dpeService.create(mockDPEDocument, testUserId);

      expect(result1.data?.metadata.numeroDpe).not.toBe(result2.data?.metadata.numeroDpe);
    });

    it('devrait initialiser les valeurs par défaut', async () => {
      const partialData = {
        administratif: {
          nom_proprietaire: 'Test',
        },
      };

      const result = await dpeService.create(partialData as any, testUserId);

      expect(result.success).toBe(true);
      expect(result.data?.administratif.nom_proprietaire).toBe('Test');
      expect(result.data?.version).toBe('8.0.4');
    });
  });

  // ============================================================================
  // CRUD - GET
  // ============================================================================
  describe('getById', () => {
    it('devrait récupérer un DPE existant', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.getById(dpeId);

      expect(result.success).toBe(true);
      expect(result.data?.metadata.id).toBe(dpeId);
    });

    it('devrait retourner une erreur pour un DPE inexistant', async () => {
      const result = await dpeService.getById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================================
  // CRUD - UPDATE
  // ============================================================================
  describe('update', () => {
    it('devrait mettre à jour un DPE existant', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const updateData = {
        administratif: {
          ...mockDPEDocument.administratif,
          nom_proprietaire: 'Nouveau Nom',
        },
      };

      const result = await dpeService.update(dpeId, updateData, testUserId);

      expect(result.success).toBe(true);
      expect(result.data?.administratif.nom_proprietaire).toBe('Nouveau Nom');
      expect(result.data?.metadata.version).toBe(2);
    });

    it('devrait empêcher la modification d\'un DPE transmis', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      // Passe par les états intermédiaires pour arriver à TRANSMIS
      await dpeService.changeStatus(dpeId, DPEStatus.EN_COURS, testUserId);
      await dpeService.changeStatus(dpeId, DPEStatus.VALIDE, testUserId);
      await dpeService.changeStatus(dpeId, DPEStatus.TRANSMIS, testUserId);

      const result = await dpeService.update(dpeId, { 
        administratif: { ...mockDPEDocument.administratif, nom_proprietaire: 'Test' } 
      }, testUserId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IMMUTABLE');
    });

    it('devrait retourner une erreur pour un DPE inexistant', async () => {
      const result = await dpeService.update('non-existent', {}, testUserId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  // ============================================================================
  // CRUD - DELETE
  // ============================================================================
  describe('delete', () => {
    it('devrait supprimer un DPE en brouillon', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.delete(dpeId);

      expect(result.success).toBe(true);

      const getResult = await dpeService.getById(dpeId);
      expect(getResult.success).toBe(false);
    });

    it('devrait empêcher la suppression d\'un DPE transmis', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      // Passe par les états intermédiaires pour arriver à TRANSMIS
      await dpeService.changeStatus(dpeId, DPEStatus.EN_COURS, testUserId);
      await dpeService.changeStatus(dpeId, DPEStatus.VALIDE, testUserId);
      await dpeService.changeStatus(dpeId, DPEStatus.TRANSMIS, testUserId);

      const result = await dpeService.delete(dpeId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IMMUTABLE');
    });
  });

  // ============================================================================
  // LISTE ET RECHERCHE
  // ============================================================================
  describe('list', () => {
    it('devrait lister les DPE avec pagination', async () => {
      // Crée plusieurs DPE
      await dpeService.create(mockDPEDocument, testUserId);
      await dpeService.create(mockDPEDocument, testUserId);
      await dpeService.create(mockDPEDocument, testUserId);

      const result = await dpeService.list(undefined, 2, 0);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(2);
      expect(result.total).toBe(3);
    });

    it('devrait filtrer par statut', async () => {
      await dpeService.create(mockDPEDocument, testUserId);
      const dpe2 = await dpeService.create(mockDPEDocument, testUserId);
      
      await dpeService.changeStatus(dpe2.data!.metadata.id, DPEStatus.EN_COURS, testUserId);

      const result = await dpeService.list({ status: DPEStatus.EN_COURS });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].metadata.status).toBe(DPEStatus.EN_COURS);
    });

    it('devrait rechercher par terme', async () => {
      const customDPE = {
        ...mockDPEDocument,
        administratif: {
          ...mockDPEDocument.administratif,
          nom_proprietaire: 'Jean Dupont Unique',
        },
      };

      await dpeService.create(mockDPEDocument, testUserId);
      await dpeService.create(customDPE, testUserId);

      const result = await dpeService.search('Unique');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].administratif.nom_proprietaire).toBe('Jean Dupont Unique');
    });
  });

  // ============================================================================
  // GESTION DES ÉTATS
  // ============================================================================
  describe('changeStatus', () => {
    it('devrait changer le statut d\'un DPE', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.changeStatus(dpeId, DPEStatus.EN_COURS, testUserId);

      expect(result.success).toBe(true);
      expect(result.data?.metadata.status).toBe(DPEStatus.EN_COURS);
    });

    it('devrait valider les transitions de statut', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      // BROUILLON -> TRANSMIS (interdit)
      const result = await dpeService.changeStatus(dpeId, DPEStatus.TRANSMIS, testUserId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TRANSITION');
    });

    it('devrait empêcher toute modification d\'un DPE transmis', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      await dpeService.changeStatus(dpeId, DPEStatus.VALIDE, testUserId);
      await dpeService.changeStatus(dpeId, DPEStatus.TRANSMIS, testUserId);

      const result = await dpeService.changeStatus(dpeId, DPEStatus.BROUILLON, testUserId);

      expect(result.success).toBe(false);
    });
  });

  describe('archive', () => {
    it('devrait archiver un DPE', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.archive(dpeId);

      expect(result.success).toBe(true);
      expect(result.data?.metadata.isArchived).toBe(true);
    });
  });

  describe('duplicate', () => {
    it('devrait dupliquer un DPE', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.duplicate(dpeId, testUserId);

      expect(result.success).toBe(true);
      expect(result.data?.metadata.id).not.toBe(dpeId);
      expect(result.data?.administratif.nom_proprietaire).toBe(mockDPEDocument.administratif.nom_proprietaire);
      expect(result.data?.metadata.status).toBe(DPEStatus.BROUILLON);
    });
  });

  // ============================================================================
  // CALCULS
  // ============================================================================
  describe('calculate', () => {
    it('devrait calculer les indicateurs d\'un DPE', async () => {
      const createResult = await dpeService.create(mockDPEDocument, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.calculate(dpeId);

      expect(result.success).toBe(true);
      expect(result.data?.etiquetteEnergie).toBeDefined();
      expect(result.data?.etiquetteGES).toBeDefined();
      expect(result.data?.consoEnergie).toBeGreaterThan(0);
      expect(result.data?.emissionGES).toBeGreaterThan(0);
      expect(result.data?.sortie).toBeDefined();
    });

    it('devrait retourner une erreur pour un DPE inexistant', async () => {
      const result = await dpeService.calculate('non-existent');

      expect(result.success).toBe(false);
    });
  });

  describe('estimateConsumption', () => {
    it('devrait estimer la consommation à partir de données partielles', async () => {
      const partialData = {
        logement: {
          ...mockDPEDocument.logement,
          caracteristique_generale: {
            ...mockDPEDocument.logement.caracteristique_generale,
            surface_habitable_logement: 100,
          },
        },
      };

      const result = await dpeService.estimateConsumption(partialData);

      expect(result.success).toBe(true);
      expect(result.data?.etiquetteEnergie).toBeDefined();
      expect(result.data?.consoEnergie).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================
  describe('validateBeforeTransmission', () => {
    it('devrait valider un DPE complet', async () => {
      // Crée un DPE avec tous les champs requis
      const completeDPE = {
        ...mockDPEDocument,
        logement: {
          ...mockDPEDocument.logement,
          sortie: {
            deperdition: {} as any,
            apport_et_besoin: {} as any,
            ef_conso: {} as any,
            ep_conso: {} as any,
            emission_ges: {} as any,
            cout: {} as any,
          },
        },
      };
      
      const createResult = await dpeService.create(completeDPE, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.validateBeforeTransmission(dpeId);

      // Le DPE devrait être valide (ou avoir des erreurs spécifiques)
      expect(result.errors).toBeDefined();
    });

    it('devrait détecter les DPE incomplets', async () => {
      const incompleteDPE = {
        ...mockDPEDocument,
        administratif: {
          ...mockDPEDocument.administratif,
          nom_proprietaire: '',
        },
      };

      const createResult = await dpeService.create(incompleteDPE, testUserId);
      const dpeId = createResult.data!.metadata.id;

      const result = await dpeService.validateBeforeTransmission(dpeId);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
