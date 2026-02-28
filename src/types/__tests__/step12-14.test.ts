import { describe, it, expect } from "vitest";
import {
  getEtapeFromXpath, getBloquants, getWarnings, grouperParEtape,
  CLASSE_MINIMALE_PARCOURS, POSTE_LABELS, XPATH_ETAPE_MAP, EXPORT_INITIAL,
  type ResultatValidation, type ResultatControle,
} from "../steps/step12-14";

describe("CLASSE_MINIMALE_PARCOURS", () => {
  it("Parcours 1 = classe C minimum", () => expect(CLASSE_MINIMALE_PARCOURS[1]).toBe("C"));
  it("Parcours 2 = classe B minimum", () => expect(CLASSE_MINIMALE_PARCOURS[2]).toBe("B"));
});

describe("POSTE_LABELS", () => {
  it("10 postes de travaux définis", () => expect(Object.keys(POSTE_LABELS).length).toBe(10));
  it("isolation_murs label correct", () => expect(POSTE_LABELS["isolation_murs"]).toBe("Isolation des murs"));
});

describe("getEtapeFromXpath", () => {
  it("administratif → étape 1", () => expect(getEtapeFromXpath("/dpe/administratif/adresse")).toBe(1));
  it("mur_collection → étape 4", () => expect(getEtapeFromXpath("/dpe/logement/enveloppe/mur_collection/mur[1]")).toBe(4));
  it("baie_vitree_collection → étape 5", () => expect(getEtapeFromXpath("/dpe/logement/enveloppe/baie_vitree_collection")).toBe(5));
  it("plancher_bas_collection → étape 6", () => expect(getEtapeFromXpath("/dpe/logement/enveloppe/plancher_bas_collection")).toBe(6));
  it("plancher_haut_collection → étape 7", () => expect(getEtapeFromXpath("/dpe/logement/enveloppe/plancher_haut_collection")).toBe(7));
  it("pont_thermique_collection → étape 8", () => expect(getEtapeFromXpath("/dpe/logement/enveloppe/pont_thermique_collection")).toBe(8));
  it("installation_chauffage_collection → étape 9", () => expect(getEtapeFromXpath("/dpe/logement/installation_chauffage_collection")).toBe(9));
  it("installation_ecs_collection → étape 10", () => expect(getEtapeFromXpath("/dpe/logement/installation_ecs_collection")).toBe(10));
  it("ventilation_collection → étape 11", () => expect(getEtapeFromXpath("/dpe/logement/ventilation_collection")).toBe(11));
  it("sortie → étape 12", () => expect(getEtapeFromXpath("/dpe/logement/sortie/deperdition")).toBe(12));
  it("xpath inconnu → null", () => expect(getEtapeFromXpath("/dpe/inconnu")).toBe(null));
});

describe("getBloquants / getWarnings", () => {
  const resultat: ResultatValidation = {
    timestamp: "2026-02-25T10:00:00Z", statut: "erreurs_bloquantes",
    nb_bloquants: 2, nb_warnings: 1, controles: [
      { code: "XSD_001", message: "Champ manquant", severite: "bloquant", xpath: "/dpe/administratif", etape_wizard: 1, champ: "adresse" },
      { code: "XSD_002", message: "Valeur invalide", severite: "bloquant", xpath: "/dpe/logement/enveloppe/mur_collection", etape_wizard: 4, champ: "umur" },
      { code: "COH_001", message: "PT incohérent", severite: "warning", xpath: "/dpe/logement/enveloppe/pont_thermique_collection", etape_wizard: 8, champ: "kpt" },
    ], version_moteur: "1.24.2", duree_ms: 120,
  };

  it("2 bloquants", () => expect(getBloquants(resultat)).toHaveLength(2));
  it("1 warning", () => expect(getWarnings(resultat)).toHaveLength(1));
});

describe("grouperParEtape", () => {
  const controles: ResultatControle[] = [
    { code: "A", message: "err1", severite: "bloquant", xpath: null, etape_wizard: 1, champ: null },
    { code: "B", message: "err2", severite: "bloquant", xpath: null, etape_wizard: 4, champ: null },
    { code: "C", message: "err3", severite: "warning", xpath: null, etape_wizard: 4, champ: null },
    { code: "D", message: "err4", severite: "bloquant", xpath: null, etape_wizard: 9, champ: null },
  ];

  it("3 étapes distinctes", () => expect(grouperParEtape(controles).size).toBe(3));
  it("étape 4 = 2 erreurs", () => expect(grouperParEtape(controles).get(4)?.length).toBe(2));
  it("étape 1 = 1 erreur", () => expect(grouperParEtape(controles).get(1)?.length).toBe(1));
});

describe("EXPORT_INITIAL", () => {
  it("statut non_genere", () => expect(EXPORT_INITIAL.statut).toBe("non_genere"));
  it("version_xsd 2.6", () => expect(EXPORT_INITIAL.version_xsd).toBe("2.6"));
  it("validation_ok false", () => expect(EXPORT_INITIAL.validation_ok).toBe(false));
});

describe("XPATH_ETAPE_MAP couverture", () => {
  it("16 mappings définis", () => expect(Object.keys(XPATH_ETAPE_MAP).length).toBe(16));
  it("couvre étapes 1 à 12", () => {
    const etapes = new Set(Object.values(XPATH_ETAPE_MAP));
    expect(etapes.has(1)).toBe(true);
    expect(etapes.has(4)).toBe(true);
    expect(etapes.has(9)).toBe(true);
    expect(etapes.has(12)).toBe(true);
  });
});
