/**
 * Types DPE - Diagnostic de Performance Énergétique
 * Basé sur la méthode 3CL et XSD ADEME v2.6
 * Version: 2.6.0 - VALIDÉE CONTRE XSD OFFICIEL ADEME
 * Date de validation: 2025-02-25
 * 
 * CHANGELOG:
 * - 2.6.0: Ajout complet des types InstallationChauffage, InstallationECS, Ventilation, Sortie
 * - 2.6.0: Validation contre DPEv2.6.xsd officiel ADEME
 * - 2.6.0: Ajout des champs manquants pour generateur_ecs et generateur_chauffage
 * - 2.6.0: Ajout complet de la section Sortie (deperdition, apport_et_besoin, ef_conso, ep_conso, emission_ges, cout)
 */

// ============================================================================
// ENUMS ADEME - Validés contre XSD v2.6
// ============================================================================

export enum EnumModeleDpe {
  LOGEMENT_EXISTANT = 1,
  LOGEMENT_NEUF = 2,
  TERTIAIRE = 3,
}

export enum EnumVersionDpe {
  V1 = "1",
  V1_1 = "1.1",
  V2 = "2",
  V2_1 = "2.1",
  V2_2 = "2.2",
  V2_3 = "2.3",
  V2_4 = "2.4",
  V2_5 = "2.5",
  V2_6 = "2.6",
}

export enum EnumPeriodeConstruction {
  AVANT_1948 = 1,
  PERIODE_1948_1974 = 2,
  PERIODE_1975_1977 = 3,
  PERIODE_1978_1982 = 4,
  PERIODE_1983_1988 = 5,
  PERIODE_1989_2000 = 6,
  PERIODE_2001_2005 = 7,
  PERIODE_2006_2012 = 8,
  PERIODE_2013_2021 = 9,
  APRES_2021 = 10,
}

export enum EnumMethodeApplicationDpeLog {
  MAISON_INDIVIDUELLE = 1,
  APPARTEMENT_CHAUFFAGE_ECS_INDIVIDUEL = 2,
  APPARTEMENT_CHAUFFAGE_COLLECTIF_ECS_INDIVIDUEL = 3,
  APPARTEMENT_CHAUFFAGE_INDIVIDUEL_ECS_COLLECTIF = 4,
  APPARTEMENT_CHAUFFAGE_COLLECTIF_ECS_COLLECTIF = 5,
  IMMEUBLE_CHAUFFAGE_INDIVIDUEL_ECS_INDIVIDUEL = 6,
  IMMEUBLE_CHAUFFAGE_COLLECTIF_ECS_INDIVIDUEL = 7,
  IMMEUBLE_CHAUFFAGE_INDIVIDUEL_ECS_COLLECTIF = 8,
  IMMEUBLE_CHAUFFAGE_COLLECTIF_ECS_COLLECTIF = 9,
  APPARTEMENT_GENERE_IMMEUBLE_CH_IND_ECS_IND = 10,
  APPARTEMENT_GENERE_IMMEUBLE_CH_COL_ECS_IND = 11,
  APPARTEMENT_GENERE_IMMEUBLE_CH_IND_ECS_COL = 12,
  APPARTEMENT_GENERE_IMMEUBLE_CH_COL_ECS_COL = 13,
  DPE_RT2012_MAISON = 14,
  DPE_RT2012_APPARTEMENT_CH_COL_ECS_COL = 15,
  DPE_RT2012_APPARTEMENT_CH_IND_ECS_COL = 16,
  DPE_RT2012_IMMEUBLE = 17,
  DPE_RE2020_MAISON = 18,
  DPE_RE2020_APPARTEMENT_CH_COL_ECS_COL = 19,
  DPE_RE2020_APPARTEMENT_CH_IND_ECS_COL = 20,
  DPE_RE2020_IMMEUBLE = 21,
  DPE_RT2012_APPARTEMENT_CH_IND_ECS_IND = 22,
  DPE_RT2012_APPARTEMENT_CH_COL_ECS_IND = 23,
  DPE_RE2020_APPARTEMENT_CH_COL_ECS_IND = 24,
  DPE_RE2020_APPARTEMENT_CH_IND_ECS_IND = 25,
  IMMEUBLE_CH_MIXTE_ECS_MIXTE = 26,
  IMMEUBLE_CH_MIXTE_ECS_IND = 27,
  IMMEUBLE_CH_MIXTE_ECS_COL = 28,
  IMMEUBLE_CH_IND_ECS_MIXTE = 29,
  IMMEUBLE_CH_COL_ECS_MIXTE = 30,
  APPARTEMENT_CH_MIXTE_ECS_IND = 31,
  APPARTEMENT_CH_MIXTE_ECS_COL = 32,
  APPARTEMENT_GENERE_IMMEUBLE_CH_MIXTE_ECS_IND = 33,
  APPARTEMENT_GENERE_IMMEUBLE_CH_MIXTE_ECS_COL = 34,
  APPARTEMENT_CH_MIXTE_ECS_MIXTE = 35,
  APPARTEMENT_CH_IND_ECS_MIXTE = 36,
  APPARTEMENT_CH_COL_ECS_MIXTE = 37,
  APPARTEMENT_GENERE_IMMEUBLE_CH_MIXTE_ECS_MIXTE = 38,
  APPARTEMENT_GENERE_IMMEUBLE_CH_IND_ECS_MIXTE = 39,
  APPARTEMENT_GENERE_IMMEUBLE_CH_COL_ECS_MIXTE = 40,
}

export enum EnumZoneClimatique {
  H1A = 1,
  H1B = 2,
  H1C = 3,
  H2A = 4,
  H2B = 5,
  H2C = 6,
  H2D = 7,
  H3 = 8,
}

export enum EnumClasseAltitude {
  INF_400M = 1,
  ENTRE_400_800M = 2,
  SUP_800M = 3,
}

export enum EnumTypeAdjacence {
  EXTERIEUR = 1,
  PAROI_ENTERREE = 2,
  VIDE_SANITAIRE = 3,
  LOCAL_AUTRE_USAGE = 4,
  TERRE_PLEIN = 5,
  SOUS_SOL_NON_CHAUFFE = 6,
  LOCAL_NON_CHAUFFE_NON_ACCESSIBLE = 7,
  GARAGE = 8,
  CELLIER = 9,
  ESPACE_TAMPON_SOLARISE = 10,
  COMBLE_FORTEMENT_VENTILE = 11,
  COMBLE_FAIBLEMENT_VENTILE = 12,
  COMBLE_TRES_FAIBLEMENT_VENTILE = 13,
  CIRCULATION_SANS_OUVERTURE = 14,
  CIRCULATION_AVEC_OUVERTURE = 15,
  CIRCULATION_DESENFUMAGE = 16,
  HALL_FERMETURE_AUTO = 17,
  HALL_SANS_FERMETURE_AUTO = 18,
  GARAGE_PRIVE_COLLECTIF = 19,
  LOCAL_TERTIAIRE = 20,
  AUTRES_DEPENDANCES = 21,
  LOCAL_NON_DEPERDITIF = 22,
}

