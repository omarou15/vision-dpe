import { describe, it, expect } from "vitest";
import { calculerEtiquette, determinerTrancheRevenu, SEUILS_ETIQUETTE, ETAPES_AUDIT_LABELS, NB_ETAPES_AUDIT } from "../steps/audit";
import { validerStep1, validerStep2, validerStep9, validerStep12, validerDpeComplet, compterErreurs, type DonneesDpe } from "../../services/validation";

describe("calculerEtiquette — doubles seuils EP + GES", () => {
  it("A : Cep=50 Eges=4", () => expect(calculerEtiquette(50, 4)).toBe("A"));
  it("B : Cep=100 Eges=10", () => expect(calculerEtiquette(100, 10)).toBe("B"));
  it("C : Cep=170 Eges=25", () => expect(calculerEtiquette(170, 25)).toBe("C"));
  it("D : Cep=240 Eges=45", () => expect(calculerEtiquette(240, 45)).toBe("D"));
  it("E : Cep=300 Eges=60", () => expect(calculerEtiquette(300, 60)).toBe("E"));
  it("F : Cep=400 Eges=90", () => expect(calculerEtiquette(400, 90)).toBe("F"));
  it("G : Cep=500 Eges=120", () => expect(calculerEtiquette(500, 120)).toBe("G"));
  it("Double seuil : Cep=60 mais Eges=15 → B (GES déclasse)", () => expect(calculerEtiquette(60, 15)).toBe("C"));
  it("Double seuil : Cep=200 mais Eges=5 → D (EP déclasse)", () => expect(calculerEtiquette(200, 5)).toBe("D"));
});

describe("determinerTrancheRevenu", () => {
  it("Très modeste IDF 1 pers", () => expect(determinerTrancheRevenu(20000, 1, "idf")).toBe("tres_modeste"));
  it("Modeste IDF 2 pers", () => expect(determinerTrancheRevenu(30000, 2, "idf")).toBe("modeste"));
  it("Intermédiaire hors IDF 3 pers", () => expect(determinerTrancheRevenu(40000, 3, "hors_idf")).toBe("intermediaire"));
  it("Supérieur hors IDF 1 pers", () => expect(determinerTrancheRevenu(50000, 1, "hors_idf")).toBe("superieur"));
});

describe("ETAPES_AUDIT_LABELS", () => {
  it("20 étapes définies", () => expect(Object.keys(ETAPES_AUDIT_LABELS).length).toBe(NB_ETAPES_AUDIT));
  it("étape 12 = Bilan état initial", () => expect(ETAPES_AUDIT_LABELS[12]).toBe("Bilan état initial"));
  it("étape 17 = Analyse économique", () => expect(ETAPES_AUDIT_LABELS[17]).toBe("Analyse économique"));
  it("étape 20 = Export XML audit", () => expect(ETAPES_AUDIT_LABELS[20]).toBe("Export XML audit"));
});

describe("SEUILS_ETIQUETTE", () => {
  it("7 classes définies", () => expect(Object.keys(SEUILS_ETIQUETTE).length).toBe(7));
  it("A: cep_max=70 eges_max=6", () => { expect(SEUILS_ETIQUETTE.A.cep_max).toBe(70); expect(SEUILS_ETIQUETTE.A.eges_max).toBe(6); });
  it("G: cep_max=Infinity", () => expect(SEUILS_ETIQUETTE.G.cep_max).toBe(Infinity));
});

