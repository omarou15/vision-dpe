/**
 * Client Supabase configuré
 * Centralise la configuration et l'initialisation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

if (!SUPABASE_URL) {
  console.warn('⚠️ SUPABASE_URL non définie - Le service Supabase ne fonctionnera pas');
}

if (!SUPABASE_ANON_KEY) {
  console.warn('⚠️ SUPABASE_ANON_KEY non définie - Le service Supabase ne fonctionnera pas');
}

// ============================================================================
// CLIENT SUPABASE
// ============================================================================

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================================================
// TYPES SUPPLÉMENTAIRES
// ============================================================================

export type Database = {
  public: {
    Tables: {
      users_profiles: {
        Row: {
          id: string;
          full_name: string;
          company: string | null;
          siret: string | null;
          numero_dpe_diagnostiqueur: string | null;
          phone: string | null;
          email: string | null;
          adresse_pro: string | null;
          code_postal_pro: string | null;
          commune_pro: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          company?: string | null;
          siret?: string | null;
          numero_dpe_diagnostiqueur?: string | null;
          phone?: string | null;
          email?: string | null;
          adresse_pro?: string | null;
          code_postal_pro?: string | null;
          commune_pro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          company?: string | null;
          siret?: string | null;
          numero_dpe_diagnostiqueur?: string | null;
          phone?: string | null;
          email?: string | null;
          adresse_pro?: string | null;
          code_postal_pro?: string | null;
          commune_pro?: string | null;
          updated_at?: string;
        };
      };
      dpe_drafts: {
        Row: {
          id: string;
          user_id: string;
          numero_dpe: string | null;
          current_step: number;
          data: Record<string, unknown>;
          validation_status: 'incomplete' | 'valid' | 'invalid';
          validation_errors: unknown[];
          created_at: string;
          updated_at: string;
          last_saved_at: string;
        };
      };
      dpe_documents: {
        Row: {
          id: string;
          user_id: string;
          numero_dpe: string;
          type_dpe: 'existant' | 'neuf' | 'tertiaire';
          status: 'draft' | 'validated' | 'submitted' | 'rejected';
          date_visite: string | null;
          date_etablissement: string | null;
          date_validation: string | null;
          date_soumission: string | null;
          data: Record<string, unknown>;
          resultats: Record<string, unknown> | null;
          xml_content: string | null;
          xml_version: string;
          ademe_validation_response: Record<string, unknown> | null;
          ademe_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
