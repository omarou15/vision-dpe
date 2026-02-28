import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallState {
  /** Le prompt d'installation est disponible */
  canInstall: boolean;
  /** L'app est déjà installée (mode standalone) */
  isInstalled: boolean;
  /** Déclenche le prompt d'installation natif du navigateur */
  install: () => Promise<boolean>;
  /** L'utilisateur a fermé le prompt manuellement */
  dismissed: boolean;
}

/**
 * Hook pour gérer l'installation PWA.
 * 
 * - Capture l'événement `beforeinstallprompt` du navigateur
 * - Détecte si l'app tourne déjà en mode standalone
 * - Expose une fonction `install()` pour déclencher le prompt
 * 
 * Usage:
 * ```tsx
 * const { canInstall, isInstalled, install } = usePWAInstall();
 * if (canInstall) return <Button onClick={install}>Installer</Button>;
 * ```
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Détection mode standalone (déjà installée)
  const isInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as unknown as { standalone: boolean }).standalone === true));

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Détecte quand l'app est installée
    const installedHandler = () => {
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      return true;
    }

    setDismissed(true);
    return false;
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    install,
    dismissed,
  };
}
