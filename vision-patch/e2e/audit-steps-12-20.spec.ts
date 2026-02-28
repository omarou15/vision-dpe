import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

function auditUrl(step: number) { return `${BASE}/audit/test-projet/step/${step}`; }

// ════════════════════════════════════════════════════════════
// ÉTAPE 12 — BILAN ÉTAT INITIAL
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 12 — Bilan état initial", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(12)); });

  test("affiche titre et info méthode 3CL", async ({ page }) => {
    await expect(page.getByText("Bilan état initial")).toBeVisible();
    await expect(page.getByText("méthode 3CL")).toBeVisible();
  });

  test("bouton calculer le bilan", async ({ page }) => {
    await expect(page.getByRole("button", { name: /calculer/i })).toBeVisible();
  });

  test("après calcul : étiquettes énergie et climat affichées", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("kWhEP/m²/an")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("kgCO₂/m²/an")).toBeVisible();
  });

  test("après calcul : déperditions par poste", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Déperditions par poste")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Murs")).toBeVisible();
    await expect(page.getByText("Ponts th.")).toBeVisible();
  });

  test("après calcul : consommations par usage", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Chauffage")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ECS")).toBeVisible();
    await expect(page.getByText("Total (Cep)")).toBeVisible();
  });

  test("après calcul : estimation facture", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Estimation facture annuelle")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("€/an")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 13 — PARCOURS 1 TRAVAUX
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 13 — Parcours 1 travaux", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(13)); });

  test("affiche titre et objectif classe C", async ({ page }) => {
    await expect(page.getByText("Parcours 1")).toBeVisible();
    await expect(page.getByText("Classe C minimum")).toBeVisible();
  });

  test("2 étapes par défaut (minimum réglementaire)", async ({ page }) => {
    await expect(page.getByText("Étape 1")).toBeVisible();
    await expect(page.getByText("Étape 2")).toBeVisible();
  });

  test("ajouter une étape au parcours", async ({ page }) => {
    await page.getByText("Ajouter une étape").click();
    await expect(page.getByText("Étape 3")).toBeVisible();
  });

  test("champs spécifiques audit : produit préconisé", async ({ page }) => {
    await expect(page.getByLabel(/produit préconisé/i)).toBeVisible();
  });

  test("champs spécifiques audit : performance attendue", async ({ page }) => {
    await expect(page.getByLabel(/performance/i)).toBeVisible();
  });

  test("champs coût HT et TTC par étape", async ({ page }) => {
    await expect(page.getByLabel(/coût ht/i)).toBeVisible();
    await expect(page.getByLabel(/coût ttc/i)).toBeVisible();
  });

  test("select classe atteinte par étape", async ({ page }) => {
    await expect(page.getByText("Classe atteinte")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 14 — DPE PROJETÉ PARCOURS 1
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 14 — DPE projeté P1", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(14)); });

  test("affiche titre et info recalcul 3CL", async ({ page }) => {
    await expect(page.getByText("DPE projeté")).toBeVisible();
    await expect(page.getByText("classe C")).toBeVisible();
  });

  test("bouton calculer le DPE projeté", async ({ page }) => {
    await expect(page.getByRole("button", { name: /calculer/i })).toBeVisible();
  });

  test("après calcul : comparaison avant/après", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Avant")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Après travaux")).toBeVisible();
    await expect(page.getByText(/réduction/i)).toBeVisible();
  });

  test("conformité : objectif atteint ou non", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    const ok = page.getByText(/objectif atteint/i);
    const ko = page.getByText(/objectif non atteint/i);
    await expect(ok.or(ko)).toBeVisible({ timeout: 5000 });
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 15 — PARCOURS 2 RÉNOVATION GLOBALE
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 15 — Parcours 2 global", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(15)); });

  test("affiche titre et objectif classe B", async ({ page }) => {
    await expect(page.getByText("Parcours 2")).toBeVisible();
    await expect(page.getByText("Classe B minimum")).toBeVisible();
  });

  test("intervention unique mentionnée", async ({ page }) => {
    await expect(page.getByText(/intervention unique/i)).toBeVisible();
  });

  test("ajouter un poste de travaux", async ({ page }) => {
    await page.getByText("Ajouter un poste").click();
    const postes = page.getByLabel(/poste/i);
    await expect(postes).toHaveCount(2);
  });

  test("champ planning en mois", async ({ page }) => {
    await expect(page.getByLabel(/planning/i)).toBeVisible();
  });

  test("coût total calculé automatiquement", async ({ page }) => {
    await expect(page.getByText("Coût total TTC")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 16 — DPE PROJETÉ PARCOURS 2
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 16 — DPE projeté P2", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(16)); });

  test("affiche titre et objectif classe B", async ({ page }) => {
    await expect(page.getByText("DPE projeté")).toBeVisible();
    await expect(page.getByText(/classe B/i)).toBeVisible();
  });

  test("après calcul : comparaison 3 colonnes (initial → P1 → P2)", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("État initial")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Parcours 2")).toBeVisible();
  });

  test("gains énergétiques affichés", async ({ page }) => {
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Réduction Cep")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("kWhEP/m²/an")).toBeVisible();
    await expect(page.getByText("kgCO₂/m²/an")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 17 — ANALYSE ÉCONOMIQUE
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 17 — Analyse économique", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(17)); });

  test("affiche titre et info aides", async ({ page }) => {
    await expect(page.getByText("Analyse économique")).toBeVisible();
    await expect(page.getByText(/revenu fiscal/i)).toBeVisible();
  });

  test("select zone géographique (IDF / hors IDF)", async ({ page }) => {
    await expect(page.getByLabel(/zone géographique/i)).toBeVisible();
  });

  test("select nombre de personnes", async ({ page }) => {
    await expect(page.getByLabel(/nombre de personnes/i)).toBeVisible();
  });

  test("champ revenu fiscal de référence", async ({ page }) => {
    await expect(page.getByLabel(/revenu fiscal/i)).toBeVisible();
  });

  test("détermination automatique tranche après saisie revenu", async ({ page }) => {
    await page.getByLabel(/revenu fiscal/i).fill("20000");
    await expect(page.getByText(/tranche/i)).toBeVisible();
  });

  test("après calcul : aides MaPrimeRénov et CEE affichées", async ({ page }) => {
    await page.getByLabel(/revenu fiscal/i).fill("25000");
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText(/maprimerénov/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/CEE/i)).toBeVisible();
  });

  test("après calcul : reste à charge et temps de retour", async ({ page }) => {
    await page.getByLabel(/revenu fiscal/i).fill("25000");
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Reste à charge")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/temps de retour/i)).toBeVisible();
  });

  test("2 analyses affichées (parcours 1 et parcours 2)", async ({ page }) => {
    await page.getByLabel(/revenu fiscal/i).fill("25000");
    await page.getByRole("button", { name: /calculer/i }).click();
    await expect(page.getByText("Parcours 1")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Parcours 2")).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 18 — SYNTHÈSE AUDIT
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 18 — Synthèse", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(18)); });

  test("affiche titre synthèse", async ({ page }) => {
    await expect(page.getByText("Synthèse de l'audit")).toBeVisible();
  });

  test("tableau comparatif étiquettes", async ({ page }) => {
    await expect(page.getByText("Évolution des étiquettes")).toBeVisible();
  });

  test("champ recommandation auditeur", async ({ page }) => {
    await expect(page.getByText("Recommandation de l'auditeur")).toBeVisible();
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("boutons rafraîchir et valider", async ({ page }) => {
    await expect(page.getByRole("button", { name: /rafraîchir/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /valider/i })).toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 19 — VALIDATION AUDIT
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 19 — Validation ADEME", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(19)); });

  test("affiche titre et info endpoint audit", async ({ page }) => {
    await expect(page.getByText("Validation audit")).toBeVisible();
    await expect(page.getByText(/controle_coherence_audit/i)).toBeVisible();
  });

  test("bouton lancer validation", async ({ page }) => {
    await expect(page.getByRole("button", { name: /validation/i })).toBeVisible();
  });

  test("après validation : résultats avec version moteur", async ({ page }) => {
    await page.getByRole("button", { name: /validation/i }).click();
    await expect(page.getByText("1.24.2")).toBeVisible({ timeout: 5000 });
  });

  test("après validation OK : bouton passer à l'export", async ({ page }) => {
    await page.getByRole("button", { name: /validation/i }).click();
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible({ timeout: 5000 });
  });

  test("labels étapes audit dans les erreurs groupées", async ({ page }) => {
    await page.getByRole("button", { name: /validation/i }).click();
    // Les labels audit doivent être affichés (pas les labels DPE)
    const content = await page.textContent("body");
    // Vérifie qu'au moins un label audit-spécifique est utilisé
    expect(content).toMatch(/parcours|analyse économique|bilan|synthèse/i);
  });
});

// ════════════════════════════════════════════════════════════
// ÉTAPE 20 — EXPORT XML AUDIT
// ════════════════════════════════════════════════════════════

test.describe("Audit Étape 20 — Export XML audit", () => {
  test.beforeEach(async ({ page }) => { await page.goto(auditUrl(20)); });

  test("affiche titre et info XSD audit", async ({ page }) => {
    await expect(page.getByText("Export XML audit")).toBeVisible();
    await expect(page.getByText(/DPE état initial/i)).toBeVisible();
  });

  test("statut initial non généré", async ({ page }) => {
    await expect(page.getByText("Non généré")).toBeVisible();
  });

  test("bouton générer le XML audit", async ({ page }) => {
    await expect(page.getByRole("button", { name: /générer/i })).toBeVisible();
  });

  test("après génération : métadonnées fichier", async ({ page }) => {
    await page.getByRole("button", { name: /générer/i }).click();
    await expect(page.getByText(/AUDIT_/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Ko/)).toBeVisible();
    await expect(page.getByText("Audit DPE v2.6")).toBeVisible();
  });

  test("contenu XML audit listé", async ({ page }) => {
    await page.getByRole("button", { name: /générer/i }).click();
    await expect(page.getByText("DPE état initial complet")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Parcours 1")).toBeVisible();
    await expect(page.getByText("Parcours 2")).toBeVisible();
    await expect(page.getByText("Analyse économique")).toBeVisible();
  });

  test("message prêt pour dépôt ADEME", async ({ page }) => {
    await page.getByRole("button", { name: /générer/i }).click();
    await expect(page.getByText("Audit prêt pour dépôt ADEME")).toBeVisible({ timeout: 5000 });
  });

  test("bouton finaliser l'audit", async ({ page }) => {
    await page.getByRole("button", { name: /générer/i }).click();
    await expect(page.getByRole("button", { name: /finaliser/i })).toBeVisible({ timeout: 5000 });
  });

  test("SHA-256 hash affiché", async ({ page }) => {
    await page.getByRole("button", { name: /générer/i }).click();
    await expect(page.getByText("SHA-256")).toBeVisible({ timeout: 5000 });
  });
});

// ════════════════════════════════════════════════════════════
// NAVIGATION AUDIT COMPLÈTE
// ════════════════════════════════════════════════════════════

test.describe("Navigation audit 20 étapes", () => {
  test("parcours complet étapes 1-20 navigable", async ({ page }) => {
    for (let step = 1; step <= 20; step++) {
      await page.goto(auditUrl(step));
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});
