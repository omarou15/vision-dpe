import { db, type LocalProjet, type SyncQueueItem, type FieldValue } from "./db";
import { supabase } from "./supabase";
import type { Projet } from "@/types";

// ============================================================
// ÉCRITURE LOCALE (offline-first)
// ============================================================

/** Sauvegarde un champ d'une étape localement avec timestamp */
export async function saveStepField(
  projetId: string,
  stepKey: string,
  fieldName: string,
  value: unknown
): Promise<void> {
  const now = new Date().toISOString();

  await db.projets
    .where("id")
    .equals(projetId)
    .modify((projet) => {
      if (!projet.data[stepKey]) {
        projet.data[stepKey] = {};
      }
      projet.data[stepKey]![fieldName] = { value, updated_at: now };
      projet.is_dirty = true;
      projet.updated_at = now;
    });
}

/** Sauvegarde plusieurs champs d'une étape en batch */
export async function saveStepFields(
  projetId: string,
  stepKey: string,
  fields: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();

  await db.projets
    .where("id")
    .equals(projetId)
    .modify((projet) => {
      if (!projet.data[stepKey]) {
        projet.data[stepKey] = {};
      }
      for (const [fieldName, value] of Object.entries(fields)) {
        projet.data[stepKey]![fieldName] = { value, updated_at: now };
      }
      projet.is_dirty = true;
      projet.updated_at = now;
    });
}

/** Met à jour les métadonnées du projet (nom, statut, étiquette, etc.) */
export async function updateProjetMeta(
  projetId: string,
  updates: Partial<Pick<LocalProjet,
    "name" | "status" | "project_type" | "logement_type" |
    "address" | "postal_code" | "city" |
    "etiquette_energie" | "etiquette_climat" |
    "current_step" | "steps_completed"
  >>
): Promise<void> {
  const now = new Date().toISOString();

  await db.projets
    .where("id")
    .equals(projetId)
    .modify((projet) => {
      Object.assign(projet, updates);
      projet.is_dirty = true;
      projet.updated_at = now;
    });
}

// ============================================================
// LECTURE LOCALE
// ============================================================

/** Récupère un projet depuis IndexedDB */
export async function getLocalProjet(
  projetId: string
): Promise<LocalProjet | undefined> {
  return db.projets.get(projetId);
}

/** Liste les projets locaux de l'organisation */
export async function listLocalProjets(
  organisationId: string
): Promise<LocalProjet[]> {
  return db.projets
    .where("organisation_id")
    .equals(organisationId)
    .reverse()
    .sortBy("updated_at");
}

/** Récupère la valeur d'un champ d'une étape */
export function getFieldValue(
  projet: LocalProjet,
  stepKey: string,
  fieldName: string
): unknown | undefined {
  return projet.data[stepKey]?.[fieldName]?.value;
}

/** Récupère toutes les valeurs d'une étape (sans les timestamps) */
export function getStepValues(
  projet: LocalProjet,
  stepKey: string
): Record<string, unknown> {
  const stepData = projet.data[stepKey];
  if (!stepData) return {};

  const values: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(stepData)) {
    values[key] = (field as FieldValue).value;
  }
  return values;
}

// ============================================================
// SYNC : LOCAL → SUPABASE
// ============================================================

/** Ajoute une opération dans la file de sync */
async function enqueueSync(
  projetId: string,
  operation: SyncQueueItem["operation"],
  payload: unknown
): Promise<void> {
  await db.syncQueue.add({
    projet_id: projetId,
    operation,
    payload: JSON.stringify(payload),
    attempts: 0,
    last_error: null,
    created_at: new Date().toISOString(),
  });
}

/** Convertit les données locales en colonnes Supabase */
function localToSupabase(projet: LocalProjet): Partial<Projet> {
  const result: Record<string, unknown> = {
    id: projet.id,
    organisation_id: projet.organisation_id,
    created_by: projet.created_by,
    assigned_to: projet.assigned_to,
    project_type: projet.project_type,
    status: projet.status,
    logement_type: projet.logement_type,
    name: projet.name,
    address: projet.address,
    postal_code: projet.postal_code,
    city: projet.city,
    etiquette_energie: projet.etiquette_energie,
    etiquette_climat: projet.etiquette_climat,
    current_step: projet.current_step,
    steps_completed: projet.steps_completed,
  };

  // Convertir data.step_X en data_step_X JSONB
  for (const [stepKey, stepData] of Object.entries(projet.data)) {
    const columnName = `data_${stepKey}`;
    // Stocker le JSONB complet avec updated_at par champ
    result[columnName] = stepData;
  }

  return result as Partial<Projet>;
}

/** Pousse les projets dirty vers Supabase */
export async function pushDirtyProjets(): Promise<{
  synced: number;
  errors: number;
}> {
  const dirtyProjets = await db.projets
    .where("is_dirty")
    .equals(1) // Dexie stocke boolean comme 0/1
    .toArray();

  let synced = 0;
  let errors = 0;

  for (const projet of dirtyProjets) {
    try {
      const supabaseData = localToSupabase(projet);

      if (projet.is_new) {
        // INSERT
        const { error } = await supabase
          .from("projets")
          .insert(supabaseData);

        if (error) throw error;
      } else {
        // UPDATE avec résolution conflit par champ
        const { error } = await supabase
          .from("projets")
          .update(supabaseData)
          .eq("id", projet.id);

        if (error) throw error;
      }

      // Marquer comme synced
      await db.projets.update(projet.id, {
        is_dirty: false,
        is_new: false,
        last_synced_at: new Date().toISOString(),
      });

      synced++;
    } catch (err) {
      console.error(`Sync failed for projet ${projet.id}:`, err);
      errors++;
    }
  }

  return { synced, errors };
}