describe("ValidationService", () => {
  describe("validerStep1", () => {
    it("géocodage manquant → GEO_001", () => {
      const errs = validerStep1({});
      expect(errs.some(e => e.code === "GEO_001")).toBe(true);
    });
    it("score insuffisant → GEO_002", () => {
      const errs = validerStep1({ geocodage: { label: "test", score: 0.3, housenumber: "", street: "", postcode: "75001", city: "Paris", citycode: "75101", latitude: 48.8, longitude: 2.3, ban_id: "x", type: "housenumber" }, geocodage_valide: true });
      expect(errs.some(e => e.code === "GEO_002")).toBe(true);
    });
    it("date visite manquante → ADM_001", () => {
      const errs = validerStep1({ geocodage_valide: true, geocodage: { label: "x", score: 0.9, housenumber: "", street: "", postcode: "75001", city: "Paris", citycode: "75101", latitude: 48.8, longitude: 2.3, ban_id: "x", type: "housenumber" } });
      expect(errs.some(e => e.code === "ADM_001")).toBe(true);
    });
  });

  describe("validerStep2", () => {
    it("surface lot manquante → ADM_011", () => {
      const errs = validerStep2({ methode_application: "maison_individuelle" });
      expect(errs.some(e => e.code === "ADM_011")).toBe(true);
    });
    it("immeuble sans surface bâtiment → ADM_014", () => {
      const errs = validerStep2({ methode_application: "immeuble_collectif", surface_habitable_lot: 80 });
      expect(errs.some(e => e.code === "ADM_014")).toBe(true);
    });
    it("lot > bâtiment → ADM_015", () => {
      const errs = validerStep2({ methode_application: "lot_copropriete", surface_habitable_lot: 200, surface_habitable_batiment: 100 });
      expect(errs.some(e => e.code === "ADM_015")).toBe(true);
    });
  });

  describe("validerStep9 — variables_requises/interdites", () => {
    it("aucune installation → CH_001", () => {
      expect(validerStep9({}).some(e => e.code === "CH_001")).toBe(true);
    });
    it("PAC sans SCOP → CH_REQ", () => {
      const errs = validerStep9({ installations_chauffage: [{
        id: "x", description: "", cfg_installation: "installation_unique", surface_chauffee: 80,
        generateurs: [{ id: "g", description: "", categorie: "pac_air_eau", type_generateur_ch_id: null, energie: "electricite", puissance_nominale: null, rpn: null, rpint: null, rendement_generation: null, scop: null, cop: null, rendement_combustion: null, presence_veilleuse: false, priorite: "base", surface_chauffee: null, part_surface: null, annee_installation: null }],
        emetteurs: [], regulation: { equipement_intermittence: "aucun", regulation_pied_colonne: false, comptage_individuel: false },
      }] });
      expect(errs.some(e => e.code === "CH_REQ" && e.champ === "scop")).toBe(true);
      expect(errs.some(e => e.code === "CH_REQ" && e.champ === "puissance_nominale")).toBe(true);
    });
  });

  describe("validerStep12 — scénarios travaux", () => {
    it("moins de 2 parcours → TRV_001", () => {
      expect(validerStep12({ parcours: [] }).some(e => e.code === "TRV_001")).toBe(true);
    });
    it("classe visée insuffisante → TRV_002", () => {
      const errs = validerStep12({ parcours: [
        { id: "1", numero_parcours: 1, description: "", etapes: [{ id: "e", numero: 1, description: "", travaux: [], cout_cumule: null, classe_visee: null }], classe_actuelle: "F", classe_visee: "D", cout_total: null, gain_total_ep: null, gain_total_ges: null },
        { id: "2", numero_parcours: 2, description: "", etapes: [{ id: "e2", numero: 1, description: "", travaux: [], cout_cumule: null, classe_visee: null }], classe_actuelle: "F", classe_visee: "B", cout_total: null, gain_total_ep: null, gain_total_ges: null },
      ] });
      expect(errs.some(e => e.code === "TRV_002")).toBe(true); // Parcours 1 vise D < C
    });
  });

  describe("compterErreurs", () => {
    it("compte bloquants et warnings", () => {
      const result = compterErreurs([
        { code: "A", message: "", severite: "bloquant", etape: 1, champ: null },
        { code: "B", message: "", severite: "warning", etape: 1, champ: null },
        { code: "C", message: "", severite: "bloquant", etape: 2, champ: null },
      ]);
      expect(result.bloquants).toBe(2);
      expect(result.warnings).toBe(1);
    });
  });
});
