/**
 * Types TypeScript — Étapes 4 à 8 du Wizard DPE
 * 
 * Mapping XSD DPEv2.6 :
 *   Étape 4 : <mur_collection>                    — Murs (ligne 319)
 *   Étape 5 : <baie_vitree_collection> +
 *             <porte_collection> + <ets_collection> — Baies, portes, ETS (ligne 1564)
 *   Étape 6 : <plancher_bas_collection>            — Planchers bas (ligne 767)
 *   Étape 7 : <plancher_haut_collection>           — Planchers hauts (ligne 1189)
 *   Étape 8 : <pont_thermique_collection>          — Ponts thermiques (ligne 3053)
 * 
 * Source : observatoire-dpe / DPEv2.6.xsd + enums.json
 */

// ════════════════════════════════════════════════════════════
// ENUMS COMMUNS ENVELOPPE
// ════════════════════════════════════════════════════════════

/** Orientation (enum "orientation" — 5 valeurs) */
export type Orientation = "nord" | "sud" | "est" | "ouest" | "horizontal";

/** Type d'adjacence (enum "type_adjacence" — 22 valeurs) */
export type TypeAdjacence =
  | "exterieur"
  | "terre_plein"
  | "vide_sanitaire"
  | "sous_sol_non_chauffe"
  | "garage"
  | "cellier"
  | "comble_perdu"
  | "comble_amenage_non_chauffe"
  | "circulation_commune"
  | "circulation_avec_ouverture"
  | "local_tertiaire"
  | "hall_entree"
  | "autre_logement_chauffe"
  | "batiment_accole"
  | "terrasse_couverte"
  | "veranda"
  | "local_commercial"
  | "local_non_chauffe_non_accessible"
  | "local_non_chauffe_accessible"
  | "local_non_residentiel"
  | "entree_immeuble"
  | "parc_stationnement";

/** Type d'isolation (enum "type_isolation" — 9 valeurs) */
export type TypeIsolation =
  | "non_isole"
  | "iti"              // Isolation Thermique par l'Intérieur
  | "ite"              // Isolation Thermique par l'Extérieur
  | "itr"              // Isolation Thermique Répartie
  | "iti_ite"          // ITI + ITE
  | "isolation_inconnue"
  | "isolation_recente"
  | "isolation_ancienne"
  | "isolation_par_lame_air";

/** Méthode de saisie U (enum "methode_saisie_u" — 10 valeurs) */
export type MethodeSaisieU =
  | "non_isole_forfaitaire"
  | "isole_forfaitaire_recent"
  | "isole_forfaitaire_ancien"
  | "saisie_directe_u"
  | "saisie_directe_u_paroi_et_isolation"
  | "saisie_resistance_isolation"
  | "saisie_epaisseur_isolation"
  | "calcul_u_detail"
  | "justificatif_constructeur"
  | "donnee_certifiee";

/** Méthode de saisie U0 paroi nue (enum "methode_saisie_u0" — 5 valeurs) */
export type MethodeSaisieU0 =
  | "u0_forfaitaire"
  | "u0_saisie_directe"
  | "u0_calcul_detail"
  | "u0_justificatif"
  | "u0_donnee_certifiee";

// ════════════════════════════════════════════════════════════
// ÉTAPE 4 — MURS (<mur_collection>)
// ════════════════════════════════════════════════════════════

/** Matériaux structure mur (enum "materiaux_structure_mur" — 27 valeurs, sélection principale) */
export type MateriauxStructureMur =
  | "pierre_moellon"
  | "pierre_taille"
  | "beton_banche"
  | "beton_bloc_parpaing"
  | "beton_cellulaire"
  | "brique_pleine"
  | "brique_creuse"
  | "brique_terre_crue"
  | "bois_massif"
  | "ossature_bois"
  | "pan_bois"
  | "metal"
  | "pisé"
  | "terre_crue"
  | "autre";

/** Type de doublage (enum "type_doublage" — 5 valeurs) */
export type TypeDoublage =
  | "sans_doublage"
  | "doublage_colle"
  | "doublage_sur_rail"
  | "doublage_independant"
  | "contre_cloison";

