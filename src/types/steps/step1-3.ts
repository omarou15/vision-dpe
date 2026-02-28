/**
 * Types TypeScript — Étapes 1 à 3 du Wizard DPE
 * 
 * Mapping direct XSD DPEv2.6 :
 *   Étape 1 : <administratif> — Informations générales (adresse, géocodage BAN, diagnostiqueur)
 *   Étape 2 : <administratif> — Données administratives DPE (n° DPE, version, modèle, commanditaire)
 *   Étape 3 : <caracteristique_generale> + <meteo> — Caractéristiques générales + zone climatique
 * 
 * Source de vérité : observatoire-dpe / DPEv2.6.xsd lignes 9-273
 * Enums : observatoire-dpe / enums.json
 */

// ════════════════════════════════════════════════════════════
// ENUMS XSD — Étapes 1-3
// ════════════════════════════════════════════════════════════

/** Version du DPE (enum "version" — 9 valeurs) */
export type DpeVersion =
  | "1" | "1.1" | "1.2" | "1.3"  // obsolètes
  | "2" | "2.1" | "2.2" | "2.3"  // anciennes
  | "2.6";                         // en vigueur

/** Modèle DPE (enum "modele_dpe" — 4 valeurs) */
export type ModeleDpe =
  | "dpe_3cl"                    // Logement existant méthode 3CL
  | "dpe_tertiaire_facture"      // Tertiaire sur factures
  | "dpe_tertiaire_neuf"         // Tertiaire neuf
  | "dpe_neuf";                  // Logement neuf RT2012/RE2020

/**
 * Méthode d'application DPE logement (enum "methode_application_dpe_log" — 40 valeurs)
 * Sélection réduite aux cas Vision DPE v1 (3CL logement existant)
 */
export type MethodeApplicationDpeLog =
  | "maison_individuelle"
  | "appartement_individuel"
  | "appartement_depuis_immeuble"
  | "immeuble_collectif"
  | "lot_copropriete";

/** Période de construction (enum "periode_construction" — 10 valeurs) */
export type PeriodeConstruction =
  | "avant_1948"
  | "1948_1974"
  | "1975_1977"
  | "1978_1982"
  | "1983_1988"
  | "1989_2000"
  | "2001_2005"
  | "2006_2012"
  | "2013_2021"
  | "apres_2021";

/** Zone climatique (enum "zone_climatique" — 8 valeurs) */
export type ZoneClimatique =
  | "H1a" | "H1b" | "H1c"
  | "H2a" | "H2b" | "H2c" | "H2d"
  | "H3";

/** Classe d'altitude (enum "classe_altitude" — 3 valeurs) */
export type ClasseAltitude =
  | "inf_400m"    // < 400m
  | "400_800m"    // 400-800m
  | "sup_800m";   // > 800m

// ════════════════════════════════════════════════════════════
// ÉTAPE 1 — Informations générales (<administratif>)
// ════════════════════════════════════════════════════════════

/** Résultat du géocodage API BAN (adresse.data.gouv.fr) */
export interface GeocodageBAN {
  /** Adresse complète retournée par l'API BAN */
  label: string;
  /** Score de confiance (0-1) — bloquant ADEME si < 0.5 */
  score: number;
  /** Numéro de voie */
  housenumber: string | null;
  /** Nom de la rue */
  street: string | null;
  /** Code postal */
  postcode: string;
  /** Nom de la commune */
  city: string;
  /** Code INSEE */
  citycode: string;
  /** Latitude WGS84 */
  latitude: number;
  /** Longitude WGS84 */
  longitude: number;
  /** Identifiant BAN unique */
  ban_id: string;
  /** Type de résultat : housenumber, street, municipality */
  type: "housenumber" | "street" | "municipality" | "locality";
}

/** Données du diagnostiqueur */
export interface DiagnostiqueurInfo {
  /** Nom complet du diagnostiqueur */
  nom: string;
  /** Prénom */
  prenom: string;
  /** Numéro de certification COFRAC */
  numero_certification: string;
  /** Organisme certificateur (ex: AFNOR, Bureau Veritas, Qualibat) */
  organisme_certification: string;
  /** Date d'expiration de la certification */
  date_expiration_certification: string; // ISO date
  /** SIRET du diagnostiqueur ou du bureau d'études */
  siret: string | null;
  /** Raison sociale du bureau d'études */
  raison_sociale: string | null;
  /** Téléphone */
  telephone: string | null;
  /** Email */
  email: string | null;
}

