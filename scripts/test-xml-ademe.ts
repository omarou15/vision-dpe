/**
 * Script de test pour l'API ADEME locale
 * Teste la génération et validation de XML DPE
 * 
 * @module test-xml-ademe
 * @version 2.6.0
 */

import { XMLGenerator } from "../utils/xml-generator";
import { XMLValidator, validateXML } from "../utils/xml-validator";
import {
  DPEDocument,
  EnumModeleDpe,
  EnumVersionDpe,
  EnumPeriodeConstruction,
  EnumMethodeApplicationDpeLog,
  EnumZoneClimatique,
  EnumClasseAltitude,
  EnumTypeAdjacence,
  EnumOrientation,
  EnumCfgInstallationCh,
  EnumTypeInstallation,
  EnumMethodeCalculConso,
  EnumTypeGenerateurCh,
  EnumTypeEnergie,
  EnumUsageGenerateur,
  EnumMethodeSaisieCaracSys,
  EnumTypeEmissionDistribution,
  EnumEquipementIntermittence,
  EnumTypeRegulation,
  EnumTypeChauffage,
  EnumTempDistributionCh,
  EnumPeriodeInstallationEmetteur,
  EnumLienGenerateurEmetteur,
  EnumCfgInstallationEcs,
  EnumTypeGenerateurEcs,
  EnumTypeStockageEcs,
  EnumBouclageReseauEcs,
  EnumMethodeSaisieQ4paConv,
  EnumTypeVentilation,
  EnumEtiquetteDpe,
} from "../types/dpe";

/**
 * Crée un DPE de test complet basé sur les exemples ADEME
 */
