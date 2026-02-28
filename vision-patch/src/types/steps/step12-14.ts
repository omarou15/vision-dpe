/**
 * Types TypeScript — Étapes 12 à 14 du Wizard DPE
 *
 * Étape 12 : Scénarios de travaux (2 parcours obligatoires depuis réforme 2021)
 * Étape 13 : Validation ADEME (API /controle_coherence)
 * Étape 14 : Export XML final conforme DPEv2.6.xsd
 */

// ════════════════════════════════════════════════════════════
// ÉTAPE 12 — SCÉNARIOS DE TRAVAUX
// ════════════════════════════════════════════════════════════

/** Poste de travaux */
export type PosteTravaux =
  | "isolation_murs"
  | "isolation_planchers_bas"
  | "isolation_toiture"
  | "remplacement_fenetres"
  | "chauffage"
  | "ecs"
  | "ventilation"
  | "climatisation"
  | "enr_photovoltaique"
  | "enr_solaire_thermique";

/** Classe énergétique DPE */
export type ClasseDpe = "A" | "B" | "C" | "D" | "E" | "F" | "G";

/** Un travail unitaire dans un scénario */
export interface Travail {
  id: string;
  poste: PosteTravaux;
  description: string;
  /** Coût estimé TTC (€) */
  cout_estime: number | null;
  /** Gain énergétique estimé (kWhEP/m²/an) */
  gain_energetique_estime: number | null;
  /** Gain émissions CO2 (kgCO2/m²/an) */
  gain_co2_estime: number | null;
}

/** Étape de travaux dans un parcours progressif */
export interface EtapeTravaux {
  id: string;
  numero: number;
  description: string;
  travaux: Travail[];
  /** Coût cumulé de l'étape */
  cout_cumule: number | null;
  /** Classe visée après cette étape */
  classe_visee: ClasseDpe | null;
}

/** Parcours de travaux (2 obligatoires) */
export interface ParcoursTravaux {
  id: string;
  /** 1 = progressif (par étapes), 2 = global (rénovation complète) */
  numero_parcours: 1 | 2;
  description: string;
  /** Étapes du parcours (1+ pour parcours 1, 1 pour parcours 2) */
  etapes: EtapeTravaux[];
  /** Classe DPE actuelle (état initial) */
  classe_actuelle: ClasseDpe | null;
  /** Classe DPE visée après tous travaux */
  classe_visee: ClasseDpe | null;
  /** Coût total estimé (€) */
  cout_total: number | null;
  /** Gain total EP (kWhEP/m²/an) */
  gain_total_ep: number | null;
  /** Gain total GES (kgCO2/m²/an) */
  gain_total_ges: number | null;
}

/** Étape 12 */
export interface Step12Data {
  parcours: ParcoursTravaux[];
}

/** Classe minimale visée par parcours (obligation réglementaire) */
export const CLASSE_MINIMALE_PARCOURS: Record<1 | 2, ClasseDpe> = {
  1: "C", // Parcours progressif : classe C minimum
  2: "B", // Parcours global : classe B minimum
};

/** Labels postes de travaux */
export const POSTE_LABELS: Record<PosteTravaux, string> = {
  isolation_murs: "Isolation des murs",
  isolation_planchers_bas: "Isolation des planchers bas",
  isolation_toiture: "Isolation de la toiture",
  remplacement_fenetres: "Remplacement des fenêtres",
  chauffage: "Système de chauffage",
  ecs: "Production d'eau chaude",
  ventilation: "Ventilation",
  climatisation: "Climatisation",
  enr_photovoltaique: "Panneaux photovoltaïques",
  enr_solaire_thermique: "Solaire thermique",
};

// ════════════════════════════════════════════════════════════
// ÉTAPE 13 — VALIDATION ADEME
// ════════════════════════════════════════════════════════════

/** Sévérité d'un contrôle ADEME */
export type SeveriteControle = "bloquant" | "warning" | "info";

/** Résultat d'un contrôle unitaire */
export interface ResultatControle {
  /** Code du contrôle ADEME */
  code: string;
  /** Message d'erreur */
  message: string;
  /** Sévérité */
  severite: SeveriteControle;
  /** XPath vers l'élément en faute dans le XML */
  xpath: string | null;
  /** Étape du wizard concernée (déduite du xpath) */
  etape_wizard: number | null;
  /** Champ concerné (nom lisible) */
  champ: string | null;
}

