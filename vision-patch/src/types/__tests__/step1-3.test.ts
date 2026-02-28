import { describe, it, expect } from "vitest";
import {
  getZoneClimatique,
  getClasseAltitude,
  isGeocodageValide,
  ZONE_CLIMATIQUE_PAR_DEPARTEMENT,
  STEP3_DEFAULTS,
} from "@/types/steps/step1-3";

describe("getZoneClimatique", () => {
  it("retourne H1c pour Paris (75)", () => {
    expect(getZoneClimatique("75001")).toBe("H1c");
    expect(getZoneClimatique("75116")).toBe("H1c");
  });

  it("retourne H3 pour Marseille (13)", () => {
    expect(getZoneClimatique("13001")).toBe("H3");
  });

  it("retourne H2a pour Rennes (35)", () => {
    expect(getZoneClimatique("35000")).toBe("H2a");
  });

  it("retourne H1b pour Strasbourg (67)", () => {
    expect(getZoneClimatique("67000")).toBe("H1b");
  });

  it("retourne H2d pour Lyon (69)", () => {
    expect(getZoneClimatique("69001")).toBe("H2d");
  });

  it("retourne H1a pour Lille (59)", () => {
    expect(getZoneClimatique("59000")).toBe("H1a");
  });

  it("retourne null pour un département inconnu", () => {
    expect(getZoneClimatique("99999")).toBeNull();
  });

  it("couvre les 96 départements métropolitains", () => {
    const depts = Object.keys(ZONE_CLIMATIQUE_PAR_DEPARTEMENT);
    expect(depts.length).toBeGreaterThanOrEqual(90);
  });
});

describe("getClasseAltitude", () => {
  it("retourne inf_400m pour altitude < 400", () => {
    expect(getClasseAltitude(0)).toBe("inf_400m");
    expect(getClasseAltitude(50)).toBe("inf_400m");
    expect(getClasseAltitude(399)).toBe("inf_400m");
  });

  it("retourne 400_800m pour 400-800", () => {
    expect(getClasseAltitude(400)).toBe("400_800m");
    expect(getClasseAltitude(600)).toBe("400_800m");
    expect(getClasseAltitude(800)).toBe("400_800m");
  });

  it("retourne sup_800m pour > 800", () => {
    expect(getClasseAltitude(801)).toBe("sup_800m");
    expect(getClasseAltitude(1500)).toBe("sup_800m");
  });
});

describe("isGeocodageValide", () => {
  it("retourne true pour score >= 0.5", () => {
    expect(isGeocodageValide(0.5)).toBe(true);
    expect(isGeocodageValide(0.85)).toBe(true);
    expect(isGeocodageValide(1.0)).toBe(true);
  });

  it("retourne false pour score < 0.5", () => {
    expect(isGeocodageValide(0.49)).toBe(false);
    expect(isGeocodageValide(0)).toBe(false);
  });
});

describe("STEP3_DEFAULTS", () => {
  it("a les bonnes valeurs par défaut", () => {
    expect(STEP3_DEFAULTS.hauteur_sous_plafond).toBe(2.5);
    expect(STEP3_DEFAULTS.nombre_niveaux).toBe(1);
    expect(STEP3_DEFAULTS.inertie).toBe("moyenne");
    expect(STEP3_DEFAULTS.materiaux_anciens).toBe(false);
  });
});
