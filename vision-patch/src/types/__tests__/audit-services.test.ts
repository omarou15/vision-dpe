import { describe, it, expect } from "vitest";
import {
  isClasseSuffisante,
  validerScenariosDpe,
  validerParcours1Audit,
  validerParcours2Audit,
  calculerCoutTotalParcours,
  calculerCoutTotalTravaux,
  getPostesCouvertsParours,
  parcoursDifferent,
  estimerGainTotal,
  GAIN_FORFAITAIRE_PAR_POSTE,
} from "../../services/scenario-travaux";
import {
  getMinimumEchantillon,
  verifierEchantillonnage,
  type LogementEchantillon,
} from "../../services/echantillon";
import { calculerEtiquette, determinerTrancheRevenu, SEUILS_ETIQUETTE, ETAPES_AUDIT_LABELS } from "../steps/audit";
import type { ParcoursTravaux, EtapeTravaux, Travail } from "../steps/step12-14";
import type { Parcours1Audit, Parcours2Audit, EtapeTravauxAudit, TravailAudit } from "../steps/audit";

// ════════════════════════════════════════════════════════════
// isClasseSuffisante
// ════════════════════════════════════════════════════════════

describe("isClasseSuffisante", () => {
  it("C ≥ C → true", () => expect(isClasseSuffisante("C", "C")).toBe(true));
  it("B ≥ C → true", () => expect(isClasseSuffisante("B", "C")).toBe(true));
  it("A ≥ B → true", () => expect(isClasseSuffisante("A", "B")).toBe(true));
  it("D ≥ C → false", () => expect(isClasseSuffisante("D", "C")).toBe(false));
  it("E ≥ B → false", () => expect(isClasseSuffisante("E", "B")).toBe(false));
  it("G ≥ A → false", () => expect(isClasseSuffisante("G", "A")).toBe(false));
});

// ════════════════════════════════════════════════════════════
// validerScenariosDpe
// ════════════════════════════════════════════════════════════