/** Résultat complet de la validation */
export interface ResultatValidation {
  /** Timestamp de la validation */
  timestamp: string;
  /** Statut global */
  statut: "valide" | "erreurs_bloquantes" | "warnings_seulement";
  /** Nombre d'erreurs bloquantes */
  nb_bloquants: number;
  /** Nombre de warnings */
  nb_warnings: number;
  /** Liste des contrôles */
  controles: ResultatControle[];
  /** Version du moteur de contrôle */
  version_moteur: string | null;
  /** Durée de la validation (ms) */
  duree_ms: number | null;
}

/** Étape 13 */
export interface Step13Data {
  /** Historique des validations (dernière en premier) */
  validations: ResultatValidation[];
  /** Dernière validation réussie sans bloquant */
  derniere_validation_ok: ResultatValidation | null;
}

/**
 * Mapping xpath → étape wizard pour localiser les erreurs.
 * Utilisé pour le feedback par champ dans le wizard.
 */
export const XPATH_ETAPE_MAP: Record<string, number> = {
  "administratif": 1,
  "logement/caracteristique_generale": 3,
  "logement/meteo": 3,
  "logement/enveloppe/mur_collection": 4,
  "logement/enveloppe/baie_vitree_collection": 5,
  "logement/enveloppe/porte_collection": 5,
  "logement/enveloppe/ets_collection": 5,
  "logement/enveloppe/plancher_bas_collection": 6,
  "logement/enveloppe/plancher_haut_collection": 7,
  "logement/enveloppe/pont_thermique_collection": 8,
  "logement/installation_chauffage_collection": 9,
  "logement/installation_ecs_collection": 10,
  "logement/ventilation_collection": 11,
  "logement/climatisation_collection": 11,
  "logement/production_elec_enr": 11,
  "logement/sortie": 12,
};

/** Déduit l'étape wizard depuis un xpath ADEME */
export function getEtapeFromXpath(xpath: string): number | null {
  for (const [prefix, etape] of Object.entries(XPATH_ETAPE_MAP)) {
    if (xpath.includes(prefix)) return etape;
  }
  return null;
}

/** Filtre les erreurs bloquantes */
export function getBloquants(resultat: ResultatValidation): ResultatControle[] {
  return resultat.controles.filter((c) => c.severite === "bloquant");
}

/** Filtre les warnings */
export function getWarnings(resultat: ResultatValidation): ResultatControle[] {
  return resultat.controles.filter((c) => c.severite === "warning");
}

/** Groupe les erreurs par étape */
export function grouperParEtape(controles: ResultatControle[]): Map<number, ResultatControle[]> {
  const map = new Map<number, ResultatControle[]>();
  for (const c of controles) {
    const etape = c.etape_wizard ?? 0;
    if (!map.has(etape)) map.set(etape, []);
    map.get(etape)!.push(c);
  }
  return map;
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 14 — EXPORT XML
// ════════════════════════════════════════════════════════════

/** Statut de l'export */
export type StatutExport = "non_genere" | "en_cours" | "genere" | "erreur";

/** Métadonnées de l'export XML */
export interface ExportXml {
  /** Statut */
  statut: StatutExport;
  /** Nom du fichier généré */
  nom_fichier: string | null;
  /** Taille en octets */
  taille: number | null;
  /** URL de téléchargement (Supabase Storage) */
  url_telechargement: string | null;
  /** Hash SHA-256 du fichier */
  hash_sha256: string | null;
  /** Timestamp de génération */
  genere_le: string | null;
  /** Version XSD utilisée */
  version_xsd: string;
  /** Dernière validation ADEME réussie */
  validation_ok: boolean;
  /** Erreur si échec */
  erreur: string | null;
}

/** Étape 14 */
export interface Step14Data {
  export_xml: ExportXml;
}

/** État initial export */
export const EXPORT_INITIAL: ExportXml = {
  statut: "non_genere",
  nom_fichier: null,
  taille: null,
  url_telechargement: null,
  hash_sha256: null,
  genere_le: null,
  version_xsd: "2.6",
  validation_ok: false,
  erreur: null,
};