export function createTestDPEDocument(): DPEDocument {
  return {
    version: "8.0.4",
    administratif: {
      date_visite_diagnostiqueur: "2021-07-10",
      date_etablissement_dpe: "2021-07-10",
      nom_proprietaire: "Hubert Bonisseur de La Bath",
      nom_proprietaire_installation_commune: "Syndic Saint D'hic",
      enum_modele_dpe_id: EnumModeleDpe.LOGEMENT_EXISTANT,
      enum_version_id: EnumVersionDpe.V2_6,
      diagnostiqueur: {
        usr_logiciel_id: 3,
        version_logiciel: "3.2",
        nom_diagnostiqueur: "Lamar",
        prenom_diagnostiqueur: "Kendrick",
        mail_diagnostiqueur: "kendrick.lamar@diagnostiqueur.fr",
        telephone_diagnostiqueur: "0607080910",
        adresse_diagnostiqueur: "20 avenue de Ségur 75007 Paris",
        entreprise_diagnostiqueur: "Entreprise Tartampion",
        numero_certification_diagnostiqueur: "????????????",
        organisme_certificateur: "Organisme Certificateur",
      },
      geolocalisation: {
        numero_fiscal_local: "2A0123456789",
        idpar: "06163000CE8888",
        immatriculation_copropriete: "AA1234567",
        adresses: {
          adresse_proprietaire: {
            adresse_brut: "3 rue roland martin",
            code_postal_brut: "94500",
            nom_commune_brut: "Champigny Sur Marne",
            label_brut: "3 rue roland martin 94500 Champigny Sur Marne",
            label_brut_avec_complement: "logement A12 escalier A1 etage 0 batiment A residence lesl lilas 3 rue roland martin 94500 Champigny Sur Marne",
            enum_statut_geocodage_ban_id: 1,
            ban_date_appel: "2021-07-10",
            compl_nom_residence: "résidence les lilas",
            compl_ref_batiment: "A",
            compl_etage_appartement: "0",
            compl_ref_cage_escalier: "A1",
            compl_ref_logement: "A12",
            ban_id: "94017_8243_00003",
            ban_label: "3 Rue Roland Martin 94500 Champigny-sur-Marne",
            ban_housenumber: "3",
            ban_street: "Rue Roland Martin",
            ban_citycode: "94017",
            ban_postcode: "94500",
            ban_city: "Champigny-sur-Marne",
            ban_type: "housenumber",
            ban_score: 0.9665599999999999,
            ban_x: 662242.87,
            ban_y: 6857973.84,
          },
          adresse_bien: {
            adresse_brut: "116 avenue de Rosny",
            code_postal_brut: "93130",
            nom_commune_brut: "Noisy Le Sec",
            label_brut: "116 avenue de Rosny 93130 Noisy Le Sec",
            label_brut_avec_complement: "logement A12 escalier A1 etage 0 batiment A residence lesl lilas 3 rue roland martin 94500 Champigny Sur Marne",
            enum_statut_geocodage_ban_id: 1,
            ban_date_appel: "2021-07-10",
            compl_nom_residence: "résidence des iris",
            compl_ref_batiment: "B",
            compl_etage_appartement: "3",
            compl_ref_logement: "40",
            ban_id: "93053_8175_00116",
            ban_label: "116 Avenue de Rosny 93130 Noisy-le-Sec",
            ban_housenumber: "116",
            ban_street: "Avenue de Rosny",
            ban_citycode: "93053",
            ban_postcode: "93130",
            ban_city: "Noisy-le-Sec",
            ban_type: "housenumber",
            ban_score: 0.9750781818181817,
            ban_x: 661218.02,
            ban_y: 6865892.53,
          },
          adresse_proprietaire_installation_commune: {
            adresse_brut: "48 Avenue Marceau",
            code_postal_brut: "93130",
            nom_commune_brut: "Noisy-le-Sec",
            label_brut: "48 Avenue Marceau 93130 Noisy-le-Sec",
            label_brut_avec_complement: "logement A12 escalier A1 etage 0 batiment A residence lesl lilas 3 rue roland martin 94500 Champigny Sur Marne",
            enum_statut_geocodage_ban_id: 1,
            ban_date_appel: "2021-07-10",
            ban_id: "93053_6120_00048",
            ban_label: "48 Avenue Marceau 93130 Noisy-le-Sec",
            ban_housenumber: "48",
            ban_street: "Avenue Marceau",
            ban_citycode: "93053",
            ban_postcode: "93130",
            ban_city: "Noisy-le-Sec",
            ban_type: "housenumber",
            ban_score: 0.9741772727272727,
            ban_x: 660505.01,
            ban_y: 6865744.45,
          },
        },
      },
      enum_consentement_formulaire_id: 1,
      enum_commanditaire_id: 1,
      information_formulaire_consentement: {
        nom_formulaire: "Hubert Bonisseur de La Bath",
        personne_morale: 1,
        siren_formulaire: "111111111",
        mail: "hubert.bonisseur.delabath@gmail.com",
        telephone: "0607080910",
        label_adresse: "20 avenue de Ségur 75007 Paris",
        label_adresse_avec_complement: "appartement 12 etage 25, 20 avenue de Ségur 75007 Paris",
      },
      horodatage_historisation: "2025-10-10T14:45:30+02:00",
    },
    logement: {
      caracteristique_generale: {
        annee_construction: 1954,
        enum_periode_construction_id: EnumPeriodeConstruction.PERIODE_1948_1974,
        enum_methode_application_dpe_log_id: EnumMethodeApplicationDpeLog.MAISON_INDIVIDUELLE,
        enum_calcul_echantillonnage_id: 1,
        surface_habitable_logement: 80,
        nombre_niveau_logement: 2,
        hsp: 2.8,
      },
      meteo: {
        enum_zone_climatique_id: EnumZoneClimatique.H1A,
        altitude: -200.0,
        enum_classe_altitude_id: EnumClasseAltitude.INF_400M,
        batiment_materiaux_anciens: 0,
      },
      enveloppe: {
        inertie: {
          inertie_plancher_bas_lourd: 1,
          inertie_plancher_haut_lourd: 1,
          inertie_paroi_verticale_lourd: 1,
          enum_classe_inertie_id: 1,
        },
        mur_collection: {
          mur: [
            {
              donnee_entree: {
                reference: "7ada6378-733d-41a5-986c-017a6f9c3ff0",
                description: "Mur exterieur sud",
                tv_coef_reduction_deperdition_id: 1,
                enum_type_adjacence_id: EnumTypeAdjacence.EXTERIEUR,
                enum_orientation_id: EnumOrientation.SUD,
                surface_paroi_totale: 50,
                surface_paroi_opaque: 30,
                paroi_lourde: 0,
                epaisseur_isolation: 10,
                resistance_isolation: 3,
                epaisseur_structure: 20,
                enum_materiaux_structure_mur_id: 9,
                enum_methode_saisie_u0_id: 3,
                enum_type_doublage_id: 5,
                enduit_isolant_paroi_ancienne: 0,
                enum_type_isolation_id: 3,
                enum_methode_saisie_u_id: 5,
                umur0_saisi: 3.5,
              },
              donnee_intermediaire: {
                b: 1,
                umur: 0.33333,
                umur0: 3.5,
              },
            },
          ],
        },
        baie_vitree_collection: {
          baie_vitree: [
            {
              donnee_entree: {
                reference: "f942bcbd-dc47-446a-a9af-4f996e04aad8",
                description: "fenetre battante",
                tv_coef_reduction_deperdition_id: 1,
                enum_type_adjacence_id: EnumTypeAdjacence.EXTERIEUR,
                enum_orientation_id: EnumOrientation.SUD,
                surface_totale_baie: 20,
                nb_baie: 4,
                tv_ug_id: 1,
                enum_type_vitrage_id: 1,
                enum_inclinaison_vitrage_id: 3,
                enum_methode_saisie_perf_vitrage_id: 1,
                tv_uw_id: 81,
                enum_type_materiaux_menuiserie_id: 6,
                enum_type_baie_id: 5,
                double_fenetre: 0,
                enum_type_fermeture_id: 1,
                presence_protection_solaire_hors_fermeture: 0,
                presence_retour_isolation: 0,
                presence_joint: 0,
                largeur_dormant: 10,
                tv_sw_id: 54,
                enum_type_pose_id: 1,
                tv_coef_masque_proche_id: 5,
              },
              donnee_intermediaire: {
                b: 1,
                ug: 5.8,
                uw: 5.8,
                u_menuiserie: 5.8,
                sw: 0.64,
                fe1: 0.5,
                fe2: 0.08,
              },
            },
          ],
        },
        plancher_bas_collection: {
          plancher_bas: [
            {
              donnee_entree: {
                reference: "628166f0-08f7-4883-bf1a-ba34c9f7051b",
                description: "plancher bas",
                tv_coef_reduction_deperdition_id: 3,
                enum_type_adjacence_id: EnumTypeAdjacence.VIDE_SANITAIRE,
                surface_paroi_opaque: 80,
                paroi_lourde: 0,
                tv_upb0_id: 3,
                enum_type_plancher_bas_id: 3,
                enum_methode_saisie_u0_id: 1,
                enum_type_isolation_id: 9,
                enum_periode_isolation_id: 2,
                tv_upb_id: 2,
                enum_methode_saisie_u_id: 2,
                calcul_ue: 1,
                perimetre_ue: 200,
                surface_ue: 300,
                ue: 0.5,
              },
              donnee_intermediaire: {
                b: 1,
                upb: 2,
                upb_final: 0.5,
                upb0: 1.45,
              },
            },
          ],
        },
        plancher_haut_collection: {
          plancher_haut: [
            {
              donnee_entree: {
                reference: "1754edd8-ba81-4dd3-941c-94db017281ec",
                description: "plancher haut",
                tv_coef_reduction_deperdition_id: 59,
                surface_aiu: 40,
                surface_aue: 45,
                enum_cfg_isolation_lnc_id: 4,
                enum_type_adjacence_id: EnumTypeAdjacence.COMBLE_FORTEMENT_VENTILE,
                surface_paroi_opaque: 80,
                paroi_lourde: 0,
                tv_uph0_id: 12,
                enum_type_plancher_haut_id: 16,
                enum_methode_saisie_u0_id: 1,
                enum_type_isolation_id: 4,
                enum_periode_isolation_id: 7,
                tv_uph_id: 32,
                enum_methode_saisie_u_id: 7,
              },
              donnee_intermediaire: {
                b: 1,
                uph: 0.23,
                uph0: 2.5,
              },
            },
          ],
        },
      },
      installation_chauffage_collection: {
        installation_chauffage: [
          {
            donnee_entree: {
              reference: "5206335e-51b5-4420-b236-b089cd710497",
              description: "installation de chauffage individuelle",
              surface_chauffee: 80,
              rdim: 1,
              nombre_niveau_installation_ch: 1,
              enum_cfg_installation_ch_id: EnumCfgInstallationCh.INSTALLATION_SOLAIRE_APPOINT_BOIS,
              enum_type_installation_id: EnumTypeInstallation.INDIVIDUELLE,
              enum_methode_calcul_conso_id: EnumMethodeCalculConso.CALCUL_SIMPLE,
              enum_methode_saisie_fact_couv_sol_id: 2,
              fch_saisi: 0.9,
            },
            donnee_intermediaire: {
              besoin_ch: 8458.035143042967,
              besoin_ch_depensier: 10995.445685955858,
              conso_ch: 9598.588572,
              conso_ch_depensier: 12478.165143600001,
              fch: 0.9,
            },
            generateur_chauffage_collection: {
              generateur_chauffage: [
                {
                  donnee_entree: {
                    reference: "c84466b8-66a0-445d-a647-52ead5ee5a81",
                    description: "PAC geo",
                    enum_lien_generateur_emetteur_id: EnumLienGenerateurEmetteur.LIEN_1,
                    enum_type_generateur_ch_id: EnumTypeGenerateurCh.PAC_GEOTHERMIQUE,
                    enum_usage_generateur_id: EnumUsageGenerateur.CHAUFFAGE,
                    enum_type_energie_id: EnumTypeEnergie.ELECTRICITE_PAC,
                    position_volume_chauffe: 0,
                    enum_methode_saisie_carac_sys_id: EnumMethodeSaisieCaracSys.VALEUR_FORFAITAIRE,
                    tv_scop_id: 58,
                  },
                  donnee_intermediaire: {
                    scop: 3.0,
                    conso_ch: 9598.588572,
                    conso_ch_depensier: 12478.165143600001,
                  },
                },
              ],
            },
            emetteur_chauffage_collection: {
              emetteur_chauffage: [
                {
                  donnee_entree: {
                    reference: "1bc32bd3-bbdf-4c33-8c1b-305260e9097e",
                    description: "convecteur electrique ancien",
                    surface_chauffee: 2500,
                    enum_lien_generateur_emetteur_id: EnumLienGenerateurEmetteur.LIEN_1,
                    tv_intermittence_id: 2,
                    tv_rendement_emission_id: 7,
                    tv_rendement_distribution_ch_id: 3,
                    tv_rendement_regulation_id: 12,
                    enum_type_emission_distribution_id: EnumTypeEmissionDistribution.CONVECTEUR,
                    enum_equipement_intermittence_id: EnumEquipementIntermittence.THERMOSTAT_D_AMBIANCE,
                    enum_type_regulation_id: EnumTypeRegulation.REGULATION_SUR_TEMPERATURE_AMBIANTE,
                    enum_type_chauffage_id: EnumTypeChauffage.PRINCIPAL,
                    enum_temp_distribution_ch_id: EnumTempDistributionCh.HAUTE_TEMPERATURE,
                    enum_periode_installation_emetteur_id: EnumPeriodeInstallationEmetteur.AVANT_2001,
                  },
                  donnee_intermediaire: {
                    rendement_emission: 0.95,
                    rendement_distribution: 0.85,
                    rendement_regulation: 0.95,
                    i0: 0.84,
                  },
                },
              ],
            },
          },
        ],
      },
      installation_ecs_collection: {
        installation_ecs: [
          {
            donnee_entree: {
              reference: "fc921d59-136e-484e-be52-b226111dcb4a",
              description: "installation hybride ballon electrique solaire",
              enum_cfg_installation_ecs_id: EnumCfgInstallationEcs.INSTALLATION_SOLAIRE,
              enum_type_installation_id: EnumTypeInstallation.INDIVIDUELLE,
              enum_methode_calcul_conso_id: EnumMethodeCalculConso.CALCUL_SIMPLE,
              surface_habitable: 80,
              nombre_logement: 1,
              rdim: 1,
              nombre_niveau_installation_ecs: 1,
              tv_facteur_couverture_solaire_id: 33,
              enum_methode_saisie_fact_couv_sol_id: 1,
              enum_type_installation_solaire_id: 2,
              tv_rendement_distribution_ecs_id: 1,
              enum_bouclage_reseau_ecs_id: EnumBouclageReseauEcs.SANS_BOUCLAGE,
            },
            donnee_intermediaire: {
              rendement_distribution: 0.93,
              besoin_ecs: 1627.1638290072408,
              besoin_ecs_depensier: 2115.312977709413,
              fecs: 0.26,
              production_ecs_solaire: 21830.0472,
              conso_ecs: 83961.72,
              conso_ecs_depensier: 109150.236,
            },
            generateur_ecs_collection: {
              generateur_ecs: [
                {
                  donnee_entree: {
                    reference: "45c3ed8a-1d4b-4284-9791-9f39b6822b76",
                    enum_type_generateur_ecs_id: EnumTypeGenerateurEcs.BALLON_THERMODYNAMIQUE_AIR_AMBIANT,
                    ref_produit_generateur_ecs: "CET",
                    description: "CET",
                    enum_usage_generateur_id: EnumUsageGenerateur.ECS,
                    enum_type_energie_id: EnumTypeEnergie.ELECTRICITE,
                    enum_methode_saisie_carac_sys_id: EnumMethodeSaisieCaracSys.VALEUR_FORFAITAIRE,
                    tv_scop_id: 73,
                    enum_type_stockage_ecs_id: EnumTypeStockageEcs.STOCKAGE_INDEPENDANT,
                    position_volume_chauffe: 1,
                    volume_stockage: 300,
                  },
                  donnee_intermediaire: {
                    ratio_besoin_ecs: 1,
                    cop: 2.5,
                    conso_ecs: 2798.724,
                    conso_ecs_depensier: 3638.3412000000003,
                  },
                },
              ],
            },
          },
        ],
      },
      ventilation_collection: {
        ventilation: [
          {
            donnee_entree: {
              reference: "55ce254d-a064-4ae7-9ff1-55cd6e11eaaf",
              description: "ventilation naturelle",
              plusieurs_facade_exposee: 0,
              surface_ventile: 80,
              tv_q4pa_conv_id: 6,
              enum_methode_saisie_q4pa_conv_id: EnumMethodeSaisieQ4paConv.VALEUR_FORFAITAIRE,
              tv_debits_ventilation_id: 25,
              enum_type_ventilation_id: EnumTypeVentilation.VENTILATION_NATURELLE_CONDUIT,
              ventilation_post_2012: 0,
            },
            donnee_intermediaire: {
              q4pa_conv: 2.2,
              conso_auxiliaire_ventilation: 0,
              hperm: 6.31785,
              hvent: 58.344,
            },
          },
        ],
      },
      sortie: {
        deperdition: {
          hvent: 58.344,
          hperm: 6.31785,
          deperdition_renouvellement_air: 64.66,
          deperdition_mur: 63.16,
          deperdition_plancher_bas: 0,
          deperdition_plancher_haut: 0,
          deperdition_baie_vitree: 38.9,
          deperdition_porte: 2.44,
          deperdition_pont_thermique: 21.292,
          deperdition_enveloppe: 123.352,
        },
        apport_et_besoin: {
          surface_sud_equivalente: 0.127,
          apport_solaire_fr: 0,
          apport_interne_fr: 0,
          apport_solaire_ch: 43.009,
          apport_interne_ch: 1701.36,
          fraction_apport_gratuit_ch: 0.165,
          fraction_apport_gratuit_depensier_ch: 0.19999,
          pertes_distribution_ecs_recup: 999,
          pertes_distribution_ecs_recup_depensier: 999,
          pertes_stockage_ecs_recup: 42,
          pertes_generateur_ch_recup: 0,
          pertes_generateur_ch_recup_depensier: 0,
          nadeq: 2,
          v40_ecs_journalier: 115,
          v40_ecs_journalier_depensier: 163,
          besoin_ch: 8458.035143042967,
          besoin_ch_depensier: 10995.445685955858,
          besoin_ecs: 1627.1638290072408,
          besoin_ecs_depensier: 2115.312977709413,
          besoin_fr: 0,
          besoin_fr_depensier: 0,
        },
        ef_conso: {
          conso_ch: 9598.588572,
          conso_ch_depensier: 12478.165143600001,
          conso_ecs: 2798.724,
          conso_ecs_depensier: 3638.3412000000003,
          conso_eclairage: 42,
          conso_auxiliaire_generation_ch: 42,
          conso_auxiliaire_generation_ch_depensier: 42,
          conso_auxiliaire_distribution_ch: 42,
          conso_auxiliaire_generation_ecs: 42,
          conso_auxiliaire_generation_ecs_depensier: 42,
          conso_auxiliaire_distribution_ecs: 42,
          conso_auxiliaire_ventilation: 0,
          conso_totale_auxiliaire: 42,
          conso_fr: 0,
          conso_fr_depensier: 0,
          conso_5_usages: 20984.61538,
          conso_5_usages_m2: 262.30769,
        },
        ep_conso: {
          ep_conso_ch: 9598.588572,
          ep_conso_ch_depensier: 12478.165143600001,
          ep_conso_ecs: 2798.724,
          ep_conso_ecs_depensier: 3638.3412000000003,
          ep_conso_eclairage: 42,
          ep_conso_auxiliaire_generation_ch: 42,
          ep_conso_auxiliaire_generation_ch_depensier: 42,
          ep_conso_auxiliaire_distribution_ch: 42,
          ep_conso_auxiliaire_generation_ecs: 42,
          ep_conso_auxiliaire_generation_ecs_depensier: 42,
          ep_conso_auxiliaire_distribution_ecs: 42,
          ep_conso_auxiliaire_ventilation: 0,
          ep_conso_totale_auxiliaire: 42,
          ep_conso_fr: 0,
          ep_conso_fr_depensier: 0,
          ep_conso_5_usages: 27280.0,
          ep_conso_5_usages_m2: 341,
          classe_bilan_dpe: EnumEtiquetteDpe.F,
        },
        emission_ges: {
          emission_ges_ch: 9598.588572,
          emission_ges_ch_depensier: 12478.165143600001,
          emission_ges_ecs: 2798.724,
          emission_ges_ecs_depensier: 3638.3412000000003,
          emission_ges_eclairage: 42,
          emission_ges_auxiliaire_generation_ch: 42,
          emission_ges_auxiliaire_generation_ch_depensier: 42,
          emission_ges_auxiliaire_distribution_ch: 42,
          emission_ges_auxiliaire_generation_ecs: 42,
          emission_ges_auxiliaire_generation_ecs_depensier: 42,
          emission_ges_auxiliaire_distribution_ecs: 42,
          emission_ges_auxiliaire_ventilation: 0,
          emission_ges_totale_auxiliaire: 42,
          emission_ges_fr: 0,
          emission_ges_fr_depensier: 0,
          emission_ges_5_usages: 2630.4,
          emission_ges_5_usages_m2: 32.88,
          classe_emission_ges: EnumEtiquetteDpe.D,
        },
        cout: {
          cout_ch: 9598.588572,
          cout_ch_depensier: 12478.165143600001,
          cout_ecs: 2798.724,
          cout_ecs_depensier: 3638.3412000000003,
          cout_eclairage: 42,
          cout_auxiliaire_generation_ch: 42,
          cout_auxiliaire_generation_ch_depensier: 42,
          cout_auxiliaire_distribution_ch: 42,
          cout_auxiliaire_generation_ecs: 42,
          cout_auxiliaire_generation_ecs_depensier: 42,
          cout_auxiliaire_distribution_ecs: 42,
          cout_auxiliaire_ventilation: 0,
          cout_total_auxiliaire: 42,
          cout_fr: 0,
          cout_fr_depensier: 0,
          cout_5_usages: 42,
        },
        production_electricite: {
          production_pv: 0,
          conso_elec_ac: 0,
          conso_elec_ac_ch: 0,
          conso_elec_ac_ecs: 0,
          conso_elec_ac_fr: 0,
          conso_elec_ac_eclairage: 0,
          conso_elec_ac_auxiliaire: 0,
          conso_elec_ac_autre_usage: 0,
        },
        sortie_par_energie_collection: {
          sortie_par_energie: [
            {
              conso_ch: 134178,
              conso_ecs: 12478.165143600001,
              conso_5_usages: 6994.87179,
              enum_type_energie_id: EnumTypeEnergie.ELECTRICITE,
              emission_ges_ch: 42,
              emission_ges_ecs: 42,
              emission_ges_5_usages: 42,
              cout_ch: 42,
              cout_ecs: 42,
              cout_5_usages: 42,
            },
          ],
        },
        confort_ete: {
          isolation_toiture: 0,
          protection_solaire_exterieure: 1,
          aspect_traversant: 0,
          brasseur_air: 0,
          inertie_lourde: 0,
          enum_indicateur_confort_ete_id: 2,
        },
        qualite_isolation: {
          ubat: 42,
          qualite_isol_enveloppe: 4,
          qualite_isol_mur: 4,
          qualite_isol_plancher_haut_toit_terrasse: 4,
          qualite_isol_plancher_bas: 4,
          qualite_isol_menuiserie: 4,
        },
      },
    },
  };
}

