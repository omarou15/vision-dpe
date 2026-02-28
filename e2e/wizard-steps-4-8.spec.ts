import { test, expect, type Page } from "@playwright/test";

test.describe("Étape 4 — Murs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/4");
  });

  test("affiche le titre et aucun mur par défaut", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Murs");
    await expect(page.getByText("0 mur(s)")).toBeVisible();
  });

  test("ajouter un mur crée le formulaire", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    await expect(page.getByText("Mur 1")).toBeVisible();
    await expect(page.getByText("1 mur(s)")).toBeVisible();
    await expect(page.getByLabel("Surface")).toBeVisible();
    await expect(page.getByLabel(/adjacence/i)).toBeVisible();
    await expect(page.getByLabel(/matériaux/i)).toBeVisible();
  });

  test("orientation chips fonctionnent", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    const chipSud = page.getByRole("button", { name: "S" });
    await chipSud.click();
    await expect(chipSud).toHaveAttribute("aria-pressed", "true");
  });

  test("méthode saisie U forfaitaire affiche message ADEME", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    await page.getByLabel(/méthode saisie/i).selectOption("non_isole_forfaitaire");
    await expect(page.getByText(/tables forfaitaires ADEME/i)).toBeVisible();
  });

  test("méthode saisie directe affiche champ U", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    await page.getByLabel(/méthode saisie/i).selectOption("saisie_directe_u");
    await expect(page.getByLabel(/W\/m²\.K/i)).toBeVisible();
  });

  test("adjacence LNC affiche alerte coefficient b", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    await page.getByLabel(/adjacence/i).selectOption("garage");
    await expect(page.getByText(/coefficient b/i)).toBeVisible();
  });

  test("supprimer un mur fonctionne", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    await expect(page.getByText("1 mur(s)")).toBeVisible();
    await page.getByRole("button", { name: /supprimer/i }).click();
    await expect(page.getByText("0 mur(s)")).toBeVisible();
  });

  test("boutons Enregistrer/Valider visibles si mur présent", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un mur/i }).click();
    await expect(page.getByRole("button", { name: /enregistrer/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /valider l'étape/i })).toBeVisible();
  });
});

test.describe("Étape 5 — Baies et Portes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/5");
  });

  test("affiche sections baies et portes", async ({ page }) => {
    await expect(page.getByText(/baies vitrées/i)).toBeVisible();
    await expect(page.getByText(/portes/i)).toBeVisible();
  });

  test("ajouter une baie crée le formulaire complet", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une baie/i }).click();
    await expect(page.getByText("Baie 1")).toBeVisible();
    await expect(page.getByLabel(/type de baie/i)).toBeVisible();
    await expect(page.getByLabel(/vitrage/i)).toBeVisible();
    await expect(page.getByLabel(/menuiserie/i)).toBeVisible();
    await expect(page.getByLabel(/pose/i)).toBeVisible();
    await expect(page.getByLabel(/fermeture/i)).toBeVisible();
  });

  test("méthode saisie Uw direct affiche champ Uw", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une baie/i }).click();
    await page.getByLabel(/méthode saisie/i).selectOption("saisie_uw");
    await expect(page.getByLabel(/Uw.*W\/m²/i)).toBeVisible();
  });

  test("ajouter une porte crée le formulaire", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une porte/i }).click();
    await expect(page.getByText("Porte 1")).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
  });

  test("toggle double fenêtre fonctionne", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une baie/i }).click();
    const toggle = page.getByRole("switch", { name: /double fenêtre/i });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("Étape 6 — Planchers bas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/6");
  });

  test("affiche titre et compteur", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Planchers bas");
    await expect(page.getByText("0 plancher(s)")).toBeVisible();
  });

  test("ajouter un plancher bas", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un plancher bas/i }).click();
    await expect(page.getByText("Plancher bas 1")).toBeVisible();
    await expect(page.getByLabel(/type plancher/i)).toBeVisible();
  });

  test("adjacence terre-plein affiche périmètre et surface Ue", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un plancher bas/i }).click();
    await page.getByLabel(/adjacence/i).selectOption("terre_plein");
    await expect(page.getByLabel(/périmètre/i)).toBeVisible();
    await expect(page.getByLabel(/surface ue/i)).toBeVisible();
  });

  test("méthode épaisseur isolation affiche 2 champs", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un plancher bas/i }).click();
    await page.getByLabel(/méthode saisie/i).selectOption("saisie_epaisseur_isolation");
    await expect(page.getByLabel(/épaisseur.*cm/i)).toBeVisible();
    await expect(page.getByLabel(/résistance/i)).toBeVisible();
  });
});

test.describe("Étape 7 — Planchers hauts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/7");
  });

  test("affiche titre", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Planchers hauts");
  });

  test("ajouter un plancher haut avec types toiture", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un plancher haut/i }).click();
    await expect(page.getByText("Plancher haut 1")).toBeVisible();
    const select = page.getByLabel(/type/i);
    const options = await select.locator("option").allTextContents();
    expect(options.some(o => o.includes("Combles perdus"))).toBe(true);
    expect(options.some(o => o.includes("Terrasse"))).toBe(true);
  });
});

test.describe("Étape 8 — Ponts thermiques", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/8");
  });

  test("affiche titre et alerte cohérence", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Ponts thermiques");
    await expect(page.getByText(/cohérents avec les isolations/i)).toBeVisible();
  });

  test("ajouter un pont thermique", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un pont thermique/i }).click();
    await expect(page.getByText("Pont thermique 1")).toBeVisible();
    await expect(page.getByLabel(/type de liaison/i)).toBeVisible();
    await expect(page.getByLabel(/longueur/i)).toBeVisible();
  });

  test("méthode forfaitaire affiche message ADEME", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un pont thermique/i }).click();
    const chip = page.getByRole("button", { name: "Forfaitaire" });
    await chip.click();
    await expect(page.getByText(/tables forfaitaires ADEME/i)).toBeVisible();
  });

  test("méthode expert affiche champ kpt", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter un pont thermique/i }).click();
    const chip = page.getByRole("button", { name: "Expert" });
    await chip.click();
    await expect(page.getByLabel(/kpt/i)).toBeVisible();
  });
});
