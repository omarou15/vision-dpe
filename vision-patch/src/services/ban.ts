/**
 * Service Géocodage — API BAN (adresse.data.gouv.fr)
 * 
 * Utilisé à l'étape 1 du wizard pour :
 * - Autocomplétion d'adresse (search)
 * - Géocodage complet (coordonnées GPS, score, identifiant BAN)
 * - Reverse geocoding (depuis GPS terrain)
 * 
 * Le géocodage BAN est BLOQUANT au sens ADEME : sans résultat valide,
 * le DPE est rejeté par le contrôle de cohérence.
 */

import type { GeocodageBAN } from "@/types";

const BAN_BASE_URL = "https://api-adresse.data.gouv.fr";

/** Résultat brut de l'API BAN */
interface BANFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    name: string;
    postcode: string;
    city: string;
    citycode: string;
    type: "housenumber" | "street" | "municipality" | "locality";
    id: string;
  };
}

interface BANResponse {
  type: "FeatureCollection";
  features: BANFeature[];
}

/** Convertit un résultat BAN en notre type GeocodageBAN */
function toGeocodage(feature: BANFeature): GeocodageBAN {
  return {
    label: feature.properties.label,
    score: feature.properties.score,
    housenumber: feature.properties.housenumber || null,
    street: feature.properties.street || feature.properties.name,
    postcode: feature.properties.postcode,
    city: feature.properties.city,
    citycode: feature.properties.citycode,
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    ban_id: feature.properties.id,
    type: feature.properties.type,
  };
}

/**
 * Recherche d'adresse (autocomplétion).
 * Retourne jusqu'à `limit` résultats triés par pertinence.
 */
export async function searchAddress(
  query: string,
  options?: {
    limit?: number;
    postcode?: string;
    citycode?: string;
    type?: "housenumber" | "street" | "municipality";
  }
): Promise<GeocodageBAN[]> {
  if (!query || query.length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    limit: String(options?.limit ?? 5),
  });

  if (options?.postcode) params.set("postcode", options.postcode);
  if (options?.citycode) params.set("citycode", options.citycode);
  if (options?.type) params.set("type", options.type);

  try {
    const response = await fetch(`${BAN_BASE_URL}/search/?${params}`);
    if (!response.ok) throw new Error(`BAN API error: ${response.status}`);

    const data: BANResponse = await response.json();
    return data.features.map(toGeocodage);
  } catch (error) {
    console.error("BAN search error:", error);
    return [];
  }
}

/**
 * Reverse geocoding depuis des coordonnées GPS.
 * Utile quand le diagnostiqueur est sur le terrain avec le GPS activé.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodageBAN | null> {
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
    });

    const response = await fetch(`${BAN_BASE_URL}/reverse/?${params}`);
    if (!response.ok) throw new Error(`BAN API error: ${response.status}`);

    const data: BANResponse = await response.json();
    if (data.features.length === 0) return null;

    return toGeocodage(data.features[0]!);
  } catch (error) {
    console.error("BAN reverse error:", error);
    return null;
  }
}
