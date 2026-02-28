import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { Button } from "@/components/ui";

/**
 * Toast affiché quand une nouvelle version est disponible.
 * L'utilisateur clique "Mettre à jour" → la page se recharge avec le nouveau build.
 */
export function UpdatePrompt() {
  const { needRefresh, updateServiceWorker, dismiss } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-fade-in rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
      role="alert"
    >
      <p className="text-sm font-medium text-gray-900">
        Nouvelle version disponible
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Cliquez pour mettre à jour l'application.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => updateServiceWorker()}>
          Mettre à jour
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Plus tard
        </Button>
      </div>
    </div>
  );
}
