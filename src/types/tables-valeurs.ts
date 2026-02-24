/**
 * Tables de valeurs ADEME - Méthode 3CL
 * Valeurs fixes utilisées pour les calculs DPE
 */

// ============================================================================
// TV - Coefficients de transmission thermique (U) par défaut
// ============================================================================

export const TV_U_MUR_NON_ISOLE: Record<string, number> = {
  "avant_1948": 1.4,
  "1948_1974": 1.0,
  "1975_1977": 0.85,
  "1978_1982": 0.70,
  "1983_1988": 0.55,
  "1989_1999": 0.45,
  "2000_2005": 0.40,
  "2006_2012": 0.35,
  "2013_2021": 0.28,
  "apres_2021": 0.20,
};

export const TV_U_PLANCHER_BAS_NON_ISOLE: Record<string, number> = {
  "avant_1948": 1.2,
  "1948_1974": 0.95,
  "1975_1977": 0.80,
  "1978_1982": 0.70,
  "1983_1988": 0.55,
  "1989_1999": 0.45,
  "2000_2005": 0.40,
  "2006_2012": 0.35,
  "2013_2021": 0.28,
  "apres_2021": 0.20,
};

export const TV_U_PLANCHER_HAUT_NON_ISOLE: Record<string, number> = {
  "avant_1948": 1.2,
  "1948_1974": 0.95,
  "1975_1977": 0.80,
  "1978_1982": 0.70,
  "1983_1988": 0.55,
  "1989_1999": 0.45,
  "2000_2005": 0.40,
  "2006_2012": 0.35,
  "2013_2021": 0.28,
  "apres_2021": 0.20,
};

// ============================================================================
// TV - Coefficients U des vitrages
// ============================================================================

export const TV_U_VITRAGE: Record<string, number> = {
  "simple_vitrage": 5.8,
  "double_vitrage": 2.9,
  "double_vitrage_renove": 1.8,
  "triple_vitrage": 1.6,
};

// ============================================================================
// TV - Facteurs solaires (Sw) des vitrages
// ============================================================================

export const TV_SW_VITRAGE: Record<string, number> = {
  "simple_vitrage": 0.85,
  "double_vitrage": 0.76,
  "double_vitrage_renove": 0.72,
  "triple_vitrage": 0.68,
};

// ============================================================================
// TV - Coefficients U des menuiseries
// ============================================================================

export const TV_U_MENUISERIE: Record<string, number> = {
  "pvc": 1.4,
  "bois": 1.8,
  "aluminium": 2.2,
  "acier": 2.4,
};

// ============================================================================
// TV - Rendements des générateurs de chauffage
// ============================================================================

export const TV_RENDEMENT_CHAUDIERE: Record<string, number> = {
  "chaudiere_gaz_standard": 0.80,
  "chaudiere_gaz_bassee_temperature": 0.90,
  "chaudiere_gaz_condensation": 1.05,
  "chaudiere_fioul_standard": 0.85,
  "chaudiere_fioul_condensation": 1.00,
  "chaudiere_electrique": 1.00,
};

// ============================================================================
// TV - COP des pompes à chaleur
// ============================================================================

export const TV_COP_PAC: Record<string, number> = {
  "pac_air_air": 3.0,
  "pac_air_eau": 2.8,
  "pac_eau_eau": 4.0,
  "pac_geothermie": 4.5,
};

// ============================================================================
// TV - Débits de ventilation par défaut (m³/h)
// ============================================================================

export const TV_DEBIT_VENTILATION: Record<string, number> = {
  "vmc_autoreglable": 35,
  "vmc_hygroreglable_b": 30,
  "vmc_hygroreglable_a": 25,
  "vmc_double_flux": 35,
};

// ============================================================================
// TV - Coefficients de pont thermique psi (W/(m·K))
// ============================================================================

export const TV_PONT_THERMIQUE: Record<string, number> = {
  "mur_plancher_non_isole": 0.95,
  "mur_plancher_isole": 0.35,
  "mur_combles_perdues_non_isole": 0.80,
  "mur_combles_perdues_isole": 0.25,
};

// ============================================================================
// TV - Facteurs de conversion énergie primaire / finale
// ============================================================================

export const TV_FACTEUR_CONVERSION: Record<string, number> = {
  "electricite": 2.3,
  "gaz_naturel": 1.0,
  "fioul": 1.0,
  "bois_buche": 0.6,
  "bois_granules": 0.6,
  "reseau_chaleur": 0.6,
};

// ============================================================================
// TV - Coefficients d'émission GES (kgCO2/kWh)
// ============================================================================

export const TV_EMISSION_GES: Record<string, number> = {
  "electricite": 0.079,
  "gaz_naturel": 0.227,
  "fioul": 0.324,
  "bois_buche": 0.024,
  "bois_granules": 0.024,
  "reseau_chaleur": 0.100,
};

// ============================================================================
// TV - Seuils pour étiquettes DPE (kWh/m².an)
// ============================================================================

export const TV_SEUILS_ETIQUETTE_ENERGIE = {
  A: 50,
  B: 90,
  C: 150,
  D: 230,
  E: 330,
  F: 450,
};

export const TV_SEUILS_ETIQUETTE_CLIMAT = {
  A: 6,
  B: 11,
  C: 30,
  D: 50,
  E: 70,
  F: 100,
};
