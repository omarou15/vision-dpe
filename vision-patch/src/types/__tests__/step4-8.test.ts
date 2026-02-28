import { describe, it, expect } from "vitest";
import {
  isAdjacenceLNC,
  isMethodeSaisieDirecte,
  isMethodeForfaitaire,
  isMethodeAvecIsolation,
  generateEnveloppeId,
  createEmptyMur,
  ADJACENCES_LNC,
  ADJACENCES_DIRECTES,
} from "@/types/steps/step4-8";

describe("isAdjacenceLNC", () => {
  it("retourne true pour les adjacences LNC", () => {
    expect(isAdjacenceLNC("garage")).toBe(true);
    expect(isAdjacenceLNC("comble_perdu")).toBe(true);
    expect(isAdjacenceLNC("circulation_commune")).toBe(true);
    expect(isAdjacenceLNC("parc_stationnement")).toBe(true);
  });

  it("retourne false pour les adjacences directes", () => {
    expect(isAdjacenceLNC("exterieur")).toBe(false);
    expect(isAdjacenceLNC("terre_plein")).toBe(false);
    expect(isAdjacenceLNC("vide_sanitaire")).toBe(false);
  });

  it("couvre au moins 14 adjacences LNC", () => {
    expect(ADJACENCES_LNC.length).toBeGreaterThanOrEqual(14);
  });

  it("couvre 3 adjacences directes", () => {
    expect(ADJACENCES_DIRECTES).toHaveLength(3);
  });
});

describe("isMethodeSaisieDirecte", () => {
  it("retourne true pour saisie_directe_u", () => {
    expect(isMethodeSaisieDirecte("saisie_directe_u")).toBe(true);
  });

  it("retourne true pour donnee_certifiee", () => {
    expect(isMethodeSaisieDirecte("donnee_certifiee")).toBe(true);
  });

  it("retourne false pour forfaitaire", () => {
    expect(isMethodeSaisieDirecte("non_isole_forfaitaire")).toBe(false);
    expect(isMethodeSaisieDirecte("isole_forfaitaire_recent")).toBe(false);
  });
});

describe("isMethodeForfaitaire", () => {
  it("retourne true pour les méthodes forfaitaires", () => {
    expect(isMethodeForfaitaire("non_isole_forfaitaire")).toBe(true);
    expect(isMethodeForfaitaire("isole_forfaitaire_recent")).toBe(true);
    expect(isMethodeForfaitaire("isole_forfaitaire_ancien")).toBe(true);
  });

  it("retourne false pour les saisies directes", () => {
    expect(isMethodeForfaitaire("saisie_directe_u")).toBe(false);
  });
});

describe("isMethodeAvecIsolation", () => {
  it("retourne true pour les méthodes épaisseur/résistance", () => {
    expect(isMethodeAvecIsolation("saisie_resistance_isolation")).toBe(true);
    expect(isMethodeAvecIsolation("saisie_epaisseur_isolation")).toBe(true);
  });

  it("retourne false pour les forfaitaires et saisie directe", () => {
    expect(isMethodeAvecIsolation("non_isole_forfaitaire")).toBe(false);
    expect(isMethodeAvecIsolation("saisie_directe_u")).toBe(false);
  });
});

describe("generateEnveloppeId", () => {
  it("génère un ID avec le bon préfixe", () => {
    const id = generateEnveloppeId("mur");
    expect(id).toMatch(/^mur_[a-f0-9]{8}$/);
  });

  it("génère des IDs uniques", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateEnveloppeId("baie")));
    expect(ids.size).toBe(100);
  });
});

describe("createEmptyMur", () => {
  it("crée un mur avec les valeurs par défaut", () => {
    const mur = createEmptyMur();

    expect(mur.id).toMatch(/^mur_/);
    expect(mur.donnee_entree.type_adjacence).toBe("exterieur");
    expect(mur.donnee_entree.orientation).toBe("nord");
    expect(mur.donnee_entree.materiaux_structure).toBe("beton_bloc_parpaing");
    expect(mur.donnee_entree.type_isolation).toBe("non_isole");
    expect(mur.donnee_entree.methode_saisie_u).toBe("non_isole_forfaitaire");
    expect(mur.donnee_entree.paroi_lourde).toBe(true);
    expect(mur.umur).toBeNull();
  });

  it("crée des murs avec des IDs différents", () => {
    const m1 = createEmptyMur();
    const m2 = createEmptyMur();
    expect(m1.id).not.toBe(m2.id);
  });
});
