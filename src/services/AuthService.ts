/**
 * AuthService - Service d'authentification
 * Gère la connexion, inscription et gestion des sessions utilisateur via Supabase
 */

import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { 
  User, 
  AuthCredentials, 
  AuthResponse, 
  AuthError,
  UserRole 
} from '../types/dpe';

export interface AuthConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class AuthService {
  private client: SupabaseClient;

  constructor(config: AuthConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Connexion avec email et mot de passe
   */
  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'AUTH_ERROR');
      }

      if (!data.user || !data.session) {
        throw new AuthError('Session invalide', 'INVALID_SESSION');
      }

      return {
        user: this.mapSupabaseUser(data.user),
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in
        },
        error: null
      };
    } catch (err) {
      if (err instanceof AuthError) {
        return { user: null, session: null, error: err };
      }
      return {
        user: null,
        session: null,
        error: new AuthError(
          err instanceof Error ? err.message : 'Erreur d\'authentification',
          'UNKNOWN_ERROR'
        )
      };
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(credentials: AuthCredentials, metadata?: { full_name?: string; role?: UserRole }): Promise<AuthResponse> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: metadata
        }
      });

      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'SIGNUP_ERROR');
      }

      if (!data.user) {
        throw new AuthError('Création utilisateur échouée', 'SIGNUP_FAILED');
      }

      return {
        user: this.mapSupabaseUser(data.user),
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in
        } : null,
        error: null
      };
    } catch (err) {
      if (err instanceof AuthError) {
        return { user: null, session: null, error: err };
      }
      return {
        user: null,
        session: null,
        error: new AuthError(
          err instanceof Error ? err.message : 'Erreur d\'inscription',
          'UNKNOWN_ERROR'
        )
      };
    }
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'SIGNOUT_ERROR');
      }
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Erreur de déconnexion')
      };
    }
  }

  /**
   * Récupération de mot de passe
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'RESET_ERROR');
      }
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Erreur de réinitialisation')
      };
    }
  }

  /**
   * Mise à jour du mot de passe
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword
      });
      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'UPDATE_ERROR');
      }
      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Erreur de mise à jour')
      };
    }
  }

  /**
   * Récupération de la session courante
   */
  async getSession(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.client.auth.getSession();
      
      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'SESSION_ERROR');
      }

      if (!data.session?.user) {
        return { user: null, error: null };
      }

      return {
        user: this.mapSupabaseUser(data.session.user),
        error: null
      };
    } catch (err) {
      return {
        user: null,
        error: err instanceof Error ? err : new Error('Erreur de récupération session')
      };
    }
  }

  /**
   * Récupération de l'utilisateur courant
   */
  async getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.client.auth.getUser();
      
      if (error) {
        throw new AuthError(error.message, error.status?.toString() || 'USER_ERROR');
      }

      if (!data.user) {
        return { user: null, error: null };
      }

      return {
        user: this.mapSupabaseUser(data.user),
        error: null
      };
    } catch (err) {
      return {
        user: null,
        error: err instanceof Error ? err : new Error('Erreur de récupération utilisateur')
      };
    }
  }

  /**
   * Écoute des changements d'état d'authentification
   */
  onAuthStateChange(callback: (event: string, user: User | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((event, session) => {
      callback(event, session?.user ? this.mapSupabaseUser(session.user) : null);
    });
    
    return () => data.subscription.unsubscribe();
  }

  /**
   * Vérification si l'utilisateur a un rôle spécifique
   */
  hasRole(user: User, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      diagnosticien: 2,
      assistant: 1,
      viewer: 0
    };

    const userRole = user.user_metadata.role || 'viewer';
    return roleHierarchy[userRole as UserRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Mapping d'un utilisateur Supabase vers notre type User
   */
  private mapSupabaseUser(supabaseUser: SupabaseUser): User {
    const metadata = supabaseUser.user_metadata as {
      full_name?: string;
      role?: UserRole;
      siret?: string;
      adresse_pro?: string;
      telephone?: string;
    } | undefined;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      user_metadata: {
        full_name: metadata?.full_name,
        role: metadata?.role || 'viewer',
        siret: metadata?.siret,
        adresse_pro: metadata?.adresse_pro,
        telephone: metadata?.telephone
      },
      created_at: supabaseUser.created_at,
      last_sign_in_at: supabaseUser.last_sign_in_at
    };
  }

  /**
   * Accès au client Supabase (pour les requêtes directes si nécessaire)
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}
