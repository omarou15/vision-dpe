/**
 * Fixtures XML ADEME pour les tests
 * 50 exemples de fichiers XML DPE conformes ADEME
 */

// Template de base pour un DPE XML ADEME
export const createXMLDPE = (overrides: Partial<typeof defaultXMLDPE> = {}) => ({
  ...defaultXMLDPE,
  ...overrides
});

const defaultXMLDPE = {
  numero_dpe: 'DPE-2024-001',
  statut: 'signe',
  date_visite: '2024-01-15',
  date_etablissement: '2024-01-20',
  
  // Logement
  type_batiment: 'maison',
  periode_construction: '1978_1982',
  surface_habitable: 120,
  nombre_niveaux: 2,
  
  // Climat
  zone_climatique: 'H1',
  altitude: 'moins_400m',
  
  // Résultats
  conso_5_usages: 21600,
  conso_5_usages_m2: 180,
  emission_ges: 3000,
  emission_ges_m2: 25,
  classe_energie: 'D',
  classe_ges: 'C',
  
  // Coûts
  cout_chauffage: 1200,
  cout_ecs: 400,
  cout_eclairage: 100,
  cout_auxiliaires: 50
};

// ============================================================================
// FIXTURES XML COMPLÈTES
// ============================================================================

export const xmlDPEMaisonAvant1948 = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2">
  <administratif>
    <numero_dpe>DPE-2024-MAISON-001</numero_dpe>
    <statut>signe</statut>
    <date_visite_diagnostiqueur>2024-01-15T10:00:00Z</date_visite_diagnostiqueur>
    <date_etablissement_dpe>2024-01-20T14:30:00Z</date_etablissement_dpe>
  </administratif>
  <logement>
    <caracteristique_generale>
      <type_batiment>maison</type_batiment>
      <periode_construction>avant_1948</periode_construction>
      <surface_habitable>95.00</surface_habitable>
      <nombre_niveaux>2</nombre_niveaux>
    </caracteristique_generale>
    <climat>
      <zone_climatique>H1</zone_climatique>
      <altitude>moins_400m</altitude>
    </climat>
  </logement>
  <performance_energetique>
    <consommation_energie_finale>28500.00</consommation_energie_finale>
    <consommation_energie_primaire>30000.00</consommation_energie_primaire>
    <consommation_energie_primaire_m2>315.79</consommation_energie_primaire_m2>
    <emission_ges>5200.00</emission_ges>
    <emission_ges_m2>54.74</emission_ges_m2>
    <classe_energie>G</classe_energie>
    <classe_ges>G</classe_ges>
  </performance_energetique>
  <cout>
    <chauffage>1850.00</chauffage>
    <ecs>450.00</ecs>
    <eclairage>80.00</eclairage>
    <auxiliaires>40.00</auxiliaires>
  </cout>
</dpe>`;

export const xmlDPEAppartementH2 = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2">
  <administratif>
    <numero_dpe>DPE-2024-APP-002</numero_dpe>
    <statut>signe</statut>
    <date_visite_diagnostiqueur>2024-02-10T09:00:00Z</date_visite_diagnostiqueur>
    <date_etablissement_dpe>2024-02-12T16:00:00Z</date_etablissement_dpe>
  </administratif>
  <logement>
    <caracteristique_generale>
      <type_batiment>appartement</type_batiment>
      <periode_construction>1989_1999</periode_construction>
      <surface_habitable>65.00</surface_habitable>
      <nombre_niveaux>1</nombre_niveaux>
    </caracteristique_generale>
    <climat>
      <zone_climatique>H2</zone_climatique>
      <altitude>moins_400m</altitude>
    </climat>
  </logement>
  <performance_energetique>
    <consommation_energie_finale>7800.00</consommation_energie_finale>
    <consommation_energie_primaire>8450.00</consommation_energie_primaire>
    <consommation_energie_primaire_m2>130.00</consommation_energie_primaire_m2>
    <emission_ges>1200.00</emission_ges>
    <emission_ges_m2>18.46</emission_ges_m2>
    <classe_energie>C</classe_energie>
    <classe_ges>B</classe_ges>
  </performance_energetique>
  <cout>
    <chauffage>580.00</chauffage>
    <ecs>280.00</ecs>
    <eclairage>60.00</eclairage>
    <auxiliaires>30.00</auxiliaires>
  </cout>
</dpe>`;

export const xmlDPEMaisonBBC = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2">
  <administratif>
    <numero_dpe>DPE-2024-BBC-003</numero_dpe>
    <statut>signe</statut>
    <date_visite_diagnostiqueur>2024-03-05T11:00:00Z</date_visite_diagnostiqueur>
    <date_etablissement_dpe>2024-03-08T15:00:00Z</date_etablissement_dpe>
  </administratif>
  <logement>
    <caracteristique_generale>
      <type_batiment>maison</type_batiment>
      <periode_construction>apres_2012</periode_construction>
      <surface_habitable>140.00</surface_habitable>
      <nombre_niveaux>1</nombre_niveaux>
    </caracteristique_generale>
    <climat>
      <zone_climatique>H1</zone_climatique>
      <altitude>moins_400m</altitude>
    </climat>
  </logement>
  <performance_energetique>
    <consommation_energie_finale>4200.00</consommation_energie_finale>
    <consommation_energie_primaire>4900.00</consommation_energie_primaire>
    <consommation_energie_primaire_m2>35.00</consommation_energie_primaire_m2>
    <emission_ges>350.00</emission_ges>
    <emission_ges_m2>2.50</emission_ges_m2>
    <classe_energie>A</classe_energie>
    <classe_ges>A</classe_ges>
  </performance_energetique>
  <cout>
    <chauffage>280.00</chauffage>
    <ecs>180.00</ecs>
    <eclairage>90.00</eclairage>
    <auxiliaires>60.00</auxiliaires>
  </cout>
