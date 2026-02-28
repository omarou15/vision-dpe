import { test, expect } from "@playwright/test";

test.describe("Étape 9 — Chauffage (champs dynamiques)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/9");
  });

  test("affiche titre et alerte variables requises/interdites", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Chauffage");
    await expect(page.getByText(/variables requises\/interdites/i)).toBeVisible();
  });

  test("ajouter une installation crée le formulaire", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await expect(page.getByText("Installation 1")).toBeVisible();
    await expect(page.getByLabel(/configuration/i)).toBeVisible();
    await expect(page.getByLabel(/surface chauffée/i)).toBeVisible();
  });

  test("PAC air/eau affiche SCOP, masque rpn/rpint", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await page.getByLabel(/type de générateur/i).selectOption("pac_air_eau");
    await expect(page.getByLabel(/SCOP/i)).toBeVisible();
    await expect(page.getByLabel(/Puissance nominale/i)).toBeVisible();
    // rpn et rpint ne doivent PAS être visibles
    await expect(page.getByLabel(/Rendement PCI pleine/i)).not.toBeVisible();
    await expect(page.getByLabel(/Rendement PCI charge/i)).not.toBeVisible();
  });

  test("chaudière gaz condensation affiche rpn/rpint, masque SCOP", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await page.getByLabel(/type de générateur/i).selectOption("chaudiere_gaz_condensation");
    await expect(page.getByLabel(/Rendement PCI pleine/i)).toBeVisible();
    await expect(page.getByLabel(/Rendement PCI charge/i)).toBeVisible();
    await expect(page.getByLabel(/SCOP/i)).not.toBeVisible();
  });

  test("convecteur électrique affiche puissance seule", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await page.getByLabel(/type de générateur/i).selectOption("convecteur_electrique");
    await expect(page.getByLabel(/Puissance nominale/i)).toBeVisible();
    await expect(page.getByLabel(/SCOP/i)).not.toBeVisible();
    await expect(page.getByLabel(/Rendement PCI/i)).not.toBeVisible();
  });

  test("énergie se met à jour automatiquement selon générateur", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await page.getByLabel(/type de générateur/i).selectOption("pac_air_eau");
    await expect(page.getByLabel(/énergie/i)).toHaveValue("electricite");
    await page.getByLabel(/type de générateur/i).selectOption("chaudiere_gaz_condensation");
    await expect(page.getByLabel(/énergie/i)).toHaveValue("gaz_naturel");
  });

  test("ajouter un appoint", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await page.getByText(/ajouter un appoint/i).click();
    await expect(page.getByText(/appoint/i)).toBeVisible();
  });

  test("select émetteurs et toggle réseau isolé", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation/i }).click();
    await expect(page.getByLabel(/émetteurs/i)).toBeVisible();
    const toggle = page.getByRole("switch", { name: /réseau.*distribution.*isolé/i });
    await expect(toggle).toBeVisible();
  });
});

test.describe("Étape 10 — ECS", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/10");
  });

  test("affiche titre", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText("ECS");
  });

  test("ajouter installation ECS", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation ecs/i }).click();
    await expect(page.getByText("Installation ECS 1")).toBeVisible();
    await expect(page.getByLabel(/configuration/i)).toBeVisible();
  });

  test("config liée au chauffage affiche alerte", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation ecs/i }).click();
    await page.getByLabel(/configuration/i).selectOption("ecs_liee_chauffage");
    await expect(page.getByText(/liée au chauffage/i)).toBeVisible();
  });

  test("stockage ballon vertical affiche champ volume", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation ecs/i }).click();
    await page.getByLabel(/stockage/i).selectOption("ballon_vertical");
    await expect(page.getByLabel(/volume.*litres/i)).toBeVisible();
  });

  test("ajouter solaire thermique", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation ecs/i }).click();
    await page.getByText(/ajouter solaire/i).click();
    await expect(page.getByText(/installation solaire/i)).toBeVisible();
    await expect(page.getByLabel(/surface capteurs/i)).toBeVisible();
    await expect(page.getByLabel(/inclinaison/i)).toBeVisible();
  });

  test("supprimer solaire thermique", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter une installation ecs/i }).click();
    await page.getByText(/ajouter solaire/i).click();
    await expect(page.getByText(/installation solaire/i)).toBeVisible();
    await page.getByRole("button", { name: /supprimer/i }).first().click();
    await expect(page.getByText(/ajouter solaire/i)).toBeVisible();
  });
});

test.describe("Étape 11 — Ventilation / Clim / ENR", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projet/test-id/etape/11");
  });

  test("affiche 3 sections", async ({ page }) => {
    await expect(page.getByText(/ventilation/i)).toBeVisible();
    await expect(page.getByText(/climatisation/i)).toBeVisible();
    await expect(page.getByText(/production enr/i)).toBeVisible();
  });

  test("ajouter ventilation", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter ventilation/i }).click();
    await expect(page.getByText("Ventilation 1")).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
    await expect(page.getByLabel(/q4pa/i)).toBeVisible();
  });

  test("toggle ventilation individuelle", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter ventilation/i }).click();
    const toggle = page.getByRole("switch", { name: /individuelle/i });
    await expect(toggle).toBeVisible();
  });

  test("ajouter climatisation avec SEER", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter climatisation/i }).click();
    await expect(page.getByText("Climatisation 1")).toBeVisible();
    await expect(page.getByLabel(/seer/i)).toBeVisible();
    await expect(page.getByLabel(/surface/i)).toBeVisible();
  });

  test("ajouter production ENR (PV)", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter production enr/i }).click();
    await expect(page.getByText("Production ENR 1")).toBeVisible();
    await expect(page.getByLabel(/surface/i)).toBeVisible();
    await expect(page.getByLabel(/inclinaison/i)).toBeVisible();
    await expect(page.getByLabel(/puissance crête/i)).toBeVisible();
  });

  test("orientation chips ENR fonctionnent", async ({ page }) => {
    await page.getByRole("button", { name: /ajouter production enr/i }).click();
    const chipSud = page.getByRole("button", { name: "S" });
    await chipSud.click();
    await expect(chipSud).toHaveAttribute("aria-pressed", "true");
  });
});
