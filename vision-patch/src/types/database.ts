/** Types TypeScript correspondant au schema Supabase Vision DPE */

// ── Enums ──
export type UserRole = "admin" | "responsable" | "diagnostiqueur";
export type ProjectType = "dpe" | "audit";
export type ProjectStatus =
  | "draft"
  | "in_progress"
  | "validated"
  | "exported"
  | "archived";
export type LogementType = "maison" | "appartement" | "immeuble";
export type DpeClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

// ── Organisation ──
export interface Organisation {
  id: string;
  name: string;
  siret: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Profile ──
export interface Profile {
  id: string;
  organisation_id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  certification_number: string | null;
  certification_org: string | null;
  certification_expiry: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Profil avec email (jointure auth.users) */
export interface ProfileWithEmail extends Profile {
  email: string;
}

/** Nom complet formaté */
export function formatProfileName(p: Pick<Profile, "first_name" | "last_name">): string {
  return `${p.first_name} ${p.last_name}`.trim() || "Sans nom";
}

// ── Projet ──
export interface Projet {
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
  ban_id: string | null;
  ban_score: number | null;
  ban_latitude: number | null;
  ban_longitude: number | null;

  // Données wizard par étape (JSONB)
  data_step_1: Record<string, unknown>;
  data_step_2: Record<string, unknown>;
  data_step_2b: Record<string, unknown>;
  data_step_3: Record<string, unknown>;
  data_step_4: Record<string, unknown>;
  data_step_5: Record<string, unknown>;
  data_step_6: Record<string, unknown>;
  data_step_7: Record<string, unknown>;
  data_step_8: Record<string, unknown>;
  data_step_9: Record<string, unknown>;
  data_step_10: Record<string, unknown>;
  data_step_11: Record<string, unknown>;
  data_step_12: Record<string, unknown>;
  data_step_13: Record<string, unknown>;
  data_step_14: Record<string, unknown>;
  // Audit
  data_step_13a: Record<string, unknown>;
  data_step_14a: Record<string, unknown>;
  data_step_15a: Record<string, unknown>;
  data_step_16a: Record<string, unknown>;
  data_step_17a: Record<string, unknown>;
  data_step_18a: Record<string, unknown>;
  data_step_19a: Record<string, unknown>;
  data_step_20a: Record<string, unknown>;

  etiquette_energie: DpeClass | null;
  etiquette_climat: DpeClass | null;
  conso_ep: number | null;
  emissions_ges: number | null;

  current_step: number;
  steps_completed: number[];

  photos_meta: PhotoMeta[];

  signature_diag_url: string | null;
  signature_occ_url: string | null;

  xml_url: string | null;
  pdf_url: string | null;
  exported_at: string | null;

  created_at: string;
  updated_at: string;
}

/** Metadata d'une photo stockée */
export interface PhotoMeta {
  id: string;
  step: number;
  category: string;
  filename: string;
  storage_path: string;
  thumbnail_base64: string;
  size_bytes: number;
  created_at: string;
}

/** Champs pour créer un nouveau projet */
export interface CreateProjetInput {
  project_type: ProjectType;
  name?: string;
  logement_type?: LogementType;
}

/** Champs pour mettre à jour un projet */
export type UpdateProjetInput = Partial<
  Pick<
    Projet,
    | "name"
    | "status"
    | "project_type"
    | "logement_type"
    | "address"
    | "postal_code"
    | "city"
    | "ban_id"
    | "ban_score"
    | "ban_latitude"
    | "ban_longitude"
    | "assigned_to"
    | "current_step"
    | "steps_completed"
    | "etiquette_energie"
    | "etiquette_climat"
    | "conso_ep"
    | "emissions_ges"
    | "photos_meta"
    | "signature_diag_url"
    | "signature_occ_url"
    | "xml_url"
    | "pdf_url"
    | "exported_at"
  > &
  Record<`data_step_${string}`, Record<string, unknown>>
>;

// ── Invitation ──
export interface Invitation {
  id: string;
  organisation_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}
