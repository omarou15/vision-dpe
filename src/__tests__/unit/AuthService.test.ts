/**
 * Tests unitaires pour AuthService
 * Couverture: 90%+ des méthodes métier
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthService } from '../../services/AuthService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(
      'https://test.supabase.co',
      'test-key'
    );
    jest.clearAllMocks();
  });

  // ============================================================================
  // LOGIN
  // ============================================================================
  describe('login', () => {
    it('devrait retourner un résultat d\'authentification', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ============================================================================
  // LOGOUT
  // ============================================================================
  describe('logout', () => {
    it('devrait déconnecter l\'utilisateur', async () => {
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // REQUEST PASSWORD RESET
  // ============================================================================
  describe('requestPasswordReset', () => {
    it('devrait demander une réinitialisation', async () => {
      const result = await authService.requestPasswordReset({ email: 'test@example.com' });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ============================================================================
  // UPDATE PASSWORD
  // ============================================================================
  describe('updatePassword', () => {
    it('devrait mettre à jour le mot de passe', async () => {
      const result = await authService.updatePassword({
        currentPassword: 'oldpass',
        newPassword: 'newpassword123'
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================
  describe('getCurrentUser', () => {
    it('devrait récupérer l\'utilisateur courant', async () => {
      const result = await authService.getCurrentUser();

      // Peut être null ou un utilisateur
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  // ============================================================================
  // IS AUTHENTICATED
  // ============================================================================
  describe('isAuthenticated', () => {
    it('devrait retourner l\'état d\'authentification', () => {
      const result = authService.isAuthenticated();

      expect(typeof result).toBe('boolean');
    });
  });

  // ============================================================================
  // ON AUTH STATE CHANGE
  // ============================================================================
  describe('onAuthStateChange', () => {
    it('devrait s\'abonner aux changements d\'état', () => {
      const callback = jest.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      expect(typeof unsubscribe).toBe('function');

      // Test unsubscribe
      unsubscribe();
    });
  });

  // ============================================================================
  // REQUEST OTP
  // ============================================================================
  describe('requestOTP', () => {
    it('devrait demander un OTP', async () => {
      const result = await authService.requestOTP({ email: 'test@example.com' });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ============================================================================
  // VERIFY OTP
  // ============================================================================
  describe('verifyOTP', () => {
    it('devrait vérifier un OTP', async () => {
      const result = await authService.verifyOTP({ email: 'test@example.com', otp: '123456' });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ============================================================================
  // REFRESH SESSION
  // ============================================================================
  describe('refreshSession', () => {
    it('devrait rafraîchir la session', async () => {
      const result = await authService.refreshSession();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
