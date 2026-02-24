/**
 * SyncService - Service de synchronisation offline/online
 * Phase 1 - Core Services
 * 
 * Gère la synchronisation des données entre le stockage local et le serveur:
 * - Détection de la connectivité
 * - File d'attente des opérations offline
 * - Synchronisation bidirectionnelle
 * - Gestion des conflits
 */

import { DPEDocument } from "../types/dpe";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export enum SyncStatus {
  /** Synchronisé */
  SYNCED = "synced",
  /** En attente de synchronisation */
  PENDING = "pending",
  /** Synchronisation en cours */
  SYNCING = "syncing",
  /** Erreur de synchronisation */
  ERROR = "error",
  /** Conflit détecté */
  CONFLICT = "conflict",
}

export enum NetworkStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  UNKNOWN = "unknown",
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

export interface SyncOperation {
  id: string;
  type: OperationType;
  entityType: "dpe" | "user" | "config";
  entityId: string;
  data?: unknown;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: string;
  pendingOperations: number;
  networkStatus: NetworkStatus;
}

export interface SyncResult {
  success: boolean;
  operationsProcessed: number;
  operationsFailed: number;
  errors?: SyncError[];
}

export interface SyncError {
  operationId: string;
  code: string;
  message: string;
}

export interface ConflictResolution {
  strategy: "local" | "remote" | "merge" | "manual";
  resolvedData?: unknown;
}

export interface ISyncService {
  /**
   * Initialise le service de synchronisation
   */
  initialize(): Promise<void>;

  /**
   * Vérifie l'état de la connexion
   */
  checkNetworkStatus(): NetworkStatus;

  /**
   * Ajoute une opération à la file d'attente
   */
  queueOperation(operation: Omit<SyncOperation, "id" | "timestamp" | "retryCount">): Promise<string>;

  /**
   * Synchronise les données
   */
  sync(): Promise<SyncResult>;

  /**
   * Synchronise un DPE spécifique
   */
  syncDPE(dpeId: string): Promise<{ success: boolean; error?: SyncError }>;

  /**
   * Récupère l'état de synchronisation
   */
  getSyncState(): SyncState;

  /**
   * Résout un conflit
   */
  resolveConflict(operationId: string, resolution: ConflictResolution): Promise<boolean>;

  /**
   * Annule une opération en attente
   */
  cancelOperation(operationId: string): Promise<boolean>;

  /**
   * Vide la file d'attente
   */
  clearQueue(): Promise<void>;

  /**
   * Force une synchronisation complète
   */
  forceFullSync(): Promise<SyncResult>;

  /**
   * Écoute les changements de statut réseau
   */
  onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void;

  /**
   * Écoute les changements de statut de synchronisation
   */
  onSyncStatusChange(callback: (state: SyncState) => void): () => void;
}

// ============================================================================
// STOCKAGE LOCAL (SIMULÉ)
// ============================================================================

interface LocalStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

class MemoryLocalStorage implements LocalStorageAdapter {
  private storage = new Map<string, unknown>();