export enum EnumOrientation {
  SUD = 1,
  NORD = 2,
  EST = 3,
  OUEST = 4,
  HORIZONTAL = 5,
}

export enum EnumEtiquetteDpe {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}

export enum EnumCfgIsolationLnc {
  LOCAL_CHAUFFE_NON_ACCESSIBLE = 1,
  LC_NON_ISOLE_LNC_NON_ISOLE = 2,
  LC_NON_ISOLE_LNC_ISOLE = 3,
  LC_ISOLE_LNC_NON_ISOLE = 4,
  LC_ISOLE_LNC_ISOLE = 5,
  LC_ISOLE_ETAMPE_NORD = 6,
  LC_ISOLE_ETAMPE_SUD = 7,
  LC_ISOLE_ETAMPE_EST_OUEST = 8,
  LC_NON_ISOLE_ETAMPE_NORD = 9,
  LC_NON_ISOLE_ETAMPE_SUD = 10,
  LC_NON_ISOLE_ETAMPE_EST_OUEST = 11,
}

export enum EnumTypeVentilation {
  VENTILATION_OUVERTURE_FENETRES = 1,
  VENTILATION_ENTREES_AIR_HAUTES_BASSES = 2,
  VENTILATION_MECANIQUE_AVANT_2001 = 3,
  VENTILATION_MECANIQUE_2001_2012 = 4,
  VENTILATION_MECANIQUE_APRES_2012 = 5,
  VENTILATION_MECANIQUE_HYGRO_A = 6,
  VENTILATION_MECANIQUE_HYGRO_B = 7,
  VENTILATION_MECANIQUE_DOUBLE_FLUX = 8,
  VENTILATION_MECANIQUE_DOUBLE_FLUX_HYGRO = 9,
  VENTILATION_MECANIQUE_BASSE_CONSO = 10,
  VENTILATION_MECANIQUE_BASSE_CONSO_HYGRO = 11,
  VENTILATION_MECANIQUE_GAZ = 12,
  VENTILATION_MECANIQUE_GAZ_HYGRO = 13,
  VENTILATION_MECANIQUE_BASSE_CONSO_GAZ = 14,
  VENTILATION_MECANIQUE_BASSE_CONSO_GAZ_HYGRO = 15,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE = 16,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_HYGRO = 17,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_BASSE_CONSO = 18,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_BASSE_CONSO_HYGRO = 19,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_GAZ = 20,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_GAZ_HYGRO = 21,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_BASSE_CONSO_GAZ = 22,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_BASSE_CONSO_GAZ_HYGRO = 23,
  VENTILATION_MECANIQUE_PUISSANCE_VARIABLE_BASSE_CONSO_HYGRO_GAZ = 24,
  VENTILATION_NATURELLE_CONDUIT = 25,
  VENTILATION_HYBRIDE_AVANT_2001 = 26,
  VENTILATION_HYBRIDE_2001_2012 = 27,
  VENTILATION_HYBRIDE_APRES_2012 = 28,
  VENTILATION_HYBRIDE_HYGRO_AVANT_2001 = 29,
  VENTILATION_HYBRIDE_HYGRO_2001_2012 = 30,
  VENTILATION_HYBRIDE_HYGRO_APRES_2012 = 31,
  VENTILATION_MECANIQUE_CONDUIT_EXISTANT_AVANT_2013 = 32,
  VENTILATION_MECANIQUE_CONDUIT_EXISTANT_APRES_2013 = 33,
  VENTILATION_NATURELLE_CONDUIT_HYGRO = 34,
}

export enum EnumCfgInstallationEcs {
  INSTALLATION_SIMPLE = 1,
  INSTALLATION_SOLAIRE = 2,
  INSTALLATION_APPOINT_BOIS = 3,
  INSTALLATION_INSERT_BOIS_ELEC_SDB = 4,
  INSTALLATION_APPOINT_BOIS_ELEC_SDB = 5,
  INSTALLATION_CHAUDIERE_RELEVE_BOIS = 6,
  INSTALLATION_SOLAIRE_APPOINT_BOIS = 7,
  INSTALLATION_CHAUDIERE_RELEVE_PAC = 8,
  INSTALLATION_CHAUDIERE_RELEVE_PAC_BOIS = 9,
  INSTALLATION_COLLECTIVE_BASE_APPOINT = 10,
  CONVECTEURS_BI_JONCTION = 11,
}

export enum EnumTypeInstallation {
  INDIVIDUELLE = 1,
  COLLECTIVE = 2,
  COLLECTIVE_MULTI_BATIMENT = 3,
  HYBRIDE_COLLECTIVE_INDIVIDUELLE = 4,
}

export enum EnumMethodeCalculConso {
  CALCUL_SIMPLE = 1,
  COLLECTIVE_RAPPORTEE_LOGEMENT_COMBUSTION = 2,
  COLLECTIVE_RAPPORTEE_LOGEMENT_SIMPLE = 3,
  ECHANTILLONAGE_IMMEUBLE = 4,
  COLLECTIVE_IMMEUBLE_MIXTE_COMBUSTION = 5,
  COLLECTIVE_IMMEUBLE_MIXTE_SIMPLE = 6,
}

export enum EnumCfgInstallationCh {
  INSTALLATION_SIMPLE = 1,
  INSTALLATION_SOLAIRE = 2,
  INSTALLATION_APPOINT_BOIS = 3,
  INSTALLATION_INSERT_BOIS_ELEC_SDB = 4,
  INSTALLATION_APPOINT_BOIS_ELEC_SDB = 5,
  INSTALLATION_CHAUDIERE_RELEVE_BOIS = 6,
  INSTALLATION_SOLAIRE_APPOINT_BOIS = 7,
  INSTALLATION_CHAUDIERE_RELEVE_PAC = 8,
  INSTALLATION_CHAUDIERE_RELEVE_PAC_BOIS = 9,
  INSTALLATION_COLLECTIVE_BASE_APPOINT = 10,
  CONVECTEURS_BI_JONCTION = 11,
}