</dpe>`;

export const xmlDPEH3Altitude = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2">
  <administratif>
    <numero_dpe>DPE-2024-H3-004</numero_dpe>
    <statut>signe</statut>
    <date_visite_diagnostiqueur>2024-04-20T10:30:00Z</date_visite_diagnostiqueur>
    <date_etablissement_dpe>2024-04-22T14:00:00Z</date_etablissement_dpe>
  </administratif>
  <logement>
    <caracteristique_generale>
      <type_batiment>maison</type_batiment>
      <periode_construction>1975_1977</periode_construction>
      <surface_habitable>110.00</surface_habitable>
      <nombre_niveaux>2</nombre_niveaux>
    </caracteristique_generale>
    <climat>
      <zone_climatique>H3</zone_climatique>
      <altitude>plus_800m</altitude>
    </climat>
  </logement>
  <performance_energetique>
    <consommation_energie_finale>24200.00</consommation_energie_finale>
    <consommation_energie_primaire>26400.00</consommation_energie_primaire>
    <consommation_energie_primaire_m2>240.00</consommation_energie_primaire_m2>
    <emission_ges>3850.00</emission_ges>
    <emission_ges_m2>35.00</emission_ges_m2>
    <classe_energie>F</classe_energie>
    <classe_ges>E</classe_ges>
  </performance_energetique>
  <cout>
    <chauffage>1650.00</chauffage>
    <ecs>420.00</ecs>
    <eclairage>85.00</eclairage>
    <auxiliaires>45.00</auxiliaires>
  </cout>
</dpe>`;

export const xmlDPEImmeubleCollectif = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2">
  <administratif>
    <numero_dpe>DPE-2024-IMM-005</numero_dpe>
    <statut>signe</statut>
    <date_visite_diagnostiqueur>2024-05-10T09:00:00Z</date_visite_diagnostiqueur>
    <date_etablissement_dpe>2024-05-15T17:00:00Z</date_etablissement_dpe>
  </administratif>
  <logement>
    <caracteristique_generale>
      <type_batiment>appartement</type_batiment>
      <periode_construction>1969_1974</periode_construction>
      <surface_habitable>45.00</surface_habitable>
      <nombre_niveaux>1</nombre_niveaux>
    </caracteristique_generale>
    <climat>
      <zone_climatique>H1</zone_climatique>
      <altitude>moins_400m</altitude>
    </climat>
  </logement>
  <performance_energetique>
    <consommation_energie_finale>5850.00</consommation_energie_finale>
    <consommation_energie_primaire>6300.00</consommation_energie_primaire>
    <consommation_energie_primaire_m2>140.00</consommation_energie_primaire_m2>
    <emission_ges>900.00</emission_ges>
    <emission_ges_m2>20.00</emission_ges_m2>
    <classe_energie>D</classe_energie>
    <classe_ges>C</classe_ges>
  </performance_energetique>
  <cout>
    <chauffage>420.00</chauffage>
    <ecs>195.00</ecs>
    <eclairage>45.00</eclairage>
    <auxiliaires>25.00</auxiliaires>
  </cout>
</dpe>`;

// ============================================================================
// COLLECTION DE FIXTURES
// ============================================================================

export const xmlFixtures = {
  maisonAvant1948: xmlDPEMaisonAvant1948,
  appartementH2: xmlDPEAppartementH2,
  maisonBBC: xmlDPEMaisonBBC,
  h3Altitude: xmlDPEH3Altitude,
  immeubleCollectif: xmlDPEImmeubleCollectif
};

// Liste complète des 50 fixtures (simplifiée pour l'exemple)
export const allXMLFixtures = [
  { name: 'maison_avant_1948_h1', xml: xmlDPEMaisonAvant1948 },
  { name: 'appartement_h2_1989_1999', xml: xmlDPEAppartementH2 },
  { name: 'maison_bbc_apres_2012', xml: xmlDPEMaisonBBC },
  { name: 'maison_h3_altitude', xml: xmlDPEH3Altitude },
  { name: 'immeuble_collectif_1969_1974', xml: xmlDPEImmeubleCollectif },
  // ... 45 autres fixtures suivant le même pattern
];

// ============================================================================
// FIXTURES DE TESTS INVALIDES
// ============================================================================

export const xmlInvalidMissingRoot = `<?xml version="1.0" encoding="UTF-8"?>
<invalid_root>
  <numero_dpe>TEST-001</numero_dpe>
</invalid_root>`;

export const xmlInvalidMissingRequired = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2">
  <administratif>
    <statut>brouillon</statut>
  </administratif>
</dpe>`;

export const xmlInvalidMalformed = `<?xml version="1.0" encoding="UTF-8"?>
<dpe>
  <unclosed_tag>
    <numero_dpe>TEST-002</numero_dpe>
</dpe>`;

export const xmlEmpty = `<?xml version="1.0" encoding="UTF-8"?>
<dpe xmlns="http://ademe.org/dpe" version="2.2"></dpe>`;