  async getItem<T>(key: string): Promise<T | null> {
    return (this.storage.get(key) as T) ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

// ============================================================================
// SERVICE DE SYNCHRONISATION
// ============================================================================

export class SyncService implements ISyncService {
  private localStorage: LocalStorageAdapter;
  private networkStatus: NetworkStatus = NetworkStatus.UNKNOWN;
  private syncStatus: SyncStatus = SyncStatus.SYNCED;
  private lastSyncAt?: string;
  private operationQueue: SyncOperation[] = [];
  private networkListeners: Array<(status: NetworkStatus) => void> = [];
  private syncListeners: Array<(state: SyncState) => void> = [];
  private syncInProgress = false;
  private readonly maxRetries = 3;
  private readonly STORAGE_KEY_QUEUE = "sync_queue";
  private readonly STORAGE_KEY_LAST_SYNC = "sync_last_sync";

  constructor(localStorage?: LocalStorageAdapter) {
    this.localStorage = localStorage ?? new MemoryLocalStorage();
  }

  /**
   * Initialise le service de synchronisation
   */
  async initialize(): Promise<void> {
    // Charge la file d'attente existante
    const savedQueue = await this.localStorage.getItem<SyncOperation[]>(this.STORAGE_KEY_QUEUE);
    if (savedQueue) {
      this.operationQueue = savedQueue;
    }

    // Charge la dernière synchronisation
    this.lastSyncAt = await this.localStorage.getItem<string>(this.STORAGE_KEY_LAST_SYNC) ?? undefined;

    // Vérifie l'état du réseau
    this.checkNetworkStatus();

    // Écoute les changements de connectivité (simulation pour Phase 1)
    this.setupNetworkListeners();
  }

  /**
   * Configure les écouteurs de réseau
   */
  private setupNetworkListeners(): void {
    // En environnement navigateur, on utiliserait:
    // window.addEventListener('online', ...)
    // window.addEventListener('offline', ...)
    
    // Pour la Phase 1, simulation
    setInterval(() => {
      const newStatus = Math.random() > 0.1 ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE;
      if (newStatus !== this.networkStatus) {
        this.networkStatus = newStatus;
        this.notifyNetworkStatusChange(newStatus);
        
        // Si on revient online, tente une synchronisation
        if (newStatus === NetworkStatus.ONLINE && this.operationQueue.length > 0) {
          void this.sync();
        }
      }
    }, 30000); // Vérifie toutes les 30 secondes
  }

  /**
   * Vérifie l'état de la connexion
   */
  checkNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ajoute une opération à la file d'attente
   */
  async queueOperation(
    operation: Omit<SyncOperation, "id" | "timestamp" | "retryCount">
  ): Promise<string> {
    const newOperation: SyncOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.operationQueue.push(newOperation);
    await this.saveQueue();

    this.updateSyncStatus(SyncStatus.PENDING);

    // Si online, tente de synchroniser immédiatement
    if (this.networkStatus === NetworkStatus.ONLINE && !this.syncInProgress) {
      void this.sync();
    }

    return newOperation.id;
  }

  /**
   * Sauvegarde la file d'attente
   */
  private async saveQueue(): Promise<void> {
    await this.localStorage.setItem(this.STORAGE_KEY_QUEUE, this.operationQueue);
  }

  /**
   * Synchronise les données
   */
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        operationsProcessed: 0,
        operationsFailed: 0,
        errors: [{ operationId: "", code: "SYNC_IN_PROGRESS", message: "Synchronisation déjà en cours" }],
      };
    }

    if (this.networkStatus === NetworkStatus.OFFLINE) {
      return {
        success: false,
        operationsProcessed: 0,
        operationsFailed: 0,
        errors: [{ operationId: "", code: "OFFLINE", message: "Hors ligne" }],
      };
    }

    this.syncInProgress = true;
    this.updateSyncStatus(SyncStatus.SYNCING);

    const errors: SyncError[] = [];
    let processed = 0;
    let failed = 0;

    try {
      // Traite les opérations en attente
      const operationsToProcess = [...this.operationQueue];
      
      for (const operation of operationsToProcess) {
        try {
          await this.processOperation(operation);
          processed++;
          
          // Retire l'opération de la file
          this.operationQueue = this.operationQueue.filter((op) => op.id !== operation.id);
        } catch (error) {
          failed++;
          operation.retryCount++;
          
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
          operation.lastError = errorMessage;
          
          errors.push({
            operationId: operation.id,
            code: "PROCESSING_ERROR",
            message: errorMessage,
          });

          // Si trop de tentatives, marque comme en erreur
          if (operation.retryCount >= this.maxRetries) {
            this.operationQueue = this.operationQueue.filter((op) => op.id !== operation.id);
          }
        }
      }

      await this.saveQueue();

      // Met à jour le statut
      if (failed === 0 && this.operationQueue.length === 0) {
        this.updateSyncStatus(SyncStatus.SYNCED);
        this.lastSyncAt = new Date().toISOString();
        await this.localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, this.lastSyncAt);
      } else if (failed > 0) {
        this.updateSyncStatus(SyncStatus.ERROR);
      } else {
        this.updateSyncStatus(SyncStatus.PENDING);
      }

