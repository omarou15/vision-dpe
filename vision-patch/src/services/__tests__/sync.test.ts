import { describe, it, expect } from "vitest";
import { getFieldValue, getStepValues } from "@/services/sync";
import type { LocalProjet } from "@/services/db";

// Helper pour créer un projet local minimal
function makeProjet(data: Record<string, Record<string, { value: unknown; updated_at: string }>>): LocalProjet {
  return {
    id: "test-1",
    organisation_id: "org-1",
    created_by: "user-1",
    assigned_to: null,
    project_type: "dpe",
    status: "draft",
    logement_type: null,
    name: "Test",
    address: null,
    postal_code: null,
    city: null,
    etiquette_energie: null,
    etiquette_climat: null,
    current_step: 1,
    steps_completed: [],
    data,
    pending_photos: [],
    pending_signatures: [],
    last_synced_at: null,
    is_dirty: false,
    is_new: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("getFieldValue", () => {
  it("retourne la valeur d'un champ existant", () => {
    const projet = makeProjet({
      step_1: {
        address: { value: "15 rue de la Paix", updated_at: "2026-01-01T00:00:00Z" },
      },
    });
    expect(getFieldValue(projet, "step_1", "address")).toBe("15 rue de la Paix");
  });

  it("retourne undefined pour un champ inexistant", () => {
    const projet = makeProjet({});
    expect(getFieldValue(projet, "step_1", "address")).toBeUndefined();
  });

  it("retourne undefined pour une étape inexistante", () => {
    const projet = makeProjet({
      step_1: { address: { value: "test", updated_at: "2026-01-01T00:00:00Z" } },
    });
    expect(getFieldValue(projet, "step_99", "address")).toBeUndefined();
  });
});

describe("getStepValues", () => {
  it("retourne toutes les valeurs sans timestamps", () => {
    const projet = makeProjet({
      step_2: {
        logement_type: { value: "maison", updated_at: "2026-01-01T00:00:00Z" },
        surface: { value: 120, updated_at: "2026-01-01T00:00:00Z" },
        hsp: { value: 2.5, updated_at: "2026-01-01T00:00:00Z" },
      },
    });

    const values = getStepValues(projet, "step_2");

    expect(values).toEqual({
      logement_type: "maison",
      surface: 120,
      hsp: 2.5,
    });
  });

  it("retourne objet vide pour étape inexistante", () => {
    const projet = makeProjet({});
    expect(getStepValues(projet, "step_99")).toEqual({});
  });

  it("gère les valeurs null et booléennes", () => {
    const projet = makeProjet({
      step_4: {
        isolation: { value: true, updated_at: "2026-01-01T00:00:00Z" },
        epaisseur: { value: null, updated_at: "2026-01-01T00:00:00Z" },
        count: { value: 0, updated_at: "2026-01-01T00:00:00Z" },
      },
    });

    const values = getStepValues(projet, "step_4");
    expect(values.isolation).toBe(true);
    expect(values.epaisseur).toBeNull();
    expect(values.count).toBe(0);
  });
});