/**
 * Test principal
 */
export async function runTests(): Promise<void> {
  console.log("=== Test XML Generator et Validator pour DPE ADEME v2.6 ===\n");

  // Test 1: Création du document DPE
  console.log("1. Création du document DPE de test...");
  const dpe = createTestDPEDocument();
  console.log("✓ Document DPE créé avec succès\n");

  // Test 2: Génération XML
  console.log("2. Génération du XML...");
  const generator = new XMLGenerator();
  const xml = generator.generate(dpe);
  console.log(`✓ XML généré (${xml.length} caractères)\n`);

  // Test 3: Validation XML
  console.log("3. Validation du XML...");
  const validation = validateXML(xml);
  
  if (validation.valid) {
    console.log("✓ XML valide selon le schéma ADEME v2.6\n");
  } else {
    console.log("✗ Erreurs de validation trouvées:");
    validation.schema_errors.forEach((err) => console.log(`  - ${err}`));
    validation.coherence_errors.forEach((err) => console.log(`  - ${err}`));
    console.log("");
  }

  // Test 4: Affichage d'un extrait du XML
  console.log("4. Extrait du XML généré (2000 premiers caractères):");
  console.log(xml.substring(0, 2000));
  console.log("...\n");

  // Test 5: Vérification des sections principales
  console.log("5. Vérification des sections principales:");
  const sections = [
    "administratif",
    "logement",
    "caracteristique_generale",
    "meteo",
    "enveloppe",
    "installation_chauffage_collection",
    "installation_ecs_collection",
    "ventilation_collection",
    "sortie",
  ];

  for (const section of sections) {
    const hasSection = xml.includes(`<${section}>`);
    console.log(`  ${hasSection ? "✓" : "✗"} ${section}`);
  }

  console.log("\n=== Tests terminés ===");
}

// Exécuter les tests si ce fichier est exécuté directement
if (require.main === module) {
  runTests().catch(console.error);
}
