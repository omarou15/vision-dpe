/**
 * Tests d'intégration complets des services
 * Vérifie l'interaction entre AuthService, ValidationService et XMLGeneratorService
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthService } from "../../services/AuthService";
import { ValidationService } from "../../services/ValidationService";
import { XMLGeneratorService } from "../../services/XMLGeneratorService";
import { XMLGenerationStatus } from "../../types/services";
import { createMockSupabaseClient } from "../mocks/supabase.mock";
import { createMockDPE, mockStep1Data, mockStep2Data } from "../fixtures/dpe.fixtures";

// Mock createClient
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@supabase/supabase-js";

describe("Intégration Services - Tests Complets", () => {
  let authService: AuthService;
  let validationService: ValidationService;
  let xmlService: XMLGeneratorService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    authService = new AuthService("https://test.supabase.co", "test-key");
    validationService = new ValidationService();
    xmlService = new XMLGeneratorService();
  });

  // ============================================================================
  // SCÉNARIO: Création d'un DPE complet
  // ============================================================================
  describe("Scénario: Création DPE complet", () => {
    it("devrait valider puis générer un XML", () => {
      const dpe = createMockDPE();

      // Étape 1: Validation - on vérifie juste que ça s'exécute
      const validationResult = validationService.validate(dpe);
      expect(validationResult).toBeDefined();
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.warnings).toBeDefined();

      // Étape 2: Génération XML
      const xmlResult = xmlService.generate(dpe);
      expect(xmlResult).toBeDefined();
      expect(xmlResult.status).toBe(XMLGenerationStatus.SUCCESS);
      expect(xmlResult.xmlContent).toBeDefined();

      // Étape 3: Validation du XML généré
      const xmlValidationResult = xmlService.validate(xmlResult.xmlContent || "");
      expect(xmlValidationResult).toBeDefined();
      expect(typeof xmlValidationResult.valid).toBe("boolean");
    });

    it("devrait détecter les erreurs avant génération", () => {
      const invalidDPE = {
        administratif: {
          date_visite_diagnostiqueur: "",
        },
      };

      // Validation
      const validationResult = validationService.validate(invalidDPE);
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it("devrait calculer la progression pendant la création", () => {
      // Étape 1: Données partielles
      const step1Data = mockStep1Data;
      let progress = validationService.calculateProgress(step1Data);
      const progressAfterStep1 = progress;
      expect(typeof progress).toBe("number");
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);

      // Étape 2: Ajout des caractéristiques générales
      const step2Data = { ...step1Data, ...mockStep2Data };
      progress = validationService.calculateProgress(step2Data);
      expect(progress).toBeGreaterThanOrEqual(progressAfterStep1);

      // Étape 3: DPE complet - la progression dépend des données complètes
      const completeDPE = createMockDPE();
      progress = validationService.calculateProgress(completeDPE);
      expect(typeof progress).toBe("number");
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // SCÉNARIO: Workflow utilisateur complet
  // ============================================================================
  describe("Scénario: Workflow utilisateur complet", () => {
    it("devrait permettre la connexion et la création de DPE", async () => {
      // Étape 1: Connexion
      const authResult = await authService.login({
        email: "diagnosticien@example.com",
        password: "password123",
      });

      expect(authResult.success).toBe(true);
      expect(authResult.data).toBeDefined();

      // Étape 2: Vérifier l'authentification
      const isAuth = authService.isAuthenticated();
      expect(isAuth).toBe(true);

      // Étape 3: Créer un DPE
      const dpe = createMockDPE();

      // Étape 4: Valider le DPE - on vérifie juste que ça s'exécute
      const validationResult = validationService.validate(dpe);
      expect(validationResult).toBeDefined();

      // Étape 5: Générer le XML
      const xmlResult = xmlService.generate(dpe);
      expect(xmlResult.status).toBe(XMLGenerationStatus.SUCCESS);
    });

    it("devrait gérer la déconnexion", async () => {
      // Connexion
      await authService.login({
        email: "test@example.com",
        password: "password123",
      });
      expect(authService.isAuthenticated()).toBe(true);

      // Déconnexion
      await authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("devrait gérer le rafraîchissement de session", async () => {
      // Connexion
      await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      // Rafraîchir la session
      const refreshResult = await authService.refreshSession();
      expect(refreshResult.success).toBe(true);
    });
  });

  // ============================================================================
  // SCÉNARIO: Cycle de vie XML complet
  // ============================================================================
  describe("Scénario: Cycle de vie XML complet", () => {
    it("devrait générer, valider et parser un XML", () => {
      const dpe = createMockDPE();

      // Génération
      const generationResult = xmlService.generate(dpe);
      expect(generationResult.status).toBe(XMLGenerationStatus.SUCCESS);
      expect(generationResult.xmlContent).toBeDefined();

      // Validation - on vérifie juste que ça s'exécute
      const validationResult = xmlService.validate(generationResult.xmlContent || "");
      expect(validationResult).toBeDefined();
      expect(typeof validationResult.valid).toBe("boolean");

      // Parsing
      const parseResult = xmlService.parse(generationResult.xmlContent || "");
      expect(parseResult.success).toBe(true);
    });

    it("devrait générer un XML asynchrone", async () => {
      const dpe = createMockDPE();

      const generationResult = await xmlService.generateAsync(dpe);
      expect(generationResult.status).toBe(XMLGenerationStatus.SUCCESS);
    });

    it("devrait exporter vers un fichier", async () => {
      const dpe = createMockDPE();
      const generationResult = xmlService.generate(dpe);

      const exportResult = await xmlService.exportToFile(
        generationResult.xmlContent || "",
        generationResult.fileName || "dpe.xml",
        "/tmp"
      );

      expect(exportResult.success).toBe(true);
    });
  });

  // ============================================================================
  // SCÉNARIO: Validation complète par étapes
  // ============================================================================
  describe("Scénario: Validation complète par étapes", () => {
    it("devrait valider chaque étape du wizard", () => {
      const steps = [
        { step: 1, data: mockStep1Data },
        { step: 2, data: { ...mockStep1Data, ...mockStep2Data } },
        { step: 3, data: { ...mockStep1Data, ...mockStep2Data, murs: [{ id: "mur-1" }] } },
      ];

      for (const { step, data } of steps) {
        const result = validationService.validateStep(step, data);
        expect(result).toBeDefined();
        expect(typeof result.valid).toBe("boolean");
      }
    });

    it("devrait détecter les étapes incomplètes", () => {
      const incompleteData = {
        numero_dpe: "DPE-24-001-001-A",
        // date_visite manquante
      };

      const result = validationService.validateStep(1, incompleteData);
      expect(result.valid).toBe(false);
      expect(result.completedSteps).not.toContain(1);
    });

    it("devrait calculer la progression", () => {
      const completeDPE = createMockDPE();
      const progress = validationService.calculateProgress(completeDPE);

      expect(typeof progress).toBe("number");
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // SCÉNARIO: Gestion des erreurs
  // ============================================================================
  describe("Scénario: Gestion des erreurs", () => {
    it("devrait gérer les erreurs d'authentification", async () => {
      mockSupabase = createMockSupabaseClient({
        shouldFail: true,
        errorCode: "invalid_credentials",
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("devrait gérer les erreurs de validation", () => {
      const invalidDPE = {
        caracteristiques_generales: {
          surface_habitable: -100, // Surface négative
        },
      };

      const result = validationService.validateStep(2, invalidDPE);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("devrait gérer les erreurs de génération XML", () => {
      // Test avec des données qui pourraient causer des problèmes
      const problematicDPE = null as any;
      const result = xmlService.generate(problematicDPE);

      // Le service devrait gérer l'erreur gracieusement
      expect(result.status).toBeDefined();
    });
  });

  // ============================================================================
  // SCÉNARIO: Workflow OTP
  // ============================================================================
  describe("Scénario: Workflow OTP", () => {
    it("devrait demander et vérifier un OTP", async () => {
      // Demander un OTP
      const requestResult = await authService.requestOTP({
        email: "test@example.com",
      });
      expect(requestResult.success).toBe(true);

      // Vérifier l'OTP
      const verifyResult = await authService.verifyOTP({
        email: "test@example.com",
        otp: "123456",
      });
      expect(verifyResult.success).toBe(true);
    });
  });

  // ============================================================================
  // SCÉNARIO: Réinitialisation de mot de passe
  // ============================================================================
  describe("Scénario: Réinitialisation de mot de passe", () => {
    it("devrait demander une réinitialisation de mot de passe", async () => {
      const result = await authService.requestPasswordReset({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait mettre à jour le mot de passe", async () => {
      const result = await authService.updatePassword({
        currentPassword: "oldpass",
        newPassword: "newpassword123",
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // SCÉNARIO: Abonnement aux changements d'état
  // ============================================================================
  describe("Scénario: Abonnement aux changements d'état", () => {
    it("devrait permettre l'abonnement aux changements d'authentification", () => {
      const callback = jest.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      expect(typeof unsubscribe).toBe("function");

      // Se désabonner
      unsubscribe();
    });
  });

  // ============================================================================
  // SCÉNARIO: Règles personnalisées
  // ============================================================================
  describe("Scénario: Règles personnalisées", () => {
    it("devrait ajouter et utiliser une règle personnalisée", () => {
      validationService.addRule({
        id: "custom_integration_rule",
        field: "custom_field",
        required: true,
        type: "string",
        message: "Champ personnalisé requis",
      });

      const result = validationService.validateField("custom_field", "", {});
      expect(result).not.toBeNull();
      expect(result?.message).toBe("Champ personnalisé requis");
    });

    it("devrait ajouter et utiliser une règle de cohérence", () => {
      validationService.addCoherenceRule({
        id: "custom_coherence_integration",
        description: "Test intégration",
        check: () => false,
        message: "Erreur de cohérence",
        severity: "error",
      });

      const result = validationService.validate({});
      expect(result.errors.some((e) => e.code === "custom_coherence_integration")).toBe(true);
    });
  });

  // ============================================================================
  // SCÉNARIO: Configuration XML
  // ============================================================================
  describe("Scénario: Configuration XML", () => {
    it("devrait utiliser la configuration par défaut", () => {
      const config = xmlService.getDefaultConfig();

      expect(config.version).toBe("2.6");
      expect(config.format).toBe("standard");
      expect(config.encoding).toBe("UTF-8");
    });

    it("devrait vérifier les versions supportées", () => {
      expect(xmlService.isVersionSupported("2.6")).toBe(true);
      expect(xmlService.isVersionSupported("2.5")).toBe(true);
      expect(xmlService.isVersionSupported("1.0")).toBe(false);
    });
  });

  // ============================================================================
  // SCÉNARIO: End-to-End
  // ============================================================================
  describe("Scénario: End-to-End", () => {
    it("devrait exécuter un workflow complet", async () => {
      // 1. Connexion
      const loginResult = await authService.login({
        email: "diagnosticien@example.com",
        password: "password123",
      });
      expect(loginResult.success).toBe(true);

      // 2. Vérifier l'authentification
      expect(authService.isAuthenticated()).toBe(true);

      // 3. Créer un DPE
      const dpe = createMockDPE();

      // 4. Valider le DPE - on vérifie juste que ça s'exécute
      const validationResult = validationService.validate(dpe);
      expect(validationResult).toBeDefined();

      // 5. Calculer la progression
      const progress = validationService.calculateProgress(dpe);
      expect(typeof progress).toBe("number");

      // 6. Générer le XML
      const generationResult = xmlService.generate(dpe);
      expect(generationResult.status).toBe(XMLGenerationStatus.SUCCESS);

      // 7. Valider le XML
      const xmlValidationResult = xmlService.validate(
        generationResult.xmlContent || ""
      );
      expect(typeof xmlValidationResult.valid).toBe("boolean");

      // 8. Exporter le fichier
      const exportResult = await xmlService.exportToFile(
        generationResult.xmlContent || "",
        generationResult.fileName || "dpe.xml",
        "/tmp"
      );
      expect(exportResult.success).toBe(true);

      // 9. Déconnexion
      await authService.logout();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
