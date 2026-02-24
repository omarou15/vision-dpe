/**
 * Tests unitaires pour AuthService
 * Phase 1 - Module Administratif
 */

import { AuthService } from "../../services/AuthService";
import {
  mockSession,
  mockUserProfile,
  createMockSupabaseClient,
} from "../mocks/supabase.mock";

// Mock de @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => createMockSupabaseClient()),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const { createClient } = jest.requireMock("@supabase/supabase-js");
    createClient.mockReturnValue(mockSupabase);
    authService = new AuthService("https://test.supabase.co", "test-key");
  });

  describe("login", () => {
    it("devrait connecter un utilisateur avec succès", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.user.email).toBe("test@example.com");
    });

    it("devrait retourner une erreur si les identifiants sont invalides", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { status: 400, code: "invalid_credentials", message: "Invalid credentials" },
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("400");
    });

    it("devrait retourner une erreur si pas de session", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: mockSession.user },
        error: null,
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("no_session");
    });
  });

  describe("requestOTP", () => {
    it("devrait envoyer un OTP avec succès", async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.requestOTP({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: { shouldCreateUser: false },
      });
    });

    it("devrait retourner une erreur si l'envoi échoue", async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: { status: 422, message: "Invalid email" },
      });

      const result = await authService.requestOTP({
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("verifyOTP", () => {
    it("devrait vérifier l'OTP et connecter l'utilisateur", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      });

      const result = await authService.verifyOTP({
        email: "test@example.com",
        otp: "123456",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("devrait retourner une erreur si l'OTP est invalide", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { session: null, user: null },
        error: { status: 401, code: "otp_invalid", message: "Invalid OTP" },
      });

      const result = await authService.verifyOTP({
        email: "test@example.com",
        otp: "000000",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("401");
    });
  });

  describe("logout", () => {
    it("devrait déconnecter l'utilisateur", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await authService.logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe("refreshSession", () => {
    it("devrait rafraîchir la session avec succès", async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      });

      const result = await authService.refreshSession();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("devrait retourner une erreur si le rafraîchissement échoue", async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { status: 401, message: "Session expired" },
      });

      const result = await authService.refreshSession();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getCurrentUser", () => {
    it("devrait retourner l'utilisateur courant", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          })),
        })),
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeDefined();
      expect(user?.email).toBe("test@example.com");
    });

    it("devrait retourner null si pas d'utilisateur", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe("requestPasswordReset", () => {
    it("devrait demander une réinitialisation de mot de passe", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.requestPasswordReset({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
    });

    it("devrait retourner une erreur si l'email est invalide", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { status: 422, message: "Invalid email" },
      });

      const result = await authService.requestPasswordReset({
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updatePassword", () => {
    it("devrait mettre à jour le mot de passe", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });

      const result = await authService.updatePassword({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      });

      expect(result.success).toBe(true);
    });

    it("devrait retourner une erreur si l'utilisateur n'est pas connecté", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.updatePassword({
        currentPassword: "oldpassword",
        newPassword: "newpassword123",
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("not_authenticated");
    });
  });

  describe("isAuthenticated", () => {
    it("devrait retourner false initialement", () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe("onAuthStateChange", () => {
    it("devrait permettre de s'abonner aux changements d'état", () => {
      const callback = jest.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      expect(typeof unsubscribe).toBe("function");
    });
  });
});