/** Étape 1 : Informations générales — XSD <administratif> partie adresse */
export interface Step1Data {
  // ── Adresse ──
  /** Adresse saisie par le diagnostiqueur (avant géocodage) */
  adresse_saisie: string;
  /** Complément d'adresse (bâtiment, escalier, étage) */
  complement_adresse: string | null;
  /** Code postal */
  code_postal: string;
  /** Ville */
  ville: string;

  // ── Géocodage BAN (bloquant ADEME) ──
  /** Résultat complet du géocodage */
  geocodage: GeocodageBAN | null;
  /** Géocodage validé par le diagnostiqueur */
  geocodage_valide: boolean;

  // ── Diagnostiqueur (pré-rempli depuis le profil) ──
  diagnostiqueur: DiagnostiqueurInfo;

  // ── Dates ──
  /** Date de la visite sur site */
  date_visite: string; // ISO date
  /** Date d'établissement du DPE */
  date_etablissement: string; // ISO date
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 2 — Données administratives DPE (<administratif>)
// ════════════════════════════════════════════════════════════

/** Commanditaire du DPE */
export interface Commanditaire {
  /** Nom ou raison sociale du commanditaire */
  nom: string;
  /** Qualité : propriétaire, bailleur, syndic, locataire */
  qualite: "proprietaire" | "bailleur" | "syndic" | "locataire" | "mandataire";
}

/** Étape 2 : Données administratives — XSD <administratif> partie DPE */
export interface Step2Data {
  /** Numéro du DPE (format ADEME : 13 chiffres, généré automatiquement ou saisi) */
  numero_dpe: string | null;

  /** Version du DPE — toujours "2.6" pour Vision DPE v1 */
  version_dpe: DpeVersion;

  /** Modèle DPE — toujours "dpe_3cl" pour Vision DPE v1 */
  modele_dpe: ModeleDpe;

  /** Méthode d'application — conditionne toute la suite du wizard */
  methode_application: MethodeApplicationDpeLog;

  /** Type de logement (choisi à la création du projet, affiché ici) */
  type_logement: "maison" | "appartement" | "immeuble";

  /** Type de bâtiment (pour immeuble : nb lots, nb niveaux) */
  nb_logements_immeuble: number | null;
  nb_niveaux_immeuble: number | null;

  /** Commanditaire */
  commanditaire: Commanditaire;

  /** Consentement du propriétaire pour la transmission à l'ADEME */
  consentement_proprietaire: boolean;

  /** Motif du DPE : vente, location, information, autre */
  motif_dpe: "vente" | "location" | "information" | "construction" | "autre";

  /** Surface habitable du lot (m²) — champ critique ADEME */
  surface_habitable_lot: number | null;

  /** Surface habitable du bâtiment (m²) — pour immeuble */
  surface_habitable_batiment: number | null;

  /** DPE remplace un précédent DPE (numéro ADEME de l'ancien) */
  numero_dpe_remplace: string | null;
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 3 — Caractéristiques générales + Météo
//           XSD <caracteristique_generale> + <meteo>
// ════════════════════════════════════════════════════════════

/** Étape 3 : Caractéristiques générales */
export interface Step3Data {
  // ── Caractéristiques générales (<caracteristique_generale>) ──

  /** Période de construction (10 valeurs) — conditionne les valeurs forfaitaires */
  periode_construction: PeriodeConstruction;

  /** Année de construction exacte (optionnel si période connue) */
  annee_construction: number | null;

  /** Surface habitable (m²) — reportée depuis étape 2 ou saisie ici */
  surface_habitable: number;

  /** Hauteur sous plafond moyenne (m) — défaut 2.50 */
  hauteur_sous_plafond: number;

  /** Nombre de niveaux habités */
  nombre_niveaux: number;

  /** Surface totale des planchers (m²) — calculée : surface_habitable * nombre_niveaux si > 1 */
  surface_planchers: number | null;

  /** Type de bâtiment — hérité de l'étape 2 */
  type_batiment: "maison" | "appartement" | "immeuble";

  /** Position de l'appartement dans l'immeuble */
  position_appartement: "rez_de_chaussee" | "etage_intermediaire" | "dernier_etage" | null;

  /** Mitoyenneté (maison) */
  mitoyennete: "non_mitoyen" | "mitoyen_1_cote" | "mitoyen_2_cotes" | null;

