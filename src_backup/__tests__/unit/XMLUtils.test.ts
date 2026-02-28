import '../mocks/supabase.mock'
/**
 * Tests unitaires pour les utilitaires XML
 * Couverture: xml-parser et xml-generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { XMLGenerator, generateXML, generateXMLWithValidation } from '../../utils/xml-generator';
import { DPEXMLParser, parseDPEXML, parseDPEXMLStrict, parseDPEXMLWithDefaults } from '../../utils/xml-parser';
import { XMLValidator, validateXML } from '../../utils/xml-validator';
import { mockDPEDocument } from '../fixtures/dpe.fixtures';
import { DPEDocument } from '../../types/dpe';

describe('XML Utilities', () => {
  describe('XMLGenerator', () => {
    let generator: XMLGenerator;

    beforeEach(() => {
      generator = new XMLGenerator();
    });

    it('devrait générer un XML valide', () => {
      const xml = generator.generate(mockDPEDocument);
      
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<dpe');
      expect(xml).toContain('</administratif>');
      expect(xml).toContain('</logement>');
    });

    it('devrait contenir les informations administratives', () => {
      const xml = generator.generate(mockDPEDocument);
      
      expect(xml).toContain('Jean Dupont');
      expect(xml).toContain('2024-01-15');
      expect(xml).toContain('2.6');
    });

    it('devrait contenir les informations du logement', () => {
      const xml = generator.generate(mockDPEDocument);
      
      expect(xml).toContain('85.5');
      expect(xml).toContain('MUR-001');
    });

    it('devrait valider avant génération si demandé', () => {
      const invalidDPE = { ...mockDPEDocument, administratif: undefined as unknown };
      
      expect(() => {
        generator.generate(invalidDPE as DPEDocument);
      }).toThrow();
    });
  });

  describe('XMLParser', () => {
    let parser: DPEXMLParser;

    beforeEach(() => {
      parser = new DPEXMLParser();
    });

    it('devrait parser un XML valide', () => {
      const generator = new XMLGenerator();
      const xml = generator.generate(mockDPEDocument);
      
      const result = parser.parse(xml);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter un XML invalide', () => {
      const result = parser.parse('invalid xml');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait détecter un XML sans racine dpe', () => {
      const result = parser.parse('<?xml version="1.0"?><invalid></invalid>');
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_ROOT_ELEMENT')).toBe(true);
    });

    it('devrait parser avec valeurs par défaut', () => {
      const generator = new XMLGenerator();
      const xml = generator.generate(mockDPEDocument);
      
      const result = parseDPEXMLWithDefaults(xml);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('devrait parser en mode strict', () => {
      const generator = new XMLGenerator();
      const xml = generator.generate(mockDPEDocument);
      
      const result = parseDPEXMLStrict(xml);
      
      expect(result.success).toBe(true);
    });
  });

  describe('XMLValidator', () => {
    let validator: XMLValidator;

    beforeEach(() => {
      validator = new XMLValidator();
    });

    it('devrait valider un XML bien formé', () => {
      const generator = new XMLGenerator();
      const xml = generator.generate(mockDPEDocument);
      
      const result = validator.validate(xml);
      
      expect(result.valid).toBe(true);
    });

    it('devrait détecter un XML mal formé', () => {
      const result = validator.validate('invalid xml');
      
      expect(result.valid).toBe(false);
      expect(result.schema_errors.length).toBeGreaterThan(0);
    });

    it('devrait détecter un XML sans racine dpe', () => {
      const result = validator.validate('<?xml version="1.0"?><invalid></invalid>');
      
      expect(result.valid).toBe(false);
      expect(result.schema_errors.some(e => e.includes("dpe"))).toBe(true);
    });

    it('devrait valider la fonction utilitaire validateXML', () => {
      const generator = new XMLGenerator();
      const xml = generator.generate(mockDPEDocument);
      
      const result = validateXML(xml);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('Round-trip (Génération + Parsing)', () => {
    it('devrait générer et re-parser un DPE', () => {
      // Génération
      const generator = new XMLGenerator();
      const xml = generator.generate(mockDPEDocument);
      
      // Parsing
      const parser = new DPEXMLParser();
      const result = parser.parse(xml);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Vérification des données
      if (result.data) {
        expect(result.data.version).toBe(mockDPEDocument.version);
        expect(result.data.administratif.nom_proprietaire).toBe(mockDPEDocument.administratif.nom_proprietaire);
        expect(result.data.logement.caracteristique_generale.hsp).toBe(mockDPEDocument.logement.caracteristique_generale.hsp);
      }
    });

    it('devrait générer avec validation et re-parser', () => {
      const { xml, validation } = generateXMLWithValidation(mockDPEDocument);
      
      expect(validation.valid).toBe(true);
      
      const result = parseDPEXML(xml);
      expect(result.success).toBe(true);
    });
  });

  describe('Fonctions utilitaires exportées', () => {
    it('devrait exporter generateXML', () => {
      const xml = generateXML(mockDPEDocument);
      expect(xml).toContain('<dpe');
    });

    it('devrait exporter parseDPEXML', () => {
      const xml = generateXML(mockDPEDocument);
      const result = parseDPEXML(xml);
      expect(result.success).toBe(true);
    });

    it('devrait exporter parseDPEXMLStrict', () => {
      const xml = generateXML(mockDPEDocument);
      const result = parseDPEXMLStrict(xml);
      expect(result.success).toBe(true);
    });

    it('devrait exporter parseDPEXMLWithDefaults', () => {
      const xml = generateXML(mockDPEDocument);
      const result = parseDPEXMLWithDefaults(xml);
      expect(result.success).toBe(true);
    });
  });
});
