import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui";

/**
 * Bandeau d'installation PWA affiché en bas de l'écran.
 * Apparaît uniquement quand :
 * - L'app n'est pas déjà installée
 * - Le navigateur propose l'installation (beforeinstallprompt)
 * - L'utilisateur n'a pas fermé le bandeau
 * 
 * Sur iOS Safari, le prompt natif n'existe pas : on affiche
 * un guide "Ajouter à l'écran d'accueil" à la place.
 */
export function InstallPrompt() {
  const { canInstall, isInstalled, install, dismissed } = usePWAInstall();
  const [hidden, setHidden] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Détection iOS Safari (pas de beforeinstallprompt)
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone);

  // Ne rien afficher si déjà installé ou fermé
  if (isInstalled || hidden || dismissed) return null;

  // iOS : guide manuel
  if (isIOS && !canInstall) {
    return (
      <>
        {!showIOSGuide && (
          <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white p-4 pb-safe shadow-lg animate-fade-in">
            <div className="mx-auto flex max-w-sm items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-700">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-6m0 0V6m0 6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Installer Vision DPE
                </p>
                <p className="text-xs text-gray-500">
                  Accès rapide depuis votre écran d'accueil
                </p>
              </div>
              <Button size="sm" onClick={() => setShowIOSGuide(true)}>
                Comment ?
              </Button>
              <button
                onClick={() => setHidden(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowIOSGuide(false)}>
            <div
              className="w-full rounded-t-2xl bg-white p-6 pb-safe animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-900">
                Installer sur iPhone / iPad
              </h3>
              <ol className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                  <span>Appuyez sur le bouton <strong>Partager</strong> (carré avec flèche vers le haut) en bas de Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                  <span>Faites défiler et appuyez sur <strong>« Sur l'écran d'accueil »</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                  <span>Appuyez sur <strong>Ajouter</strong> en haut à droite</span>
                </li>
              </ol>
              <Button fullWidth className="mt-6" onClick={() => setShowIOSGuide(false)}>
                Compris
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android / Desktop : prompt natif
  if (!canInstall) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white p-4 pb-safe shadow-lg animate-fade-in">
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-700">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Installer Vision DPE
          </p>
          <p className="text-xs text-gray-500">
            Accès rapide, fonctionne hors ligne
          </p>
        </div>
        <Button size="sm" onClick={() => install()}>
          Installer
        </Button>
        <button
          onClick={() => setHidden(true)}
          className="p-1 text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
