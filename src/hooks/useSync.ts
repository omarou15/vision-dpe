import { useEffect, useRef, useCallback, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuthStore } from "@/store/authStore";
import * as syncService from "@/services/sync";

interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  error: string | null;
  /** Déclenche une sync manuelle */
  syncNow: () => Promise<void>;
}

/** Intervalle de sync automatique : 5 minutes */
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Hook de synchronisation automatique.
 * 
 * - Sync au montage (si online)
 * - Sync quand le réseau revient (offline → online)
 * - Sync périodique toutes les 5 minutes
 * - Expose syncNow() pour sync manuelle
 */
export function useSync(): SyncState {
  const isOnline = useOnlineStatus();
  const organisation = useAuthStore((s) => s.organisation);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasOfflineRef = useRef(false);

  const orgId = organisation?.id;

  const doSync = useCallback(async () => {
    if (!orgId || !isOnline || isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncService.syncAll(orgId);

      if (result.errors > 0) {
        setError(`${result.errors} erreur(s) de synchronisation`);
      }

      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError("Erreur de synchronisation");
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
      // Mettre à jour le compteur pending
      const count = await syncService.getPendingSyncCount();
      setPendingCount(count);
    }
  }, [orgId, isOnline, isSyncing]);

  // Sync au montage
  useEffect(() => {
    if (orgId && isOnline) {
      doSync();
    }
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync quand le réseau revient
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      doSync();
    }
  }, [isOnline, doSync]);

  // Sync périodique
  useEffect(() => {
    if (orgId && isOnline) {
      intervalRef.current = setInterval(doSync, SYNC_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orgId, isOnline, doSync]);

  // Mettre à jour le compteur pending régulièrement
  useEffect(() => {
    const updateCount = async () => {
      const count = await syncService.getPendingSyncCount();
      setPendingCount(count);
    };
    updateCount();
    const id = setInterval(updateCount, 10_000);
    return () => clearInterval(id);
  }, []);

  return {
    isSyncing,
    lastSyncedAt,
    pendingCount,
    error,
    syncNow: doSync,
  };
}