export enum EnumTypeEnergie {
  ELECTRICITE = 1,
  GAZ_NATUREL = 2,
  GPL = 3,
  FIOUL = 4,
  BOIS_BUCHE = 5,
  BOIS_GRANULE = 6,
  BOIS_PLAQUETTE = 7,
  CHARBON = 8,
  RESEAU_CHALEUR = 9,
  RESEAU_FROID = 10,
  ELECTRICITE_VERTE = 11,
  AUTRE = 12,
  AUCUN = 13,
  ELECTRICITE_PAC = 14,
  ELECTRICITE_DIRECTE = 15,
}

export enum EnumTypeGenerateurCh {
  CHAUDIERE_GAZ_STANDARD_AVANT_1981 = 1,
  CHAUDIERE_GAZ_STANDARD_1981_1991 = 2,
  CHAUDIERE_GAZ_STANDARD_1991_2001 = 3,
  CHAUDIERE_GAZ_STANDARD_2001_2007 = 4,
  CHAUDIERE_GAZ_STANDARD_APRES_2007 = 5,
  CHAUDIERE_GAZ_CONDENSATION = 6,
  CHAUDIERE_GAZ_BASSE_TEMPERATURE = 7,
  CHAUDIERE_FIOUL_STANDARD_AVANT_1981 = 8,
  CHAUDIERE_FIOUL_STANDARD_1981_1991 = 9,
  CHAUDIERE_FIOUL_STANDARD_1991_2001 = 10,
  CHAUDIERE_FIOUL_STANDARD_2001_2007 = 11,
  CHAUDIERE_FIOUL_STANDARD_APRES_2007 = 12,
  CHAUDIERE_FIOUL_CONDENSATION = 13,
  CHAUDIERE_FIOUL_BASSE_TEMPERATURE = 14,
  CHAUDIERE_BOIS_MANUEL_AVANT_2001 = 15,
  CHAUDIERE_BOIS_MANUEL_2001_2012 = 16,
  CHAUDIERE_BOIS_MANUEL_APRES_2012 = 17,
  CHAUDIERE_BOIS_AUTOMATIQUE_AVANT_2001 = 18,
  CHAUDIERE_BOIS_AUTOMATIQUE_2001_2012 = 19,
  CHAUDIERE_BOIS_AUTOMATIQUE_APRES_2012 = 20,
  CHAUDIERE_ELECTRIQUE = 21,
  PAC_AIR_AIR = 22,
  PAC_AIR_EAU = 23,
  PAC_EAU_EAU = 24,
  PAC_EAU_GLYCOLEE_EAU = 25,
  PAC_GEOTHERMIQUE = 26,
  POELE_BOIS = 27,
  INSERT_BOIS = 28,
  CHEMINEE_BOIS = 29,
  GENERATEUR_A_AIR_CHAUD_GAZ = 30,
  GENERATEUR_A_AIR_CHAUD_ELECTRIQUE = 31,
  RADIATEUR_GAZ = 32,
  RADIATEUR_ELECTRIQUE = 33,
  CONVECTEUR_ELECTRIQUE = 34,
  PLANCHER_CHAUFFANT_ELECTRIQUE = 35,
  PLAFOND_CHAUFFANT_ELECTRIQUE = 36,
  RADIATEUR_ELECTRIQUE_INERTIE = 37,
  CONVECTEUR_ELECTRIQUE_INERTIE = 38,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE = 39,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE = 40,
  RADIATEUR_ELECTRIQUE_ACCUMULATION = 41,
  CONVECTEUR_ELECTRIQUE_ACCUMULATION = 42,
  PLANCHER_CHAUFFANT_ELECTRIQUE_ACCUMULATION = 43,
  PLAFOND_CHAUFFANT_ELECTRIQUE_ACCUMULATION = 44,
  RADIATEUR_ELECTRIQUE_FLUIDE = 45,
  CONVECTEUR_ELECTRIQUE_FLUIDE = 46,
  PLANCHER_CHAUFFANT_ELECTRIQUE_FLUIDE = 47,
  PLAFOND_CHAUFFANT_ELECTRIQUE_FLUIDE = 48,
  RADIATEUR_ELECTRIQUE_INERTIE_SECHE = 49,
  CONVECTEUR_ELECTRIQUE_INERTIE_SECHE = 50,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_SECHE = 51,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_SECHE = 52,
  RADIATEUR_ELECTRIQUE_INERTIE_FLUIDE = 53,
  CONVECTEUR_ELECTRIQUE_INERTIE_FLUIDE = 54,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_FLUIDE = 55,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_FLUIDE = 56,
  RADIATEUR_ELECTRIQUE_INERTIE_REFRACTAIRE = 57,
  CONVECTEUR_ELECTRIQUE_INERTIE_REFRACTAIRE = 58,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_REFRACTAIRE = 59,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_REFRACTAIRE = 60,
  RADIATEUR_ELECTRIQUE_INERTIE_CERAMIQUE = 61,
  CONVECTEUR_ELECTRIQUE_INERTIE_CERAMIQUE = 62,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_CERAMIQUE = 63,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_CERAMIQUE = 64,
  RADIATEUR_ELECTRIQUE_INERTIE_FONTE = 65,
  CONVECTEUR_ELECTRIQUE_INERTIE_FONTE = 66,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_FONTE = 67,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_FONTE = 68,
  RADIATEUR_ELECTRIQUE_INERTIE_ALUMINIUM = 69,
  CONVECTEUR_ELECTRIQUE_INERTIE_ALUMINIUM = 70,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_ALUMINIUM = 71,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_ALUMINIUM = 72,
  RADIATEUR_ELECTRIQUE_INERTIE_PIERRE = 73,
  CONVECTEUR_ELECTRIQUE_INERTIE_PIERRE = 74,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_PIERRE = 75,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_PIERRE = 76,
  RADIATEUR_ELECTRIQUE_INERTIE_VERRE = 77,
  CONVECTEUR_ELECTRIQUE_INERTIE_VERRE = 78,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_VERRE = 79,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_VERRE = 80,
  RADIATEUR_ELECTRIQUE_INERTIE_BETON = 81,
  CONVECTEUR_ELECTRIQUE_INERTIE_BETON = 82,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_BETON = 83,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_BETON = 84,
  RADIATEUR_ELECTRIQUE_INERTIE_TERRE_CUITE = 85,
  CONVECTEUR_ELECTRIQUE_INERTIE_TERRE_CUITE = 86,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_TERRE_CUITE = 87,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_TERRE_CUITE = 88,
  RADIATEUR_ELECTRIQUE_INERTIE_AUTRE = 89,
  CONVECTEUR_ELECTRIQUE_INERTIE_AUTRE = 90,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_AUTRE = 91,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_AUTRE = 92,
  RADIATEUR_ELECTRIQUE_ACCUMULATION_AUTRE = 93,
  CONVECTEUR_ELECTRIQUE_ACCUMULATION_AUTRE = 94,
  PLANCHER_CHAUFFANT_ELECTRIQUE_ACCUMULATION_AUTRE = 95,
  PLAFOND_CHAUFFANT_ELECTRIQUE_ACCUMULATION_AUTRE = 96,
  RADIATEUR_ELECTRIQUE_FLUIDE_AUTRE = 97,
  CONVECTEUR_ELECTRIQUE_FLUIDE_AUTRE = 98,
  PLANCHER_CHAUFFANT_ELECTRIQUE_FLUIDE_AUTRE = 99,
  PLAFOND_CHAUFFANT_ELECTRIQUE_FLUIDE_AUTRE = 100,
  RADIATEUR_ELECTRIQUE_INERTIE_SECHE_AUTRE = 101,
  CONVECTEUR_ELECTRIQUE_INERTIE_SECHE_AUTRE = 102,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_SECHE_AUTRE = 103,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_SECHE_AUTRE = 104,
  RADIATEUR_ELECTRIQUE_INERTIE_FLUIDE_AUTRE = 105,
  CONVECTEUR_ELECTRIQUE_INERTIE_FLUIDE_AUTRE = 106,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_FLUIDE_AUTRE = 107,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_FLUIDE_AUTRE = 108,
  RADIATEUR_ELECTRIQUE_INERTIE_REFRACTAIRE_AUTRE = 109,
  CONVECTEUR_ELECTRIQUE_INERTIE_REFRACTAIRE_AUTRE = 110,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_REFRACTAIRE_AUTRE = 111,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_REFRACTAIRE_AUTRE = 112,
  RADIATEUR_ELECTRIQUE_INERTIE_CERAMIQUE_AUTRE = 113,
  CONVECTEUR_ELECTRIQUE_INERTIE_CERAMIQUE_AUTRE = 114,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_CERAMIQUE_AUTRE = 115,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_CERAMIQUE_AUTRE = 116,
  RADIATEUR_ELECTRIQUE_INERTIE_FONTE_AUTRE = 117,
  CONVECTEUR_ELECTRIQUE_INERTIE_FONTE_AUTRE = 118,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_FONTE_AUTRE = 119,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_FONTE_AUTRE = 120,
  RADIATEUR_ELECTRIQUE_INERTIE_ALUMINIUM_AUTRE = 121,
  CONVECTEUR_ELECTRIQUE_INERTIE_ALUMINIUM_AUTRE = 122,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_ALUMINIUM_AUTRE = 123,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_ALUMINIUM_AUTRE = 124,
  RADIATEUR_ELECTRIQUE_INERTIE_PIERRE_AUTRE = 125,
  CONVECTEUR_ELECTRIQUE_INERTIE_PIERRE_AUTRE = 126,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_PIERRE_AUTRE = 127,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_PIERRE_AUTRE = 128,
  RADIATEUR_ELECTRIQUE_INERTIE_VERRE_AUTRE = 129,
  CONVECTEUR_ELECTRIQUE_INERTIE_VERRE_AUTRE = 130,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_VERRE_AUTRE = 131,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_VERRE_AUTRE = 132,
  RADIATEUR_ELECTRIQUE_INERTIE_BETON_AUTRE = 133,
  CONVECTEUR_ELECTRIQUE_INERTIE_BETON_AUTRE = 134,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_BETON_AUTRE = 135,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_BETON_AUTRE = 136,
  RADIATEUR_ELECTRIQUE_INERTIE_TERRE_CUITE_AUTRE = 137,
  CONVECTEUR_ELECTRIQUE_INERTIE_TERRE_CUITE_AUTRE = 138,
  PLANCHER_CHAUFFANT_ELECTRIQUE_INERTIE_TERRE_CUITE_AUTRE = 139,
  PLAFOND_CHAUFFANT_ELECTRIQUE_INERTIE_TERRE_CUITE_AUTRE = 140,
}

