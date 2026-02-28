/**
 * Tests Client API ADEME — Contrôle de cohérence
 *
 * Mock fetch pour simuler les réponses du moteur ADEME
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock import.meta.env avant l'import du module
vi.stubEnv("VITE_ADEME_API_URL", "http://localhost:5000");

// Import après le mock env
const {
  validerXmlAdeme,
  validerXmlAudit,
  getVersionAdeme,
  healthCheckAdeme,
  traduireXml,
} = await import("../ademe-api");

// ════════════════════════════════════════════════════════════
// Mock fetch
// ════════════════════════════════════════════════════════════

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ════════════════════════════════════════════════════════════
// Helpers — réponses API simulées
// ════════════════════════════════════════════════════════════

function ademeReponseValide() {
  return {
    statut: "conforme",
    nb_erreurs: 0,
    nb_avertissements: 0,
    controles: [],
    version_moteur: "1.24.2",
  };
}

function ademeReponseAvecErreurs() {
  return {
    statut: "non_conforme",
    nb_erreurs: 2,
    nb_avertissements: 1,
    controles: [
      {
        code: "XSD_001",
        message: "Élément manquant : surface_habitable_logement",
        type: "erreur",
        xpath: "/dpe/logement/caracteristique_generale/surface_habitable_logement",
      },
      {
        code: "COH_042",
        message: "Incohérence surfaces installations > surface logement",
        type: "erreur",
        xpath: "/dpe/logement/installation_chauffage_collection",
      },
      {
        code: "WARN_015",
        message: "Score géocodage BAN faible",
        type: "avertissement",
        xpath: "/dpe/administratif/geolocalisation/score_ban",
      },
    ],
    version_moteur: "1.24.2",
  };
}

function mockResponse(body: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  };
}

// ════════════════════════════════════════════════════════════
// Tests validerXmlAdeme
// ════════════════════════════════════════════════════════════

describe("validerXmlAdeme", () => {
  it("retourne statut valide quand ADEME confirme", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseValide()));

    const result = await validerXmlAdeme("<dpe>test</dpe>");

    expect(result.statut).toBe("valide");
    expect(result.nb_bloquants).toBe(0);
    expect(result.nb_warnings).toBe(0);
    expect(result.controles).toHaveLength(0);
    expect(result.version_moteur).toBe("1.24.2");
  });

  it("retourne erreurs_bloquantes quand ADEME rejette", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseAvecErreurs()));

    const result = await validerXmlAdeme("<dpe>test</dpe>");

    expect(result.statut).toBe("erreurs_bloquantes");
    expect(result.nb_bloquants).toBe(2);
    expect(result.nb_warnings).toBe(1);
    expect(result.controles).toHaveLength(3);
  });

  it("mappe correctement les sévérités", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseAvecErreurs()));

    const result = await validerXmlAdeme("<dpe>test</dpe>");

    expect(result.controles[0].severite).toBe("bloquant");
    expect(result.controles[1].severite).toBe("bloquant");
    expect(result.controles[2].severite).toBe("warning");
  });

  it("extrait le xpath de chaque contrôle", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseAvecErreurs()));

    const result = await validerXmlAdeme("<dpe>test</dpe>");

    expect(result.controles[0].xpath).toContain("surface_habitable_logement");
    expect(result.controles[0].champ).toBe("surface_habitable_logement");
  });

  it("mappe xpath vers étape wizard", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseAvecErreurs()));

    const result = await validerXmlAdeme("<dpe>test</dpe>");

    // xpath contient "caracteristique_generale" → étape 3
    // xpath contient "installation_chauffage" → étape 9
    // Le mapping dépend de getEtapeFromXpath
    expect(result.controles[0].etape_wizard).toBeTruthy();
  });

  it("appelle POST /controle_coherence avec XML", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseValide()));

    await validerXmlAdeme("<dpe>mon xml</dpe>");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:5000/controle_coherence",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: "<dpe>mon xml</dpe>",
      })
    );
  });

  it("throw si API retourne erreur HTTP", async () => {
    mockFetch.mockResolvedValue(mockResponse("Internal Server Error", 500));

    await expect(validerXmlAdeme("<dpe/>")).rejects.toThrow("API ADEME erreur 500");
  });

  it("contient un timestamp ISO", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseValide()));

    const result = await validerXmlAdeme("<dpe/>");
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("contient duree_ms", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseValide()));

    const result = await validerXmlAdeme("<dpe/>");
    expect(result.duree_ms).toBeGreaterThanOrEqual(0);
  });

  it("retourne warnings_seulement quand pas d'erreurs bloquantes", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        statut: "conforme",
        nb_erreurs: 0,
        nb_avertissements: 1,
        controles: [
          { code: "WARN_001", message: "Warning", type: "avertissement" },
        ],
        version_moteur: "1.24.2",
      })
    );

    const result = await validerXmlAdeme("<dpe/>");
    expect(result.statut).toBe("warnings_seulement");
    expect(result.nb_bloquants).toBe(0);
    expect(result.nb_warnings).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════
// Tests validerXmlAudit
// ════════════════════════════════════════════════════════════

describe("validerXmlAudit", () => {
  it("appelle POST /controle_coherence_audit", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseValide()));

    await validerXmlAudit("<audit>test</audit>");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:5000/controle_coherence_audit",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("retourne statut valide", async () => {
    mockFetch.mockResolvedValue(mockResponse(ademeReponseValide()));

    const result = await validerXmlAudit("<audit/>");
    expect(result.statut).toBe("valide");
  });

  it("throw si erreur HTTP", async () => {
    mockFetch.mockResolvedValue(mockResponse("Error", 503));

    await expect(validerXmlAudit("<audit/>")).rejects.toThrow("API ADEME Audit erreur 503");
  });
});

// ════════════════════════════════════════════════════════════
// Tests getVersionAdeme
// ════════════════════════════════════════════════════════════

describe("getVersionAdeme", () => {
  it("retourne les versions", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        version_xsd: "9.2.1",
        version_moteur: "1.24.2",
        version_service: "3.2.1",
      })
    );

    const result = await getVersionAdeme();
    expect(result.version_xsd).toBe("9.2.1");
    expect(result.version_moteur).toBe("1.24.2");
  });

  it("throw si erreur HTTP", async () => {
    mockFetch.mockResolvedValue(mockResponse("", 404));

    await expect(getVersionAdeme()).rejects.toThrow("API ADEME /version erreur 404");
  });
});

// ════════════════════════════════════════════════════════════
// Tests healthCheckAdeme
// ════════════════════════════════════════════════════════════

describe("healthCheckAdeme", () => {
  it("retourne true si API ok", async () => {
    mockFetch.mockResolvedValue(mockResponse({ status: "ok" }));

    const result = await healthCheckAdeme();
    expect(result).toBe(true);
  });

  it("retourne false si erreur réseau", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await healthCheckAdeme();
    expect(result).toBe(false);
  });

  it("retourne false si timeout", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const result = await healthCheckAdeme();
    expect(result).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════
// Tests traduireXml
// ════════════════════════════════════════════════════════════

describe("traduireXml", () => {
  it("retourne le XML traduit", async () => {
    mockFetch.mockResolvedValue(mockResponse("<dpe_traduit>libellés lisibles</dpe_traduit>"));

    const result = await traduireXml("<dpe>original</dpe>");
    expect(result).toContain("traduit");
  });

  it("throw si erreur HTTP", async () => {
    mockFetch.mockResolvedValue(mockResponse("", 400));

    await expect(traduireXml("<dpe/>")).rejects.toThrow("API ADEME /traduction_xml erreur 400");
  });
});
