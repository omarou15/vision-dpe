/**
 * Mocks pour les tests des services
 * Mock de Supabase et autres dépendances externes
 */

import { User, Session, AuthError } from "@supabase/supabase-js";

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
  phone_change_sent_at: undefined,
  reauthentication_sent_at: undefined,
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
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const createMockSupabaseClient = () => {
  return {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  };
};

export const mockAuthError: AuthError = {
  name: "AuthError",
  message: "Invalid credentials",
  status: 400,
  code: "invalid_credentials",
};
