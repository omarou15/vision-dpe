import { describe, it, expect } from "vitest";
import {
  isChampRequis,
  isChampInterdit,
  getChampsVisibles,
  GENERATEUR_CH_FIELDS,
  ENERGIE_PAR_DEFAUT,
  type CategorieGenerateurCh,
  type ChampGenerateurCh,
} from "../steps/step9-11";

describe("GENERATEUR_CH_FIELDS — variables_requises/interdites", () => {
  it("PAC air/eau : scop requis, rpn/rpint/rendement_generation interdits", () => {
    expect(isChampRequis("pac_air_eau", "scop")).toBe(true);
    expect(isChampRequis("pac_air_eau", "puissance_nominale")).toBe(true);
    expect(isChampInterdit("pac_air_eau", "rpn")).toBe(true);
    expect(isChampInterdit("pac_air_eau", "rpint")).toBe(true);
    expect(isChampInterdit("pac_air_eau", "rendement_generation")).toBe(true);
    expect(isChampInterdit("pac_air_eau", "rendement_combustion")).toBe(true);
  });

  it("Chaudière gaz condensation : rpn/rpint requis, scop/cop interdits", () => {
    expect(isChampRequis("chaudiere_gaz_condensation", "rpn")).toBe(true);
    expect(isChampRequis("chaudiere_gaz_condensation", "rpint")).toBe(true);
    expect(isChampRequis("chaudiere_gaz_condensation", "puissance_nominale")).toBe(true);
    expect(isChampInterdit("chaudiere_gaz_condensation", "scop")).toBe(true);
    expect(isChampInterdit("chaudiere_gaz_condensation", "cop")).toBe(true);
  });

  it("Convecteur electrique : puissance seule, rendements interdits", () => {
    expect(isChampRequis("convecteur_electrique", "puissance_nominale")).toBe(true);
    expect(isChampInterdit("convecteur_electrique", "rpn")).toBe(true);
    expect(isChampInterdit("convecteur_electrique", "scop")).toBe(true);
    expect(isChampInterdit("convecteur_electrique", "cop")).toBe(true);
    expect(isChampInterdit("convecteur_electrique", "rendement_combustion")).toBe(true);
  });

  it("Réseau chaleur : aucun champ requis, tout interdit sauf veilleuse/année", () => {
    const r = GENERATEUR_CH_FIELDS["reseau_chaleur"];
    expect(r.requis).toHaveLength(0);
    expect(r.interdits).toContain("puissance_nominale");
    expect(r.interdits).toContain("rpn");
    expect(r.interdits).toContain("scop");
  });

  it("Insert bois : rendement_generation requis, scop/cop interdits", () => {
    expect(isChampRequis("insert_bois", "rendement_generation")).toBe(true);
    expect(isChampRequis("insert_bois", "puissance_nominale")).toBe(true);
    expect(isChampInterdit("insert_bois", "scop")).toBe(true);
    expect(isChampInterdit("insert_bois", "cop")).toBe(true);
  });

  it("Chaudière fioul : rendement_combustion requis", () => {
    expect(isChampRequis("chaudiere_fioul", "rendement_combustion")).toBe(true);
    expect(isChampRequis("chaudiere_fioul", "rpn")).toBe(true);
  });
});

describe("getChampsVisibles", () => {
  it("PAC air/eau : retourne champs sans les interdits", () => {
    const v = getChampsVisibles("pac_air_eau");
    expect(v).toContain("scop");
    expect(v).toContain("puissance_nominale");
    expect(v).not.toContain("rpn");
    expect(v).not.toContain("rpint");
    expect(v).not.toContain("rendement_generation");
    expect(v).not.toContain("rendement_combustion");
  });

  it("Convecteur electrique : seulement puissance + veilleuse + année", () => {
    const v = getChampsVisibles("convecteur_electrique");
    expect(v).toContain("puissance_nominale");
    expect(v).toContain("annee_installation");
    expect(v).not.toContain("rpn");
    expect(v).not.toContain("scop");
  });

  it("Chaudière gaz : rpn, rpint, rendement_combustion visibles, scop absent", () => {
    const v = getChampsVisibles("chaudiere_gaz");
    expect(v).toContain("rpn");
    expect(v).toContain("rpint");
    expect(v).toContain("rendement_combustion");
    expect(v).not.toContain("scop");
    expect(v).not.toContain("cop");
  });

  it("autre_generateur_ch : tous les champs visibles (rien interdit)", () => {
    const v = getChampsVisibles("autre_generateur_ch");
    expect(v.length).toBe(9); // tous les 9 champs
  });
});

describe("ENERGIE_PAR_DEFAUT", () => {
  it("PAC = electricite", () => {
    expect(ENERGIE_PAR_DEFAUT["pac_air_eau"]).toBe("electricite");
    expect(ENERGIE_PAR_DEFAUT["pac_air_air"]).toBe("electricite");
    expect(ENERGIE_PAR_DEFAUT["pac_geothermique"]).toBe("electricite");
  });

  it("Chaudière gaz = gaz_naturel", () => {
    expect(ENERGIE_PAR_DEFAUT["chaudiere_gaz"]).toBe("gaz_naturel");
    expect(ENERGIE_PAR_DEFAUT["chaudiere_gaz_condensation"]).toBe("gaz_naturel");
  });

  it("Chaudière fioul = fioul_domestique", () => {
    expect(ENERGIE_PAR_DEFAUT["chaudiere_fioul"]).toBe("fioul_domestique");
  });

  it("Bois = bois_buches ou bois_granules", () => {
    expect(ENERGIE_PAR_DEFAUT["poele_bois_buches"]).toBe("bois_buches");
    expect(ENERGIE_PAR_DEFAUT["poele_granules"]).toBe("bois_granules");
    expect(ENERGIE_PAR_DEFAUT["chaudiere_bois_granules"]).toBe("bois_granules");
  });

  it("Réseau chaleur = reseau_chaleur", () => {
    expect(ENERGIE_PAR_DEFAUT["reseau_chaleur"]).toBe("reseau_chaleur");
  });

  it("19 catégories couvertes", () => {
    const cats = Object.keys(ENERGIE_PAR_DEFAUT) as CategorieGenerateurCh[];
    expect(cats.length).toBe(19);
  });
});

describe("Cohérence requis/interdits — pas de chevauchement", () => {
  it("Aucun champ n'est à la fois requis ET interdit pour une même catégorie", () => {
    const cats = Object.keys(GENERATEUR_CH_FIELDS) as CategorieGenerateurCh[];
    for (const cat of cats) {
      const r = GENERATEUR_CH_FIELDS[cat];
      const overlap = r.requis.filter((c) => r.interdits.includes(c));
      expect(overlap, `Chevauchement pour ${cat}: ${overlap.join(", ")}`).toHaveLength(0);
    }
  });

  it("19 catégories de générateurs définies", () => {
    expect(Object.keys(GENERATEUR_CH_FIELDS).length).toBe(19);
  });
});