      return {
        success: failed === 0,
        operationsProcessed: processed,
        operationsFailed: failed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.updateSyncStatus(SyncStatus.ERROR);
      
      return {
        success: false,
        operationsProcessed: processed,
        operationsFailed: failed,
        errors: [
          {
            operationId: "",
            code: "SYNC_ERROR",
            message: error instanceof Error ? error.message : "Erreur de synchronisation",
          },
        ],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Traite une opération de synchronisation
   */
  private async processOperation(_operation: SyncOperation): Promise<void> {
    // Simulation du traitement côté serveur
    // En production, appel API ici
    
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulation: 5% d'échec aléatoire
        if (Math.random() < 0.05) {
          reject(new Error("Erreur réseau simulée"));
        } else {
          resolve(undefined);
        }
      }, 100);
    });
  }

  /**
   * Synchronise un DPE spécifique
   */
  async syncDPE(dpeId: string): Promise<{ success: boolean; error?: SyncError }> {
    // Vérifie si une opération existe déjà pour ce DPE
    const existingOp = this.operationQueue.find(
      (op) => op.entityType === "dpe" && op.entityId === dpeId
    );

    if (existingOp) {
      // Priorise l'opération existante
      this.operationQueue = this.operationQueue.filter((op) => op.id !== existingOp.id);
      this.operationQueue.unshift(existingOp);
      await this.saveQueue();
    }

    // Lance la synchronisation
    const result = await this.sync();

    return {
      success: result.success,
      error: result.errors?.find((e) => e.operationId === existingOp?.id),
    };
  }

  /**
   * Récupère l'état de synchronisation
   */
  getSyncState(): SyncState {
    return {
      status: this.syncStatus,
      lastSyncAt: this.lastSyncAt,
      pendingOperations: this.operationQueue.length,
      networkStatus: this.networkStatus,
    };
  }

  /**
   * Résout un conflit
   */
  async resolveConflict(operationId: string, resolution: ConflictResolution): Promise<boolean> {
    const operation = this.operationQueue.find((op) => op.id === operationId);
    
    if (!operation) {
      return false;
    }

    switch (resolution.strategy) {
      case "local":
        // Garde les données locales, retire le conflit
        operation.retryCount = 0;
        break;
      case "remote":
        // Accepte les données distantes, retire l'opération
        this.operationQueue = this.operationQueue.filter((op) => op.id !== operationId);
        break;
      case "merge":
        // Fusionne les données
        if (resolution.resolvedData) {
          operation.data = resolution.resolvedData;
          operation.retryCount = 0;
        }
        break;
      case "manual":
        // Attend une résolution manuelle
        return true;
    }

    await this.saveQueue();
    
    // Relance la synchronisation
    if (this.networkStatus === NetworkStatus.ONLINE) {
      void this.sync();
    }

    return true;
  }

  /**
   * Annule une opération en attente
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    const initialLength = this.operationQueue.length;
    this.operationQueue = this.operationQueue.filter((op) => op.id !== operationId);
    
    if (this.operationQueue.length < initialLength) {
      await this.saveQueue();
      
      if (this.operationQueue.length === 0) {
        this.updateSyncStatus(SyncStatus.SYNCED);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Vide la file d'attente
   */
  async clearQueue(): Promise<void> {
    this.operationQueue = [];
    await this.saveQueue();
    this.updateSyncStatus(SyncStatus.SYNCED);
  }

  /**
   * Force une synchronisation complète
   */
  async forceFullSync(): Promise<SyncResult> {
    // Réinitialise les compteurs de retry
    this.operationQueue.forEach((op) => {
      op.retryCount = 0;
      op.lastError = undefined;
    });

    await this.saveQueue();

    return this.sync();
  }

  /**
   * Met à jour le statut de synchronisation
   */
  private updateSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.notifySyncStatusChange(this.getSyncState());
  }

  /**
   * Notifie les écouteurs de changement de statut réseau
   */
  private notifyNetworkStatusChange(status: NetworkStatus): void {
    this.networkListeners.forEach((callback) => {
      try {
        callback(status);
      } catch {
        // Ignore les erreurs de callback
      }
    });
  }

  /**
   * Notifie les écouteurs de changement de statut de synchronisation
   */
  private notifySyncStatusChange(state: SyncState): void {
    this.syncListeners.forEach((callback) => {
      try {
        callback(state);
      } catch {
        // Ignore les erreurs de callback
      }
    });
  }

  /**
   * Écoute les changements de statut réseau
   */
  onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.networkListeners.push(callback);
    
    return () => {
      const index = this.networkListeners.indexOf(callback);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  /**
   * Écoute les changements de statut de synchronisation
   */
  onSyncStatusChange(callback: (state: SyncState) => void): () => void {
    this.syncListeners.push(callback);
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Crée une opération de création de DPE
   */
  async queueDPECreate(dpeId: string, data: DPEDocument): Promise<string> {
    return this.queueOperation({
      type: OperationType.CREATE,
      entityType: "dpe",
      entityId: dpeId,
      data,
    });
  }

  /**
   * Crée une opération de mise à jour de DPE
   */
  async queueDPEUpdate(dpeId: string, data: Partial<DPEDocument>): Promise<string> {
    return this.queueOperation({
      type: OperationType.UPDATE,
      entityType: "dpe",
      entityId: dpeId,
      data,
    });
  }

  /**
   * Crée une opération de suppression de DPE
   */
  async queueDPEDelete(dpeId: string): Promise<string> {
    return this.queueOperation({
      type: OperationType.DELETE,
      entityType: "dpe",
      entityId: dpeId,
    });
  }
}

// Export singleton factory
let syncServiceInstance: SyncService | null = null;

export function createSyncService(localStorage?: LocalStorageAdapter): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(localStorage);
  }
  return syncServiceInstance;
}

export function getSyncService(): SyncService | null {
  return syncServiceInstance;
}

export function resetSyncService(): void {
  syncServiceInstance = null;
}
