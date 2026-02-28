import { supabase } from "./supabase";
import type {
  Profile,
  ProfileWithEmail,
  Organisation,
  UserRole,
  Invitation,
} from "@/types";

// ── Types de retour ──
interface AuthResult<T = void> {
  data: T | null;
  error: string | null;
}

// ============================================================
// AUTHENTIFICATION
// ============================================================

/** Connexion par email + mot de passe */
export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

/** Inscription avec metadata organisation + rôle */
export async function signup(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organisationId: string;
  role?: UserRole;
}): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        organisation_id: params.organisationId,
        role: params.role || "diagnostiqueur",
        first_name: params.firstName,
        last_name: params.lastName,
      },
    },
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

/** Déconnexion */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** Demande de réinitialisation de mot de passe */
export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

/** Mise à jour du mot de passe (après reset) */
export async function updatePassword(
  newPassword: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

/** Retourne l'utilisateur courant ou null */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Écoute les changements d'état d'authentification */
export function onAuthStateChange(
  callback: (event: string, userId: string | null) => void
) {
  if (!supabase) {
    console.warn("Supabase non configuré — auth désactivée");
    return { subscription: { unsubscribe: () => {} } };
  }
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event: string, session: any) => {
    callback(event, session?.user?.id ?? null);
  });

  return subscription;
}

// ============================================================
// PROFIL
// ============================================================

/** Récupère le profil de l'utilisateur courant */
export async function getMyProfile(): Promise<AuthResult<Profile>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Non connecté" };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Profile, error: null };
}

/** Met à jour le profil de l'utilisateur courant */
export async function updateMyProfile(
  updates: Partial<
    Pick<
      Profile,
      | "first_name"
      | "last_name"
      | "phone"
      | "certification_number"
      | "certification_org"
      | "certification_expiry"
    >
  >
): Promise<AuthResult<Profile>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Non connecté" };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Profile, error: null };
}

/** Récupère l'organisation de l'utilisateur courant */
export async function getMyOrganisation(): Promise<AuthResult<Organisation>> {
  const profile = await getMyProfile();
  if (profile.error || !profile.data)
    return { data: null, error: profile.error || "Profil introuvable" };

  const { data, error } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", profile.data.organisation_id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Organisation, error: null };
}

// ============================================================
// GESTION UTILISATEURS (responsable)
// ============================================================

/** Liste les profils de l'organisation courante */
export async function listOrganisationProfiles(): Promise<
  AuthResult<Profile[]>
> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) return { data: null, error: error.message };
  return { data: data as Profile[], error: null };
}

/** Active ou désactive un profil (responsable uniquement) */
export async function toggleProfileActive(
  profileId: string,
  isActive: boolean
): Promise<AuthResult> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

// ============================================================
// INVITATIONS
// ============================================================

/** Crée une invitation par email */
export async function createInvitation(
  email: string,
  role: UserRole = "diagnostiqueur"
): Promise<AuthResult<Invitation>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Non connecté" };

  const profile = await getMyProfile();
  if (!profile.data)
    return { data: null, error: "Profil introuvable" };

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      organisation_id: profile.data.organisation_id,
      email,
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Invitation, error: null };
}

/** Liste les invitations de l'organisation */
export async function listInvitations(): Promise<AuthResult<Invitation[]>> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as Invitation[], error: null };
}

/** Accepte une invitation par token */
export async function acceptInvitation(
  token: string
): Promise<AuthResult<Invitation>> {
  // Vérifier que l'invitation existe et n'est pas expirée
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (fetchError || !invitation) {
    return {
      data: null,
      error: "Invitation invalide ou expirée",
    };
  }

  // Marquer comme acceptée
  const { data, error } = await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Invitation, error: null };
}

// ============================================================
// VÉRIFICATIONS
// ============================================================

/** Vérifie si la certification du diagnostiqueur est encore valide */
export function isCertificationValid(
  expiryDate: string | null
): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) > new Date();
}

/** Retourne le nombre de jours avant expiration de la certification */
export function certificationDaysRemaining(
  expiryDate: string | null
): number | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
