/**
 * Types pour l'API ADEME
 * Endpoints et formats de données pour la validation et traduction XML
 */

// ============================================================================
// ENDPOINTS API ADEME
// ============================================================================

export const ADEME_API_BASE_URL = "https://api.ademe.fr/dpe";

export const ADEME_ENDPOINTS = {
  CONTROLE_COHERENCE: "/controle_coherence",
  TRADUCTION_XML: "/traduction_xml",
  VALIDATION_XSD: "/validation_xsd",
  ENREGISTREMENT: "/enregistrement",
} as const;

// ============================================================================
// REQUÊTES
// ============================================================================

export interface ControleCoherenceRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dpe_data: Record<string, any>;
  version: "2.6";
  type_dpe: "existant" | "neuf" | "tertiaire";
}

export interface TraductionXMLRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dpe_data: Record<string, any>;
  version: "2.6";
  format: "standard" | "complet";
}

export interface ValidationXSDRequest {
  xml_content: string;
  version: "2.6";
}

// ============================================================================
// RÉPONSES
// ============================================================================

export interface ControleCoherenceResponse {
  valid: boolean;
  errors: AdemeError[];
  warnings: AdemeWarning[];
  metadata: {
    version: string;
    timestamp: string;
    request_id: string;
  };
}

export interface TraductionXMLResponse {
  success: boolean;
  xml_content?: string;
  errors?: AdemeError[];
  metadata: {
    version: string;
    timestamp: string;
    request_id: string;
  };
}

export interface ValidationXSDResponse {
  valid: boolean;
  schema_errors: SchemaError[];
  coherence_errors: AdemeError[];
  metadata: {
    version: string;
    timestamp: string;
    request_id: string;
  };
}

// ============================================================================
// ERREURS ET WARNINGS
// ============================================================================

export interface AdemeError {
  code: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface AdemeWarning {
  code: string;
  message: string;
  field?: string;
}

export interface SchemaError {
  line: number;
  column: number;
  message: string;
  path: string;
}

// ============================================================================
// TYPES POUR AUThentIFICATION
// ============================================================================

export interface AdemeCredentials {
  api_key: string;
  client_id?: string;
  client_secret?: string;
}

// ============================================================================
// CONFIGURATION API
// ============================================================================

export interface AdemeApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  credentials: AdemeCredentials;
}

// ============================================================================
// TYPES POUR CACHE
// ============================================================================

export interface EnumCache {
  lastUpdated: string;
  version: string;
  enums: Record<string, string[]>;
}

export interface TablesValeursCache {
  lastUpdated: string;
  version: string;
  tables: Record<string, Record<string, number>>;
}
