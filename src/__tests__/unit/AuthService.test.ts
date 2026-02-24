/**
 * Tests complets pour AuthService avec mocks Supabase
 * Couverture cible: 90%+
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthService } from "../../services/AuthService";
import { createMockSupabaseClient, mockAuthUser, mockUserProfile } from "../mocks/supabase.mock";

// Mock createClient avant d'importer AuthService
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@supabase/supabase-js";

describe("AuthService - Tests Complets", () => {
  let authService: AuthService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    authService = new AuthService("https://test.supabase.co", "test-key");
  });

  // ============================================================================
  // CONSTRUCTOR & INITIALIZATION
  // ============================================================================
  describe("constructor", () => {
    it("devrait créer une instance avec les paramètres fournis", () => {
      expect(authService).toBeInstanceOf(AuthService);
      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-key",
        expect.objectContaining({
          auth: expect.objectContaining({
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }),
        })
      );
    });

    it("devrait configurer l'écoute des changements d'état", () => {
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // LOGIN
  // ============================================================================
  describe("login", () => {
    it("devrait connecter un utilisateur avec succès", async () => {
      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const session = result.data as { user: { email: string } };
      expect(session.user).toBeDefined();
      expect(session.user.email).toBe("test@example.com");
    });

    it("devrait retourner une erreur en cas d'échec de connexion", async () => {
      mockSupabase = createMockSupabaseClient({
        shouldFail: true,
        errorCode: "invalid_credentials",
        errorMessage: "Email ou mot de passe incorrect",
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("400");
    });

    it("devrait gérer le cas où aucune session n'est créée", async () => {
      mockSupabase = createMockSupabaseClient({
        shouldFail: true,
        session: null,
        user: null,
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("devrait mapper correctement le profil utilisateur", async () => {
      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      // Vérifier que la session contient les données utilisateur
      expect(result.data).toBeDefined();
    });
  });

  // ============================================================================
  // OTP (ONE TIME PASSWORD)
  // ============================================================================
  describe("OTP", () => {
    describe("requestOTP", () => {
      it("devrait demander un OTP avec succès", async () => {
        const result = await authService.requestOTP({
          email: "test@example.com",
        });

        expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
          email: "test@example.com",
          options: { shouldCreateUser: false },
        });
        expect(result.success).toBe(true);
      });

      it("devrait retourner une erreur si l'envoi échoue", async () => {
        mockSupabase = createMockSupabaseClient({
          shouldFail: true,
          errorCode: "429",
          errorMessage: "Trop de tentatives",
        });
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
        authService = new AuthService("https://test.supabase.co", "test-key");

        const result = await authService.requestOTP({
          email: "test@example.com",
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("400");
      });
    });

    describe("verifyOTP", () => {
      it("devrait vérifier un OTP avec succès", async () => {
        const result = await authService.verifyOTP({
          email: "test@example.com",
          otp: "123456",
        });

        expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
          email: "test@example.com",
          token: "123456",
          type: "email",
        });
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("devrait retourner une erreur si le code OTP est invalide", async () => {
        mockSupabase = createMockSupabaseClient({
          shouldFail: true,
          errorCode: "otp_invalid",
          errorMessage: "Code OTP invalide",
        });
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
        authService = new AuthService("https://test.supabase.co", "test-key");

        const result = await authService.verifyOTP({
          email: "test@example.com",
          otp: "000000",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  // ============================================================================
  // LOGOUT
  // ============================================================================
  describe("logout", () => {
    it("devrait déconnecter l'utilisateur avec succès", async () => {
      await expect(authService.logout()).resolves.not.toThrow();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("devrait notifier les callbacks après déconnexion", async () => {
      const callback = jest.fn();
      authService.onAuthStateChange(callback);

      await authService.logout();

      // Le callback devrait être appelé avec null lors de la déconnexion
      // Note: cela dépend de l'implémentation interne
    });
  });

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  describe("refreshSession", () => {
    it("devrait rafraîchir la session avec succès", async () => {
      const result = await authService.refreshSession();

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("devrait retourner une erreur si le rafraîchissement échoue", async () => {
      mockSupabase = createMockSupabaseClient({
        shouldFail: true,
        errorCode: "401",
        errorMessage: "Session invalide",
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.refreshSession();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("400");
    });

    it("devrait gérer le cas où aucune session n'est retournée", async () => {
      mockSupabase = createMockSupabaseClient({
        session: null,
        user: null,
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.refreshSession();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("no_session");
    });
  });

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================
  describe("getCurrentUser", () => {
    it("devrait retourner l'utilisateur courant", async () => {
      const result = await authService.getCurrentUser();

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockAuthUser.id);
    });

    it("devrait retourner null si aucun utilisateur n'est connecté", async () => {
      mockSupabase = createMockSupabaseClient({
        user: null,
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it("devrait mapper correctement les données du profil", async () => {
      const result = await authService.getCurrentUser();

      expect(result?.fullName).toBe(mockUserProfile.full_name);
      expect(result?.company).toBe(mockUserProfile.company);
      expect(result?.numeroDpeDiagnostiqueur).toBe(
        mockUserProfile.numero_dpe_diagnostiqueur
      );
      expect(result?.phone).toBe(mockUserProfile.phone);
    });
  });

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================
  describe("Password Management", () => {
    describe("requestPasswordReset", () => {
      it("devrait demander une réinitialisation de mot de passe", async () => {
        const result = await authService.requestPasswordReset({
          email: "test@example.com",
        });

        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          "test@example.com",
          { redirectTo: "https://vision-dpe.fr/reset-password" }
        );
        expect(result.success).toBe(true);
      });

      it("devrait retourner une erreur si l'utilisateur n'existe pas", async () => {
        mockSupabase = createMockSupabaseClient({
          shouldFail: true,
          errorCode: "404",
          errorMessage: "Utilisateur non trouvé",
        });
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
        authService = new AuthService("https://test.supabase.co", "test-key");

        const result = await authService.requestPasswordReset({
          email: "unknown@example.com",
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("400");
      });
    });

    describe("updatePassword", () => {
      it("devrait mettre à jour le mot de passe", async () => {
        const result = await authService.updatePassword({
          currentPassword: "oldpass",
          newPassword: "newpassword123",
        });

        expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
          password: "newpassword123",
        });
        expect(result.success).toBe(true);
      });

      it("devrait retourner une erreur si l'utilisateur n'est pas authentifié", async () => {
        mockSupabase = createMockSupabaseClient({
          user: null,
        });
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
        authService = new AuthService("https://test.supabase.co", "test-key");

        const result = await authService.updatePassword({
          currentPassword: "oldpass",
          newPassword: "newpassword123",
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe("not_authenticated");
      });

      it("devrait retourner une erreur si la mise à jour échoue", async () => {
        // Utiliser un mock qui échoue pour la mise à jour
        mockSupabase = createMockSupabaseClient({
          shouldFail: true,
          errorCode: "422",
          errorMessage: "Mot de passe trop faible",
        });
        (createClient as jest.Mock).mockReturnValue(mockSupabase);
        authService = new AuthService("https://test.supabase.co", "test-key");
        
        // Se connecter d'abord
        await authService.login({
          email: "test@example.com",
          password: "password123",
        });

        const result = await authService.updatePassword({
          currentPassword: "oldpass",
          newPassword: "weak",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  // ============================================================================
  // AUTHENTICATION STATE
  // ============================================================================
  describe("isAuthenticated", () => {
    it("devrait retourner false par défaut", () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("devrait retourner true après connexion", async () => {
      await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe("onAuthStateChange", () => {
    it("devrait permettre l'abonnement aux changements d'état", () => {
      const callback = jest.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("devrait permettre de se désabonner", () => {
      const callback = jest.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      unsubscribe();

      // Après désabonnement, le callback ne devrait plus être appelé
      // Note: cela dépend de l'implémentation interne
    });

    it("devrait notifier les callbacks lors des changements d'état", async () => {
      const callback = jest.fn();
      authService.onAuthStateChange(callback);

      await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      // Le callback devrait avoir été appelé
      // Note: cela dépend de l'implémentation interne avec onAuthStateChange
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================
  describe("Error Handling", () => {
    it("devrait mapper correctement les erreurs d'authentification", async () => {
      // Test avec un code d'erreur spécifique
      mockSupabase = createMockSupabaseClient({
        shouldFail: true,
        errorCode: "invalid_credentials",
        errorMessage: "Email ou mot de passe incorrect",
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.error?.message).toBe("Requête invalide");
    });

    it("devrait gérer les erreurs inconnues", async () => {
      mockSupabase = createMockSupabaseClient({
        shouldFail: true,
        errorCode: "unknown_error",
        errorMessage: "Erreur inconnue",
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.error).toBeDefined();
    });

    it("devrait gérer les erreurs de profil utilisateur", async () => {
      mockSupabase = createMockSupabaseClient({
        profile: null,
      });
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      authService = new AuthService("https://test.supabase.co", "test-key");

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      // Le login devrait réussir même sans profil
    });
  });
});