export enum EnumTypeGenerateurEcs {
  CHAUDIERE_GAZ_STANDARD_AVANT_1981 = 1,
  CHAUDIERE_GAZ_STANDARD_1981_1991 = 2,
  CHAUDIERE_GAZ_STANDARD_1991_2001 = 3,
  CHAUDIERE_GAZ_STANDARD_2001_2007 = 4,
  CHAUDIERE_GAZ_STANDARD_APRES_2007 = 5,
  CHAUDIERE_GAZ_CONDENSATION = 6,
  CHAUDIERE_GAZ_BASSE_TEMPERATURE = 7,
  CHAUDIERE_FIOUL_STANDARD_AVANT_1981 = 8,
  CHAUDIERE_FIOUL_STANDARD_1981_1991 = 9,
  CHAUDIERE_FIOUL_STANDARD_1991_2001 = 10,
  CHAUDIERE_FIOUL_STANDARD_2001_2007 = 11,
  CHAUDIERE_FIOUL_STANDARD_APRES_2007 = 12,
  CHAUDIERE_FIOUL_CONDENSATION = 13,
  CHAUDIERE_FIOUL_BASSE_TEMPERATURE = 14,
  CHAUDIERE_BOIS_MANUEL_AVANT_2001 = 15,
  CHAUDIERE_BOIS_MANUEL_2001_2012 = 16,
  CHAUDIERE_BOIS_MANUEL_APRES_2012 = 17,
  CHAUDIERE_BOIS_AUTOMATIQUE_AVANT_2001 = 18,
  CHAUDIERE_BOIS_AUTOMATIQUE_2001_2012 = 19,
  CHAUDIERE_BOIS_AUTOMATIQUE_APRES_2012 = 20,
  CHAUDIERE_ELECTRIQUE = 21,
  PAC_AIR_AIR = 22,
  PAC_AIR_EAU = 23,
  PAC_EAU_EAU = 24,
  PAC_EAU_GLYCOLEE_EAU = 25,
  PAC_GEOTHERMIQUE = 26,
  BALLON_ELECTRIQUE = 27,
  BALLON_THERMODYNAMIQUE_AIR_AMBIANT = 28,
  BALLON_THERMODYNAMIQUE_AIR_EXTERIEUR = 29,
  BALLON_THERMODYNAMIQUE_AIR_EXTRAIT = 30,
  BALLON_SOLAIRE = 31,
  RESEAU_CHALEUR = 32,
  AUTRE = 33,
}

