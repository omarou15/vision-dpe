import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchAddress, reverseGeocode } from "@/services/ban";

// Mock fetch global
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeBanResponse(features: unknown[]) {
  return {
    ok: true,
    json: async () => ({ type: "FeatureCollection", features }),
  };
}

function makeBanFeature(overrides: Record<string, unknown> = {}) {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [2.3488, 48.8534] },
    properties: {
      label: "15 Rue de la Paix 75002 Paris",
      score: 0.92,
      housenumber: "15",
      street: "Rue de la Paix",
      name: "15 Rue de la Paix",
      postcode: "75002",
      city: "Paris",
      citycode: "75102",
      type: "housenumber",
      id: "75102_7220_00015",
      ...overrides,
    },
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("searchAddress", () => {
  it("retourne un tableau vide pour une query trop courte", async () => {
    const results = await searchAddress("ab");
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("retourne un tableau vide pour une query vide", async () => {
    const results = await searchAddress("");
    expect(results).toEqual([]);
  });

  it("appelle l'API BAN avec les bons paramètres", async () => {
    mockFetch.mockResolvedValueOnce(makeBanResponse([makeBanFeature()]));

    await searchAddress("15 rue de la paix paris", { limit: 3 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("api-adresse.data.gouv.fr/search");
    expect(url).toContain("q=15+rue+de+la+paix+paris");
    expect(url).toContain("limit=3");
  });

  it("convertit correctement le résultat BAN en GeocodageBAN", async () => {
    mockFetch.mockResolvedValueOnce(makeBanResponse([makeBanFeature()]));

    const results = await searchAddress("15 rue de la paix");
    expect(results).toHaveLength(1);

    const r = results[0]!;
    expect(r.label).toBe("15 Rue de la Paix 75002 Paris");
    expect(r.score).toBe(0.92);
    expect(r.postcode).toBe("75002");
    expect(r.city).toBe("Paris");
    expect(r.latitude).toBe(48.8534);
    expect(r.longitude).toBe(2.3488);
    expect(r.ban_id).toBe("75102_7220_00015");
    expect(r.type).toBe("housenumber");
  });

  it("retourne un tableau vide en cas d'erreur réseau", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const results = await searchAddress("15 rue de la paix");
    expect(results).toEqual([]);
  });

  it("passe le postcode en paramètre si fourni", async () => {
    mockFetch.mockResolvedValueOnce(makeBanResponse([]));

    await searchAddress("rue de la paix", { postcode: "75002" });

    const url = mockFetch.mock.calls[0]![0] as string;
    expect(url).toContain("postcode=75002");
  });
});

describe("reverseGeocode", () => {
  it("retourne le premier résultat du reverse geocoding", async () => {
    mockFetch.mockResolvedValueOnce(makeBanResponse([makeBanFeature()]));

    const result = await reverseGeocode(48.8534, 2.3488);
    expect(result).not.toBeNull();
    expect(result!.label).toBe("15 Rue de la Paix 75002 Paris");
    expect(result!.latitude).toBe(48.8534);
  });

  it("retourne null si aucun résultat", async () => {
    mockFetch.mockResolvedValueOnce(makeBanResponse([]));

    const result = await reverseGeocode(0, 0);
    expect(result).toBeNull();
  });

  it("retourne null en cas d'erreur", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await reverseGeocode(48.8534, 2.3488);
    expect(result).toBeNull();
  });
});