/** Données d'entrée d'un mur — XSD donnee_entree */
export interface MurDonneeEntree {
  /** Description libre */
  description: string;
  /** Référence unique du mur dans le DPE */
  reference: string;
  /** Adjacence (22 types) */
  type_adjacence: TypeAdjacence;
  /** Orientation (N/S/E/O/H) */
  orientation: Orientation;
  /** Surface opaque (m², hors baies) */
  surface_paroi_opaque: number;
  /** Paroi lourde (influence inertie) */
  paroi_lourde: boolean;
  /** Matériau de structure (27 types) */
  materiaux_structure: MateriauxStructureMur;
  /** Épaisseur de la structure (cm) */
  epaisseur_structure: number | null;
  /** Enduit isolant paroi ancienne */
  enduit_isolant_paroi_ancienne: boolean;
  /** Type de doublage (5 types) */
  type_doublage: TypeDoublage;
  /** Type d'isolation (9 types) */
  type_isolation: TypeIsolation;
  /** Période d'isolation */
  periode_isolation: string | null;
  /** Épaisseur d'isolant (cm) */
  epaisseur_isolation: number | null;
  /** Résistance thermique isolant (m².K/W) */
  resistance_isolation: number | null;
  /** Méthode de saisie U0 paroi nue */
  methode_saisie_u0: MethodeSaisieU0;
  /** U0 saisi directement (W/m².K) — si saisie directe */
  umur0_saisi: number | null;
  /** ID table de valeur U0 — si forfaitaire */
  tv_umur0_id: number | null;
  /** Méthode de saisie U final */
  methode_saisie_u: MethodeSaisieU;
  /** U mur saisi directement (W/m².K) — si saisie directe */
  umur_saisi: number | null;
  /** ID table de valeur U — si forfaitaire */
  tv_umur_id: number | null;
  /** Référence LNC associé */
  reference_lnc: string | null;
  /** Config isolation LNC */
  cfg_isolation_lnc: string | null;
}

/** Un mur complet dans la collection */
export interface Mur {
  id: string;
  donnee_entree: MurDonneeEntree;
  /** U mur calculé/saisi final (W/m².K) — donnée intermédiaire */
  umur: number | null;
  /** U0 paroi nue (W/m².K) — donnée intermédiaire */
  umur0: number | null;
  /** Coefficient b de réduction (LNC) */
  b: number | null;
}

