/**
 * Types pour l'authentification et les profils utilisateurs
 */

// ============================================================================
// UTILISATEUR
// ============================================================================

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface UserProfile {
  fullName: string;
  company?: string;
  siret?: string;
  numeroDpeDiagnostiqueur?: string;
  phone?: string;
  adressePro?: string;
  codePostalPro?: string;
  communePro?: string;
}

// ============================================================================
// CREDENTIALS
// ============================================================================

export interface UserCredentials {
  email: string;
  password: string;
}

// ============================================================================
// ERREURS
// ============================================================================

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'INVALID_NAME'
  | 'INVALID_CREDENTIALS'
  | 'AUTH_ERROR'
  | 'USER_CREATION_FAILED'
  | 'PROFILE_CREATION_FAILED'
  | 'NOT_AUTHENTICATED'
  | 'UPDATE_FAILED'
  | 'RESET_FAILED'
  | 'UNKNOWN_ERROR';

// ============================================================================
// SESSION
// ============================================================================

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