  /** Présence d'un sous-sol */
  presence_sous_sol: boolean;

  /** Inertie du bâtiment (déduite ou saisie) */
  inertie: "lourde" | "moyenne" | "legere";

  /** Matériaux anciens (bâtiment avant 1948 avec enduits spécifiques) */
  materiaux_anciens: boolean;

  // ── Météo (<meteo>) ──

  /** Zone climatique (8 valeurs) — déduite automatiquement du code postal */
  zone_climatique: ZoneClimatique;

  /** Altitude du logement (m) — déduite du géocodage ou saisie */
  altitude: number;

  /** Classe d'altitude (3 valeurs) — calculée depuis altitude */
  classe_altitude: ClasseAltitude;
}

// ════════════════════════════════════════════════════════════
// VALEURS PAR DÉFAUT & HELPERS
// ════════════════════════════════════════════════════════════

/** Mapping code postal → zone climatique (simplifié, les 2 premiers chiffres) */
export const ZONE_CLIMATIQUE_PAR_DEPARTEMENT: Record<string, ZoneClimatique> = {
  // H1a : Nord, Picardie, Île-de-France nord
  "02": "H1a", "08": "H1a", "10": "H1a", "51": "H1a", "52": "H1a", "59": "H1a", "60": "H1a", "62": "H1a", "80": "H1a",
  // H1b : Est
  "21": "H1b", "25": "H1b", "39": "H1b", "54": "H1b", "55": "H1b", "57": "H1b", "67": "H1b", "68": "H1b",
  "70": "H1b", "71": "H1b", "88": "H1b", "89": "H1b", "90": "H1b",
  // H1c : Centre, Île-de-France, Auvergne altitude
  "03": "H1c", "15": "H1c", "23": "H1c", "43": "H1c", "45": "H1c",
  "58": "H1c", "63": "H1c", "75": "H1c", "77": "H1c", "78": "H1c",
  "91": "H1c", "92": "H1c", "93": "H1c", "94": "H1c", "95": "H1c",
  "18": "H1c", "28": "H1c", "36": "H1c", "37": "H1c", "41": "H1c",
  // H2a : Bretagne, Normandie
  "14": "H2a", "22": "H2a", "27": "H2a", "29": "H2a", "35": "H2a",
  "44": "H2a", "49": "H2a", "50": "H2a", "53": "H2a", "56": "H2a",
  "61": "H2a", "72": "H2a", "76": "H2a", "85": "H2a",
  // H2b : Atlantique
  "16": "H2b", "17": "H2b", "19": "H2b", "24": "H2b", "33": "H2b",
  "40": "H2b", "46": "H2b", "47": "H2b", "64": "H2b", "79": "H2b",
  "86": "H2b", "87": "H2b",
  // H2c : Sud-Ouest intérieur
  "09": "H2c", "12": "H2c", "31": "H2c", "32": "H2c", "65": "H2c",
  "81": "H2c", "82": "H2c",
  // H2d : Rhône-Alpes, sud Bourgogne
  "01": "H2d", "07": "H2d", "26": "H2d", "38": "H2d", "42": "H2d",
  "69": "H2d", "73": "H2d", "74": "H2d",
  // H3 : Méditerranée
  "04": "H3", "05": "H3", "06": "H3", "11": "H3", "13": "H3",
  "2A": "H3", "2B": "H3", "30": "H3", "34": "H3", "48": "H3",
  "66": "H3", "83": "H3", "84": "H3",
};

/** Déduit la zone climatique depuis le code postal */
export function getZoneClimatique(codePostal: string): ZoneClimatique | null {
  const dept = codePostal.substring(0, 2);
  return ZONE_CLIMATIQUE_PAR_DEPARTEMENT[dept] || null;
}

/** Déduit la classe d'altitude depuis l'altitude en mètres */
export function getClasseAltitude(altitude: number): ClasseAltitude {
  if (altitude < 400) return "inf_400m";
  if (altitude <= 800) return "400_800m";
  return "sup_800m";
}

/** Vérifie si le score BAN est suffisant (seuil ADEME) */
export function isGeocodageValide(score: number): boolean {
  return score >= 0.5;
}

/** Valeurs par défaut étape 3 */
export const STEP3_DEFAULTS: Partial<Step3Data> = {
  hauteur_sous_plafond: 2.5,
  nombre_niveaux: 1,
  inertie: "moyenne",
  materiaux_anciens: false,
  presence_sous_sol: false,
};
