import '../mocks/supabase.mock'
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../services/AuthService";
import { createMockSupabaseClient } from "../mocks/supabase.mock";

// Mock createClient avant d'importer AuthService
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}));

import { createClient } from "@supabase/supabase-js";

describe("AuthService - Tests Complets", () => {
  let authService: AuthService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    authService = new AuthService("https://test.supabase.co", "test-key");
  });

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
  });

  describe("login", () => {
    it("devrait connecter un utilisateur avec succès", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      const mockSession = {
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password",
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });

    it("devrait retourner une erreur si les identifiants sont invalides", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 },
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "wrong-password",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("logout", () => {
    it("devrait déconnecter l'utilisateur avec succès", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await authService.logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe("requestOTP", () => {
    it("devrait demander un OTP avec succès", async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

      const result = await authService.requestOTP({ email: "test@example.com" });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: { shouldCreateUser: false },
      });
    });

    it("devrait retourner une erreur si l'envoi échoue", async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        error: { message: "Rate limit exceeded", status: 429 },
      });

      const result = await authService.requestOTP({ email: "test@example.com" });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("verifyOTP", () => {
    it("devrait vérifier un OTP avec succès", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: {},
        created_at: "2024-01-01T00:00:00Z",
      };
      const mockSession = {
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser,
      };

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await authService.verifyOTP({
        email: "test@example.com",
        otp: "123456",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "email",
      });
    });
  });

  describe("getCurrentUser", () => {
    it("devrait récupérer l'utilisateur courant", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await authService.getCurrentUser();

      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-123");
    });

    it("devrait retourner null si non authentifié", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});