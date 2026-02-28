import { test, expect } from "@playwright/test";

/**
 * Tests E2E Wizard DPE — Étapes 1 à 3
 * 
 * Ces tests vérifient le flux utilisateur complet :
 * - Navigation entre étapes via la barre de progression
 * - Saisie des formulaires
 * - Validation des champs obligatoires
 * - Boutons Enregistrer / Valider
 * 
 * Note : Ces tests utilisent un projet en mode local (IndexedDB)
 * sans nécessiter de Supabase réel. Les appels API BAN sont mockés.
 */

// ── Helpers ──

const BASE_URL = "http://localhost:5173";

/** Mock l'API BAN pour l'autocomplétion */
async function mockBanAPI(page: import("@playwright/test").Page) {
  await page.route("**/api-adresse.data.gouv.fr/search/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [2.3488, 48.8534] },
            properties: {
              label: "15 Rue de la Paix 75002 Paris",
              score: 0.92,
              housenumber: "15",
              street: "Rue de la Paix",
              name: "15 Rue de la Paix",
              postcode: "75002",
              city: "Paris",
              citycode: "75102",
              type: "housenumber",
              id: "75102_7220_00015",
            },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
            properties: {
              label: "3 Rue de la Paix 75001 Paris",
              score: 0.88,
              housenumber: "3",
              street: "Rue de la Paix",
              name: "3 Rue de la Paix",
              postcode: "75001",
              city: "Paris",
              citycode: "75101",
              type: "housenumber",
              id: "75101_7220_00003",
            },
          },
        ],
      }),
    });
  });
}

// ── Tests ──

test.describe("Wizard DPE — Étape 1 : Informations générales", () => {
  test("affiche le titre et les sections du formulaire", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    // Titre de l'étape
    await expect(page.getByText("Informations générales")).toBeVisible();

    // Sections
    await expect(page.getByText("Adresse du bien")).toBeVisible();
    await expect(page.getByText("Diagnostiqueur")).toBeVisible();
    await expect(page.getByText("Dates")).toBeVisible();
  });

  test("recherche d'adresse BAN avec autocomplétion", async ({ page }) => {
    await mockBanAPI(page);
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    // Saisir une adresse
    const adresseInput = page.getByLabel("Adresse");
    await adresseInput.fill("15 rue de la paix");

    // Attendre les suggestions (debounce 300ms)
    await page.waitForTimeout(400);

    // Vérifier qu'au moins une suggestion apparaît
    await expect(page.getByText("15 Rue de la Paix 75002 Paris")).toBeVisible();
  });

  test("sélection d'une adresse affiche le résultat géocodage", async ({ page }) => {
    await mockBanAPI(page);
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    const adresseInput = page.getByLabel("Adresse");
    await adresseInput.fill("15 rue de la paix");
    await page.waitForTimeout(400);

    // Cliquer sur la première suggestion
    await page.getByText("15 Rue de la Paix 75002 Paris").click();

    // Vérifier l'indicateur de géocodage
    await expect(page.getByText(/Géocodage valide/)).toBeVisible();
    await expect(page.getByText(/92%/)).toBeVisible();
  });

  test("bouton GPS est présent", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);
    await expect(page.getByText("Utiliser ma position GPS")).toBeVisible();
  });

  test("champs dates sont de type date", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    const dateVisite = page.getByLabel("Date de visite");
    await expect(dateVisite).toHaveAttribute("type", "date");

    const dateEtablissement = page.getByLabel("Date d'établissement");
    await expect(dateEtablissement).toHaveAttribute("type", "date");
  });

  test("bouton Valider est désactivé sans géocodage", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    const validerBtn = page.getByRole("button", { name: "Valider l'étape" });
    await expect(validerBtn).toBeDisabled();
  });
});

