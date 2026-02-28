/**
 * Types utilitaires pour les services Vision DPE
 * DTOs, Payloads et types de réponse API
 * 
 * @module utils-types
 * @version 1.0.0
 */

import { DPEDocument, ValidationResult } from "./dpe";
import { AuthUser, AuthSession, AuthError } from "./services";

// ============================================================================
// TYPES DE BASE POUR LES DTOs
// ============================================================================

/**
 * Type utilitaire pour rendre certaines propriétés optionnelles
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type utilitaire pour rendre certaines propriétés requises
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Type utilitaire pour les réponses paginées
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Type utilitaire pour les filtres de requête
 */
export interface QueryFilters {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

/**
 * Type utilitaire pour le tri
 */
export interface QuerySort {
  field: string;
  direction: "asc" | "desc";
}

// ============================================================================
// DTOs POUR LES REQUÊTES API
// ============================================================================

/**
 * DTO pour la création d'un DPE
 */
export interface CreateDPEDto {
  administratif: CreateAdministratifDto;
  logement: CreateLogementDto;
}

/**
 * DTO pour la création de la partie administrative
 */
export interface CreateAdministratifDto {
  date_visite_diagnostiqueur: string;
  date_etablissement_dpe: string;
  nom_proprietaire: string;
  nom_proprietaire_installation_commune?: string;
  enum_modele_dpe_id: number;
  enum_version_id: string;
  diagnostiqueur: CreateDiagnostiqueurDto;
  geolocalisation: CreateGeolocalisationDto;
  enum_consentement_formulaire_id?: number;
  enum_commanditaire_id?: number;
  information_formulaire_consentement?: CreateInformationFormulaireConsentementDto;
}

/**
 * DTO pour la création du diagnostiqueur
 */
export interface CreateDiagnostiqueurDto {
  usr_logiciel_id: number;
  version_logiciel: string;
  nom_diagnostiqueur: string;
  prenom_diagnostiqueur: string;
  mail_diagnostiqueur: string;
  telephone_diagnostiqueur: string;
  adresse_diagnostiqueur: string;
  entreprise_diagnostiqueur: string;
  numero_certification_diagnostiqueur: string;
  organisme_certificateur: string;
}

/**
 * DTO pour la création de la géolocalisation
 */
export interface CreateGeolocalisationDto {
  numero_fiscal_local?: string;
  idpar?: string;
  immatriculation_copropriete?: string;
  adresses: {
    adresse_proprietaire: CreateAdresseDto;
    adresse_bien: CreateAdresseDto;
    adresse_proprietaire_installation_commune?: CreateAdresseDto;
  };
}

/**
 * DTO pour la création d'une adresse
 */
export interface CreateAdresseDto {
  adresse_brut: string;
  code_postal_brut: string;
  nom_commune_brut: string;
  label_brut: string;
  label_brut_avec_complement: string;
  enum_statut_geocodage_ban_id: number;
  ban_date_appel: string;
  compl_nom_residence?: string;
  compl_ref_batiment?: string;
  compl_etage_appartement?: string;
  compl_ref_cage_escalier?: string;
  compl_ref_logement?: string;
  ban_id: string;
  ban_label: string;
  ban_housenumber: string;
  ban_street: string;
  ban_citycode: string;
  ban_postcode: string;
  ban_city: string;
  ban_type: string;
  ban_score: number;
  ban_x: number;
  ban_y: number;
}

/**
 * DTO pour la création des informations de consentement
 */
export interface CreateInformationFormulaireConsentementDto {
  nom_formulaire: string;
  personne_morale: number;
  siren_formulaire: string;
  mail: string;
  telephone: string;
  label_adresse: string;
  label_adresse_avec_complement: string;
}

/**
 * DTO pour la création du logement
 */
export interface CreateLogementDto {
  caracteristique_generale: CreateCaracteristiqueGeneraleDto;
  meteo: CreateMeteoDto;
  enveloppe: CreateEnveloppeDto;
  installation_chauffage_collection?: CreateInstallationChauffageCollectionDto;
  installation_ecs_collection?: CreateInstallationECSCollectionDto;
  ventilation_collection?: CreateVentilationCollectionDto;
  climatisation_collection?: CreateClimatisationCollectionDto;
  sortie?: CreateSortieDto;
}

/**
 * DTO pour la création des caractéristiques générales
 */
export interface CreateCaracteristiqueGeneraleDto {
  annee_construction?: number;
  enum_periode_construction_id: number;
  enum_methode_application_dpe_log_id: number;
  enum_calcul_echantillonnage_id?: number;
  surface_habitable_logement?: number;
  nombre_niveau_immeuble?: number;
  nombre_niveau_logement?: number;
  hsp: number;
  surface_habitable_immeuble?: number;
  surface_tertiaire_immeuble?: number;
  nombre_appartement?: number;
  appartement_non_visite?: number;
}

/**
 * DTO pour la création des données météo
 */
export interface CreateMeteoDto {
  enum_zone_climatique_id: number;
  altitude?: number;
  enum_classe_altitude_id: number;
  batiment_materiaux_anciens: number;
}

/**
 * DTO pour la création de l'enveloppe
 */
export interface CreateEnveloppeDto {
  inertie: CreateInertieDto;
  mur_collection: CreateMurCollectionDto;
  baie_vitree_collection?: CreateBaieVitreeCollectionDto;
  plancher_bas_collection?: CreatePlancherBasCollectionDto;
  plancher_haut_collection?: CreatePlancherHautCollectionDto;
  porte_collection?: CreatePorteCollectionDto;
  ets_collection?: CreateETSCollectionDto;
  pont_thermique_collection?: CreatePontThermiqueCollectionDto;
}

/**
 * DTO pour la création de l'inertie
 */
export interface CreateInertieDto {
  inertie_plancher_bas_lourd: number;
  inertie_plancher_haut_lourd: number;
  inertie_paroi_verticale_lourd: number;
  enum_classe_inertie_id: number;
}

/**
 * DTO pour la création des collections de murs
 */
export interface CreateMurCollectionDto {
  mur: CreateMurDto | CreateMurDto[];
}

/**
 * DTO pour la création d'un mur
 */
export interface CreateMurDto {
  donnee_entree: CreateMurDonneeEntreeDto;
  donnee_intermediaire: CreateMurDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un mur
 */
export interface CreateMurDonneeEntreeDto {
  reference: string;
  description?: string;
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: number;
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: number;
  enum_type_adjacence_id: number;
  enum_orientation_id: number;
  surface_paroi_totale?: number;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  umur0_saisi?: number;
  umur_saisi?: number;
  tv_umur0_id?: number;
  tv_umur_id?: number;
  epaisseur_structure?: number;
  enum_materiaux_structure_mur_id?: number;
  enum_methode_saisie_u0_id?: number;
  enum_type_doublage_id?: number;
  enduit_isolant_paroi_ancienne?: number;
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
  epaisseur_isolation?: number;
  resistance_isolation?: number;
}

/**
 * DTO pour la création des données intermédiaires d'un mur
 */
export interface CreateMurDonneeIntermediaireDto {
  b: number;
  umur: number;
  umur0?: number;
}

/**
 * DTO pour la création des collections de baies vitrées
 */
export interface CreateBaieVitreeCollectionDto {
  baie_vitree: CreateBaieVitreeDto | CreateBaieVitreeDto[];
}

/**
 * DTO pour la création d'une baie vitrée
 */
export interface CreateBaieVitreeDto {
  donnee_entree: CreateBaieVitreeDonneeEntreeDto;
  donnee_intermediaire?: CreateBaieVitreeDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'une baie vitrée
 */
export interface CreateBaieVitreeDonneeEntreeDto {
  reference: string;
  description?: string;
  reference_paroi?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: number;
  enum_orientation_id: number;
  surface_totale_baie: number;
  nb_baie?: number;
  tv_ug_id?: number;
  enum_type_vitrage_id?: number;
  enum_inclinaison_vitrage_id?: number;
  enum_methode_saisie_perf_vitrage_id?: number;
  tv_uw_id?: number;
  enum_type_materiaux_menuiserie_id?: number;
  enum_type_baie_id?: number;
  double_fenetre?: number;
  tv_deltar_id?: number;
  tv_ujn_id?: number;
  enum_type_fermeture_id?: number;
  presence_protection_solaire_hors_fermeture?: number;
  presence_retour_isolation?: number;
  presence_joint?: number;
  largeur_dormant?: number;
  tv_sw_id?: number;
  enum_type_pose_id?: number;
  tv_coef_masque_proche_id?: number;
  masque_lointain_non_homogene_collection?: {
    masque_lointain_non_homogene: { tv_coef_masque_lointain_non_homogene_id: number } | { tv_coef_masque_lointain_non_homogene_id: number }[];
  };
}

/**
 * DTO pour la création des données intermédiaires d'une baie vitrée
 */
export interface CreateBaieVitreeDonneeIntermediaireDto {
  b: number;
  ug?: number;
  uw?: number;
  ujn?: number;
  u_menuiserie?: number;
  sw?: number;
  fe1?: number;
  fe2?: number;
}

/**
 * DTO pour la création des collections de planchers bas
 */
export interface CreatePlancherBasCollectionDto {
  plancher_bas: CreatePlancherBasDto | CreatePlancherBasDto[];
}

/**
 * DTO pour la création d'un plancher bas
 */
export interface CreatePlancherBasDto {
  donnee_entree: CreatePlancherBasDonneeEntreeDto;
  donnee_intermediaire: CreatePlancherBasDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un plancher bas
 */
export interface CreatePlancherBasDonneeEntreeDto {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: number;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  tv_upb0_id?: number;
  tv_upb_id?: number;
  enum_type_plancher_bas_id?: number;
  enum_methode_saisie_u0_id?: number;
  enum_type_isolation_id: number;
  enum_periode_isolation_id?: number;
  enum_methode_saisie_u_id: number;
  calcul_ue?: number;
  perimetre_ue?: number;
  surface_ue?: number;
  ue?: number;
}

/**
 * DTO pour la création des données intermédiaires d'un plancher bas
 */
export interface CreatePlancherBasDonneeIntermediaireDto {
  b: number;
  upb: number;
  upb_final: number;
  upb0?: number;
}

/**
 * DTO pour la création des collections de planchers hauts
 */
export interface CreatePlancherHautCollectionDto {
  plancher_haut: CreatePlancherHautDto | CreatePlancherHautDto[];
}

/**
 * DTO pour la création d'un plancher haut
 */
export interface CreatePlancherHautDto {
  donnee_entree: CreatePlancherHautDonneeEntreeDto;
  donnee_intermediaire: CreatePlancherHautDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un plancher haut
 */
export interface CreatePlancherHautDonneeEntreeDto {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: number;
  enum_type_adjacence_id: number;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  tv_uph0_id?: number;
  tv_uph_id?: number;
  enum_type_plancher_haut_id?: number;
  enum_methode_saisie_u0_id?: number;
  enum_type_isolation_id: number;
  enum_periode_isolation_id?: number;
  enum_methode_saisie_u_id: number;
}

/**
 * DTO pour la création des données intermédiaires d'un plancher haut
 */
export interface CreatePlancherHautDonneeIntermediaireDto {
  b: number;
  uph: number;
  uph0?: number;
}

/**
 * DTO pour la création des collections de portes
 */
export interface CreatePorteCollectionDto {
  porte: CreatePorteDto | CreatePorteDto[];
}

/**
 * DTO pour la création d'une porte
 */
export interface CreatePorteDto {
  donnee_entree: CreatePorteDonneeEntreeDto;
  donnee_intermediaire: CreatePorteDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'une porte
 */
export interface CreatePorteDonneeEntreeDto {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: number;
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: number;
  surface_porte: number;
  tv_uporte_id?: number;
  nb_porte?: number;
  largeur_dormant?: number;
  presence_retour_isolation?: number;
  presence_joint?: number;
  enum_methode_saisie_uporte_id?: number;
  enum_type_porte_id?: number;
  enum_type_pose_id?: number;
}

/**
 * DTO pour la création des données intermédiaires d'une porte
 */
export interface CreatePorteDonneeIntermediaireDto {
  b: number;
  uporte: number;
}

/**
 * DTO pour la création des collections d'ETS
 */
export interface CreateETSCollectionDto {
  ets: CreateETSDto | CreateETSDto[];
}

/**
 * DTO pour la création d'un ETS
 */
export interface CreateETSDto {
  donnee_entree: CreateETSDonneeEntreeDto;
  donnee_intermediaire: CreateETSDonneeIntermediaireDto;
  baie_ets_collection?: CreateBaieETSCollectionDto;
}

/**
 * DTO pour la création des données d'entrée d'un ETS
 */
export interface CreateETSDonneeEntreeDto {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_cfg_isolation_lnc_id?: number;
  tv_coef_transparence_ets_id?: number;
}

/**
 * DTO pour la création des données intermédiaires d'un ETS
 */
export interface CreateETSDonneeIntermediaireDto {
  coef_transparence_ets: number;
  bver: number;
}

/**
 * DTO pour la création des collections de baies ETS
 */
export interface CreateBaieETSCollectionDto {
  baie_ets: CreateBaieETSDto | CreateBaieETSDto[];
}

/**
 * DTO pour la création d'une baie ETS
 */
export interface CreateBaieETSDto {
  donnee_entree: CreateBaieETSDonneeEntreeDto;
}

/**
 * DTO pour la création des données d'entrée d'une baie ETS
 */
export interface CreateBaieETSDonneeEntreeDto {
  reference: string;
  enum_orientation_id: number;
  enum_inclinaison_vitrage_id?: number;
  surface_totale_baie: number;
  nb_baie?: number;
}

/**
 * DTO pour la création des collections de ponts thermiques
 */
export interface CreatePontThermiqueCollectionDto {
  pont_thermique: CreatePontThermiqueDto | CreatePontThermiqueDto[];
}

/**
 * DTO pour la création d'un pont thermique
 */
export interface CreatePontThermiqueDto {
  donnee_entree: CreatePontThermiqueDonneeEntreeDto;
  donnee_intermediaire: CreatePontThermiqueDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un pont thermique
 */
export interface CreatePontThermiqueDonneeEntreeDto {
  reference: string;
  description?: string;
  tv_pont_thermique_id?: number;
  enum_methode_saisie_pont_thermique_id?: number;
  pourcentage_valeur_pont_thermique?: number;
  l: number;
  enum_type_liaison_id: number;
}

/**
 * DTO pour la création des données intermédiaires d'un pont thermique
 */
export interface CreatePontThermiqueDonneeIntermediaireDto {
  k: number;
}

/**
 * DTO pour la création des collections d'installation de chauffage
 */
export interface CreateInstallationChauffageCollectionDto {
  installation_chauffage: CreateInstallationChauffageDto | CreateInstallationChauffageDto[];
}

/**
 * DTO pour la création d'une installation de chauffage
 */
export interface CreateInstallationChauffageDto {
  donnee_entree: CreateInstallationChauffageDonneeEntreeDto;
  donnee_intermediaire: CreateInstallationChauffageDonneeIntermediaireDto;
  generateur_chauffage_collection?: CreateGenerateurChauffageCollectionDto;
  emetteur_chauffage_collection?: CreateEmetteurChauffageCollectionDto;
}

/**
 * DTO pour la création des données d'entrée d'une installation de chauffage
 */
export interface CreateInstallationChauffageDonneeEntreeDto {
  reference: string;
  description?: string;
  surface_chauffee: number;
  nombre_logement_echantillon?: number;
  rdim: number;
  nombre_niveau_installation_ch: number;
  enum_cfg_installation_ch_id: number;
  ratio_virtualisation?: number;
  coef_ifc?: number;
  cle_repartition_ch?: number;
  enum_type_installation_id: number;
  enum_methode_calcul_conso_id: number;
  enum_methode_saisie_fact_couv_sol_id?: number;
  tv_facteur_couverture_solaire_id?: number;
  fch_saisi?: number;
}

/**
 * DTO pour la création des données intermédiaires d'une installation de chauffage
 */
export interface CreateInstallationChauffageDonneeIntermediaireDto {
  besoin_ch: number;
  besoin_ch_depensier: number;
  production_ch_solaire?: number;
  fch?: number;
  conso_ch: number;
  conso_ch_depensier: number;
}

/**
 * DTO pour la création des collections de générateurs de chauffage
 */
export interface CreateGenerateurChauffageCollectionDto {
  generateur_chauffage: CreateGenerateurChauffageDto | CreateGenerateurChauffageDto[];
}

/**
 * DTO pour la création d'un générateur de chauffage
 */
export interface CreateGenerateurChauffageDto {
  donnee_entree: CreateGenerateurChauffageDonneeEntreeDto;
  donnee_intermediaire: CreateGenerateurChauffageDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un générateur de chauffage
 */
export interface CreateGenerateurChauffageDonneeEntreeDto {
  reference: string;
  description?: string;
  enum_lien_generateur_emetteur_id?: number;
  enum_type_generateur_ch_id: number;
  ref_produit_generateur_ch?: string;
  enum_usage_generateur_id: number;
  enum_type_energie_id: number;
  position_volume_chauffe: number;
  enum_methode_saisie_carac_sys_id: number;
  tv_rendement_generation_id?: number;
  tv_scop_id?: number;
  identifiant_reseau_chaleur?: string;
  date_arrete_reseau_chaleur?: string;
  tv_reseau_chaleur_id?: number;
}

/**
 * DTO pour la création des données intermédiaires d'un générateur de chauffage
 */
export interface CreateGenerateurChauffageDonneeIntermediaireDto {
  rendement_generation?: number;
  scop?: number;
  conso_ch: number;
  conso_ch_depensier: number;
}

/**
 * DTO pour la création des collections d'émetteurs de chauffage
 */
export interface CreateEmetteurChauffageCollectionDto {
  emetteur_chauffage: CreateEmetteurChauffageDto | CreateEmetteurChauffageDto[];
}

/**
 * DTO pour la création d'un émetteur de chauffage
 */
export interface CreateEmetteurChauffageDto {
  donnee_entree: CreateEmetteurChauffageDonneeEntreeDto;
  donnee_intermediaire: CreateEmetteurChauffageDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un émetteur de chauffage
 */
export interface CreateEmetteurChauffageDonneeEntreeDto {
  reference: string;
  description?: string;
  surface_chauffee: number;
  enum_lien_generateur_emetteur_id?: number;
  tv_intermittence_id: number;
  tv_rendement_emission_id: number;
  tv_rendement_distribution_ch_id: number;
  tv_rendement_regulation_id: number;
  enum_type_emission_distribution_id: number;
  enum_equipement_intermittence_id: number;
  enum_type_regulation_id: number;
  enum_type_chauffage_id: number;
  enum_temp_distribution_ch_id: number;
  enum_periode_installation_emetteur_id: number;
}

/**
 * DTO pour la création des données intermédiaires d'un émetteur de chauffage
 */
export interface CreateEmetteurChauffageDonneeIntermediaireDto {
  rendement_emission: number;
  rendement_distribution: number;
  rendement_regulation: number;
  i0: number;
}

/**
 * DTO pour la création des collections d'installation ECS
 */
export interface CreateInstallationECSCollectionDto {
  installation_ecs: CreateInstallationECSDto | CreateInstallationECSDto[];
}

/**
 * DTO pour la création d'une installation ECS
 */
export interface CreateInstallationECSDto {
  donnee_entree: CreateInstallationECSDonneeEntreeDto;
  donnee_intermediaire: CreateInstallationECSDonneeIntermediaireDto;
  generateur_ecs_collection?: CreateGenerateurECSCollectionDto;
}

/**
 * DTO pour la création des données d'entrée d'une installation ECS
 */
export interface CreateInstallationECSDonneeEntreeDto {
  reference: string;
  description?: string;
  enum_cfg_installation_ecs_id: number;
  enum_type_installation_id: number;
  enum_methode_calcul_conso_id: number;
  ratio_virtualisation?: number;
  cle_repartition_ecs?: number;
  surface_habitable: number;
  nombre_logement: number;
  rdim: number;
  nombre_niveau_installation_ecs: number;
  fecs_saisi?: number;
  tv_facteur_couverture_solaire_id?: number;
  enum_methode_saisie_fact_couv_sol_id?: number;
  enum_type_installation_solaire_id?: number;
  tv_rendement_distribution_ecs_id?: number;
  enum_bouclage_reseau_ecs_id?: number;
  reseau_distribution_isole?: number;
}

/**
 * DTO pour la création des données intermédiaires d'une installation ECS
 */
export interface CreateInstallationECSDonneeIntermediaireDto {
  rendement_distribution: number;
  besoin_ecs: number;
  besoin_ecs_depensier: number;
  fecs?: number;
  production_ecs_solaire?: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
}

/**
 * DTO pour la création des collections de générateurs ECS
 */
export interface CreateGenerateurECSCollectionDto {
  generateur_ecs: CreateGenerateurECSDto | CreateGenerateurECSDto[];
}

/**
 * DTO pour la création d'un générateur ECS
 */
export interface CreateGenerateurECSDto {
  donnee_entree: CreateGenerateurECSDonneeEntreeDto;
  donnee_intermediaire: CreateGenerateurECSDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'un générateur ECS
 */
export interface CreateGenerateurECSDonneeEntreeDto {
  reference: string;
  description?: string;
  reference_generateur_mixte?: string;
  enum_type_generateur_ecs_id: number;
  ref_produit_generateur_ecs?: string;
  enum_usage_generateur_id: number;
  enum_type_energie_id: number;
  tv_generateur_combustion_id?: number;
  enum_methode_saisie_carac_sys_id: number;
  tv_pertes_stockage_id?: number;
  tv_scop_id?: number;
  enum_periode_installation_ecs_thermo_id?: number;
  identifiant_reseau_chaleur?: string;
  date_arrete_reseau_chaleur?: string;
  tv_reseau_chaleur_id?: number;
  enum_type_stockage_ecs_id?: number;
  position_volume_chauffe: number;
  position_volume_chauffe_stockage?: number;
  volume_stockage?: number;
  presence_ventouse?: number;
}

/**
 * DTO pour la création des données intermédiaires d'un générateur ECS
 */
export interface CreateGenerateurECSDonneeIntermediaireDto {
  pn?: number;
  qp0?: number;
  pveilleuse?: number;
  rpn?: number;
  cop?: number;
  ratio_besoin_ecs: number;
  rendement_generation?: number;
  rendement_generation_stockage?: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
  rendement_stockage?: number;
}

/**
 * DTO pour la création des collections de ventilation
 */
export interface CreateVentilationCollectionDto {
  ventilation: CreateVentilationDto | CreateVentilationDto[];
}

/**
 * DTO pour la création d'une ventilation
 */
export interface CreateVentilationDto {
  donnee_entree: CreateVentilationDonneeEntreeDto;
  donnee_intermediaire: CreateVentilationDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'une ventilation
 */
export interface CreateVentilationDonneeEntreeDto {
  reference: string;
  description?: string;
  plusieurs_facade_exposee: number;
  surface_ventile: number;
  tv_q4pa_conv_id?: number;
  q4pa_conv_saisi?: number;
  enum_methode_saisie_q4pa_conv_id: number;
  tv_debits_ventilation_id: number;
  enum_type_ventilation_id: number;
  ventilation_post_2012: number;
  ref_produit_ventilation?: string;
  cle_repartition_ventilation?: number;
}

/**
 * DTO pour la création des données intermédiaires d'une ventilation
 */
export interface CreateVentilationDonneeIntermediaireDto {
  q4pa_conv: number;
  conso_auxiliaire_ventilation: number;
  hperm: number;
  hvent: number;
  pvent_moy?: number;
}

/**
 * DTO pour la création des collections de climatisation
 */
export interface CreateClimatisationCollectionDto {
  climatisation: CreateClimatisationDto | CreateClimatisationDto[];
}

/**
 * DTO pour la création d'une climatisation
 */
export interface CreateClimatisationDto {
  donnee_entree: CreateClimatisationDonneeEntreeDto;
  donnee_intermediaire: CreateClimatisationDonneeIntermediaireDto;
}

/**
 * DTO pour la création des données d'entrée d'une climatisation
 */
export interface CreateClimatisationDonneeEntreeDto {
  reference: string;
  description?: string;
  surface_clim: number;
  ref_produit_fr?: string;
  tv_seer_id?: number;
  nombre_logement_echantillon?: number;
  enum_methode_calcul_conso_id: number;
  enum_periode_installation_fr_id?: number;
  enum_type_energie_id: number;
  enum_type_generateur_fr_id?: number;
  enum_methode_saisie_carac_sys_id: number;
}

/**
 * DTO pour la création des données intermédiaires d'une climatisation
 */
export interface CreateClimatisationDonneeIntermediaireDto {
  eer?: number;
  besoin_fr: number;
  conso_fr: number;
  conso_fr_depensier: number;
}

/**
 * DTO pour la création de la sortie
 */
export interface CreateSortieDto {
  deperdition: CreateSortieDeperditionDto;
  apport_et_besoin: CreateSortieApportEtBesoinDto;
  ef_conso: CreateSortieEfConsoDto;
  ep_conso: CreateSortieEpConsoDto;
  emission_ges: CreateSortieEmissionGesDto;
  cout: CreateSortieCoutDto;
  production_electricite?: CreateSortieProductionElectriciteDto;
  sortie_par_energie_collection?: CreateSortieParEnergieCollectionDto;
  confort_ete?: CreateSortieConfortEteDto;
  qualite_isolation?: CreateSortieQualiteIsolationDto;
}

/**
 * DTO pour la création des données de déperdition
 */
export interface CreateSortieDeperditionDto {
  hvent: number;
  hperm: number;
  deperdition_renouvellement_air: number;
  deperdition_mur: number;
  deperdition_plancher_bas: number;
  deperdition_plancher_haut: number;
  deperdition_baie_vitree: number;
  deperdition_porte: number;
  deperdition_pont_thermique: number;
  deperdition_enveloppe: number;
}

/**
 * DTO pour la création des données d'apport et besoin
 */
export interface CreateSortieApportEtBesoinDto {
  surface_sud_equivalente: number;
  apport_solaire_fr: number;
  apport_interne_fr: number;
  apport_solaire_ch: number;
  apport_interne_ch: number;
  fraction_apport_gratuit_ch: number;
  fraction_apport_gratuit_depensier_ch: number;
  pertes_distribution_ecs_recup: number;
  pertes_distribution_ecs_recup_depensier: number;
  pertes_stockage_ecs_recup: number;
  pertes_generateur_ch_recup: number;
  pertes_generateur_ch_recup_depensier: number;
  nadeq: number;
  v40_ecs_journalier: number;
  v40_ecs_journalier_depensier: number;
  besoin_ch: number;
  besoin_ch_depensier: number;
  besoin_ecs: number;
  besoin_ecs_depensier: number;
  besoin_fr: number;
  besoin_fr_depensier: number;
}

/**
 * DTO pour la création des données de consommation finale
 */
export interface CreateSortieEfConsoDto {
  conso_ch: number;
  conso_ch_depensier: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
  conso_eclairage: number;
  conso_auxiliaire_generation_ch: number;
  conso_auxiliaire_generation_ch_depensier: number;
  conso_auxiliaire_distribution_ch: number;
  conso_auxiliaire_generation_ecs: number;
  conso_auxiliaire_generation_ecs_depensier: number;
  conso_auxiliaire_distribution_ecs: number;
  conso_auxiliaire_distribution_fr?: number;
  conso_auxiliaire_ventilation: number;
  conso_totale_auxiliaire: number;
  conso_fr: number;
  conso_fr_depensier: number;
  conso_5_usages: number;
  conso_5_usages_m2: number;
}

/**
 * DTO pour la création des données de consommation primaire
 */
export interface CreateSortieEpConsoDto {
  ep_conso_ch: number;
  ep_conso_ch_depensier: number;
  ep_conso_ecs: number;
  ep_conso_ecs_depensier: number;
  ep_conso_eclairage: number;
  ep_conso_auxiliaire_generation_ch: number;
  ep_conso_auxiliaire_generation_ch_depensier: number;
  ep_conso_auxiliaire_distribution_ch: number;
  ep_conso_auxiliaire_generation_ecs: number;
  ep_conso_auxiliaire_generation_ecs_depensier: number;
  ep_conso_auxiliaire_distribution_ecs: number;
  ep_conso_auxiliaire_distribution_fr?: number;
  ep_conso_auxiliaire_ventilation: number;
  ep_conso_totale_auxiliaire: number;
  ep_conso_fr: number;
  ep_conso_fr_depensier: number;
  ep_conso_5_usages: number;
  ep_conso_5_usages_m2: number;
  classe_bilan_dpe: string;
}

/**
 * DTO pour la création des données d'émission GES
 */
export interface CreateSortieEmissionGesDto {
  emission_ges_ch: number;
  emission_ges_ch_depensier: number;
  emission_ges_ecs: number;
  emission_ges_ecs_depensier: number;
  emission_ges_eclairage: number;
  emission_ges_auxiliaire_generation_ch: number;
  emission_ges_auxiliaire_generation_ch_depensier: number;
  emission_ges_auxiliaire_distribution_ch: number;
  emission_ges_auxiliaire_generation_ecs: number;
  emission_ges_auxiliaire_generation_ecs_depensier: number;
  emission_ges_auxiliaire_distribution_ecs: number;
  emission_ges_auxiliaire_distribution_fr?: number;
  emission_ges_auxiliaire_ventilation: number;
  emission_ges_totale_auxiliaire: number;
  emission_ges_fr: number;
  emission_ges_fr_depensier: number;
  emission_ges_5_usages: number;
  emission_ges_5_usages_m2: number;
  classe_emission_ges: string;
}

/**
 * DTO pour la création des données de coût
 */
export interface CreateSortieCoutDto {
  cout_ch: number;
  cout_ch_depensier: number;
  cout_ecs: number;
  cout_ecs_depensier: number;
  cout_eclairage: number;
  cout_auxiliaire_generation_ch: number;
  cout_auxiliaire_generation_ch_depensier: number;
  cout_auxiliaire_distribution_ch: number;
  cout_auxiliaire_generation_ecs: number;
  cout_auxiliaire_generation_ecs_depensier: number;
  cout_auxiliaire_distribution_ecs: number;
  cout_auxiliaire_distribution_fr?: number;
  cout_auxiliaire_ventilation: number;
  cout_total_auxiliaire: number;
  cout_fr: number;
  cout_fr_depensier: number;
  cout_5_usages: number;
}

/**
 * DTO pour la création des données de production électrique
 */
export interface CreateSortieProductionElectriciteDto {
  production_pv: number;
  conso_elec_ac: number;
  conso_elec_ac_ch: number;
  conso_elec_ac_ecs: number;
  conso_elec_ac_fr: number;
  conso_elec_ac_eclairage: number;
  conso_elec_ac_auxiliaire: number;
  conso_elec_ac_autre_usage: number;
}

/**
 * DTO pour la création des collections de sortie par énergie
 */
export interface CreateSortieParEnergieCollectionDto {
  sortie_par_energie: CreateSortieParEnergieDto | CreateSortieParEnergieDto[];
}

/**
 * DTO pour la création des données de sortie par énergie
 */
export interface CreateSortieParEnergieDto {
  conso_ch: number;
  conso_ecs: number;
  conso_5_usages: number;
  enum_type_energie_id: number;
  emission_ges_ch: number;
  emission_ges_ecs: number;
  emission_ges_5_usages: number;
  cout_ch: number;
  cout_ecs: number;
  cout_5_usages: number;
}

/**
 * DTO pour la création des données de confort été
 */
export interface CreateSortieConfortEteDto {
  isolation_toiture: number;
  protection_solaire_exterieure: number;
  aspect_traversant: number;
  brasseur_air: number;
  inertie_lourde: number;
  enum_indicateur_confort_ete_id: number;
}

/**
 * DTO pour la création des données de qualité d'isolation
 */
export interface CreateSortieQualiteIsolationDto {
  ubat: number;
  qualite_isol_enveloppe: number;
  qualite_isol_mur: number;
  qualite_isol_plancher_haut_toit_terrasse: number;
  qualite_isol_plancher_bas: number;
  qualite_isol_menuiserie: number;
}

// ============================================================================
// DTOs POUR LES MISES À JOUR
// ============================================================================

/**
 * DTO pour la mise à jour d'un DPE
 */
export type UpdateDPEDto = Partial<CreateDPEDto>;

/**
 * DTO pour la mise à jour partielle d'un DPE (PATCH)
 */
export type PatchDPEDto = Partial<CreateDPEDto>;

// ============================================================================
// TYPES DE RÉPONSE API
// ============================================================================

/**
 * Interface de base pour les réponses API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * Interface pour les erreurs API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  field?: string;
}

/**
 * Interface pour les métadonnées de réponse API
 */
export interface ApiMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Type pour les réponses de liste DPE
 */
export type DPEListResponse = ApiResponse<PaginatedResponse<DPEDocument>>;

/**
 * Type pour les réponses de détail DPE
 */
export type DPEDetailResponse = ApiResponse<DPEDocument>;

/**
 * Type pour les réponses de création DPE
 */
export type DPECreateResponse = ApiResponse<{
  dpe: DPEDocument;
  validation: ValidationResult;
}>;

/**
 * Type pour les réponses de mise à jour DPE
 */
export type DPEUpdateResponse = ApiResponse<{
  dpe: DPEDocument;
  validation: ValidationResult;
}>;

/**
 * Type pour les réponses de suppression DPE
 */
export type DPEDeleteResponse = ApiResponse<{
  deleted: boolean;
  id: string;
}>;

/**
 * Type pour les réponses de validation DPE
 */
export type DPEValidationResponse = ApiResponse<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}>;

/**
 * Type pour les réponses de génération XML
 */
export type DPEXMLResponse = ApiResponse<{
  xml: string;
  fileName: string;
  fileSize: number;
}>;

/**
 * Type pour les réponses d'authentification
 */
export type AuthResponse = ApiResponse<{
  user: AuthUser;
  session: AuthSession;
}>;

/**
 * Type pour les réponses d'erreur d'authentification
 */
export type AuthErrorResponse = ApiResponse<{
  error: AuthError;
}>;

// ============================================================================
// TYPES POUR LES WEBSOCKETS / REALTIME
// ============================================================================

/**
 * Type pour les événements de mise à jour DPE en temps réel
 */
export interface DPERealtimeEvent {
  type: "created" | "updated" | "deleted" | "validated" | "error";
  dpeId: string;
  timestamp: string;
  userId: string;
  data?: Partial<DPEDocument>;
  error?: string;
}

/**
 * Type pour les payloads de souscription realtime
 */
export interface DPERealtimeSubscribePayload {
  dpeId?: string;
  userId?: string;
  events: DPERealtimeEvent["type"][];
}

// ============================================================================
// TYPES POUR L'EXPORT/IMPORT
// ============================================================================

/**
 * Options d'export DPE
 */
export interface DPEExportOptions {
  format: "xml" | "json" | "pdf";
  version: "2.6";
  includePhotos?: boolean;
  includeSignatures?: boolean;
  encoding?: "UTF-8";
}

/**
 * Résultat d'export DPE
 */
export interface DPEExportResult {
  success: boolean;
  content?: string | Buffer;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Options d'import DPE
 */
export interface DPEImportOptions {
  format: "xml" | "json";
  validateSchema?: boolean;
  strictMode?: boolean;
}

/**
 * Résultat d'import DPE
 */
export interface DPEImportResult {
  success: boolean;
  dpe?: DPEDocument;
  validation?: ValidationResult;
  warnings?: string[];
  error?: string;
}

// ============================================================================
// TYPES POUR LES STATISTIQUES ET RAPPORTS
// ============================================================================

/**
 * Statistiques DPE pour un utilisateur ou une période
 */
export interface DPEStatistics {
  total: number;
  byStatus: Record<string, number>;
  byClass: Record<string, number>;
  byPeriod: Record<string, number>;
  averageSurface: number;
  averageConso: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Filtres pour les statistiques DPE
 */
export interface DPEStatisticsFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  zoneClimatique?: number;
  typeBatiment?: number;
}

// ============================================================================
// TYPES UTILITAIRES POUR LES FORMULAIRES
// ============================================================================

/**
 * Type pour la progression d'un formulaire DPE
 */
export interface DPEFormProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  stepProgress: Record<number, number>;
  canProceed: boolean;
  canGoBack: boolean;
  isComplete: boolean;
}

/**
 * Type pour les étapes du wizard DPE
 */
export interface DPEWizardStep {
  id: number;
  name: string;
  label: string;
  description: string;
  required: boolean;
  fields: string[];
  dependencies?: number[];
}

/**
 * Configuration du wizard DPE
 */
export const DPE_WIZARD_STEPS: DPEWizardStep[] = [
  { id: 1, name: "administratif", label: "Administratif", description: "Informations administratives du DPE", required: true, fields: ["date_visite_diagnostiqueur", "date_etablissement_dpe", "nom_proprietaire", "diagnostiqueur", "geolocalisation"] },
  { id: 2, name: "caracteristiques", label: "Caractéristiques", description: "Caractéristiques générales du logement", required: true, fields: ["annee_construction", "enum_periode_construction_id", "surface_habitable_logement", "hsp"], dependencies: [1] },
  { id: 3, name: "meteo", label: "Météo", description: "Données météorologiques", required: true, fields: ["enum_zone_climatique_id", "enum_classe_altitude_id"], dependencies: [2] },
  { id: 4, name: "enveloppe", label: "Enveloppe", description: "Description de l'enveloppe thermique", required: true, fields: ["mur_collection", "plancher_bas_collection", "plancher_haut_collection"], dependencies: [3] },
  { id: 5, name: "ventilation", label: "Ventilation", description: "Système de ventilation", required: true, fields: ["ventilation_collection"], dependencies: [4] },
  { id: 6, name: "chauffage", label: "Chauffage", description: "Installation de chauffage", required: true, fields: ["installation_chauffage_collection"], dependencies: [5] },
  { id: 7, name: "ecs", label: "ECS", description: "Eau chaude sanitaire", required: true, fields: ["installation_ecs_collection"], dependencies: [6] },
  { id: 8, name: "climatisation", label: "Climatisation", description: "Climatisation (optionnel)", required: false, fields: ["climatisation_collection"], dependencies: [7] },
  { id: 9, name: "validation", label: "Validation", description: "Validation et contrôle de cohérence", required: true, fields: ["sortie"], dependencies: [1, 2, 3, 4, 5, 6, 7] },
  { id: 10, name: "export", label: "Export", description: "Export XML ADEME", required: true, fields: [], dependencies: [9] },
];
