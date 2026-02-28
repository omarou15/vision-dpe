import { test, expect } from "@playwright/test";

test.describe("Étape 12 — Scénarios de travaux", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/12");
  });

  test("affiche titre et alerte réforme 2021", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("travaux");
    await expect(page.getByText(/réforme DPE 2021/i)).toBeVisible();
    await expect(page.getByText(/2 scénarios.*obligatoires/i)).toBeVisible();
  });

  test("2 parcours affichés par défaut", async ({ page }) => {
    await expect(page.getByText("Parcours 1")).toBeVisible();
    await expect(page.getByText("Parcours 2")).toBeVisible();
  });

  test("parcours 1 objectif classe C minimum", async ({ page }) => {
    await expect(page.getByText(/objectif.*C/i).first()).toBeVisible();
    await expect(page.getByText(/classe C/i).first()).toBeVisible();
  });

  test("parcours 2 objectif classe B minimum", async ({ page }) => {
    await expect(page.getByText(/objectif.*B/i)).toBeVisible();
  });

  test("ajouter une étape au parcours 1", async ({ page }) => {
    await page.getByText(/ajouter une étape au parcours/i).click();
    await expect(page.getByText("Étape 2")).toBeVisible();
  });

  test("select poste de travaux 10 options", async ({ page }) => {
    const select = page.getByLabel(/poste/i).first();
    const options = await select.locator("option").allTextContents();
    expect(options.length).toBeGreaterThanOrEqual(10);
    expect(options.some(o => o.includes("Isolation des murs"))).toBe(true);
    expect(options.some(o => o.includes("Ventilation"))).toBe(true);
  });

  test("champs coûts et gains visibles", async ({ page }) => {
    await expect(page.getByLabel(/coût.*€/i).first()).toBeVisible();
    await expect(page.getByLabel(/gain ep/i).first()).toBeVisible();
  });

  test("select classe actuelle et classe visée", async ({ page }) => {
    await expect(page.getByLabel(/classe actuelle/i).first()).toBeVisible();
    await expect(page.getByLabel(/classe visée/i).first()).toBeVisible();
  });
});

test.describe("Étape 13 — Validation ADEME", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/13");
  });

  test("affiche titre et info moteur ADEME", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Validation");
    await expect(page.getByText(/contrôle de cohérence ADEME/i)).toBeVisible();
  });

  test("bouton lancer la validation présent", async ({ page }) => {
    await expect(page.getByRole("button", { name: /lancer la validation/i })).toBeVisible();
  });

  test("lancer la validation affiche résultats", async ({ page }) => {
    await page.getByRole("button", { name: /lancer la validation/i }).click();
    // Attend fin simulation (1.5s)
    await expect(page.getByText(/bloquant|warning|valide/i)).toBeVisible({ timeout: 5000 });
  });

  test("après validation OK, bouton passer à l'export visible", async ({ page }) => {
    await page.getByRole("button", { name: /lancer la validation/i }).click();
    await expect(page.getByRole("button", { name: /passer à l'export/i })).toBeVisible({ timeout: 5000 });
  });

  test("erreurs groupées par étape avec lien corriger", async ({ page }) => {
    await page.getByRole("button", { name: /lancer la validation/i }).click();
    // Le mock produit 1 warning étape 8
    await expect(page.getByText(/étape 8/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/corriger/i)).toBeVisible();
  });

  test("badge version moteur affiché", async ({ page }) => {
    await page.getByRole("button", { name: /lancer la validation/i }).click();
    await expect(page.getByText(/1\.24\.2/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Étape 14 — Export XML", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/14");
  });

  test("affiche titre et info XSD", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Export");
    await expect(page.getByText(/DPEv2\.6/i)).toBeVisible();
  });

  test("statut initial non généré", async ({ page }) => {
    await expect(page.getByText(/non généré/i)).toBeVisible();
  });

  test("bouton générer le XML", async ({ page }) => {
    await expect(page.getByRole("button", { name: /générer le xml/i })).toBeVisible();
  });

  test("génération produit métadonnées fichier", async ({ page }) => {
    await page.getByRole("button", { name: /générer le xml/i }).click();
    // Attend simulation (2s)
    await expect(page.getByText(/xml généré/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/\.xml/)).toBeVisible();
    await expect(page.getByText(/Ko/)).toBeVisible();
    await expect(page.getByText(/DPE v2\.6/)).toBeVisible();
  });

  test("après génération, boutons télécharger et finaliser visibles", async ({ page }) => {
    await page.getByRole("button", { name: /générer le xml/i }).click();
    await expect(page.getByRole("button", { name: /télécharger/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /finaliser/i })).toBeVisible();
  });

  test("message prêt pour dépôt ADEME affiché", async ({ page }) => {
    await page.getByRole("button", { name: /générer le xml/i }).click();
    await expect(page.getByText(/prêt pour dépôt ADEME/i)).toBeVisible({ timeout: 5000 });
  });

  test("SHA-256 hash affiché", async ({ page }) => {
    await page.getByRole("button", { name: /générer le xml/i }).click();
    await expect(page.getByText(/SHA-256/i)).toBeVisible({ timeout: 5000 });
  });

  test("bouton régénérer après première génération", async ({ page }) => {
    await page.getByRole("button", { name: /générer le xml/i }).click();
    await expect(page.getByRole("button", { name: /régénérer/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Navigation wizard complète", () => {
  test("parcours complet étapes 1 à 14 navigable", async ({ page }) => {
    for (let i = 1; i <= 14; i++) {
      await page.goto(`/projet/test-id/etape/${i}`);
      await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    }
  });
});
