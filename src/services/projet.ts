import { supabase } from "./supabase";
import { db, type LocalProjet } from "./db";
import * as syncService from "./sync";
import type {
  ProjectType,
  ProjectStatus,
  LogementType,
  CreateProjetInput,
  UpdateProjetInput,
  Projet,
} from "@/types";
import type { StepData } from "@/services/db";

// ============================================================
// CRÉER
// ============================================================

/** Crée un nouveau projet (local-first) */
export async function createProjet(input: {
  organisationId: string;
  createdBy: string;
  projectType: ProjectType;
  logementType: LogementType;
  name: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const local: LocalProjet = {
    id,
    organisation_id: input.organisationId,
    created_by: input.createdBy,
    assigned_to: null,
    project_type: input.projectType,
    status: "draft",
    logement_type: input.logementType,
    name: input.name,
    address: null,
    postal_code: null,
    city: null,
    etiquette_energie: null,
    etiquette_climat: null,
    current_step: 1,
    steps_completed: [],
    data: {},
    pending_photos: [],
    pending_signatures: [],
    last_synced_at: null,
    is_dirty: true,
    is_new: true,
    created_at: now,
    updated_at: now,
  };

  await db.projets.put(local);
  return id;
}

// ============================================================
// LIRE
// ============================================================

/** Récupère un projet (IndexedDB d'abord, fallback Supabase) */
export async function getProjet(projetId: string): Promise<LocalProjet | null> {
  const local = await db.projets.get(projetId);
  if (local) return local;

  // Fallback : chercher en base
  const { data, error } = await supabase
    .from("projets")
    .select("*")
    .eq("id", projetId)
    .single();

  if (error || !data) return null;

  // Mettre en cache local
  const localProjet = supabaseToLocal(data);
  await db.projets.put(localProjet);
  return localProjet;
}

/** Liste les projets de l'organisation */
export async function listProjets(
  organisationId: string,
  filters?: {
    status?: ProjectStatus;
    projectType?: ProjectType;
    assignedTo?: string;
  }
): Promise<LocalProjet[]> {
  let collection = db.projets
    .where("organisation_id")
    .equals(organisationId);

  let results = await collection.toArray();

  // Filtres en mémoire (Dexie ne supporte pas les filtres composés facilement)
  if (filters?.status) {
    results = results.filter((p) => p.status === filters.status);
  }
  if (filters?.projectType) {
    results = results.filter((p) => p.project_type === filters.projectType);
  }
  if (filters?.assignedTo) {
    results = results.filter(
      (p) => p.assigned_to === filters.assignedTo || p.created_by === filters.assignedTo
    );
  }

  // Tri : updated_at desc
  results.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return results;
}

/** Compte les projets par statut */
export async function countByStatus(
  organisationId: string
): Promise<Record<ProjectStatus, number>> {
  const all = await db.projets
    .where("organisation_id")
    .equals(organisationId)
    .toArray();

  const counts: Record<string, number> = {
    draft: 0,
    in_progress: 0,
    validated: 0,
    exported: 0,
    archived: 0,
  };

  for (const p of all) {
    counts[p.status] = (counts[p.status] || 0) + 1;
  }

  return counts as Record<ProjectStatus, number>;
}

// ============================================================
// MODIFIER
// ============================================================

/** Met à jour les métadonnées d'un projet */
export async function updateProjet(
  projetId: string,
  updates: Partial<Pick<LocalProjet,
    "name" | "status" | "assigned_to" | "logement_type" |
    "address" | "postal_code" | "city" |
    "etiquette_energie" | "etiquette_climat" |
    "current_step" | "steps_completed"
  >>
): Promise<void> {
  await syncService.updateProjetMeta(projetId, updates);
}

/** Marque une étape comme complétée */
export async function completeStep(
  projetId: string,
  stepNumber: number
): Promise<void> {
  const projet = await db.projets.get(projetId);
  if (!projet) return;

  const steps = new Set(projet.steps_completed);
  steps.add(stepNumber);

  const nextStep = Math.min(stepNumber + 1, projet.project_type === "audit" ? 20 : 14);

  await syncService.updateProjetMeta(projetId, {
    steps_completed: Array.from(steps).sort((a, b) => a - b),
    current_step: Math.max(projet.current_step, nextStep),
    status: projet.status === "draft" ? "in_progress" : projet.status,
  });
}

/** Marque le projet comme validé */
export async function validateProjet(projetId: string): Promise<void> {
  await syncService.updateProjetMeta(projetId, {
    status: "validated",
  });
}

/** Marque le projet comme exporté */
export async function exportProjet(projetId: string): Promise<void> {
  await syncService.updateProjetMeta(projetId, {
    status: "exported",
  });
}

/** Archive un projet */
export async function archiveProjet(projetId: string): Promise<void> {
  await syncService.updateProjetMeta(projetId, {
    status: "archived",
  });
}

// ============================================================
// SUPPRIMER
// ============================================================

/** Supprime un projet (local + Supabase si online) */
export async function deleteProjet(projetId: string): Promise<void> {
  // Supprimer localement
  await db.projets.delete(projetId);
  await db.syncQueue.where("projet_id").equals(projetId).delete();

  // Supprimer en base (best effort)
  try {
    await supabase.from("projets").delete().eq("id", projetId);
  } catch {
    // Si offline, la suppression sera gérée à la prochaine sync
    console.warn("Could not delete projet from Supabase (offline?)");
  }
}

// ============================================================
// DUPLIQUER
// ============================================================

/** Duplique un projet existant (nouveau brouillon avec les mêmes données) */
export async function duplicateProjet(
  sourceProjetId: string,
  newName?: string
): Promise<string> {
  const source = await db.projets.get(sourceProjetId);
  if (!source) throw new Error("Projet source introuvable");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const duplicate: LocalProjet = {
    ...source,
    id,
    name: newName || `${source.name} (copie)`,
    status: "draft",
    current_step: 1,
    steps_completed: [],
    etiquette_energie: null,
    etiquette_climat: null,
    pending_photos: [],
    pending_signatures: [],
    last_synced_at: null,
    is_dirty: true,
    is_new: true,
    created_at: now,
    updated_at: now,
  };

  await db.projets.put(duplicate);
  return id;
}

// ============================================================
// TRANSFORMER DPE → AUDIT
// ============================================================

/**
 * Transforme un projet DPE en Audit.
 * 
 * Les étapes 1-11 (état initial) sont conservées.
 * Le project_type passe à "audit".
 * Les étapes 12-14 DPE sont remplacées par les étapes 12-20 Audit.
 * Le statut repasse à in_progress.
 */
export async function transformerEnAudit(projetId: string): Promise<void> {
  const projet = await db.projets.get(projetId);
  if (!projet) throw new Error("Projet introuvable");
  if (projet.project_type === "audit") throw new Error("Déjà un audit");

  const now = new Date().toISOString();

  // Conserver uniquement les données étapes 1-11
  const cleanedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(projet.data)) {
    const match = key.match(/^step_(\d+)$/);
    if (match) {
      const stepNum = parseInt(match[1], 10);
      if (stepNum <= 11) {
        cleanedData[key] = value;
      }
    }
  }

  // Conserver uniquement les étapes complétées 1-11
  const cleanedSteps = projet.steps_completed.filter((s) => s <= 11);

  await db.projets.update(projetId, {
    project_type: "audit" as ProjectType,
    status: "in_progress" as ProjectStatus,
    data: cleanedData,
    steps_completed: cleanedSteps,
    current_step: Math.min(projet.current_step, 12),
    etiquette_energie: null,
    etiquette_climat: null,
    is_dirty: true,
    updated_at: now,
  });
}

