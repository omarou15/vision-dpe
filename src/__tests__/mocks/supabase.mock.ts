/**
 * Mocks complets pour Supabase
 * Permet de tester AuthService sans appels réseau
 */

import { User, Session, AuthError } from "@supabase/supabase-js";

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockAuthUser: User = {
  id: "user-123",
  email: "test@example.com",
  user_metadata: {
    full_name: "Test User",
  },
  app_metadata: {},
  aud: "authenticated",
  confirmation_sent_at: undefined,
  confirmed_at: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  email_confirmed_at: "2024-01-01T00:00:00Z",
  phone: "",
  phone_confirmed_at: undefined,
  recovery_sent_at: undefined,
  new_email: undefined,
  new_phone: undefined,
  invited_at: undefined,
  action_link: undefined,
  email_change_sent_at: undefined,
  is_anonymous: false,
  factors: [],
  identities: [],
  role: "authenticated",
  updated_at: "2024-01-01T00:00:00Z",
  last_sign_in_at: "2024-01-01T00:00:00Z",
};

export const mockSession: Session = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: mockAuthUser,
};

export const mockUserProfile = {
  id: "user-123",
  full_name: "Test User",
  company: "Test Company",
  numero_dpe_diagnostiqueur: "DPE-123456",
  phone: "0612345678",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ============================================================================
// MOCK FACTORY
// ============================================================================

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;

export function createMockSupabaseClient(options: {
  shouldFail?: boolean;
  errorCode?: string;
  errorMessage?: string;
  user?: User | null;
  session?: Session | null;
  profile?: typeof mockUserProfile | null;
} = {}) {
  const {
    shouldFail = false,
    errorCode = "unknown_error",
    errorMessage = "Mock error",
    user = mockAuthUser,
    session = mockSession,
    profile = mockUserProfile,
  } = options;

  const mockError = shouldFail
    ? createMockAuthError(errorCode, errorMessage)
    : null;

  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: shouldFail ? { user: null, session: null } : { user, session },
        error: mockError,
      }),
      signInWithOtp: jest.fn().mockResolvedValue({
        data: shouldFail ? null : {},
        error: mockError,
      }),
      verifyOtp: jest.fn().mockResolvedValue({
        data: shouldFail ? { user: null, session: null } : { user, session },
        error: mockError,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      refreshSession: jest.fn().mockResolvedValue({
        data: shouldFail ? { user: null, session: null } : { user, session },
        error: mockError,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: shouldFail ? null : user },
        error: mockError,
      }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({
        data: shouldFail ? null : {},
        error: mockError,
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: shouldFail ? { user: null } : { user },
        error: mockError,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: shouldFail || table !== "users_profiles" ? null : profile,
            error: shouldFail ? { message: errorMessage } : null,
          }),
        })),
      })),
    })),
  };
}

// ============================================================================
// MOCK HELPERS
// ============================================================================

function createMockAuthError(code: string, message: string): AuthError {
  const error = new Error(message) as AuthError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error as any).__isAuthError = true;
  error.name = "AuthError";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error as any).status = 400;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (error as any).code = code;
  return error;
}

export const mockAuthError = (code: string, message: string): AuthError =>
  createMockAuthError(code, message);

// ============================================================================
// JEST MOCK SETUP
// ============================================================================

export function setupSupabaseMock() {
  const mockClient = createMockSupabaseClient();
  
  jest.mock("@supabase/supabase-js", () => ({
    createClient: jest.fn(() => mockClient),
    SupabaseClient: jest.fn(),
    AuthError: jest.fn(),
  }));

  return mockClient;
}
