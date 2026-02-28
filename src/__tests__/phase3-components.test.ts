import { describe, it, expect } from "vitest";
import {
  getPeriodeFromAnnee,
  getDefaults,
  getDefaultsFromAnnee,
  getDefaultWithSource,
  getUmurDefaut,
  getUwDefaut,
  getAllDefaultsWithSource,
  PERIODE_LABELS,
  type PeriodeConstruction,
} from "@/services/default-values";
import {
  GENERATEURS_CHAUFFAGE,
  GENERATEURS_ECS,
  findGenerateur,
  getCategoriesChauffage,
  getCategoriesEcs,
} from "@/data/generateurs-entonnoir";

// ════════════════════════════════════════════════════════════
// DefaultValuesEngine
// ════════════════════════════════════════════════════════════

describe("getPeriodeFromAnnee", () => {
  it("1920 → avant_1948", () => expect(getPeriodeFromAnnee(1920)).toBe("avant_1948"));
  it("1947 → avant_1948", () => expect(getPeriodeFromAnnee(1947)).toBe("avant_1948"));
  it("1948 → 1948_1974", () => expect(getPeriodeFromAnnee(1948)).toBe("1948_1974"));
  it("1970 → 1948_1974", () => expect(getPeriodeFromAnnee(1970)).toBe("1948_1974"));
  it("1975 → 1975_1981", () => expect(getPeriodeFromAnnee(1975)).toBe("1975_1981"));
  it("1985 → 1982_1989", () => expect(getPeriodeFromAnnee(1985)).toBe("1982_1989"));
  it("1995 → 1990_2000", () => expect(getPeriodeFromAnnee(1995)).toBe("1990_2000"));
  it("2003 → 2001_2005", () => expect(getPeriodeFromAnnee(2003)).toBe("2001_2005"));
  it("2010 → 2006_2012", () => expect(getPeriodeFromAnnee(2010)).toBe("2006_2012"));
  it("2020 → apres_2012", () => expect(getPeriodeFromAnnee(2020)).toBe("apres_2012"));
});

describe("getDefaults", () => {
  it("avant 1948 : pierre, non isolé, simple vitrage", () => {
    const d = getDefaults("avant_1948");
    expect(d.materiaux_mur).toBe("pierre");
    expect(d.type_isolation).toBe("non_isole");
    expect(d.type_vitrage).toBe("simple_vitrage");
    expect(d.type_ventilation).toBe("naturelle");
  });

  it("1982-1989 : béton, ITI, double vitrage ancien", () => {
    const d = getDefaults("1982_1989");
    expect(d.materiaux_mur).toBe("beton");
    expect(d.type_isolation).toBe("iti");
    expect(d.type_vitrage).toBe("double_vitrage_ancien");
    expect(d.type_ventilation).toBe("vmc_sf");
  });

  it("après 2012 : ITE/ITI fort, double/triple vitrage, VMC DF", () => {
    const d = getDefaults("apres_2012");
    expect(d.type_isolation).toBe("ite_ou_iti_fort");
    expect(d.type_vitrage).toBe("double_triple_vitrage");
    expect(d.type_ventilation).toBe("vmc_df_hygro_b");
  });

  it("8 périodes définies", () => {
    expect(Object.keys(PERIODE_LABELS).length).toBe(8);
  });

  it("toutes les périodes ont des valeurs U", () => {
    const periodes: PeriodeConstruction[] = [
      "avant_1948", "1948_1974", "1975_1981", "1982_1989",
      "1990_2000", "2001_2005", "2006_2012", "apres_2012",
    ];
    for (const p of periodes) {
      const d = getDefaults(p);
      expect(d.umur_defaut).toBeGreaterThan(0);
      expect(d.uw_defaut).toBeGreaterThan(0);
    }
  });

  it("U mur décroît avec les périodes récentes", () => {
    const old = getDefaults("avant_1948").umur_defaut;
    const recent = getDefaults("apres_2012").umur_defaut;
    expect(old).toBeGreaterThan(recent);
  });
});

describe("getDefaultsFromAnnee", () => {
  it("1965 → non isolé", () => {
    const d = getDefaultsFromAnnee(1965);
    expect(d.type_isolation).toBe("non_isole");
  });

  it("2020 → ITE ou ITI fort", () => {
    const d = getDefaultsFromAnnee(2020);
    expect(d.type_isolation).toBe("ite_ou_iti_fort");
  });
});

describe("getDefaultWithSource", () => {
  it("retourne value et source", () => {
    const r = getDefaultWithSource("1982_1989", "materiaux_mur");
    expect(r.value).toBe("beton");
    expect(r.source).toContain("1982");
  });
});

describe("getUmurDefaut / getUwDefaut", () => {
  it("Umur avant 1948 = 2.5", () => {
    const r = getUmurDefaut("avant_1948");
    expect(r.value).toBe(2.5);
    expect(r.source).toContain("2.5");
  });

  it("Uw après 2012 = 1.1", () => {
    const r = getUwDefaut("apres_2012");
    expect(r.value).toBe(1.1);
  });
});

describe("getAllDefaultsWithSource", () => {
  it("retourne 13 champs avec source", () => {
    const all = getAllDefaultsWithSource("1990_2000");
    expect(Object.keys(all).length).toBe(13);
    for (const [key, val] of Object.entries(all)) {
      expect(val.source).toBeTruthy();
    }
  });
});

// ════════════════════════════════════════════════════════════
// Mapping entonnoir générateurs
// ════════════════════════════════════════════════════════════

describe("GENERATEURS_CHAUFFAGE", () => {
  it("contient au moins 40 générateurs", () => {
    expect(GENERATEURS_CHAUFFAGE.length).toBeGreaterThanOrEqual(40);
  });

  it("chaque générateur a id, label, categorie, sous_categorie", () => {
    for (const g of GENERATEURS_CHAUFFAGE) {
      expect(g.id).toBeTruthy();
      expect(g.label).toBeTruthy();
      expect(g.categorie).toBeTruthy();
      expect(g.sous_categorie).toBeTruthy();
    }
  });

  it("ids uniques", () => {
    const ids = GENERATEURS_CHAUFFAGE.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contient les catégories principales", () => {
    const cats = getCategoriesChauffage();
    expect(cats).toContain("Chaudière");
    expect(cats).toContain("PAC");
    expect(cats).toContain("Électrique");
    expect(cats).toContain("Bois");
  });
});

describe("GENERATEURS_ECS", () => {
  it("contient au moins 20 générateurs", () => {
    expect(GENERATEURS_ECS.length).toBeGreaterThanOrEqual(20);
  });

  it("ids uniques", () => {
    const ids = GENERATEURS_ECS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contient les catégories principales", () => {
    const cats = getCategoriesEcs();
    expect(cats).toContain("Ballon électrique");
    expect(cats).toContain("Thermodynamique");
    expect(cats).toContain("Solaire");
  });
});

describe("findGenerateur", () => {
  it("trouve un générateur chauffage", () => {
    const g = findGenerateur("pac_air_eau_apres_2018");
    expect(g).toBeDefined();
    expect(g?.categorie).toBe("PAC");
  });

  it("trouve un générateur ECS", () => {
    const g = findGenerateur("ecs_thermodynamique_air_extrait");
    expect(g).toBeDefined();
    expect(g?.categorie).toBe("Thermodynamique");
  });

  it("retourne undefined pour id inconnu", () => {
    expect(findGenerateur("inexistant")).toBeUndefined();
  });
});
