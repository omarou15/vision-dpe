/**
 * Interfaces pour les services core de Vision DPE
 * Phase 1 - Module Administratif
 */

import { ValidationResult, ValidationError } from "./validation";
import { DPEDocument, XMLExportOptions, XMLValidationResult } from "./dpe";

// ============================================================================
// AUTH SERVICE
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  company: string | null;
  numeroDpeDiagnostiqueur: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPRequest {
  email: string;
}

export interface OTPVerify {
  email: string;
  otp: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResult {
  success: boolean;
  data?: AuthSession | AuthUser;
  error?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface IAuthService {
  /**
   * Connexion avec email/password
   */
  login(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Demande d'OTP (One Time Password)
   */
  requestOTP(request: OTPRequest): Promise<AuthResult>;

  /**
   * Vérification de l'OTP et connexion
   */
  verifyOTP(verify: OTPVerify): Promise<AuthResult>;

  /**
   * Déconnexion
   */
  logout(): Promise<void>;

  /**
   * Rafraîchissement de la session
   */
  refreshSession(): Promise<AuthResult>;

  /**
   * Récupère l'utilisateur courant
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Demande de réinitialisation de mot de passe
   */
  requestPasswordReset(request: PasswordResetRequest): Promise<AuthResult>;

  /**
   * Mise à jour du mot de passe
   */
  updatePassword(update: PasswordUpdate): Promise<AuthResult>;

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean;

  /**
   * Écoute les changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}

// ============================================================================
// VALIDATION SERVICE
// ============================================================================

export interface ValidationRule<T = unknown> {
  id: string;
  field: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "enum" | "array" | "object" | "date";
  enumValues?: string[] | number[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: T, data: unknown) => ValidationError | null;
  message: string;
}

export interface ValidationContext {
  step?: number;
  strict?: boolean;
  partial?: boolean;
}

export interface ValidationOptions {
  context?: ValidationContext;
  includeWarnings?: boolean;
  stopOnFirstError?: boolean;
}

export interface CoherenceRule {
  id: string;
  description: string;
  check: (data: unknown) => boolean;
  message: string;
  severity: "error" | "warning";
  applicableSteps?: number[];
}

export interface IValidationService {
  /**
   * Valide un DPE complet ou partiel
   */
  validate(dpeData: unknown, options?: ValidationOptions): ValidationResult;

  /**
   * Valide une étape spécifique du wizard
   */
  validateStep(step: number, data: unknown): ValidationResult;

  /**
   * Valide un champ spécifique
   */
  validateField(field: string, value: unknown, data?: unknown): ValidationError | null;

  /**
   * Ajoute une règle de validation personnalisée
   */
  addRule(rule: ValidationRule): void;

  /**
   * Ajoute une règle de cohérence
   */
  addCoherenceRule(rule: CoherenceRule): void;

  /**
   * Récupère les règles pour une étape
   */
  getRulesForStep(step: number): ValidationRule[];

  /**
   * Vérifie si une étape est complète
   */
  isStepComplete(step: number, data: unknown): boolean;

  /**
   * Calcule la progression globale
   */
  calculateProgress(data: unknown): number;
}

// ============================================================================
// XML GENERATOR SERVICE
// ============================================================================

export enum XMLGenerationStatus {
  PENDING = "pending",
  GENERATING = "generating",
  SUCCESS = "success",
  ERROR = "error",
  VALIDATED = "validated",
}

export interface XMLGenerationResult {
  status: XMLGenerationStatus;
  xmlContent?: string;
  fileName?: string;
  fileSize?: number;
  generatedAt?: string;
  errors?: XMLGenerationError[];
  warnings?: XMLGenerationError[];
}

export interface XMLGenerationError {
  code: string;
  message: string;
  path?: string;
  line?: number;
}

export interface XMLValidationOptions {
  validateAgainstXSD?: boolean;
  checkCoherence?: boolean;
  strictMode?: boolean;
}

export interface XMLExportConfig {
  version: "2.6";
  format: "standard" | "complet";
  includePhotos: boolean;
  includeSignatures: boolean;
  encoding: "UTF-8";
}

export interface IXMLGeneratorService {
  /**
   * Génère le XML ADEME à partir d'un DPE
   */
  generate(dpeData: DPEDocument, config?: Partial<XMLExportConfig>): XMLGenerationResult;

  /**
   * Génère le XML de manière asynchrone
   */
  generateAsync(
    dpeData: DPEDocument,
    config?: Partial<XMLExportConfig>
  ): Promise<XMLGenerationResult>;

  /**
   * Valide un XML généré
   */
  validate(xmlContent: string, options?: XMLValidationOptions): XMLValidationResult;

  /**
   * Exporte le XML vers un fichier
   */
  exportToFile(
    xmlContent: string,
    fileName: string,
    directory: string
  ): Promise<{ success: boolean; path?: string; error?: string }>;

  /**
   * Parse un XML existant en objet DPE
   */
  parse(xmlContent: string): { success: boolean; data?: DPEDocument; errors?: string[] };

  /**
   * Récupère la configuration par défaut
   */
  getDefaultConfig(): XMLExportConfig;

  /**
   * Vérifie si la version XML est supportée
   */
  isVersionSupported(version: string): boolean;
}
