import { describe, it, expect } from "vitest";
import { getCompletionPercent, getStatusLabel } from "@/services/projet";
import type { LocalProjet } from "@/services/db";

function makeProjet(overrides: Partial<LocalProjet> = {}): LocalProjet {
  return {
    id: "p-1",
    organisation_id: "org-1",
    created_by: "user-1",
    assigned_to: null,
    project_type: "dpe",
    status: "draft",
    logement_type: "maison",
    name: "Test DPE",
    address: null,
    postal_code: null,
    city: null,
    etiquette_energie: null,
    etiquette_climat: null,
    current_step: 1,
    steps_completed: [],
    data: {},
    pending_photos: [],
    pending_signatures: [],
    last_synced_at: null,
    is_dirty: false,
    is_new: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getCompletionPercent", () => {
  it("retourne 0% pour un projet sans étapes complétées", () => {
    expect(getCompletionPercent(makeProjet())).toBe(0);
  });

  it("retourne 50% pour un DPE avec 7/14 étapes", () => {
    expect(
      getCompletionPercent(makeProjet({ steps_completed: [1, 2, 3, 4, 5, 6, 7] }))
    ).toBe(50);
  });

  it("retourne 100% pour un DPE avec 14/14 étapes", () => {
    const allSteps = Array.from({ length: 14 }, (_, i) => i + 1);
    expect(getCompletionPercent(makeProjet({ steps_completed: allSteps }))).toBe(100);
  });

  it("calcule sur 20 pour un audit", () => {
    expect(
      getCompletionPercent(
        makeProjet({
          project_type: "audit",
          steps_completed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        })
      )
    ).toBe(50);
  });

  it("retourne 100% pour un audit avec 20/20 étapes", () => {
    const allSteps = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(
      getCompletionPercent(makeProjet({ project_type: "audit", steps_completed: allSteps }))
    ).toBe(100);
  });
});

describe("getStatusLabel", () => {
  it("retourne le label FR pour chaque statut", () => {
    expect(getStatusLabel("draft")).toBe("Brouillon");
    expect(getStatusLabel("in_progress")).toBe("En cours");
    expect(getStatusLabel("validated")).toBe("Validé");
    expect(getStatusLabel("exported")).toBe("Exporté");
    expect(getStatusLabel("archived")).toBe("Archivé");
  });
});
