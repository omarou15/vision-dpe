import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/utils/cn";

/**
 * Bandeau affiché en haut de l'écran quand l'utilisateur perd la connexion.
 * Disparaît automatiquement quand la connexion revient.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md",
        "animate-fade-in"
      )}
      role="status"
      aria-live="polite"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-2.828 2.828a1 1 0 010 1.414"
        />
      </svg>
      {t("common.offline")} — {t("common.syncing")}
    </div>
  );
}