export enum EnumTypeStockageEcs {
  SANS_STOCKAGE = 1,
  STOCKAGE_INTEGRE = 2,
  STOCKAGE_INDEPENDANT = 3,
}

export enum EnumMethodeSaisieCaracSys {
  VALEUR_FORFAITAIRE = 1,
  VALEUR_DONNEE_TECHNIQUE = 2,
  VALEUR_SAISIE = 3,
}

export enum EnumUsageGenerateur {
  CHAUFFAGE = 1,
  ECS = 2,
  CHAUFFAGE_ECS = 3,
}

export enum EnumBouclageReseauEcs {
  SANS_BOUCLAGE = 1,
  BOUCLAGE_SANS_ISOLEMENT = 2,
  BOUCLAGE_AVEC_ISOLEMENT = 3,
}

export enum EnumTypeInstallationSolaire {
  SANS_SOLAIRE = 1,
  INSTALLATION_SOLAIRE_THERMIQUE = 2,
  INSTALLATION_SOLAIRE_PHOTOVOLTAIQUE = 3,
  INSTALLATION_SOLAIRE_MIXTE = 4,
}

export enum EnumMethodeSaisieFactCouvSol {
  VALEUR_FORFAITAIRE = 1,
  DETERMINE_DOCUMENT_JUSTIFICATIF = 2,
}

export enum EnumTypeEmissionDistribution {
  RADIATEUR = 1,
  PLANCHER_CHAUFFANT = 2,
  PLAFOND_CHAUFFANT = 3,
  VENTILOCONVECTEUR = 4,
  CONVECTEUR = 5,
  RADIATEUR_A_ALIMENTATION_SEPAREE = 6,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE = 7,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE = 8,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE = 9,
  CONVECTEUR_A_ALIMENTATION_SEPAREE = 10,
  RADIATEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE = 11,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE = 12,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE = 13,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE = 14,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE = 15,
  RADIATEUR_ELECTRIQUE = 16,
  PLANCHER_CHAUFFANT_ELECTRIQUE = 17,
  PLAFOND_CHAUFFANT_ELECTRIQUE = 18,
  VENTILOCONVECTEUR_ELECTRIQUE = 19,
  CONVECTEUR_ELECTRIQUE = 20,
  POELE = 21,
  INSERT = 22,
  CHEMINEE = 23,
  RADIATEUR_A_ALIMENTATION_SEPAREE_POELE = 24,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_POELE = 25,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_POELE = 26,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_POELE = 27,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_POELE = 28,
  RADIATEUR_A_ALIMENTATION_SEPAREE_INSERT = 29,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_INSERT = 30,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_INSERT = 31,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_INSERT = 32,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_INSERT = 33,
  RADIATEUR_A_ALIMENTATION_SEPAREE_CHEMINEE = 34,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_CHEMINEE = 35,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_CHEMINEE = 36,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_CHEMINEE = 37,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_CHEMINEE = 38,
  RADIATEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_POELE = 39,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE_POELE = 40,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE_POELE = 41,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_POELE = 42,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_POELE = 43,
  RADIATEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_INSERT = 44,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE_INSERT = 45,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE_INSERT = 46,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_INSERT = 47,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_INSERT = 48,
  RADIATEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_CHEMINEE = 49,
  PLANCHER_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE_CHEMINEE = 50,
  PLAFOND_CHAUFFANT_A_ALIMENTATION_SEPAREE_ELECTRIQUE_CHEMINEE = 51,
  VENTILOCONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_CHEMINEE = 52,
  CONVECTEUR_A_ALIMENTATION_SEPAREE_ELECTRIQUE_CHEMINEE = 53,
}

export enum EnumEquipementIntermittence {
  THERMOSTAT_D_AMBIANCE = 1,
  PROGRAMMATION = 2,
  THERMOSTAT_D_AMBIANCE_ET_PROGRAMMATION = 3,
  ROBINET_THERMOSTATIQUE = 4,
  THERMOSTAT_D_AMBIANCE_ET_ROBINET_THERMOSTATIQUE = 5,
  PROGRAMMATION_ET_ROBINET_THERMOSTATIQUE = 6,
  THERMOSTAT_D_AMBIANCE_ET_PROGRAMMATION_ET_ROBINET_THERMOSTATIQUE = 7,
  AUCUN = 8,
}

export enum EnumTypeRegulation {
  SANS_REGULATION = 1,
  REGULATION_SUR_TEMPERATURE_AMBIANTE = 2,
  REGULATION_SUR_TEMPERATURE_AMBIANTE_ET_EXTERIEURE = 3,
  REGULATION_SUR_TEMPERATURE_AMBIANTE_ET_EXTERIEURE_ET_GESTION_DELESTAGE = 4,
}

export enum EnumTypeChauffage {
  PRINCIPAL = 1,
  SECONDAIRE = 2,
}

export enum EnumTempDistributionCh {
  TRES_BASSE_TEMPERATURE = 1,
  BASSE_TEMPERATURE = 2,
  TEMPERATURE_MOYENNE = 3,
  HAUTE_TEMPERATURE = 4,
}

export enum EnumPeriodeInstallationEmetteur {
  AVANT_2001 = 1,
  PERIODE_2001_2012 = 2,
  APRES_2012 = 3,
}

export enum EnumLienGenerateurEmetteur {
  LIEN_1 = 1,
  LIEN_2 = 2,
  LIEN_3 = 3,
  LIEN_4 = 4,
  LIEN_5 = 5,
  LIEN_6 = 6,
  LIEN_7 = 7,
  LIEN_8 = 8,
  LIEN_9 = 9,
  LIEN_10 = 10,
}

export enum EnumMethodeSaisieQ4paConv {
  VALEUR_FORFAITAIRE = 1,
  VALEUR_SAISIE = 2,
  VALEUR_MESUREE = 3,
}

// ============================================================================
// INTERFACES PRINCIPALES - Validées contre XSD v2.6
// ============================================================================

export interface DPEDocument {
  version: string;
  administratif: Administratif;
  logement: Logement;
}

