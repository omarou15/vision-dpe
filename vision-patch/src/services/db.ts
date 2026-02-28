import Dexie, { type Table } from "dexie";
import type { ProjectType, ProjectStatus, LogementType, DpeClass } from "@/types";

// ── Types pour le cache local ──

/** Projet stocké en IndexedDB — miroir simplifié de la table Supabase */
export interface LocalProjet {
  /** UUID identique à Supabase */
  id: string;
  organisation_id: string;
  created_by: string;
  assigned_to: string | null;

  project_type: ProjectType;
  status: ProjectStatus;
  logement_type: LogementType | null;

  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;

  etiquette_energie: DpeClass | null;
  etiquette_climat: DpeClass | null;
  current_step: number;
  steps_completed: number[];

  /** Données wizard : chaque clé = "step_X", valeur = JSONB avec updated_at par champ */
  data: Record<string, StepData>;

  /** Photos en attente de sync (base64 compressé) */
  pending_photos: PendingPhoto[];

  /** Signatures en attente de sync */
  pending_signatures: PendingSignature[];

  // Sync metadata
  /** Dernière sync réussie avec Supabase */
  last_synced_at: string | null;
  /** Modifié localement depuis la dernière sync */
  is_dirty: boolean;
  /** Créé offline (n'existe pas encore en base) */
  is_new: boolean;

  created_at: string;
  updated_at: string;
}

/** Données d'une étape du wizard avec updated_at par champ */
export interface StepData {
  [field: string]: FieldValue;
}

/** Valeur d'un champ avec son timestamp — résolution conflit last-write-wins par champ */
export interface FieldValue {
  value: unknown;
  updated_at: string;
}

/** Photo en attente de sync vers Supabase Storage */
export interface PendingPhoto {
  id: string;
  step: number;
  category: string;
  filename: string;
  /** Image compressée en base64 (800px, qualité 0.7) */
  data_base64: string;
  /** Miniature 64px en base64 */
  thumbnail_base64: string;
  size_bytes: number;
  created_at: string;
}

/** Signature en attente de sync */
export interface PendingSignature {
  type: "diagnostiqueur" | "occupant";
  data_base64: string;
  created_at: string;
}

/** File d'attente des opérations de sync */
export interface SyncQueueItem {
  id?: number;
  projet_id: string;
  operation: "create" | "update" | "upload_photo" | "upload_signature";
  /** Payload sérialisé */
  payload: string;
  /** Nombre de tentatives */
  attempts: number;
  /** Dernière erreur */
  last_error: string | null;
  created_at: string;
}

// ── Database ──

class VisionDPEDatabase extends Dexie {
  projets!: Table<LocalProjet, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("vision-dpe");

    this.version(1).stores({
      // Index : id (pk), organisation_id, status, is_dirty, updated_at
      projets: "id, organisation_id, status, is_dirty, updated_at",
      // Index : auto-increment id, projet_id
      syncQueue: "++id, projet_id, operation",
    });
  }
}

export const db = new VisionDPEDatabase();