describe("validerScenariosDpe", () => {
  function mockParcours(num: 1 | 2, classe: string, nbEtapes: number, postes: string[]): ParcoursTravaux {
    return {
      id: `p${num}`, numero_parcours: num, description: "", classe_actuelle: "F",
      classe_visee: classe as any, cout_total: null, gain_total_ep: null, gain_total_ges: null,
      etapes: Array.from({ length: nbEtapes }, (_, i) => ({
        id: `e${i}`, numero: i + 1, description: "", cout_cumule: null, classe_visee: null,
        travaux: postes.map((p) => ({ id: `t${p}`, poste: p as any, description: "", cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null })),
      })),
    };
  }

  it("0 parcours → SCE_001", () => {
    expect(validerScenariosDpe([]).some((e) => e.code === "SCE_001")).toBe(true);
  });

  it("1 seul parcours → SCE_001", () => {
    expect(validerScenariosDpe([mockParcours(1, "C", 2, ["chauffage"])]).some((e) => e.code === "SCE_001")).toBe(true);
  });

  it("P1 classe D < C → SCE_002", () => {
    const errs = validerScenariosDpe([mockParcours(1, "D", 2, ["chauffage"]), mockParcours(2, "B", 1, ["ecs"])]);
    expect(errs.some((e) => e.code === "SCE_002" && e.parcours === 1)).toBe(true);
  });

  it("P2 classe C < B → SCE_002", () => {
    const errs = validerScenariosDpe([mockParcours(1, "C", 2, ["chauffage"]), mockParcours(2, "C", 1, ["ecs"])]);
    expect(errs.some((e) => e.code === "SCE_002" && e.parcours === 2)).toBe(true);
  });

  it("P1 1 seule étape → SCE_004", () => {
    const errs = validerScenariosDpe([mockParcours(1, "C", 1, ["chauffage"]), mockParcours(2, "B", 1, ["ecs"])]);
    expect(errs.some((e) => e.code === "SCE_004")).toBe(true);
  });

  it("parcours identiques → SCE_006", () => {
    const errs = validerScenariosDpe([mockParcours(1, "C", 2, ["chauffage"]), mockParcours(2, "B", 1, ["chauffage"])]);
    expect(errs.some((e) => e.code === "SCE_006")).toBe(true);
  });

  it("2 parcours valides et différents → 0 erreurs", () => {
    const errs = validerScenariosDpe([mockParcours(1, "C", 2, ["isolation_murs", "chauffage"]), mockParcours(2, "B", 1, ["isolation_murs", "chauffage", "ecs"])]);
    expect(errs.length).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
// validerParcours1Audit / validerParcours2Audit
// ════════════════════════════════════════════════════════════

describe("validerParcours1Audit", () => {
  function mockP1(nbEtapes: number, hasProduit: boolean, classe: string | null): Parcours1Audit {
    return {
      etapes: Array.from({ length: nbEtapes }, (_, i) => ({
        id: `e${i}`, numero: i + 1, description: "", cout_ht: null, cout_ttc: null,
        classe_atteinte: null, cep_apres: null, eges_apres: null,
        travaux: [{ id: "t", poste: "chauffage" as any, description: "", cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null, produit_preconise: hasProduit ? "PAC air/eau" : "", reference_produit: null, performance_attendue: null, duree_vie: null }],
      })),
      dpe_projete: classe ? { etiquette_energie: classe as any, etiquette_climat: classe as any, cep: 100, eges: 10, consommations: { chauffage: 0, ecs: 0, refroidissement: 0, eclairage: 0, auxiliaires: 0, total: 100 }, gain_cep: 280, gain_eges: 55, pourcentage_reduction_cep: 74 } : null,
      cout_total_ttc: null, classe_objectif: "C", conforme: false,
    };
  }

  it("1 étape < 2 → AUD_P1_001", () => {
    expect(validerParcours1Audit(mockP1(1, true, "C")).some((e) => e.code === "AUD_P1_001")).toBe(true);
  });

  it("sans produit préconisé → AUD_P1_003", () => {
    expect(validerParcours1Audit(mockP1(2, false, "C")).some((e) => e.code === "AUD_P1_003")).toBe(true);
  });

  it("classe projetée D < C → AUD_P1_004", () => {
    expect(validerParcours1Audit(mockP1(2, true, "D")).some((e) => e.code === "AUD_P1_004")).toBe(true);
  });

  it("2 étapes + produit + classe C → 0 erreurs", () => {
    expect(validerParcours1Audit(mockP1(2, true, "C")).length).toBe(0);
  });
});

describe("validerParcours2Audit", () => {
  it("0 travaux → AUD_P2_001", () => {
    const p: Parcours2Audit = { travaux: [], dpe_projete: null, cout_total_ttc: null, planning_mois: null, classe_objectif: "B", conforme: false };
    expect(validerParcours2Audit(p).some((e) => e.code === "AUD_P2_001")).toBe(true);
  });

  it("classe projetée C < B → AUD_P2_003", () => {
    const p: Parcours2Audit = {
      travaux: [{ id: "t", poste: "chauffage" as any, description: "", cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null, produit_preconise: "PAC", reference_produit: null, performance_attendue: null, duree_vie: null }],
      dpe_projete: { etiquette_energie: "C", etiquette_climat: "C", cep: 170, eges: 28, consommations: { chauffage: 0, ecs: 0, refroidissement: 0, eclairage: 0, auxiliaires: 0, total: 170 }, gain_cep: 210, gain_eges: 37, pourcentage_reduction_cep: 55 },
      cout_total_ttc: null, planning_mois: null, classe_objectif: "B", conforme: false,
    };
    expect(validerParcours2Audit(p).some((e) => e.code === "AUD_P2_003")).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// Calculs utilitaires
// ════════════════════════════════════════════════════════════

describe("calculs utilitaires", () => {
  it("calculerCoutTotalTravaux", () => {
    const travaux = [
      { id: "1", poste: "chauffage" as any, description: "", cout_estime: 15000, gain_energetique_estime: null, gain_co2_estime: null },
      { id: "2", poste: "ecs" as any, description: "", cout_estime: 5000, gain_energetique_estime: null, gain_co2_estime: null },
      { id: "3", poste: "ventilation" as any, description: "", cout_estime: null, gain_energetique_estime: null, gain_co2_estime: null },
    ];
    expect(calculerCoutTotalTravaux(travaux)).toBe(20000);
  });

  it("parcoursDifferent : postes différents → true", () => {
    expect(parcoursDifferent(["isolation_murs", "chauffage"], ["isolation_murs", "chauffage", "ecs"])).toBe(true);
  });

  it("parcoursDifferent : postes identiques → false", () => {
    expect(parcoursDifferent(["chauffage", "ecs"], ["ecs", "chauffage"])).toBe(false);
  });

  it("estimerGainTotal : isolation murs + chauffage", () => {
    const gain = estimerGainTotal(["isolation_murs", "chauffage"]);
    expect(gain.cep).toBe(GAIN_FORFAITAIRE_PAR_POSTE.isolation_murs.cep + GAIN_FORFAITAIRE_PAR_POSTE.chauffage.cep);
    expect(gain.eges).toBe(GAIN_FORFAITAIRE_PAR_POSTE.isolation_murs.eges + GAIN_FORFAITAIRE_PAR_POSTE.chauffage.eges);
  });

  it("10 postes définis dans GAIN_FORFAITAIRE_PAR_POSTE", () => {
    expect(Object.keys(GAIN_FORFAITAIRE_PAR_POSTE).length).toBe(10);
  });
});

// ════════════════════════════════════════════════════════════
// Échantillonnage copropriété
// ════════════════════════════════════════════════════════════

describe("getMinimumEchantillon", () => {
  it("≤30 logements → 3 minimum", () => expect(getMinimumEchantillon(20)).toBe(3));
  it("≤30 logements (30) → 3 minimum", () => expect(getMinimumEchantillon(30)).toBe(3));
  it("50 logements → >10% = 6", () => expect(getMinimumEchantillon(50)).toBe(6));
  it("100 logements → >10% = 11", () => expect(getMinimumEchantillon(100)).toBe(11));
  it(">100 logements (200) → max(10, >5%) = 11", () => expect(getMinimumEchantillon(200)).toBe(11));
  it(">100 logements (300) → max(10, >5%) = 16", () => expect(getMinimumEchantillon(300)).toBe(16));
});

describe("verifierEchantillonnage", () => {
  const base: LogementEchantillon = { id: "l1", type_logement: "T3", etage: "courant", orientations: ["sud"], planchers: [], surface: 65, description: "" };

  it("0 logements → pastille blanc", () => {
    const r = verifierEchantillonnage([], 20, ["nord", "sud"], ["combles_perdus"], ["T3"]);
    expect(r.pastille).toBe("blanc");
  });

  it("1 logement < 3 requis → pastille rouge", () => {
    const r = verifierEchantillonnage([base], 20, ["sud"], [], ["T3"]);
    expect(r.pastille).toBe("rouge");
    expect(r.criteres.find((c) => c.code === "QTT_001")?.satisfait).toBe(false);
  });

  it("3 logements couvrant tout → pastille vert", () => {
    const logements: LogementEchantillon[] = [
      { id: "l1", type_logement: "T2", etage: "rdc", orientations: ["nord"], planchers: ["rdc_terre_plein", "combles_perdus"], surface: 45, description: "" },
      { id: "l2", type_logement: "T3", etage: "courant", orientations: ["sud"], planchers: [], surface: 65, description: "" },
      { id: "l3", type_logement: "T4", etage: "dernier", orientations: ["est", "ouest"], planchers: ["combles_perdus"], surface: 85, description: "" },
    ];
    const r = verifierEchantillonnage(logements, 20, ["nord", "sud", "est", "ouest"], ["combles_perdus"], ["T2", "T3", "T4"]);
    expect(r.pastille).toBe("vert");
    expect(r.tous_satisfaits).toBe(true);
  });

  it("3 logements sans RDC → pastille jaune", () => {
    const logements: LogementEchantillon[] = [
      { id: "l1", type_logement: "T2", etage: "courant", orientations: ["nord", "sud"], planchers: [], surface: 45, description: "" },
      { id: "l2", type_logement: "T3", etage: "courant", orientations: ["est"], planchers: ["combles_perdus"], surface: 65, description: "" },
      { id: "l3", type_logement: "T4", etage: "dernier", orientations: ["ouest"], planchers: ["combles_perdus"], surface: 85, description: "" },
    ];
    const r = verifierEchantillonnage(logements, 20, ["nord", "sud", "est", "ouest"], ["combles_perdus"], ["T2", "T3", "T4"]);
    expect(r.pastille).toBe("jaune");
    expect(r.criteres.find((c) => c.code === "QUA_001")?.satisfait).toBe(false);
  });

  it("orientation manquante détectée", () => {
    const logements: LogementEchantillon[] = [
      { id: "l1", type_logement: "T3", etage: "rdc", orientations: ["nord"], planchers: [], surface: 65, description: "" },
      { id: "l2", type_logement: "T3", etage: "courant", orientations: ["nord"], planchers: [], surface: 65, description: "" },
      { id: "l3", type_logement: "T3", etage: "courant", orientations: ["nord"], planchers: [], surface: 65, description: "" },
    ];
    const r = verifierEchantillonnage(logements, 20, ["nord", "sud"], [], ["T3"]);
    const oriCritere = r.criteres.find((c) => c.code === "QUA_004");
    expect(oriCritere?.satisfait).toBe(false);
    expect(oriCritere?.detail).toContain("sud");
  });
});