test.describe("Wizard DPE — Étape 2 : Données administratives", () => {
  test("affiche les sections du formulaire", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    await expect(page.getByText("Type de logement")).toBeVisible();
    await expect(page.getByText("Surfaces")).toBeVisible();
    await expect(page.getByText("Commanditaire")).toBeVisible();
  });

  test("select méthode d'application est présent avec 5 options", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    const select = page.getByLabel("Méthode d'application");
    await expect(select).toBeVisible();

    // Vérifier les options
    const options = select.locator("option");
    await expect(options).toHaveCount(5);
  });

  test("champs immeuble apparaissent quand immeuble collectif sélectionné", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    // Sélectionner immeuble collectif
    await page.getByLabel("Méthode d'application").selectOption("immeuble_collectif");

    // Vérifier que les champs immeuble apparaissent
    await expect(page.getByLabel("Surface habitable bâtiment (m²)")).toBeVisible();
    await expect(page.getByLabel("Nb logements")).toBeVisible();
    await expect(page.getByLabel("Nb niveaux")).toBeVisible();
  });

  test("champs immeuble masqués pour maison individuelle", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    // Sélectionner maison (par défaut)
    await page.getByLabel("Méthode d'application").selectOption("maison_individuelle");

    // Vérifier que les champs immeuble sont absents
    await expect(page.getByLabel("Surface habitable bâtiment (m²)")).not.toBeVisible();
    await expect(page.getByLabel("Nb logements")).not.toBeVisible();
  });

  test("toggle consentement ADEME fonctionne", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    const toggle = page.getByRole("switch", { name: /Consentement/ });
    await expect(toggle).toBeVisible();

    // Cliquer pour activer
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  test("bouton Valider désactivé sans commanditaire", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    const validerBtn = page.getByRole("button", { name: "Valider l'étape" });
    await expect(validerBtn).toBeDisabled();
  });
});

test.describe("Wizard DPE — Étape 3 : Caractéristiques générales", () => {
  test("affiche les sections du formulaire", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    await expect(page.getByText("Construction")).toBeVisible();
    await expect(page.getByText("Dimensions")).toBeVisible();
    await expect(page.getByText("Inertie du bâtiment")).toBeVisible();
    await expect(page.getByText("Données météorologiques")).toBeVisible();
  });

  test("select période construction a 10 options", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    const select = page.getByLabel("Période de construction");
    const options = select.locator("option");
    await expect(options).toHaveCount(10);
  });

  test("toggle matériaux anciens apparaît pour avant 1948", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    // Sélectionner avant 1948
    await page.getByLabel("Période de construction").selectOption("avant_1948");

    // Le toggle doit apparaître
    await expect(page.getByText("Matériaux anciens")).toBeVisible();
  });

  test("toggle matériaux anciens masqué pour période récente", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    await page.getByLabel("Période de construction").selectOption("2001_2005");

    // Le toggle ne doit pas apparaître
    await expect(page.getByText("Matériaux anciens")).not.toBeVisible();
  });

  test("chips inertie sont cliquables", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    // Cliquer sur "Lourde"
    await page.getByRole("button", { name: "Lourde" }).click();

    // Vérifier qu'elle est sélectionnée (aria-pressed)
    await expect(page.getByRole("button", { name: "Lourde" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("hauteur sous plafond a la valeur par défaut 2.5", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    const hsp = page.getByLabel("Hauteur sous plafond (m)");
    await expect(hsp).toHaveValue("2.5");
  });

  test("champ altitude modifie la classe affichée", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/3`);

    const altInput = page.getByLabel("Altitude (m)");

    // Saisir 500m
    await altInput.fill("500");
    await expect(page.getByText("400-800m")).toBeVisible();

    // Saisir 1200m
    await altInput.fill("1200");
    await expect(page.getByText("> 800m")).toBeVisible();
  });
});

test.describe("Wizard — Navigation", () => {
  test("bouton Suivant navigue vers l'étape suivante", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    await page.getByRole("button", { name: /Suivant/ }).click();

    await expect(page).toHaveURL(/\/etape\/2/);
  });

  test("bouton Précédent navigue vers l'étape précédente", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    await page.getByRole("button", { name: /Précédent/ }).click();

    await expect(page).toHaveURL(/\/etape\/1/);
  });

  test("bouton Précédent est désactivé à l'étape 1", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/1`);

    const prevBtn = page.getByRole("button", { name: /Précédent/ });
    await expect(prevBtn).toBeDisabled();
  });

  test("la barre de progression affiche le numéro d'étape correct", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/test-1/etape/2`);

    // Vérifier le compteur
    await expect(page.getByText("2/14")).toBeVisible();
  });
});
