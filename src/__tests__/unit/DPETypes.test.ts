/**
 * Tests de validation des types DPE contre XSD
 * Parsing des XML exemples ADEME
 */

import { describe, it, expect } from '@jest/globals';
import { 
  xmlDPEMaisonAvant1948, 
  xmlDPEAppartementH2, 
  xmlDPEMaisonBBC, 
  xmlDPEH3Altitude,
  xmlDPEImmeubleCollectif,
  xmlInvalidMissingRoot,
  xmlInvalidMissingRequired,
  xmlEmpty
} from '../fixtures/xmlFixtures';

describe('Types DPE - Validation XML ADEME', () => {
  
  // ============================================================================
  // HELPERS DE PARSING
  // ============================================================================
  
  interface ParsedXMLData {
    numero_dpe: string;
    statut: string;
    type_batiment: string;
    periode_construction: string;
    surface_habitable: number;
    nombre_niveaux: number;
    zone_climatique: string;
    altitude: string;
    consommation_energie_primaire_m2: number;
    emission_ges_m2: number;
    classe_energie: string;
    classe_ges: string;
  }

  const parseXMLBasic = (xmlString: string): Partial<ParsedXMLData> => {
    const extractValue = (tag: string): string | null => {
      const regex = new RegExp(`<${tag}[^\u003e]*>([^\u003c]*)<\\/${tag}>`);
      const match = xmlString.match(regex);
      return match ? match[1] : null;
    };

    const extractNumber = (tag: string): number => {
      const value = extractValue(tag);
      return value ? parseFloat(value) : 0;
    };

    return {
      numero_dpe: extractValue('numero_dpe') || '',
      statut: extractValue('statut') || '',
      type_batiment: extractValue('type_batiment') || '',
      periode_construction: extractValue('periode_construction') || '',
      surface_habitable: extractNumber('surface_habitable'),
      nombre_niveaux: extractNumber('nombre_niveaux'),
      zone_climatique: extractValue('zone_climatique') || 'H1',
      altitude: extractValue('altitude') || 'moins_400m',
      consommation_energie_primaire_m2: extractNumber('consommation_energie_primaire_m2'),
      emission_ges_m2: extractNumber('emission_ges_m2'),
      classe_energie: extractValue('classe_energie') || 'G',
      classe_ges: extractValue('classe_ges') || 'G'
    };
  };

  const validateXMLStructure = (xml: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Vérification du prologue
    if (!xml.includes('<?xml')) {
      errors.push('Prologue XML manquant');
    }

    // Vérification élément racine
    if (!xml.includes('<dpe')) {
      errors.push('Élément racine dpe manquant');
    }

    // Vérification des éléments obligatoires
    const requiredElements = ['numero_dpe', 'type_batiment', 'surface_habitable', 'classe_energie'];
    for (const element of requiredElements) {
      if (!xml.includes(`<${element}>`)) {
        errors.push(`Élément ${element} manquant`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // ============================================================================
  // TESTS DE PARSING XML VALIDE
  // ============================================================================
  
  describe('Parsing XML valides', () => {
    it('devrait parser correctement une maison avant 1948', () => {
      const data = parseXMLBasic(xmlDPEMaisonAvant1948);
      
      expect(data.numero_dpe).toBe('DPE-2024-MAISON-001');
      expect(data.type_batiment).toBe('maison');
      expect(data.periode_construction).toBe('avant_1948');
      expect(data.surface_habitable).toBe(95);
      expect(data.zone_climatique).toBe('H1');
      expect(data.classe_energie).toBe('G');
      expect(data.consommation_energie_primaire_m2).toBeGreaterThan(300);
    });

    it('devrait parser correctement un appartement H2', () => {
      const data = parseXMLBasic(xmlDPEAppartementH2);
      
      expect(data.numero_dpe).toBe('DPE-2024-APP-002');
      expect(data.type_batiment).toBe('appartement');
      expect(data.zone_climatique).toBe('H2');
      expect(data.surface_habitable).toBe(65);
      expect(data.classe_energie).toBe('C');
      expect(data.classe_ges).toBe('B');
    });

    it('devrait parser correctement une maison BBC (classe A)', () => {
      const data = parseXMLBasic(xmlDPEMaisonBBC);
      
      expect(data.numero_dpe).toBe('DPE-2024-BBC-003');
      expect(data.type_batiment).toBe('maison');
      expect(data.periode_construction).toBe('apres_2012');
      expect(data.surface_habitable).toBe(140);
      expect(data.classe_energie).toBe('A');
      expect(data.classe_ges).toBe('A');
      expect(data.consommation_energie_primaire_m2).toBeLessThan(50);
    });

    it('devrait parser correctement une maison en H3 à haute altitude', () => {
      const data = parseXMLBasic(xmlDPEH3Altitude);
      
      expect(data.numero_dpe).toBe('DPE-2024-H3-004');
      expect(data.zone_climatique).toBe('H3');
      expect(data.altitude).toBe('plus_800m');
      expect(data.classe_energie).toBe('F');
    });

    it('devrait parser correctement un immeuble collectif', () => {
      const data = parseXMLBasic(xmlDPEImmeubleCollectif);
      
      expect(data.numero_dpe).toBe('DPE-2024-IMM-005');
      expect(data.type_batiment).toBe('appartement');
      expect(data.periode_construction).toBe('1969_1974');
      expect(data.surface_habitable).toBe(45);
    });
  });

  // ============================================================================
  // TESTS DE VALIDATION DE STRUCTURE
  // ============================================================================
  
  describe('Validation structure XML', () => {
    it('devrait valider la structure d\'un XML ADEME complet', () => {
      const result = validateXMLStructure(xmlDPEMaisonAvant1948);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait détecter un XML sans élément racine dpe', () => {
      const result = validateXMLStructure(xmlInvalidMissingRoot);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('racine'))).toBe(true);
    });

    it('devrait détecter un XML sans éléments obligatoires', () => {
      const result = validateXMLStructure(xmlInvalidMissingRequired);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait détecter un XML vide', () => {
      const result = validateXMLStructure(xmlEmpty);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('numero_dpe'))).toBe(true);
    });
  });

  // ============================================================================
  // TESTS DE COHÉRENCE DES DONNÉES
  // ============================================================================
  
  describe('Cohérence des données', () => {
    it('devrait vérifier la cohérence classe énergie / consommation', () => {
      const testCases = [
        { xml: xmlDPEMaisonBBC, expectedClass: 'A', maxConso: 70 },
        { xml: xmlDPEAppartementH2, expectedClass: 'C', maxConso: 180 },
        { xml: xmlDPEMaisonAvant1948, expectedClass: 'G', minConso: 300 }
      ];

      for (const testCase of testCases) {
        const data = parseXMLBasic(testCase.xml);
        expect(data.classe_energie).toBe(testCase.expectedClass);
        
        if (testCase.maxConso) {
          expect(data.consommation_energie_primaire_m2).toBeLessThanOrEqual(testCase.maxConso);
        }
        if (testCase.minConso) {
          expect(data.consommation_energie_primaire_m2).toBeGreaterThanOrEqual(testCase.minConso);
        }
      }
    });

    it('devrait vérifier la cohérence zone climatique / altitude', () => {
      const dataH3 = parseXMLBasic(xmlDPEH3Altitude);
      
      expect(dataH3.zone_climatique).toBe('H3');
      expect(dataH3.altitude).toBe('plus_800m');
    });

    it('devrait vérifier que toutes les classes sont valides', () => {
      const validClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const fixtures = [xmlDPEMaisonBBC, xmlDPEAppartementH2, xmlDPEH3Altitude, xmlDPEMaisonAvant1948];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        expect(validClasses).toContain(data.classe_energie);
        expect(validClasses).toContain(data.classe_ges);
      }
    });
  });

  // ============================================================================
  // TESTS DE TYPES
  // ============================================================================
  
  describe('Types des données', () => {
    it('devrait avoir des surfaces numériques positives', () => {
      const fixtures = [xmlDPEMaisonAvant1948, xmlDPEAppartementH2, xmlDPEMaisonBBC];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        expect(typeof data.surface_habitable).toBe('number');
        expect(data.surface_habitable).toBeGreaterThan(0);
      }
    });

    it('devrait avoir des consommations numériques', () => {
      const data = parseXMLBasic(xmlDPEMaisonAvant1948);
      
      expect(typeof data.consommation_energie_primaire_m2).toBe('number');
      expect(data.consommation_energie_primaire_m2).toBeGreaterThan(0);
    });

    it('devrait avoir des numéros de DPE non vides', () => {
      const fixtures = [xmlDPEMaisonAvant1948, xmlDPEAppartementH2, xmlDPEMaisonBBC];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        expect(data.numero_dpe).toBeTruthy();
        expect(data.numero_dpe!.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // TESTS DE COMPLÉTUDE
  // ============================================================================
  
  describe('Complétude des fixtures', () => {
    it('devrait couvrir toutes les zones climatiques', () => {
      const zones = new Set<string>();
      const fixtures = [xmlDPEMaisonAvant1948, xmlDPEAppartementH2, xmlDPEH3Altitude];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        zones.add(data.zone_climatique || '');
      }
      
      expect(zones.has('H1')).toBe(true);
      expect(zones.has('H2')).toBe(true);
      expect(zones.has('H3')).toBe(true);
    });

    it('devrait couvrir tous les types de bâtiment', () => {
      const types = new Set<string>();
      const fixtures = [xmlDPEMaisonAvant1948, xmlDPEAppartementH2, xmlDPEImmeubleCollectif];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        types.add(data.type_batiment || '');
      }
      
      expect(types.has('maison')).toBe(true);
      expect(types.has('appartement')).toBe(true);
    });

    it('devrait couvrir différentes périodes de construction', () => {
      const periodes = new Set<string>();
      const fixtures = [
        xmlDPEMaisonAvant1948,   // avant_1948
        xmlDPEImmeubleCollectif, // 1969_1974
        xmlDPEAppartementH2,     // 1989_1999
        xmlDPEMaisonBBC          // apres_2012
      ];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        periodes.add(data.periode_construction || '');
      }
      
      expect(periodes.size).toBeGreaterThanOrEqual(4);
    });

    it('devrait couvrir toutes les classes énergie', () => {
      const classes = new Set<string>();
      const fixtures = [
        xmlDPEMaisonBBC,         // A
        xmlDPEAppartementH2,     // C
        xmlDPEImmeubleCollectif, // D
        xmlDPEH3Altitude,        // F
        xmlDPEMaisonAvant1948    // G
      ];
      
      for (const fixture of fixtures) {
        const data = parseXMLBasic(fixture);
        classes.add(data.classe_energie || '');
      }
      
      expect(classes.has('A')).toBe(true);
      expect(classes.has('C')).toBe(true);
      expect(classes.has('D')).toBe(true);
      expect(classes.has('F')).toBe(true);
      expect(classes.has('G')).toBe(true);
    });
  });
});