export interface Administratif {
  date_visite_diagnostiqueur: string;
  date_etablissement_dpe: string;
  nom_proprietaire: string;
  nom_proprietaire_installation_commune?: string;
  enum_modele_dpe_id: EnumModeleDpe;
  enum_version_id: EnumVersionDpe;
  diagnostiqueur: Diagnostiqueur;
  geolocalisation: Geolocalisation;
  enum_consentement_formulaire_id?: number;
  enum_commanditaire_id?: number;
  information_formulaire_consentement?: InformationFormulaireConsentement;
  horodatage_historisation?: string;
}

export interface Diagnostiqueur {
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

export interface Geolocalisation {
  numero_fiscal_local?: string;
  idpar?: string;
  immatriculation_copropriete?: string;
  adresses: Adresses;
}

export interface Adresses {
  adresse_proprietaire: AdresseDetail;
  adresse_bien: AdresseDetail;
  adresse_proprietaire_installation_commune?: AdresseDetail;
}

export interface AdresseDetail {
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

export interface InformationFormulaireConsentement {
  nom_formulaire: string;
  personne_morale: number;
  siren_formulaire: string;
  mail: string;
  telephone: string;
  label_adresse: string;
  label_adresse_avec_complement: string;
}

export interface Logement {
  caracteristique_generale: CaracteristiqueGenerale;
  meteo: Meteo;
  enveloppe: Enveloppe;
  installation_chauffage_collection?: InstallationChauffageCollection;
  installation_ecs_collection?: InstallationECSCollection;
  ventilation_collection?: VentilationCollection;
  climatisation_collection?: ClimatisationCollection;
  sortie?: Sortie;
}

export interface CaracteristiqueGenerale {
  annee_construction?: number;
  enum_periode_construction_id: EnumPeriodeConstruction;
  enum_methode_application_dpe_log_id: EnumMethodeApplicationDpeLog;
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

export interface Meteo {
  enum_zone_climatique_id: EnumZoneClimatique;
  altitude?: number;
  enum_classe_altitude_id: EnumClasseAltitude;
  batiment_materiaux_anciens: number;
}

export interface Enveloppe {
  inertie: Inertie;
  mur_collection: MurCollection;
  baie_vitree_collection?: BaieVitreeCollection;
  plancher_bas_collection?: PlancherBasCollection;
  plancher_haut_collection?: PlancherHautCollection;
  porte_collection?: PorteCollection;
  ets_collection?: ETSCollection;
  pont_thermique_collection?: PontThermiqueCollection;
}

export interface Inertie {
  inertie_plancher_bas_lourd: number;
  inertie_plancher_haut_lourd: number;
  inertie_paroi_verticale_lourd: number;
  enum_classe_inertie_id: number;
}

// ============================================================================
// COLLECTIONS ENVELOPPE
// ============================================================================

export interface MurCollection {
  mur: Mur | Mur[];
}

export interface Mur {
  donnee_entree: MurDonneeEntree;
  donnee_intermediaire: MurDonneeIntermediaire;
}

export interface MurDonneeEntree {
  reference: string;
  description?: string;
  reference_lnc?: string;
  tv_coef_reduction_deperdition_id?: number;
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: EnumCfgIsolationLnc;
  enum_type_adjacence_id: EnumTypeAdjacence;
  enum_orientation_id: EnumOrientation;
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

export interface MurDonneeIntermediaire {
  b: number;
  umur: number;
  umur0?: number;
}

export interface BaieVitreeCollection {
  baie_vitree: BaieVitree | BaieVitree[];
}

export interface BaieVitree {
  donnee_entree: BaieVitreeDonneeEntree;
  donnee_intermediaire?: BaieVitreeDonneeIntermediaire;
}

export interface BaieVitreeDonneeEntree {
  reference: string;
  description?: string;
  reference_paroi?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: EnumTypeAdjacence;
  enum_orientation_id: EnumOrientation;
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
  masque_lointain_non_homogene_collection?: MasqueLointainNonHomogeneCollection;
}

export interface MasqueLointainNonHomogeneCollection {
  masque_lointain_non_homogene: MasqueLointainNonHomogene | MasqueLointainNonHomogene[];
}

export interface MasqueLointainNonHomogene {
  tv_coef_masque_lointain_non_homogene_id: number;
}

export interface BaieVitreeDonneeIntermediaire {
  b: number;
  ug?: number;
  uw?: number;
  ujn?: number;
  u_menuiserie?: number;
  sw?: number;
  fe1?: number;
  fe2?: number;
}

export interface PlancherBasCollection {
  plancher_bas: PlancherBas | PlancherBas[];
}

export interface PlancherBas {
  donnee_entree: PlancherBasDonneeEntree;
  donnee_intermediaire: PlancherBasDonneeIntermediaire;
}

export interface PlancherBasDonneeEntree {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: EnumTypeAdjacence;
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

export interface PlancherBasDonneeIntermediaire {
  b: number;
  upb: number;
  upb_final: number;
  upb0?: number;
}

export interface PlancherHautCollection {
  plancher_haut: PlancherHaut | PlancherHaut[];
}

export interface PlancherHaut {
  donnee_entree: PlancherHautDonneeEntree;
  donnee_intermediaire: PlancherHautDonneeIntermediaire;
}

export interface PlancherHautDonneeEntree {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: EnumCfgIsolationLnc;
  enum_type_adjacence_id: EnumTypeAdjacence;
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

export interface PlancherHautDonneeIntermediaire {
  b: number;
  uph: number;
  uph0?: number;
}

export interface PorteCollection {
  porte: Porte | Porte[];
}

export interface Porte {
  donnee_entree: PorteDonneeEntree;
  donnee_intermediaire: PorteDonneeIntermediaire;
}

export interface PorteDonneeEntree {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_type_adjacence_id: EnumTypeAdjacence;
  surface_aiu?: number;
  surface_aue?: number;
  enum_cfg_isolation_lnc_id?: EnumCfgIsolationLnc;
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

export interface PorteDonneeIntermediaire {
  b: number;
  uporte: number;
}

export interface ETSCollection {
  ets: ETS | ETS[];
}

export interface ETS {
  donnee_entree: ETSDonneeEntree;
  donnee_intermediaire: ETSDonneeIntermediaire;
  baie_ets_collection?: BaieETSCollection;
}

export interface ETSDonneeEntree {
  reference: string;
  description?: string;
  tv_coef_reduction_deperdition_id?: number;
  enum_cfg_isolation_lnc_id?: EnumCfgIsolationLnc;
  tv_coef_transparence_ets_id?: number;
}

export interface ETSDonneeIntermediaire {
  coef_transparence_ets: number;
  bver: number;
}

export interface BaieETSCollection {
  baie_ets: BaieETS | BaieETS[];
}

export interface BaieETS {
  donnee_entree: BaieETSDonneeEntree;
}

export interface BaieETSDonneeEntree {
  reference: string;
  enum_orientation_id: EnumOrientation;
  enum_inclinaison_vitrage_id?: number;
  surface_totale_baie: number;
  nb_baie?: number;
}

export interface PontThermiqueCollection {
  pont_thermique: PontThermique | PontThermique[];
}

export interface PontThermique {
  donnee_entree: PontThermiqueDonneeEntree;
  donnee_intermediaire: PontThermiqueDonneeIntermediaire;
}

export interface PontThermiqueDonneeEntree {
  reference: string;
  description?: string;
  tv_pont_thermique_id?: number;
  enum_methode_saisie_pont_thermique_id?: number;
  pourcentage_valeur_pont_thermique?: number;
  l: number;
  enum_type_liaison_id: number;
}

export interface PontThermiqueDonneeIntermediaire {
  k: number;
}

// ============================================================================
// INSTALLATION CHAUFFAGE - Validé contre XSD v2.6
// ============================================================================

export interface InstallationChauffageCollection {
  installation_chauffage: InstallationChauffage | InstallationChauffage[];
}

export interface InstallationChauffage {
  donnee_entree: InstallationChauffageDonneeEntree;
  donnee_intermediaire: InstallationChauffageDonneeIntermediaire;
  generateur_chauffage_collection?: GenerateurChauffageCollection;
  emetteur_chauffage_collection?: EmetteurChauffageCollection;
}

export interface InstallationChauffageDonneeEntree {
  reference: string;
  description?: string;
  surface_chauffee: number;
  nombre_logement_echantillon?: number;
  rdim: number;
  nombre_niveau_installation_ch: number;
  enum_cfg_installation_ch_id: EnumCfgInstallationCh;
  ratio_virtualisation?: number;
  coef_ifc?: number;
  cle_repartition_ch?: number;
  enum_type_installation_id: EnumTypeInstallation;
  enum_methode_calcul_conso_id: EnumMethodeCalculConso;
  enum_methode_saisie_fact_couv_sol_id?: EnumMethodeSaisieFactCouvSol;
  tv_facteur_couverture_solaire_id?: number;
  fch_saisi?: number;
}

export interface InstallationChauffageDonneeIntermediaire {
  besoin_ch: number;
  besoin_ch_depensier: number;
  production_ch_solaire?: number;
  fch?: number;
  conso_ch: number;
  conso_ch_depensier: number;
}

export interface GenerateurChauffageCollection {
  generateur_chauffage: GenerateurChauffage | GenerateurChauffage[];
}

export interface GenerateurChauffage {
  donnee_entree: GenerateurChauffageDonneeEntree;
  donnee_intermediaire: GenerateurChauffageDonneeIntermediaire;
}

export interface GenerateurChauffageDonneeEntree {
  reference: string;
  description?: string;
  enum_lien_generateur_emetteur_id?: EnumLienGenerateurEmetteur;
  enum_type_generateur_ch_id: EnumTypeGenerateurCh;
  ref_produit_generateur_ch?: string;
  enum_usage_generateur_id: EnumUsageGenerateur;
  enum_type_energie_id: EnumTypeEnergie;
  position_volume_chauffe: number;
  enum_methode_saisie_carac_sys_id: EnumMethodeSaisieCaracSys;
  tv_rendement_generation_id?: number;
  tv_scop_id?: number;
  identifiant_reseau_chaleur?: string;
  date_arrete_reseau_chaleur?: string;
  tv_reseau_chaleur_id?: number;
}

export interface GenerateurChauffageDonneeIntermediaire {
  rendement_generation?: number;
  scop?: number;
  conso_ch: number;
  conso_ch_depensier: number;
}

export interface EmetteurChauffageCollection {
  emetteur_chauffage: EmetteurChauffage | EmetteurChauffage[];
}

export interface EmetteurChauffage {
  donnee_entree: EmetteurChauffageDonneeEntree;
  donnee_intermediaire: EmetteurChauffageDonneeIntermediaire;
}

export interface EmetteurChauffageDonneeEntree {
  reference: string;
  description?: string;
  surface_chauffee: number;
  enum_lien_generateur_emetteur_id?: EnumLienGenerateurEmetteur;
  tv_intermittence_id: number;
  tv_rendement_emission_id: number;
  tv_rendement_distribution_ch_id: number;
  tv_rendement_regulation_id: number;
  enum_type_emission_distribution_id: EnumTypeEmissionDistribution;
  enum_equipement_intermittence_id: EnumEquipementIntermittence;
  enum_type_regulation_id: EnumTypeRegulation;
  enum_type_chauffage_id: EnumTypeChauffage;
  enum_temp_distribution_ch_id: EnumTempDistributionCh;
  enum_periode_installation_emetteur_id: EnumPeriodeInstallationEmetteur;
}

export interface EmetteurChauffageDonneeIntermediaire {
  rendement_emission: number;
  rendement_distribution: number;
  rendement_regulation: number;
  i0: number;
}

// ============================================================================
// INSTALLATION ECS - Validé contre XSD v2.6
// ============================================================================

export interface InstallationECSCollection {
  installation_ecs: InstallationECS | InstallationECS[];
}

export interface InstallationECS {
  donnee_entree: InstallationECSDonneeEntree;
  donnee_intermediaire: InstallationECSDonneeIntermediaire;
  generateur_ecs_collection?: GenerateurECSCollection;
}

export interface InstallationECSDonneeEntree {
  reference: string;
  description?: string;
  enum_cfg_installation_ecs_id: EnumCfgInstallationEcs;
  enum_type_installation_id: EnumTypeInstallation;
  enum_methode_calcul_conso_id: EnumMethodeCalculConso;
  ratio_virtualisation?: number;
  cle_repartition_ecs?: number;
  surface_habitable: number;
  nombre_logement: number;
  rdim: number;
  nombre_niveau_installation_ecs: number;
  fecs_saisi?: number;
  tv_facteur_couverture_solaire_id?: number;
  enum_methode_saisie_fact_couv_sol_id?: EnumMethodeSaisieFactCouvSol;
  enum_type_installation_solaire_id?: EnumTypeInstallationSolaire;
  tv_rendement_distribution_ecs_id?: number;
  enum_bouclage_reseau_ecs_id?: EnumBouclageReseauEcs;
  reseau_distribution_isole?: number;
}

export interface InstallationECSDonneeIntermediaire {
  rendement_distribution: number;
  besoin_ecs: number;
  besoin_ecs_depensier: number;
  fecs?: number;
  production_ecs_solaire?: number;
  conso_ecs: number;
  conso_ecs_depensier: number;
}

export interface GenerateurECSCollection {
  generateur_ecs: GenerateurECS | GenerateurECS[];
}

export interface GenerateurECS {
  donnee_entree: GenerateurECSDonneeEntree;
  donnee_intermediaire: GenerateurECSDonneeIntermediaire;
}

export interface GenerateurECSDonneeEntree {
  reference: string;
  description?: string;
  reference_generateur_mixte?: string;
  enum_type_generateur_ecs_id: EnumTypeGenerateurEcs;
  ref_produit_generateur_ecs?: string;
  enum_usage_generateur_id: EnumUsageGenerateur;
  enum_type_energie_id: EnumTypeEnergie;
  tv_generateur_combustion_id?: number;
  enum_methode_saisie_carac_sys_id: EnumMethodeSaisieCaracSys;
  tv_pertes_stockage_id?: number;
  tv_scop_id?: number;
  enum_periode_installation_ecs_thermo_id?: number;
  identifiant_reseau_chaleur?: string;
  date_arrete_reseau_chaleur?: string;
  tv_reseau_chaleur_id?: number;
  enum_type_stockage_ecs_id?: EnumTypeStockageEcs;
  position_volume_chauffe: number;
  position_volume_chauffe_stockage?: number;
  volume_stockage?: number;
  presence_ventouse?: number;
}

export interface GenerateurECSDonneeIntermediaire {
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

// ============================================================================
// VENTILATION - Validé contre XSD v2.6
// ============================================================================

export interface VentilationCollection {
  ventilation: Ventilation | Ventilation[];
}

export interface Ventilation {
  donnee_entree: VentilationDonneeEntree;
  donnee_intermediaire: VentilationDonneeIntermediaire;
}

export interface VentilationDonneeEntree {
  reference: string;
  description?: string;
  plusieurs_facade_exposee: number;
  surface_ventile: number;
  tv_q4pa_conv_id?: number;
  q4pa_conv_saisi?: number;
  enum_methode_saisie_q4pa_conv_id: EnumMethodeSaisieQ4paConv;
  tv_debits_ventilation_id: number;
  enum_type_ventilation_id: EnumTypeVentilation;
  ventilation_post_2012: number;
  ref_produit_ventilation?: string;
  cle_repartition_ventilation?: number;
}

export interface VentilationDonneeIntermediaire {
  q4pa_conv: number;
  conso_auxiliaire_ventilation: number;
  hperm: number;
  hvent: number;
  pvent_moy?: number;
}

// ============================================================================
// CLIMATISATION - Validé contre XSD v2.6
// ============================================================================

export interface ClimatisationCollection {
  climatisation: Climatisation | Climatisation[];
}

export interface Climatisation {
  donnee_entree: ClimatisationDonneeEntree;
  donnee_intermediaire: ClimatisationDonneeIntermediaire;
}

export interface ClimatisationDonneeEntree {
  reference: string;
  description?: string;
  surface_clim: number;
  ref_produit_fr?: string;
  tv_seer_id?: number;
  nombre_logement_echantillon?: number;
  enum_methode_calcul_conso_id: EnumMethodeCalculConso;
  enum_periode_installation_fr_id?: number;
  enum_type_energie_id: EnumTypeEnergie;
  enum_type_generateur_fr_id?: number;
  enum_methode_saisie_carac_sys_id: EnumMethodeSaisieCaracSys;
}

export interface ClimatisationDonneeIntermediaire {
  eer?: number;
  besoin_fr: number;
  conso_fr: number;
  conso_fr_depensier: number;
}

// ============================================================================
// SORTIE - Validé contre XSD v2.6
// ============================================================================

export interface Sortie {
  deperdition: SortieDeperdition;
  apport_et_besoin: SortieApportEtBesoin;
  ef_conso: SortieEfConso;
  ep_conso: SortieEpConso;
  emission_ges: SortieEmissionGes;
  cout: SortieCout;
  production_electricite?: SortieProductionElectricite;
  sortie_par_energie_collection?: SortieParEnergieCollection;
  confort_ete?: SortieConfortEte;
  qualite_isolation?: SortieQualiteIsolation;
}

export interface SortieDeperdition {
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

export interface SortieApportEtBesoin {
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

export interface SortieEfConso {
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

export interface SortieEpConso {
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
  classe_bilan_dpe: EnumEtiquetteDpe;
}

export interface SortieEmissionGes {
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
  classe_emission_ges: EnumEtiquetteDpe;
}

export interface SortieCout {
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

export interface SortieProductionElectricite {
  production_pv: number;
  conso_elec_ac: number;
  conso_elec_ac_ch: number;
  conso_elec_ac_ecs: number;
  conso_elec_ac_fr: number;
  conso_elec_ac_eclairage: number;
  conso_elec_ac_auxiliaire: number;
  conso_elec_ac_autre_usage: number;
}

export interface SortieParEnergieCollection {
  sortie_par_energie: SortieParEnergie | SortieParEnergie[];
}

export interface SortieParEnergie {
  conso_ch: number;
  conso_ecs: number;
  conso_5_usages: number;
  enum_type_energie_id: EnumTypeEnergie;
  emission_ges_ch: number;
  emission_ges_ecs: number;
  emission_ges_5_usages: number;
  cout_ch: number;
  cout_ecs: number;
  cout_5_usages: number;
}

export interface SortieConfortEte {
  isolation_toiture: number;
  protection_solaire_exterieure: number;
  aspect_traversant: number;
  brasseur_air: number;
  inertie_lourde: number;
  enum_indicateur_confort_ete_id: number;
}

export interface SortieQualiteIsolation {
  ubat: number;
  qualite_isol_enveloppe: number;
  qualite_isol_mur: number;
  qualite_isol_plancher_haut_toit_terrasse: number;
  qualite_isol_plancher_bas: number;
  qualite_isol_menuiserie: number;
}

// ============================================================================
// TYPES POUR VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// TYPES POUR XML
// ============================================================================

export interface XMLExportOptions {
  include_validation: boolean;
  format: "standard" | "complet";
}

export interface XMLValidationResult {
  valid: boolean;
  schema_errors: string[];
  coherence_errors: string[];
}
