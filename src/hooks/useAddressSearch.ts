import { useState, useEffect, useRef, useCallback } from "react";
import { searchAddress, reverseGeocode } from "@/services/ban";
import { getZoneClimatique, getClasseAltitude } from "@/types";
import type { GeocodageBAN, ZoneClimatique, ClasseAltitude } from "@/types";

interface UseAddressSearchResult {
  /** Résultats de l'autocomplétion */
  suggestions: GeocodageBAN[];
  /** Adresse sélectionnée */
  selected: GeocodageBAN | null;
  /** Zone climatique déduite */
  zoneClimatique: ZoneClimatique | null;
  /** Classe altitude (nécessite altitude manuelle ou API externe) */
  classeAltitude: ClasseAltitude;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur */
  error: string | null;
  /** Lancer la recherche avec une query */
  search: (query: string) => void;
  /** Sélectionner une suggestion */
  select: (geo: GeocodageBAN) => void;
  /** Géolocaliser depuis le GPS du terrain */
  geolocate: () => void;
  /** Réinitialiser */
  clear: () => void;
}

/** Délai debounce pour l'autocomplétion (ms) */
const DEBOUNCE_MS = 300;

/**
 * Hook de recherche d'adresse BAN avec autocomplétion debounced.
 * 
 * Déduit automatiquement la zone climatique depuis le code postal.
 * Altitude par défaut : 0m (à affiner par le diagnostiqueur à l'étape 3).
 */
export function useAddressSearch(altitude: number = 0): UseAddressSearchResult {
  const [suggestions, setSuggestions] = useState<GeocodageBAN[]>([]);
  const [selected, setSelected] = useState<GeocodageBAN | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zone climatique déduite
  const zoneClimatique = selected ? getZoneClimatique(selected.postcode) : null;
  const classeAltitude = getClasseAltitude(altitude);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await searchAddress(query, { limit: 5 });
        setSuggestions(results);
      } catch {
        setError("Erreur de recherche d'adresse");
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const search = useCallback((q: string) => {
    setQuery(q);
    setSelected(null);
  }, []);

  const select = useCallback((geo: GeocodageBAN) => {
    setSelected(geo);
    setSuggestions([]);
    setQuery("");
  }, []);

  const geolocate = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non disponible");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          if (result) {
            setSelected(result);
            setSuggestions([]);
          } else {
            setError("Aucune adresse trouvée à cette position");
          }
        } catch {
          setError("Erreur de géolocalisation inverse");
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError(`Erreur GPS : ${err.message}`);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
    setSuggestions([]);
    setQuery("");
    setError(null);
  }, []);

  return {
    suggestions,
    selected,
    zoneClimatique,
    classeAltitude,
    isLoading,
    error,
    search,
    select,
    geolocate,
    clear,
  };
}
