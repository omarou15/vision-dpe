/**
 * Tests unitaires pour ValidationService
 * Phase 1 - Module Administratif
 */

import { ValidationService } from "../../services/ValidationService";
import {
  mockStep1Data,
  mockStep2Data,
  mockStep2InvalidData,
} from "../fixtures/dpe.fixtures";

describe("ValidationService", () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe("validateStep", () => {
    describe("Étape 1 - Informations administratives", () => {
      it("devrait valider une étape 1 complète", () => {
        const result = validationService.validateStep(1, mockStep1Data);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("devrait détecter les champs manquants à l'étape 1", () => {
        const incompleteData = {
          numero_dpe: "",
          date_visite: "",
        };

        const result = validationService.validateStep(1, incompleteData);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it("devrait valider le format du numéro DPE", () => {
        const invalidData = {
          ...mockStep1Data,
          numero_dpe: "INVALID",
        };

        const result = validationService.validateStep(1, invalidData);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === "numero_dpe")).toBe(true);
      });
    });

    describe("Étape 2 - Caractéristiques générales", () => {
      it("devrait valider une étape 2 complète", () => {
        const result = validationService.validateStep(2, mockStep2Data);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("devrait détecter une surface habitable négative", () => {
        const result = validationService.validateStep(2, mockStep2InvalidData);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => 
          e.message.includes("surface") || e.code === "min_value"
        )).toBe(true);
      });

      it("devrait détecter un nombre de niveaux incohérent", () => {
        const invalidData = {
          caracteristiques_generales: {
            type_batiment: "maison",
            periode_construction: "1983-1988",
            surface_habitable: 100,
            nombre_niveaux: 100,
          },
        };

        const result = validationService.validateStep(2, invalidData);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => 
          e.message.includes("niveaux") || e.code === "max_value"
        )).toBe(true);
      });
    });

    describe("Étape 3 - Murs", () => {
      it("devrait valider des murs définis", () => {
        const data = {
          murs: [{ id: "mur-1", surface: 20 }],
        };

        const result = validationService.validateStep(3, data);

        expect(result.valid).toBe(true);
      });

      it("devrait rejeter une liste de murs vide", () => {
        const data = {
          murs: [],
        };

        const result = validationService.validateStep(3, data);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === "murs")).toBe(true);
      });
    });

    describe("Étape 4 - Baies vitrées", () => {
      it("devrait accepter une liste vide de baies", () => {
        const data = {
          baies_vitrees: [],
        };

        const result = validationService.validateStep(4, data);

        expect(result.valid).toBe(true);
      });

      it("devrait valider des baies définies", () => {
        const data = {
          baies_vitrees: [{ id: "baie-1", surface: 5 }],
        };

        const result = validationService.validateStep(4, data);

        expect(result.valid).toBe(true);
      });
    });
  });

  describe("validateField", () => {
    it("devrait valider un champ spécifique", () => {
      const result = validationService.validateField(
        "proprietaire.nom",
        "Jean Dupont",
        {}
      );

      expect(result).toBeNull();
    });

    it("devrait détecter un champ requis vide", () => {
      const result = validationService.validateField(
        "proprietaire.nom",
        "",
        {}
      );

      expect(result).not.toBeNull();
      expect(result?.code).toBe("required");
    });

    it("devrait valider la longueur minimale", () => {
      const result = validationService.validateField(
        "proprietaire.nom",
        "A",
        {}
      );

      expect(result).not.toBeNull();
      expect(result?.code).toBe("min_length");
    });
  });

  describe("addRule", () => {
    it("devrait ajouter une règle personnalisée", () => {
      validationService.addRule({
        id: "custom_rule",
        field: "custom_field",
        required: true,
        type: "string",
        message: "Champ personnalisé requis",
      });

      const result = validationService.validateField("custom_field", "", {});

      expect(result).not.toBeNull();
      expect(result?.message).toBe("Champ personnalisé requis");
    });
  });

  describe("addCoherenceRule", () => {
    it("devrait ajouter une règle de cohérence", () => {
      validationService.addCoherenceRule({
        id: "custom_coherence",
        description: "Test de cohérence",
        check: (data: unknown) => {
          const d = data as Record<string, unknown>;
          return d.test === true;
        },
        message: "Test échoué",
        severity: "error",
      });

      const result = validationService.validate({ test: false });

      expect(result.errors.some((e) => e.code === "custom_coherence")).toBe(true);
    });
  });

  describe("isStepComplete", () => {
    it("devrait retourner true pour une étape complète", () => {
      const isComplete = validationService.isStepComplete(1, mockStep1Data);

      expect(isComplete).toBe(true);
    });

    it("devrait retourner false pour une étape incomplète", () => {
      const isComplete = validationService.isStepComplete(1, {});

      expect(isComplete).toBe(false);
    });
  });

  describe("calculateProgress", () => {
    it("devrait calculer 0% pour un DPE vide", () => {
      const progress = validationService.calculateProgress({});

      expect(progress).toBe(0);
    });

    it("devrait calculer une progression partielle", () => {
      const data = {
        ...mockStep1Data,
        ...mockStep2Data,
        murs: [{ id: "mur-1" }],
      };

      const progress = validationService.calculateProgress(data);

      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe("validate avec options", () => {
    it("devrait respecter stopOnFirstError", () => {
      const invalidData = {
        numero_dpe: "",
        date_visite: "",
        proprietaire: { nom: "" },
      };

      const result = validationService.validate(invalidData, {
        context: { step: 1 },
        stopOnFirstError: true,
      });

      expect(result.errors.length).toBe(1);
    });

    it("devrait inclure les warnings si demandé", () => {
      const data = {
        caracteristiques_generales: {
          surface_habitable: 15000, // Très grande surface
          nombre_niveaux: 2,
        },
      };

      const result = validationService.validate(data, {
        context: { step: 2 },
        includeWarnings: true,
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
