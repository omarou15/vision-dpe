import { describe, it, expect } from "vitest";
import {
  DPE_COLORS,
  DPE_THRESHOLDS_EP,
  DPE_THRESHOLDS_GES,
  PEF_ELECTRICITE,
  STEPS_COUNT,
  PROJECT_TYPES,
  LOGEMENT_TYPES,
} from "@/utils/constants";

describe("Constants Vision DPE", () => {
  it("DPE_COLORS contient les 7 classes A-G", () => {
    const classes = Object.keys(DPE_COLORS);
    expect(classes).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
  });

  it("DPE_THRESHOLDS_EP sont dans l'ordre croissant", () => {
    const values = Object.values(DPE_THRESHOLDS_EP);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]!);
    }
  });

  it("DPE_THRESHOLDS_GES sont dans l'ordre croissant", () => {
    const values = Object.values(DPE_THRESHOLDS_GES);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]!);
    }
  });

  it("PEF electricite = 1.9 (version 1.12.3 janvier 2026)", () => {
    expect(PEF_ELECTRICITE).toBe(1.9);
  });

  it("DPE = 14 etapes, Audit = 20 etapes", () => {
    expect(STEPS_COUNT.dpe).toBe(14);
    expect(STEPS_COUNT.audit).toBe(20);
  });

  it("Types de projet : dpe et audit", () => {
    expect(PROJECT_TYPES).toEqual(["dpe", "audit"]);
  });

  it("Types de logement : maison, appartement, immeuble", () => {
    expect(LOGEMENT_TYPES).toEqual(["maison", "appartement", "immeuble"]);
  });
});
