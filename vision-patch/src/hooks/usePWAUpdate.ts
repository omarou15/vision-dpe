import { useState, useCallback, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

interface PWAUpdateState {
  /** Une mise à jour est disponible */
  needRefresh: boolean;
  /** Applique la mise à jour et recharge la page */
  updateServiceWorker: () => Promise<void>;
  /** Ferme la notification de mise à jour */
  dismiss: () => void;
}

/**
 * Hook pour gérer les mises à jour du Service Worker.
 * 
 * Quand un nouveau build est déployé sur Vercel :
 * 1. Le Service Worker détecte le changement
 * 2. `needRefresh` passe à `true`
 * 3. On affiche un toast "Mise à jour disponible"
 * 4. L'utilisateur clique → `updateServiceWorker()` recharge avec la nouvelle version
 * 
 * Usage:
 * ```tsx
 * const { needRefresh, updateServiceWorker, dismiss } = usePWAUpdate();
 * if (needRefresh) return <Toast action={updateServiceWorker} />;
 * ```
 */
export function usePWAUpdate(): PWAUpdateState {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Vérifie les mises à jour toutes les heures
      if (registration) {
        setInterval(
          () => {
            registration.update().catch(() => {
              // Silencieux en cas d'erreur réseau
            });
          },
          60 * 60 * 1000 // 1 heure
        );
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  const dismiss = useCallback(() => {
    setDismissed(true);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  // Reset dismissed quand une nouvelle mise à jour arrive
  useEffect(() => {
    if (needRefresh) {
      setDismissed(false);
    }
  }, [needRefresh]);

  return {
    needRefresh: needRefresh && !dismissed,
    updateServiceWorker: () => updateServiceWorker(true),
    dismiss,
  };
}
