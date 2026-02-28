import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook principal d'authentification.
 * Initialise automatiquement le store au premier rendu.
 *
 * Usage:
 * ```tsx
 * const { profile, isAuthenticated, isLoading, login, logout } = useAuth();
 * ```
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    // Initialiser une seule fois au montage
    if (store.isLoading && !store.isAuthenticated && !store.profile) {
      store.initialize();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return store;
}
