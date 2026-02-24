/**
 * AuthService - Service d'authentification Supabase
 * Phase 1 - Module Administratif
 * 
 * Gère l'authentification des diagnostiqueurs via:
 * - Email/password
 * - OTP (One Time Password)
 * - Sessions et tokens
 */

import {
  createClient,
  SupabaseClient,
  AuthError as SupabaseAuthError,
  Session,
  User,
} from "@supabase/supabase-js";
import {
  IAuthService,
  AuthUser,
  LoginCredentials,
  OTPRequest,
  OTPVerify,
  AuthSession,
  PasswordResetRequest,
  PasswordUpdate,
  AuthResult,
  AuthError,
} from "../types/services";

interface UserProfile {
  id: string;
  full_name: string | null;
  company: string | null;
  numero_dpe_diagnostiqueur: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export class AuthService implements IAuthService {
  private supabase: SupabaseClient;
  private currentSession: AuthSession | null = null;
  private authStateCallbacks: Array<(user: AuthUser | null) => void> = [];

  constructor(
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Écoute les changements d'état d'authentification
    this.supabase.auth.onAuthStateChange((event, session) => {
      void this.handleAuthStateChange(event, session);
    });
  }

  /**
   * Mappe un utilisateur Supabase vers AuthUser
   */
  private mapToAuthUser(user: User, profile?: UserProfile | null): AuthUser {
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? (user.user_metadata?.["full_name"] as string) ?? null,
      company: profile?.company ?? null,
      numeroDpeDiagnostiqueur: profile?.numero_dpe_diagnostiqueur ?? null,
      phone: profile?.phone ?? user.phone ?? null,
      createdAt: profile?.created_at ?? user.created_at,
      updatedAt: profile?.updated_at ?? user.updated_at ?? user.created_at,
    };
  }

  /**
   * Mappe une session Supabase vers AuthSession
   */
  private mapToAuthSession(session: Session, profile?: UserProfile | null): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      user: this.mapToAuthUser(session.user, profile),
    };
  }

  /**
   * Récupère le profil utilisateur depuis la base
   */
  private async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from("users_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as UserProfile;
  }

  /**
   * Convertit une erreur Supabase en AuthError
   */
  private mapAuthError(error: SupabaseAuthError | Error | unknown): AuthError {
    const err = error as SupabaseAuthError;
    const code = err.status?.toString() ?? "unknown_error";
    
    const errorMessages: Record<string, string> = {
      "400": "Requête invalide",
      "401": "Non autorisé",
      "403": "Accès interdit",
      "404": "Utilisateur non trouvé",
      "422": "Email invalide ou déjà utilisé",
      "429": "Trop de tentatives, veuillez réessayer plus tard",
      "500": "Erreur serveur",
      "invalid_credentials": "Email ou mot de passe incorrect",
      "user_not_found": "Utilisateur non trouvé",
      "otp_expired": "Code OTP expiré",
      "otp_invalid": "Code OTP invalide",
    };

    return {
      code,
      message: errorMessages[code] ?? err.message ?? "Une erreur est survenue",
      field: err.code === "invalid_credentials" ? "email" : undefined,
    };
  }

  /**
   * Gère les changements d'état d'authentification
   */
  private async handleAuthStateChange(
    _event: string,
    session: Session | null
  ): Promise<void> {
    if (session) {
      const profile = await this.fetchUserProfile(session.user.id);
      this.currentSession = this.mapToAuthSession(session, profile);
      this.notifyAuthStateChange(this.currentSession.user);
    } else {
      this.currentSession = null;
      this.notifyAuthStateChange(null);
    }
  }

  /**
   * Notifie les callbacks d'état d'authentification
   */
  private notifyAuthStateChange(user: AuthUser | null): void {
    this.authStateCallbacks.forEach((callback) => {
      try {
        callback(user);
      } catch {
        // Ignore les erreurs de callback
      }
    });
  }

  /**
   * Connexion avec email/password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: { code: "no_session", message: "Session non créée" },
        };
      }

      const profile = await this.fetchUserProfile(data.user.id);
      this.currentSession = this.mapToAuthSession(data.session, profile);

      return {
        success: true,
        data: this.currentSession,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapAuthError(error),
      };
    }
  }

  /**
   * Demande d'OTP (One Time Password)
   * Envoie un code OTP à l'email spécifié
   */
  async requestOTP(request: OTPRequest): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signInWithOtp({
        email: request.email,
        options: {
          shouldCreateUser: false, // Ne crée pas d'utilisateur s'il n'existe pas
        },
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapAuthError(error),
      };
    }
  }

  /**
   * Vérification de l'OTP et connexion
   */
  async verifyOTP(verify: OTPVerify): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        email: verify.email,
        token: verify.otp,
        type: "email",
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: { code: "no_session", message: "Session non créée" },
        };
      }

      const profile = await this.fetchUserProfile(data.user.id);
      this.currentSession = this.mapToAuthSession(data.session, profile);

      return {
        success: true,
        data: this.currentSession,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapAuthError(error),
      };
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentSession = null;
    this.notifyAuthStateChange(null);
  }

  /**
   * Rafraîchissement de la session
   */
  async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: { code: "no_session", message: "Impossible de rafraîchir la session" },
        };
      }

      const profile = await this.fetchUserProfile(data.user.id);
      this.currentSession = this.mapToAuthSession(data.session, profile);

      return {
        success: true,
        data: this.currentSession,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapAuthError(error),
      };
    }
  }

  /**
   * Récupère l'utilisateur courant
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentSession) {
      return this.currentSession.user;
    }

    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const profile = await this.fetchUserProfile(user.id);
    return this.mapToAuthUser(user, profile);
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(
        request.email,
        {
          redirectTo: "https://vision-dpe.fr/reset-password",
        }
      );

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapAuthError(error),
      };
    }
  }

  /**
   * Mise à jour du mot de passe
   */
  async updatePassword(update: PasswordUpdate): Promise<AuthResult> {
    try {
      // Vérifie d'abord le mot de passe actuel
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: { code: "not_authenticated", message: "Utilisateur non connecté" },
        };
      }

      // Met à jour le mot de passe
      const { error } = await this.supabase.auth.updateUser({
        password: update.newPassword,
      });

      if (error) {
        return {
          success: false,
          error: this.mapAuthError(error),
        };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: this.mapAuthError(error),
      };
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Écoute les changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateCallbacks.push(callback);
    
    // Retourne une fonction pour se désabonner
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }
}

// Export singleton factory
let authServiceInstance: AuthService | null = null;

export function createAuthService(
  supabaseUrl: string,
  supabaseKey: string
): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(supabaseUrl, supabaseKey);
  }
  return authServiceInstance;
}

export function getAuthService(): AuthService | null {
  return authServiceInstance;
}
