/**
 * Tests DefaultValuesEngine + ScenarioTravauxService
 *
 * Couverture des 2 services manquants pour atteindre ≥90%
 */

import { describe, it, expect } from "vitest";

// ════════════════════════════════════════════════════════════
// DefaultValuesEngine (si pas déjà couvert par phase3-components.test.ts)
// ════════════════════════════════════════════════════════════

import {
  getPeriodeFromAnnee,
  getDefaults,
  getDefaultsFromAnnee,
  getDefaultWithSource,
  getUmurDefaut,
  getUwDefaut,
  getAllDefaultsWithSource,
  PERIODE_LABELS,
  MATERIAUX_LABELS,
  ISOLATION_LABELS,
  VITRAGE_LABELS,
  VENTILATION_LABELS,
} from "../default-values";

describe("DefaultValuesEngine — complet", () => {
  describe("getPeriodeFromAnnee — bornes exactes", () => {
    it("1947 → avant_1948", () => expect(getPeriodeFromAnnee(1947)).toBe("avant_1948"));
    it("1948 → 1948_1974", () => expect(getPeriodeFromAnnee(1948)).toBe("1948_1974"));
    it("1974 → 1948_1974", () => expect(getPeriodeFromAnnee(1974)).toBe("1948_1974"));
    it("1975 → 1975_1981", () => expect(getPeriodeFromAnnee(1975)).toBe("1975_1981"));
    it("1981 → 1975_1981", () => expect(getPeriodeFromAnnee(1981)).toBe("1975_1981"));
    it("1982 → 1982_1989", () => expect(getPeriodeFromAnnee(1982)).toBe("1982_1989"));
    it("1989 → 1982_1989", () => expect(getPeriodeFromAnnee(1989)).toBe("1982_1989"));
    it("1990 → 1990_2000", () => expect(getPeriodeFromAnnee(1990)).toBe("1990_2000"));
    it("2000 → 1990_2000", () => expect(getPeriodeFromAnnee(2000)).toBe("1990_2000"));
    it("2001 → 2001_2005", () => expect(getPeriodeFromAnnee(2001)).toBe("2001_2005"));
    it("2005 → 2001_2005", () => expect(getPeriodeFromAnnee(2005)).toBe("2001_2005"));
    it("2006 → 2006_2012", () => expect(getPeriodeFromAnnee(2006)).toBe("2006_2012"));
    it("2012 → 2006_2012", () => expect(getPeriodeFromAnnee(2012)).toBe("2006_2012"));
    it("2013 → apres_2012", () => expect(getPeriodeFromAnnee(2013)).toBe("apres_2012"));
  });

  describe("getDefaults — toutes périodes", () => {
    it("avant 1948 : pierre non isolé", () => {
      const d = getDefaults("avant_1948");
      expect(d.materiaux_mur).toBe("pierre");
      expect(d.type_isolation).toBe("non_isole");
      expect(d.epaisseur_isolation).toBeNull();
      expect(d.umur_defaut).toBe(2.5);
    });

    it("1975-1981 : ITI possible 4cm", () => {
      const d = getDefaults("1975_1981");
      expect(d.type_isolation).toBe("iti");
      expect(d.epaisseur_isolation).toBe(4);
      expect(d.resistance_isolation).toBe(1.0);
    });

    it("2001-2005 : double vitrage low-e", () => {
      const d = getDefaults("2001_2005");
      expect(d.type_vitrage).toBe("double_vitrage_lowe");
      expect(d.type_ventilation).toBe("vmc_sf_hygro");
    });

    it("après 2012 : meilleurs U", () => {
      const d = getDefaults("apres_2012");
      expect(d.umur_defaut).toBeLessThan(0.3);
      expect(d.uw_defaut).toBeLessThan(1.5);
      expect(d.uph_defaut).toBeLessThan(0.3);
    });

    it("U mur décroît avec les périodes", () => {
      const periodes = ["avant_1948", "1948_1974", "1975_1981", "1990_2000", "apres_2012"] as const;
      for (let i = 1; i < periodes.length; i++) {
        const prev = getDefaults(periodes[i - 1]).umur_defaut;
        const curr = getDefaults(periodes[i]).umur_defaut;
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });
  });

  describe("getDefaultsFromAnnee", () => {
    it("délègue à getDefaults correctement", () => {
      const d = getDefaultsFromAnnee(1985);
      expect(d).toEqual(getDefaults("1982_1989"));
    });
  });

  describe("getDefaultWithSource", () => {
    it("retourne value + source pour materiaux_mur", () => {
      const r = getDefaultWithSource("avant_1948", "materiaux_mur");
      expect(r.value).toBe("pierre");
      expect(r.source).toContain("1948");
    });

    it("retourne value + source pour type_isolation", () => {
      const r = getDefaultWithSource("1990_2000", "type_isolation");
      expect(r.value).toBe("iti");
      expect(r.source).toContain("1990");
    });
  });

  describe("getUmurDefaut / getUwDefaut", () => {
    it("Umur 1948-1974 = 2.5", () => {
      expect(getUmurDefaut("1948_1974").value).toBe(2.5);
    });

    it("Uw 1982-1989 = 2.8", () => {
      expect(getUwDefaut("1982_1989").value).toBe(2.8);
    });

    it("source contient la valeur U", () => {
      const r = getUmurDefaut("apres_2012");
      expect(r.source).toContain("0.2");
    });
  });

  describe("getAllDefaultsWithSource", () => {
    it("retourne 13 entrées", () => {
      const all = getAllDefaultsWithSource("1982_1989");
      expect(Object.keys(all)).toHaveLength(13);
    });

    it("chaque entrée a value et source", () => {
      const all = getAllDefaultsWithSource("2006_2012");
      for (const [, val] of Object.entries(all)) {
        expect(val).toHaveProperty("value");
        expect(val).toHaveProperty("source");
        expect(val.source.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Labels exportés", () => {
    it("8 périodes", () => expect(Object.keys(PERIODE_LABELS)).toHaveLength(8));
    it("MATERIAUX_LABELS", () => expect(Object.keys(MATERIAUX_LABELS).length).toBeGreaterThan(0));
    it("ISOLATION_LABELS", () => expect(Object.keys(ISOLATION_LABELS).length).toBeGreaterThan(0));
    it("VITRAGE_LABELS", () => expect(Object.keys(VITRAGE_LABELS).length).toBeGreaterThan(0));
    it("VENTILATION_LABELS", () => expect(Object.keys(VENTILATION_LABELS).length).toBeGreaterThan(0));
  });
});

// ════════════════════════════════════════════════════════════
// ScenarioTravauxService
// ════════════════════════════════════════════════════════════

import {
  validerScenariosDpe,
  isClasseSuffisante,
  calculerCoutTotalTravaux,
  parcoursDifferent,
  estimerGainTotal,
  GAIN_FORFAITAIRE_PAR_POSTE,
} from "../scenario-travaux";

describe("ScenarioTravauxService", () => {
  describe("isClasseSuffisante", () => {
    it("A >= B → true", () => expect(isClasseSuffisante("A", "B")).toBe(true));
    it("B >= B → true", () => expect(isClasseSuffisante("B", "B")).toBe(true));
    it("C >= C → true", () => expect(isClasseSuffisante("C", "C")).toBe(true));
    it("C >= B → false", () => expect(isClasseSuffisante("C", "B")).toBe(false));
    it("D >= C → false", () => expect(isClasseSuffisante("D", "C")).toBe(false));
    it("G >= A → false", () => expect(isClasseSuffisante("G", "A")).toBe(false));
  });

  describe("validerScenariosDpe", () => {
    const parcoursValide1 = {
      numero_parcours: 1,
      classe_visee: "C",
      cout_total: 10000,
      etapes: [
        { numero: 1, travaux: [{ poste: "isolation_murs", description: "Isolation", cout_estime: 5000 }], description: "Étape 1" },
        { numero: 2, travaux: [{ poste: "chauffage", description: "Chaudière", cout_estime: 5000 }], description: "Étape 2" },
      ],
    };

    const parcoursValide2 = {
      numero_parcours: 2,
      classe_visee: "B",
      cout_total: 25000,
      etapes: [
        { numero: 1, travaux: [
          { poste: "isolation_murs", description: "Mur", cout_estime: 8000 },
          { poste: "chauffage", description: "PAC", cout_estime: 10000 },
          { poste: "ventilation", description: "VMC", cout_estime: 7000 },
        ], description: "Global" },
      ],
    };

    it("2 parcours valides différents → 0 erreurs", () => {
      const erreurs = validerScenariosDpe([parcoursValide1, parcoursValide2] as any);
      expect(erreurs).toHaveLength(0);
    });

    it("0 parcours → SCE_001", () => {
      const erreurs = validerScenariosDpe([]);
      expect(erreurs.some(e => e.code === "SCE_001")).toBe(true);
    });

    it("1 seul parcours → SCE_001", () => {
      const erreurs = validerScenariosDpe([parcoursValide1] as any);
      expect(erreurs.some(e => e.code === "SCE_001")).toBe(true);
    });
  });

  describe("calculerCoutTotalTravaux", () => {
    it("somme les coûts", () => {
      const travaux = [
        { poste: "isolation_murs", description: "Mur", cout_estime: 5000 },
        { poste: "chauffage", description: "Chaudière", cout_estime: 3000 },
        { poste: "ventilation", description: "VMC", cout_estime: 2000 },
      ];
      expect(calculerCoutTotalTravaux(travaux as any)).toBe(10000);
    });

    it("0 travaux → 0", () => {
      expect(calculerCoutTotalTravaux([])).toBe(0);
    });
  });

  describe("parcoursDifferent", () => {
    it("postes différents → true", () => {
      expect(parcoursDifferent(
        ["isolation_murs", "chauffage"],
        ["ventilation", "ecs"]
      )).toBe(true);
    });

    it("postes identiques → false", () => {
      expect(parcoursDifferent(
        ["isolation_murs", "chauffage"],
        ["isolation_murs", "chauffage"]
      )).toBe(false);
    });

    it("un poste différent suffit → true", () => {
      expect(parcoursDifferent(
        ["isolation_murs", "chauffage"],
        ["isolation_murs", "ventilation"]
      )).toBe(true);
    });
  });

  describe("estimerGainTotal", () => {
    it("isolation murs + chauffage", () => {
      const gains = estimerGainTotal(["isolation_murs", "chauffage"] as any);
      expect(gains.cep).toBe(
        GAIN_FORFAITAIRE_PAR_POSTE.isolation_murs.cep +
        GAIN_FORFAITAIRE_PAR_POSTE.chauffage.cep
      );
      expect(gains.eges).toBe(
        GAIN_FORFAITAIRE_PAR_POSTE.isolation_murs.eges +
        GAIN_FORFAITAIRE_PAR_POSTE.chauffage.eges
      );
    });

    it("tous les postes", () => {
      const allPostes = Object.keys(GAIN_FORFAITAIRE_PAR_POSTE);
      const gains = estimerGainTotal(allPostes as any);
      expect(gains.cep).toBeGreaterThan(0);
      expect(gains.eges).toBeGreaterThan(0);
    });
  });

  describe("GAIN_FORFAITAIRE_PAR_POSTE", () => {
    it("contient au moins 8 postes", () => {
      expect(Object.keys(GAIN_FORFAITAIRE_PAR_POSTE).length).toBeGreaterThanOrEqual(8);
    });

    it("chaque poste a cep et eges positifs", () => {
      for (const [, gain] of Object.entries(GAIN_FORFAITAIRE_PAR_POSTE)) {
        expect(gain.cep).toBeGreaterThan(0);
        expect(gain.eges).toBeGreaterThan(0);
      }
    });

    it("chauffage a le plus gros gain Cep", () => {
      const maxCep = Math.max(
        ...Object.values(GAIN_FORFAITAIRE_PAR_POSTE).map(g => g.cep)
      );
      expect(GAIN_FORFAITAIRE_PAR_POSTE.chauffage.cep).toBe(maxCep);
    });
  });
});
