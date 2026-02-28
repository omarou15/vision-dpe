import { describe, it, expect } from "vitest";
import {
  isCertificationValid,
  certificationDaysRemaining,
} from "@/services/auth";

describe("isCertificationValid", () => {
  it("retourne false si null", () => {
    expect(isCertificationValid(null)).toBe(false);
  });

  it("retourne true si date future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isCertificationValid(future.toISOString())).toBe(true);
  });

  it("retourne false si date passée", () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);
    expect(isCertificationValid(past.toISOString())).toBe(false);
  });
});

describe("certificationDaysRemaining", () => {
  it("retourne null si null", () => {
    expect(certificationDaysRemaining(null)).toBeNull();
  });

  it("retourne un nombre positif si date future", () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const days = certificationDaysRemaining(future.toISOString());
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  it("retourne un nombre négatif si date passée", () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const days = certificationDaysRemaining(past.toISOString());
    expect(days).toBeLessThan(0);
  });
});
