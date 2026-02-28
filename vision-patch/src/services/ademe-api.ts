/**
 * Client API ADEME — Contrôle de cohérence
 *
 * Endpoints du moteur de validation officiel ADEME (Flask/Python)
 * hébergé en local ou via proxy.
 *
 * Source : svc_controle_coherence du repo observatoire-dpe
 * Version : 1.24.2 (3 novembre 2025)
 */

import { getEtapeFromXpath, type ResultatValidation, type ResultatControle, type SeveriteControle } from "@/types/steps/step12-14";

// ════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════

const ADEME_API_BASE = import.meta.env.VITE_ADEME_API_URL || "http://localhost:5000";

// ════════════════════════════════════════════════════════════
// Types réponse API ADEME
// ════════════════════════════════════════════════════════════

interface AdemeControleRaw {
  code: string;
  message: string;
  type: "erreur" | "avertissement" | "info";
  xpath?: string;
}

interface AdemeReponseRaw {
  statut: "conforme" | "non_conforme";
  nb_erreurs: number;
  nb_avertissements: number;
  controles: AdemeControleRaw[];
  version_moteur?: string;
}

interface AdemeVersionResponse {
  version_xsd: string;
  version_moteur: string;
  version_service: string;
}

// ════════════════════════════════════════════════════════════
// Conversion types ADEME → types Vision DPE
// ════════════════════════════════════════════════════════════

function mapSeverite(type: string): SeveriteControle {
  switch (type) {
    case "erreur": return "bloquant";
    case "avertissement": return "warning";
    default: return "info";
  }
}

function mapControle(raw: AdemeControleRaw): ResultatControle {
  const severite = mapSeverite(raw.type);
  const xpath = raw.xpath || null;
  const etape = xpath ? getEtapeFromXpath(xpath) : null;

  // Extraction du nom de champ depuis le xpath
  let champ: string | null = null;
  if (xpath) {
    const parts = xpath.split("/");
    const last = parts[parts.length - 1];
    if (last && !last.includes("[")) champ = last;
  }

  return { code: raw.code, message: raw.message, severite, xpath, etape_wizard: etape, champ };
}

// ════════════════════════════════════════════════════════════
// API Client
// ════════════════════════════════════════════════════════════

/**
 * Soumet un XML DPE au moteur de contrôle de cohérence ADEME.
 * Endpoint : POST /controle_coherence
 *
 * @param xmlContent - Contenu XML DPE complet (string)
 * @returns ResultatValidation avec contrôles mappés aux étapes wizard
 */
export async function validerXmlAdeme(xmlContent: string): Promise<ResultatValidation> {
  const start = performance.now();

  const response = await fetch(`${ADEME_API_BASE}/controle_coherence`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xmlContent,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Erreur inconnue");
    throw new Error(`API ADEME erreur ${response.status}: ${errText}`);
  }

  const raw: AdemeReponseRaw = await response.json();
  const duree = Math.round(performance.now() - start);

  const controles = raw.controles.map(mapControle);
  const nb_bloquants = controles.filter(c => c.severite === "bloquant").length;
  const nb_warnings = controles.filter(c => c.severite === "warning").length;

  return {
    timestamp: new Date().toISOString(),
    statut: nb_bloquants > 0 ? "erreurs_bloquantes" : nb_warnings > 0 ? "warnings_seulement" : "valide",
    nb_bloquants,
    nb_warnings,
    controles,
    version_moteur: raw.version_moteur || null,
    duree_ms: duree,
  };
}

/**
 * Soumet un XML Audit au moteur de contrôle de cohérence ADEME.
 * Endpoint : POST /controle_coherence_audit
 */
export async function validerXmlAudit(xmlContent: string): Promise<ResultatValidation> {
  const start = performance.now();

  const response = await fetch(`${ADEME_API_BASE}/controle_coherence_audit`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xmlContent,
  });

  if (!response.ok) {
    throw new Error(`API ADEME Audit erreur ${response.status}`);
  }

  const raw: AdemeReponseRaw = await response.json();
  const duree = Math.round(performance.now() - start);
  const controles = raw.controles.map(mapControle);

  return {
    timestamp: new Date().toISOString(),
    statut: controles.some(c => c.severite === "bloquant") ? "erreurs_bloquantes" : "valide",
    nb_bloquants: controles.filter(c => c.severite === "bloquant").length,
    nb_warnings: controles.filter(c => c.severite === "warning").length,
    controles,
    version_moteur: raw.version_moteur || null,
    duree_ms: duree,
  };
}

/**
 * Récupère les versions du moteur ADEME.
 * Endpoint : GET /version
 */
export async function getVersionAdeme(): Promise<AdemeVersionResponse> {
  const response = await fetch(`${ADEME_API_BASE}/version`);
  if (!response.ok) throw new Error(`API ADEME /version erreur ${response.status}`);
  return response.json();
}

/**
 * Health check du moteur ADEME.
 * Endpoint : GET /health
 */
export async function healthCheckAdeme(): Promise<boolean> {
  try {
    const response = await fetch(`${ADEME_API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Traduit les enum_id en libellés lisibles.
 * Endpoint : POST /traduction_xml
 */
export async function traduireXml(xmlContent: string): Promise<string> {
  const response = await fetch(`${ADEME_API_BASE}/traduction_xml`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xmlContent,
  });
  if (!response.ok) throw new Error(`API ADEME /traduction_xml erreur ${response.status}`);
  return response.text();
}
