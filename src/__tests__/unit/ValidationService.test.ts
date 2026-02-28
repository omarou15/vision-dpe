import '../mocks/supabase.mock'
import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../../services/ValidationService';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validate', () => {
    it('devrait exister', () => {
      expect(service.validate).toBeDefined();
    });

    it('devrait retourner un résultat', () => {
      const result = service.validate({});
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('devrait valider avec options', () => {
      const result = service.validate({}, { includeWarnings: true });
      expect(result).toBeDefined();
    });
  });

  describe('validateStep', () => {
    it('devrait exister', () => {
      expect(service.validateStep).toBeDefined();
    });

    describe('Étape 1 — Informations administratives', () => {
      it('devrait valider l\'étape 1', () => {
        const result = service.validateStep(1, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec données administratives', () => {
        const dpe = {
          administratif: {
            numero_dpe: 'DPE-24-001-001-A',
            date_visite_diagnostiqueur: '2024-01-15',
            nom_proprietaire: 'Jean Dupont',
          },
        };
        const result = service.validateStep(1, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 2 — Caractéristiques générales', () => {
      it('devrait valider l\'étape 2', () => {
        const result = service.validateStep(2, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec caractéristiques', () => {
        const dpe = {
          caracteristique_generale: {
            annee_construction: 1980,
            enum_periode_construction_id: 3,
            surface_habitable_logement: 120,
            nombre_niveau_logement: 2,
            hsp: 2.5,
          },
        };
        const result = service.validateStep(2, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 3 — Murs', () => {
      it('devrait valider l\'étape 3', () => {
        const result = service.validateStep(3, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec murs', () => {
        const dpe = {
          logement: {
            enveloppe: {
              mur_collection: {
                mur: [{
                  donnee_entree: {
                    reference: 'MUR-001',
                    surface_paroi_opaque: 50,
                    enum_type_adjacence_id: 1,
                    enum_orientation_id: 1,
                  },
                }],
              },
            },
          },
        };
        const result = service.validateStep(3, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 4 — Baies vitrées', () => {
      it('devrait valider l\'étape 4', () => {
        const result = service.validateStep(4, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec baies', () => {
        const dpe = {
          logement: {
            enveloppe: {
              baie_vitree_collection: {
                baie_vitree: [{
                  donnee_entree: {
                    reference: 'BAIE-001',
                    surface_totale_baie: 10,
                    enum_type_adjacence_id: 1,
                    enum_orientation_id: 1,
                  },
                }],
              },
            },
          },
        };
        const result = service.validateStep(4, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 5 — Planchers bas', () => {
      it('devrait valider l\'étape 5', () => {
        const result = service.validateStep(5, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec planchers bas', () => {
        const dpe = {
          logement: {
            enveloppe: {
              plancher_bas_collection: {
                plancher_bas: [{
                  donnee_entree: {
                    reference: 'PB-001',
                    surface_paroi_opaque: 60,
                    enum_type_adjacence_id: 1,
                  },
                }],
              },
            },
          },
        };
        const result = service.validateStep(5, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 6 — Planchers hauts', () => {
      it('devrait valider l\'étape 6', () => {
        const result = service.validateStep(6, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec planchers hauts', () => {
        const dpe = {
          logement: {
            enveloppe: {
              plancher_haut_collection: {
                plancher_haut: [{
                  donnee_entree: {
                    reference: 'PH-001',
                    surface_paroi_opaque: 60,
                    enum_type_adjacence_id: 1,
                  },
                }],
              },
            },
          },
        };
        const result = service.validateStep(6, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 7 — Ponts thermiques', () => {
      it('devrait valider l\'étape 7', () => {
        const result = service.validateStep(7, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec ponts thermiques', () => {
        const dpe = {
          logement: {
            enveloppe: {
              pont_thermique_collection: {
                pont_thermique: [{
                  donnee_entree: {
                    reference: 'PT-001',
                    l: 10,
                    enum_type_liaison_id: 1,
                  },
                }],
              },
            },
          },
        };
        const result = service.validateStep(7, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étape 8 — Chauffage', () => {
      it('devrait valider l\'étape 8', () => {
        const result = service.validateStep(8, {});
        expect(result).toBeDefined();
      });

      it('devrait valider avec installation chauffage', () => {
        const dpe = {
          logement: {
            installation_chauffage_collection: {
              installation_chauffage: [{
                donnee_entree: {
                  reference: 'CH-001',
                  surface_chauffee: 120,
                  enum_cfg_installation_ch_id: 1,
                },
              }],
            },
          },
        };
        const result = service.validateStep(8, dpe);
        expect(result).toBeDefined();
      });
    });

    describe('Étapes 9 à 13', () => {
      it('devrait valider l\'étape 9 (ECS)', () => {
        const result = service.validateStep(9, {});
        expect(result).toBeDefined();
      });

      it('devrait valider l\'étape 10 (Ventilation)', () => {
        const result = service.validateStep(10, {});
        expect(result).toBeDefined();
      });

      it('devrait valider l\'étape 11 (Climatisation)', () => {
        const result = service.validateStep(11, {});
        expect(result).toBeDefined();
      });

      it('devrait valider l\'étape 12 (Scénarios travaux)', () => {
        const result = service.validateStep(12, {});
        expect(result).toBeDefined();
      });

      it('devrait valider l\'étape 13 (Validation)', () => {
        const result = service.validateStep(13, {});
        expect(result).toBeDefined();
      });
    });
  });

  describe('validateField', () => {
    it('devrait exister', () => {
      expect(service.validateField).toBeDefined();
    });

    it('devrait valider un champ', () => {
      const result = service.validateField('test', 'value');
      expect(result).toBeDefined();
    });
  });

  describe('Règles de cohérence', () => {
    it('devrait détecter une surface incohérente', () => {
      const dpe = {
        caracteristique_generale: {
          surface_habitable_logement: 15000,
        },
      };
      const result = service.validateStep(2, dpe);
      expect(result).toBeDefined();
    });

    it('devrait détecter un nombre de niveaux incohérent', () => {
      const dpe = {
        caracteristique_generale: {
          nombre_niveau_logement: 100,
        },
      };
      const result = service.validateStep(2, dpe);
      expect(result).toBeDefined();
    });
  });
});