/**
 * Setup global pour les tests Jest
 * Initialisation des mocks et configurations communes
 */

import { jest } from '@jest/globals';

// ============================================================================
// MOCK SUPABASE
// ============================================================================

export const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
  },
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  upsert: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  lte: jest.fn(() => mockSupabaseClient),
  like: jest.fn(() => mockSupabaseClient),
  ilike: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  in: jest.fn(() => mockSupabaseClient),
  contains: jest.fn(() => mockSupabaseClient),
  containedBy: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  overlaps: jest.fn(() => mockSupabaseClient),
  textSearch: jest.fn(() => mockSupabaseClient),
  filter: jest.fn(() => mockSupabaseClient),
  not: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  and: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(() => mockSupabaseClient),
  csv: jest.fn(() => mockSupabaseClient),
  returns: jest.fn(() => mockSupabaseClient),
  abortSignal: jest.fn(() => mockSupabaseClient),
  then: jest.fn((callback) => Promise.resolve(callback({ data: null, error: null }))),
  match: jest.fn(() => mockSupabaseClient),
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
};

// Mock du module Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// ============================================================================
// MOCK CONSOLE
// ============================================================================

// Supprimer les logs en mode test sauf erreurs
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;

global.beforeAll(() => {
  if (process.env.CI || process.env.SUPPRESS_LOGS === 'true') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
  }
});

global.afterAll(() => {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
});

// ============================================================================
// HELPERS DE TEST
// ============================================================================

/**
 * Crée une réponse mock Supabase réussie
 */
export function createMockSuccessResponse<T>(data: T, status = 200) {
  return {
    data,
    error: null,
    status,
    statusText: 'OK'
  };
}

/**
 * Crée une réponse mock Supabase en erreur
 */
export function createMockErrorResponse(message: string, code = 'ERROR', status = 400) {
  return {
    data: null,
    error: {
      message,
      code,
      details: null,
      hint: null
    },
    status,
    statusText: 'Error'
  };
}

/**
 * Réinitialise tous les mocks Supabase
 */
export function resetSupabaseMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.values(mockSupabaseClient).forEach((mock: jest.Mock | unknown) => {
    if (typeof (mock as jest.Mock).mockClear === 'function') {
      (mock as jest.Mock).mockClear();
    }
  });
  
  // Réinitialiser les méthodes chaînées
  ['from', 'select', 'insert', 'update', 'delete', 'eq', 'single'].forEach(method => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockSupabaseClient as unknown as Record<string, jest.Mock>)[method].mockReturnValue(mockSupabaseClient);
  });
}

/**
 * Configure une réponse de succès pour une requête SELECT
 */
export function mockSelectResponse<T>(data: T | T[]) {
  const response = createMockSuccessResponse(Array.isArray(data) ? data : [data]);
  mockSupabaseClient.from.mockReturnValue({
    ...mockSupabaseClient,
    select: jest.fn(() => ({
      ...mockSupabaseClient,
      eq: jest.fn(() => ({
        ...mockSupabaseClient,
        single: jest.fn(() => Promise.resolve(
          Array.isArray(data) 
            ? createMockSuccessResponse(data[0])
            : createMockSuccessResponse(data)
        ))
      })),
      single: jest.fn(() => Promise.resolve(
        Array.isArray(data) 
          ? createMockSuccessResponse(data[0])
          : createMockSuccessResponse(data)
      ))
    }))
  });
  return response;
}

/**
 * Configure une réponse d'erreur pour une requête
 */
export function mockErrorResponse(message: string, code = 'ERROR') {
  const response = createMockErrorResponse(message, code);
  mockSupabaseClient.from.mockReturnValue({
    ...mockSupabaseClient,
    select: jest.fn(() => ({
      ...mockSupabaseClient,
      eq: jest.fn(() => ({
        ...mockSupabaseClient,
        single: jest.fn(() => Promise.resolve(response))
      })),
      single: jest.fn(() => Promise.resolve(response))
    }))
  });
  return response;
}

// ============================================================================
// FIXTURES COMMUNES
// ============================================================================

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'diagnosticien'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser
};

export const mockDPEData = {
  id: 'dpe-123',
  numero_dpe: 'DPE-2024-001',
  user_id: 'user-123',
  adresse: '123 Rue de Test',
  code_postal: '75001',
  commune: 'Paris',
  type_batiment: 'maison',
  annee_construction: 1985,
  surface_habitable: 120,
  nombre_niveaux: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// ============================================================================
// EXTENSIONS JEST
// ============================================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDPE(): R;
      toHaveValidXMLStructure(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidDPE(received) {
    const hasValidStructure = 
      received &&
      typeof received === 'object' &&
      'numero_dpe' in received &&
      'adresse' in received &&
      'surface_habitable' in received;
    
    return {
      message: () => `expected ${received} to be a valid DPE object`,
      pass: hasValidStructure
    };
  },
  
  toHaveValidXMLStructure(received) {
    const hasXMLProlog = received.includes('<?xml');
    const hasRootElement = /<[A-Za-z_][\w\-]*\b[^>]*>/.test(received);
    
    return {
      message: () => `expected ${received} to have valid XML structure`,
      pass: hasXMLProlog && hasRootElement
    };
  }
});

// ============================================================================
// HOOKS GLOBALS
// ============================================================================

beforeEach(() => {
  resetSupabaseMocks();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});