/**
 * Transforme un projet Audit en DPE (retour arrière).
 * 
 * Les étapes 1-11 sont conservées.
 * Les données audit (12-20) sont supprimées.
 */
export async function transformerEnDpe(projetId: string): Promise<void> {
  const projet = await db.projets.get(projetId);
  if (!projet) throw new Error("Projet introuvable");
  if (projet.project_type === "dpe") throw new Error("Déjà un DPE");

  const now = new Date().toISOString();

  const cleanedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(projet.data)) {
    const match = key.match(/^step_(\d+)$/);
    if (match) {
      const stepNum = parseInt(match[1], 10);
      if (stepNum <= 11) {
        cleanedData[key] = value;
      }
    }
  }

  const cleanedSteps = projet.steps_completed.filter((s) => s <= 11);

  await db.projets.update(projetId, {
    project_type: "dpe" as ProjectType,
    status: "in_progress" as ProjectStatus,
    data: cleanedData,
    steps_completed: cleanedSteps,
    current_step: Math.min(projet.current_step, 12),
    etiquette_energie: null,
    etiquette_climat: null,
    is_dirty: true,
    updated_at: now,
  });
}

// ============================================================
// UTILITAIRES
// ============================================================

/** Convertit un Supabase row en LocalProjet */
function supabaseToLocal(row: Projet): LocalProjet {
  const data: Record<string, StepData> = {};

  for (const key of Object.keys(row)) {
    if (key.startsWith("data_step_")) {
      const stepKey = key.replace("data_", "");
      const val = row[key as keyof Projet];
      if (val && typeof val === "object") {
        data[stepKey] = val;
      }
    }
  }

  return {
    id: row.id,
    organisation_id: row.organisation_id,
    created_by: row.created_by,
    assigned_to: row.assigned_to,
    project_type: row.project_type,
    status: row.status,
    logement_type: row.logement_type,
    name: row.name,
    address: row.address,
    postal_code: row.postal_code,
    city: row.city,
    etiquette_energie: row.etiquette_energie,
    etiquette_climat: row.etiquette_climat,
    current_step: row.current_step,
    steps_completed: row.steps_completed,
    data,
    pending_photos: [],
    pending_signatures: [],
    last_synced_at: new Date().toISOString(),
    is_dirty: false,
    is_new: false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Calcule le % de complétion d'un projet */
export function getCompletionPercent(projet: LocalProjet): number {
  const totalSteps = projet.project_type === "audit" ? 20 : 14;
  return Math.round((projet.steps_completed.length / totalSteps) * 100);
}

/** Retourne le label du statut (FR) */
export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    draft: "Brouillon",
    in_progress: "En cours",
    validated: "Validé",
    exported: "Exporté",
    archived: "Archivé",
  };
  return labels[status] || status;
}
