/**
 * Service d'authentification et gestion des profils utilisateurs
 * Intégration avec Supabase Auth
 */

import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';

// ============================================================================
// TYPES LOCAUX
// ============================================================================

export interface AuthError {
  code: string;
  message: string;
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
// TYPES
// ============================================================================

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  company?: string;
  siret?: string;
  numeroDpeDiagnostiqueur?: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserWithProfile;
  error?: AuthError;
}

export interface UserWithProfile extends User {
  profile: UserProfile;
}

export interface ProfileUpdateData {
  fullName?: string;
  company?: string;
  siret?: string;
  numeroDpeDiagnostiqueur?: string;
  phone?: string;
  adressePro?: string;
  codePostalPro?: string;
  communePro?: string;
}

// ============================================================================
// SERVICE AUTH
// ============================================================================

export class AuthService {
  private static instance: AuthService;
  private currentUser: UserWithProfile | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ============================================================================
  // AUTHENTIFICATION
  // ============================================================================

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // Validation des données
      const validationError = this.validateSignUpData(data);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Création du compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { success: false, error: { code: 'AUTH_ERROR', message: authError.message } };
      }

      if (!authData.user) {
        return { success: false, error: { code: 'USER_CREATION_FAILED', message: 'Échec création utilisateur' } };
      }

      // Création du profil
      const { error: profileError } = await supabase
        .from('users_profiles')
        .insert({
          id: authData.user.id,
          full_name: data.fullName,
          company: data.company,
          siret: data.siret,
          numero_dpe_diagnostiqueur: data.numeroDpeDiagnostiqueur,
          phone: data.phone,
          email: data.email,
        });

      if (profileError) {
        // Rollback: supprimer l'utilisateur auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: { code: 'PROFILE_CREATION_FAILED', message: profileError.message } };
      }

      this.currentUser = await this.buildUser(authData.user.id);
      return { success: true, user: this.currentUser };

    } catch {
      return { success: false, error: { code: 'UNKNOWN_ERROR', message: 'Erreur inconnue' } };
    }
  }

  /**
   * Connexion utilisateur
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      // Validation
      if (!data.email || !data.password) {
        return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email et mot de passe requis' } };
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' } };
      }

      this.currentUser = await this.buildUser(authData.user.id);
      return { success: true, user: this.currentUser };

    } catch {
      return { success: false, error: { code: 'UNKNOWN_ERROR', message: 'Erreur inconnue' } };
    }
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
  }

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser(): Promise<UserWithProfile | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    this.currentUser = await this.buildUser(user.id);
    return this.currentUser;
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // ============================================================================
  // GESTION DU PROFIL
  // ============================================================================

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(data: ProfileUpdateData): Promise<AuthResult> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Utilisateur non connecté' } };
      }

      const updateData: Record<string, unknown> = {};
      if (data.fullName) updateData.full_name = data.fullName;
      if (data.company !== undefined) updateData.company = data.company;
      if (data.siret !== undefined) updateData.siret = data.siret;
      if (data.numeroDpeDiagnostiqueur !== undefined) updateData.numero_dpe_diagnostiqueur = data.numeroDpeDiagnostiqueur;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.adressePro !== undefined) updateData.adresse_pro = data.adressePro;
      if (data.codePostalPro !== undefined) updateData.code_postal_pro = data.codePostalPro;
      if (data.communePro !== undefined) updateData.commune_pro = data.communePro;

      const { error } = await supabase
        .from('users_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
      }

      this.currentUser = await this.buildUser(user.id);
      return { success: true, user: this.currentUser };

    } catch {
      return { success: false, error: { code: 'UNKNOWN_ERROR', message: 'Erreur inconnue' } };
    }
  }

  /**
   * Récupérer le profil complet
   */
  async getProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser();
    return user?.profile || null;
  }

  // ============================================================================
  // RÉINITIALISATION MOT DE PASSE
  // ============================================================================

  /**
   * Demander réinitialisation mot de passe
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'vision-dpe://reset-password',
      });

      if (error) {
        return { success: false, error: { code: 'RESET_FAILED', message: error.message } };
      }

      return { success: true };
    } catch {
      return { success: false, error: { code: 'UNKNOWN_ERROR', message: 'Erreur inconnue' } };
    }
  }

  /**
   * Mettre à jour le mot de passe
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      // Validation du mot de passe
      if (!this.isValidPassword(newPassword)) {
        return { success: false, error: { code: 'INVALID_PASSWORD', message: 'Le mot de passe doit contenir au moins 8 caractères' } };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
      }

      return { success: true };
    } catch {
      return { success: false, error: { code: 'UNKNOWN_ERROR', message: 'Erreur inconnue' } };
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private async buildUser(userId: string): Promise<UserWithProfile> {
    const { data: profile, error } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error('Profil non trouvé');
    }

    return {
      id: userId,
      email: profile.email,
      profile: {
        fullName: profile.full_name,
        company: profile.company,
        siret: profile.siret,
        numeroDpeDiagnostiqueur: profile.numero_dpe_diagnostiqueur,
        phone: profile.phone,
        adressePro: profile.adresse_pro,
        codePostalPro: profile.code_postal_pro,
        communePro: profile.commune_pro,
      },
    };
  }

  private validateSignUpData(data: SignUpData): AuthError | null {
    if (!data.email || !this.isValidEmail(data.email)) {
      return { code: 'INVALID_EMAIL', message: 'Email invalide' };
    }

    if (!data.password || !this.isValidPassword(data.password)) {
      return { code: 'INVALID_PASSWORD', message: 'Mot de passe invalide (min 8 caractères)' };
    }

    if (!data.fullName || data.fullName.length < 2) {
      return { code: 'INVALID_NAME', message: 'Nom complet requis' };
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }
}

// Export singleton
export const authService = AuthService.getInstance();