// ============================================================
// SYNC : SUPABASE → LOCAL
// ============================================================

/** Merge les données du serveur avec les données locales (last-write-wins par champ) */
function mergeStepData(
  local: Record<string, FieldValue> | undefined,
  remote: Record<string, FieldValue> | undefined
): Record<string, FieldValue> {
  const merged: Record<string, FieldValue> = {};

  // Tous les champs du remote
  if (remote) {
    for (const [key, remoteField] of Object.entries(remote)) {
      merged[key] = remoteField as FieldValue;
    }
  }

  // Les champs locaux plus récents écrasent
  if (local) {
    for (const [key, localField] of Object.entries(local)) {
      const lf = localField as FieldValue;
      const rf = merged[key];
      if (!rf || new Date(lf.updated_at) > new Date((rf as FieldValue).updated_at)) {
        merged[key] = lf;
      }
    }
  }

  return merged;
}

/** Tire les projets depuis Supabase et merge avec le cache local */
export async function pullFromSupabase(
  organisationId: string
): Promise<{ pulled: number }> {
  const { data: remoteProjets, error } = await supabase
    .from("projets")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("updated_at", { ascending: false });

  if (error || !remoteProjets) {
    console.error("Pull failed:", error);
    return { pulled: 0 };
  }

  let pulled = 0;

  for (const remote of remoteProjets) {
    const local = await db.projets.get(remote.id);

    if (!local) {
      // Nouveau projet du serveur — ajouter localement
      const localProjet: LocalProjet = {
        id: remote.id,
        organisation_id: remote.organisation_id,
        created_by: remote.created_by,
        assigned_to: remote.assigned_to,
        project_type: remote.project_type,
        status: remote.status,
        logement_type: remote.logement_type,
        name: remote.name,
        address: remote.address,
        postal_code: remote.postal_code,
        city: remote.city,
        etiquette_energie: remote.etiquette_energie,
        etiquette_climat: remote.etiquette_climat,
        current_step: remote.current_step,
        steps_completed: remote.steps_completed,
        data: {},
        pending_photos: [],
        pending_signatures: [],
        last_synced_at: new Date().toISOString(),
        is_dirty: false,
        is_new: false,
        created_at: remote.created_at,
        updated_at: remote.updated_at,
      };

      // Extraire data_step_X → data.step_X
      for (const key of Object.keys(remote)) {
        if (key.startsWith("data_step_")) {
          const stepKey = key.replace("data_", "");
          const remoteValue = remote[key as keyof typeof remote];
          if (remoteValue && typeof remoteValue === "object") {
            localProjet.data[stepKey] = remoteValue as Record<string, FieldValue>;
          }
        }
      }

      await db.projets.put(localProjet);
      pulled++;
    } else if (!local.is_dirty) {
      // Pas de modification locale → écraser avec le serveur
      await db.projets.update(remote.id, {
        ...remote,
        last_synced_at: new Date().toISOString(),
      });
      pulled++;
    } else {
      // Conflit : modification locale + serveur → merge par champ
      const mergedData: Record<string, Record<string, FieldValue>> = {};

      for (const key of Object.keys(remote)) {
        if (key.startsWith("data_step_")) {
          const stepKey = key.replace("data_", "");
          const remoteStep = remote[key as keyof typeof remote] as Record<string, FieldValue> | undefined;
          const localStep = local.data[stepKey];
          mergedData[stepKey] = mergeStepData(localStep, remoteStep);
        }
      }

      await db.projets.update(remote.id, {
        data: mergedData,
        last_synced_at: new Date().toISOString(),
        // On garde is_dirty = true car il y a des données locales mergées à repousser
      });
      pulled++;
    }
  }

  return { pulled };
}

// ============================================================
// SYNC ORCHESTRATEUR
// ============================================================

/** Sync complète : pull puis push */
export async function syncAll(organisationId: string): Promise<{
  pulled: number;
  pushed: number;
  errors: number;
}> {
  // 1. Pull d'abord (pour avoir les données serveur les plus récentes)
  const pullResult = await pullFromSupabase(organisationId);

  // 2. Push les modifications locales
  const pushResult = await pushDirtyProjets();

  return {
    pulled: pullResult.pulled,
    pushed: pushResult.synced,
    errors: pushResult.errors,
  };
}

/** Retourne le nombre de projets en attente de sync */
export async function getPendingSyncCount(): Promise<number> {
  return db.projets.where("is_dirty").equals(1).count();
}

/** Nettoie les projets archivés de plus de 30 jours du cache local */
export async function cleanOldArchived(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const old = await db.projets
    .where("status")
    .equals("archived")
    .filter((p) => new Date(p.updated_at) < thirtyDaysAgo)
    .toArray();

  if (old.length > 0) {
    await db.projets.bulkDelete(old.map((p) => p.id));
  }

  return old.length;
}