/** Étape 4 : collection de murs */
export interface Step4Data {
  murs: Mur[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 5 — BAIES, PORTES, ETS
// ════════════════════════════════════════════════════════════

/** Type de vitrage (enum "type_vitrage" — 6 valeurs) */
export type TypeVitrage =
  | "simple_vitrage"
  | "double_vitrage"
  | "double_vitrage_fe"    // faible émissivité
  | "triple_vitrage"
  | "survitrage"
  | "vitrage_vir";         // à isolation renforcée

/** Matériaux menuiserie (enum "type_materiaux_menuiserie" — 7 valeurs) */
export type TypeMateriauxMenuiserie =
  | "bois"
  | "pvc"
  | "aluminium"
  | "acier"
  | "mixte_bois_alu"
  | "mixte_pvc_alu"
  | "autre_menuiserie";

/** Type de baie (enum "type_baie" — 8 valeurs) */
export type TypeBaie =
  | "fenetre_battante"
  | "fenetre_coulissante"
  | "porte_fenetre_battante"
  | "porte_fenetre_coulissante"
  | "fenetre_toit"
  | "baie_fixe"
  | "paroi_vitree"
  | "brique_verre";

/** Type de pose (enum "type_pose" — 4 valeurs) */
export type TypePose =
  | "nu_interieur"
  | "nu_exterieur"
  | "tunnel"
  | "menuiserie_avancee";

/** Type de fermeture (enum "type_fermeture" — 8 valeurs) */
export type TypeFermeture =
  | "sans_fermeture"
  | "volet_roulant_alu"
  | "volet_roulant_pvc"
  | "volet_battant_bois"
  | "volet_battant_alu_pvc"
  | "persienne_bois"
  | "persienne_alu_pvc"
  | "volet_coulissant";

/** Méthode saisie performance vitrage (enum "methode_saisie_perf_vitrage" — 15 valeurs, sélection) */
export type MethodeSaisieVitrage =
  | "forfaitaire_simple"
  | "forfaitaire_double"
  | "forfaitaire_triple"
  | "forfaitaire_survitrage"
  | "saisie_uw"
  | "saisie_ug_uf"
  | "justificatif_fabricant"
  | "donnee_certifiee_vitrage";

/** Données d'entrée d'une baie vitrée */
export interface BaieDonneeEntree {
  description: string;
  reference: string;
  /** Référence du mur porteur */
  reference_paroi: string;
  type_adjacence: TypeAdjacence;
  orientation: Orientation;
  /** Surface totale de la baie (m²) */
  surface: number;
  type_baie: TypeBaie;
  type_vitrage: TypeVitrage;
  materiaux_menuiserie: TypeMateriauxMenuiserie;
  type_pose: TypePose;
  type_fermeture: TypeFermeture;
  /** Présence de double fenêtre */
  double_fenetre: boolean;
  /** Masques solaires : masque proche + lointain */
  masque_proche_avance: number | null;
  masque_proche_depassement: number | null;
  masque_lointain_hauteur: number | null;
  masque_lointain_orientation: number | null;
  /** Méthode saisie performance */
  methode_saisie: MethodeSaisieVitrage;
  /** Uw saisi (W/m².K) — si saisie directe */
  uw_saisi: number | null;
  /** ID table valeur Uw — si forfaitaire */
  tv_uw_id: number | null;
  /** Ug et Uf — si saisie détaillée */
  ug: number | null;
  uf: number | null;
}

export interface BaieVitree {
  id: string;
  donnee_entree: BaieDonneeEntree;
  uw: number | null;
  sw: number | null;
}

/** Type de porte (enum "type_porte" — 16 valeurs, sélection principale) */
export type TypePorte =
  | "porte_opaque_pleine"
  | "porte_opaque_isolee"
  | "porte_vitree_simple"
  | "porte_vitree_double"
  | "porte_paliere"
  | "porte_garage"
  | "porte_service";

export interface PorteDonneeEntree {
  description: string;
  reference: string;
  reference_paroi: string;
  type_adjacence: TypeAdjacence;
  orientation: Orientation;
  surface: number;
  type_porte: TypePorte;
  /** U porte saisi (W/m².K) */
  uporte_saisi: number | null;
  tv_uporte_id: number | null;
}

export interface Porte {
  id: string;
  donnee_entree: PorteDonneeEntree;
  uporte: number | null;
}

/** ETS — Espace Tampon Solarisé (véranda) */
export interface ETS {
  id: string;
  description: string;
  surface: number;
  orientation: Orientation;
  type_vitrage: TypeVitrage;
  /** Ratio surface vitrée / surface totale */
  ratio_surface_vitree: number;
}

/** Étape 5 : baies + portes + ETS */
export interface Step5Data {
  baies: BaieVitree[];
  portes: Porte[];
  ets: ETS[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 6 — PLANCHERS BAS (<plancher_bas_collection>)
// ════════════════════════════════════════════════════════════

/** Type plancher bas (enum "type_plancher_bas" — 13 valeurs, sélection) */
export type TypePlancherBas =
  | "dalle_beton"
  | "dalle_beton_entrevous"
  | "plancher_bois"
  | "plancher_metal"
  | "plancher_mixte_bois_beton"
  | "dalle_pierre"
  | "autre_plancher_bas";

export interface PlancherBasDonneeEntree {
  description: string;
  reference: string;
  type_adjacence: TypeAdjacence;
  surface: number;
  type_plancher: TypePlancherBas;
  type_isolation: TypeIsolation;
  methode_saisie_u: MethodeSaisieU;
  upb_saisi: number | null;
  tv_upb_id: number | null;
  epaisseur_isolation: number | null;
  resistance_isolation: number | null;
  /** Périmètre du plancher (terre-plein, m) */
  perimetre: number | null;
  /** Surface sous chape (terre-plein, m²) */
  surface_ue: number | null;
  /** Ue terre-plein calculé */
  ue: number | null;
  reference_lnc: string | null;
}

export interface PlancherBas {
  id: string;
  donnee_entree: PlancherBasDonneeEntree;
  upb: number | null;
  b: number | null;
}

/** Étape 6 : collection planchers bas */
export interface Step6Data {
  planchers_bas: PlancherBas[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 7 — PLANCHERS HAUTS (<plancher_haut_collection>)
// ════════════════════════════════════════════════════════════

/** Type plancher haut (enum "type_plancher_haut" — 16 valeurs, sélection) */
export type TypePlancherHaut =
  | "combles_perdus_bois"
  | "combles_perdus_beton"
  | "combles_perdus_metal"
  | "combles_amenages_bois"
  | "combles_amenages_beton"
  | "terrasse_beton"
  | "terrasse_bois"
  | "toiture_bac_acier"
  | "plafond_sous_etage"
  | "autre_plancher_haut";

export interface PlancherHautDonneeEntree {
  description: string;
  reference: string;
  type_adjacence: TypeAdjacence;
  surface: number;
  type_plancher: TypePlancherHaut;
  type_isolation: TypeIsolation;
  methode_saisie_u: MethodeSaisieU;
  uph_saisi: number | null;
  tv_uph_id: number | null;
  epaisseur_isolation: number | null;
  resistance_isolation: number | null;
  reference_lnc: string | null;
}

export interface PlancherHaut {
  id: string;
  donnee_entree: PlancherHautDonneeEntree;
  uph: number | null;
  b: number | null;
}

/** Étape 7 : collection planchers hauts */
export interface Step7Data {
  planchers_hauts: PlancherHaut[];
}

// ════════════════════════════════════════════════════════════
// ÉTAPE 8 — PONTS THERMIQUES (<pont_thermique_collection>)
// ════════════════════════════════════════════════════════════

/** Type de liaison pont thermique (enum "type_liaison" — 5 valeurs) */
export type TypeLiaison =
  | "mur_plancher_bas"
  | "mur_plancher_haut"
  | "mur_mur"
  | "mur_menuiserie"
  | "plancher_refend";

export interface PontThermiqueDonneeEntree {
  description: string;
  reference: string;
  type_liaison: TypeLiaison;
  /** Référence du 1er élément (mur, plancher) */
  reference_1: string;
  /** Référence du 2ème élément */
  reference_2: string;
  /** Longueur du pont thermique (m) */
  longueur: number;
  /** Coefficient kpt saisi (W/m.K) — si saisie directe */
  kpt_saisi: number | null;
  /** ID table valeur kpt — si forfaitaire */
  tv_kpt_id: number | null;
  /** Méthode saisie : forfaitaire, expert, mesure */
  methode_saisie: "forfaitaire" | "expert" | "mesure";
}

export interface PontThermique {
  id: string;
  donnee_entree: PontThermiqueDonneeEntree;
  /** kpt final (W/m.K) */
  kpt: number | null;
}

/** Étape 8 : collection ponts thermiques */
export interface Step8Data {
  ponts_thermiques: PontThermique[];
}

// ════════════════════════════════════════════════════════════
// HELPERS ENVELOPPE
// ════════════════════════════════════════════════════════════

/** Adjacences qui nécessitent un coefficient b (LNC) */
export const ADJACENCES_LNC: TypeAdjacence[] = [
  "sous_sol_non_chauffe",
  "garage",
  "cellier",
  "comble_perdu",
  "comble_amenage_non_chauffe",
  "circulation_commune",
  "circulation_avec_ouverture",
  "hall_entree",
  "local_commercial",
  "local_non_chauffe_non_accessible",
  "local_non_chauffe_accessible",
  "local_non_residentiel",
  "entree_immeuble",
  "parc_stationnement",
];

/** Adjacences directes (pas de coefficient b) */
export const ADJACENCES_DIRECTES: TypeAdjacence[] = [
  "exterieur",
  "terre_plein",
  "vide_sanitaire",
];

/** Vérifie si l'adjacence nécessite un coefficient b */
export function isAdjacenceLNC(adj: TypeAdjacence): boolean {
  return ADJACENCES_LNC.includes(adj);
}

/** Méthodes de saisie qui nécessitent une valeur U saisie directement */
export function isMethodeSaisieDirecte(methode: MethodeSaisieU): boolean {
  return [
    "saisie_directe_u",
    "saisie_directe_u_paroi_et_isolation",
    "calcul_u_detail",
    "justificatif_constructeur",
    "donnee_certifiee",
  ].includes(methode);
}

/** Méthodes de saisie qui utilisent une table de valeur forfaitaire */
export function isMethodeForfaitaire(methode: MethodeSaisieU): boolean {
  return [
    "non_isole_forfaitaire",
    "isole_forfaitaire_recent",
    "isole_forfaitaire_ancien",
  ].includes(methode);
}

/** Méthodes qui nécessitent épaisseur ou résistance isolation */
export function isMethodeAvecIsolation(methode: MethodeSaisieU): boolean {
  return [
    "saisie_resistance_isolation",
    "saisie_epaisseur_isolation",
  ].includes(methode);
}

/** Génère un ID unique pour un élément d'enveloppe */
export function generateEnveloppeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Crée un mur vide avec valeurs par défaut */
export function createEmptyMur(): Mur {
  return {
    id: generateEnveloppeId("mur"),
    donnee_entree: {
      description: "",
      reference: "",
      type_adjacence: "exterieur",
      orientation: "nord",
      surface_paroi_opaque: 0,
      paroi_lourde: true,
      materiaux_structure: "beton_bloc_parpaing",
      epaisseur_structure: null,
      enduit_isolant_paroi_ancienne: false,
      type_doublage: "sans_doublage",
      type_isolation: "non_isole",
      periode_isolation: null,
      epaisseur_isolation: null,
      resistance_isolation: null,
      methode_saisie_u0: "u0_forfaitaire",
      umur0_saisi: null,
      tv_umur0_id: null,
      methode_saisie_u: "non_isole_forfaitaire",
      umur_saisi: null,
      tv_umur_id: null,
      reference_lnc: null,
      cfg_isolation_lnc: null,
    },
    umur: null,
    umur0: null,
    b: null,
  };
}
