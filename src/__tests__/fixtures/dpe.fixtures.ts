/**
 * Fixtures pour les tests des services
 * Données de test réalistes pour DPE
 */

import {
  DPEDocument,
  EnumModeleDpe,
  EnumVersionDpe,
  EnumPeriodeConstruction,
  EnumZoneClimatique,
  EnumClasseAltitude,
  EnumTypeAdjacence,
  EnumOrientation,
} from "../../types/dpe";

export const mockDPEDocument: DPEDocument = {
  version: "8.0.4",
  administratif: {
    date_visite_diagnostiqueur: "2024-01-15",
    date_etablissement_dpe: "2024-01-16",
    nom_proprietaire: "Jean Dupont",
    enum_modele_dpe_id: EnumModeleDpe.LOGEMENT_EXISTANT,
    enum_version_id: EnumVersionDpe.V2_6,
    diagnostiqueur: {
      usr_logiciel_id: 12345,
      version_logiciel: "1.0.0",
      nom_diagnostiqueur: "Martin",
      prenom_diagnostiqueur: "Sophie",
      mail_diagnostiqueur: "sophie.martin@dpe-expert.fr",
      telephone_diagnostiqueur: "0612345678",
      adresse_diagnostiqueur: "15 rue des Experts",
      entreprise_diagnostiqueur: "DPE Expert SAS",
      numero_certification_diagnostiqueur: "CERT-2024-001",
      organisme_certificateur: "QualiDPE",
    },
    geolocalisation: {
      adresses: {
        adresse_proprietaire: {
          adresse_brut: "25 rue de la Paix",
          code_postal_brut: "75002",
          nom_commune_brut: "Paris",
          label_brut: "25 rue de la Paix 75002 Paris",
          label_brut_avec_complement: "25 rue de la Paix 75002 Paris",
          enum_statut_geocodage_ban_id: 1,
          ban_date_appel: "2024-01-15",
          ban_id: "75102_1234_00025",
          ban_label: "25 rue de la Paix",
          ban_housenumber: "25",
          ban_street: "rue de la Paix",
          ban_citycode: "75102",
          ban_postcode: "75002",
          ban_city: "Paris",
          ban_type: "housenumber",
          ban_score: 0.95,
          ban_x: 2.3314,
          ban_y: 48.8689,
        },
        adresse_bien: {
          adresse_brut: "25 rue de la Paix",
          code_postal_brut: "75002",
          nom_commune_brut: "Paris",
          label_brut: "25 rue de la Paix 75002 Paris",
          label_brut_avec_complement: "25 rue de la Paix 75002 Paris",
          enum_statut_geocodage_ban_id: 1,
          ban_date_appel: "2024-01-15",
          ban_id: "75102_1234_00025",
          ban_label: "25 rue de la Paix",
          ban_housenumber: "25",
          ban_street: "rue de la Paix",
          ban_citycode: "75102",
          ban_postcode: "75002",
          ban_city: "Paris",
          ban_type: "housenumber",
          ban_score: 0.95,
          ban_x: 2.3314,
          ban_y: 48.8689,
        },
      },
    },
  },
  logement: {
    caracteristique_generale: {
      annee_construction: 1985,
      enum_periode_construction_id: EnumPeriodeConstruction.PERIODE_1983_1988,
      enum_methode_application_dpe_log_id: 1,
      surface_habitable_logement: 85.5,
      nombre_niveau_immeuble: 6,
      nombre_niveau_logement: 1,
      hsp: 2.5,
    },
    meteo: {
      enum_zone_climatique_id: EnumZoneClimatique.H1B,
      enum_classe_altitude_id: EnumClasseAltitude.INF_400M,
      batiment_materiaux_anciens: 0,
    },
    enveloppe: {
      inertie: {
        inertie_plancher_bas_lourd: 1,
        inertie_plancher_haut_lourd: 0,
        inertie_paroi_verticale_lourd: 1,
        enum_classe_inertie_id: 2,
      },
      mur_collection: {
        mur: [
          {
            donnee_entree: {
              reference: "MUR-001",
              enum_type_adjacence_id: EnumTypeAdjacence.EXTERIEUR,
              enum_orientation_id: EnumOrientation.NORD,
              surface_paroi_opaque: 25.5,
              paroi_lourde: 1,
              enum_type_isolation_id: 1,
              enum_methode_saisie_u_id: 1,
              enduit_isolant_paroi_ancienne: 0,
            },
            donnee_intermediaire: {
              b: 1.0,
              umur: 0.55,
            },
          },
          {
            donnee_entree: {
              reference: "MUR-002",
              enum_type_adjacence_id: EnumTypeAdjacence.EXTERIEUR,
              enum_orientation_id: EnumOrientation.SUD,
              surface_paroi_opaque: 20.0,
              paroi_lourde: 1,
              enum_type_isolation_id: 1,
              enum_methode_saisie_u_id: 1,
              enduit_isolant_paroi_ancienne: 0,
            },
            donnee_intermediaire: {
              b: 1.0,
              umur: 0.55,
            },
          },
        ],
      },
      baie_vitree_collection: {
        baie_vitree: [
          {
            donnee_entree: {
              reference: "BAIE-001",
              enum_type_adjacence_id: EnumTypeAdjacence.EXTERIEUR,
              enum_orientation_id: EnumOrientation.SUD,
              surface_totale_baie: 8.5,
            },
          },
        ],
      },
      plancher_bas_collection: {
        plancher_bas: [
          {
            donnee_entree: {
              reference: "PB-001",
              enum_type_adjacence_id: EnumTypeAdjacence.VIDE_SANITAIRE,
              surface_paroi_opaque: 85.5,
              paroi_lourde: 1,
              enum_type_isolation_id: 1,
              enum_methode_saisie_u_id: 1,
            },
            donnee_intermediaire: {
              b: 0.85,
              upb: 0.45,
              upb_final: 0.38,
            },
          },
        ],
      },
      plancher_haut_collection: {
        plancher_haut: [
          {
            donnee_entree: {
              reference: "PH-001",
              enum_type_adjacence_id: EnumTypeAdjacence.COMBLE_FAIBLEMENT_VENTILE,
              surface_paroi_opaque: 85.5,
              paroi_lourde: 0,
              enum_type_isolation_id: 2,
              enum_methode_saisie_u_id: 1,
            },
            donnee_intermediaire: {
              b: 0.95,
              uph: 0.35,
            },
          },
        ],
      },
    },
    installation_chauffage_collection: undefined,
    installation_ecs_collection: undefined,
    ventilation_collection: undefined,
  },
};

export const mockInvalidDPEDocument = {
  version: "8.0.4",
  administratif: {
    date_visite_diagnostiqueur: "",
    date_etablissement_dpe: "2024-01-16",
    nom_proprietaire: "",
    enum_modele_dpe_id: 1,
    enum_version_id: "2.6",
    diagnostiqueur: {
      usr_logiciel_id: 12345,
      version_logiciel: "1.0.0",
      nom_diagnostiqueur: "Martin",
      prenom_diagnostiqueur: "Sophie",
      mail_diagnostiqueur: "invalid-email",
      telephone_diagnostiqueur: "0612345678",
      adresse_diagnostiqueur: "15 rue des Experts",
      entreprise_diagnostiqueur: "DPE Expert SAS",
      numero_certification_diagnostiqueur: "CERT-2024-001",
      organisme_certificateur: "QualiDPE",
    },
    geolocalisation: {
      adresses: {
        adresse_proprietaire: {
          adresse_brut: "",
          code_postal_brut: "",
          nom_commune_brut: "",
          label_brut: "",
          label_brut_avec_complement: "",
          enum_statut_geocodage_ban_id: 1,
          ban_date_appel: "2024-01-15",
          ban_id: "",
          ban_label: "",
          ban_housenumber: "",
          ban_street: "",
          ban_citycode: "",
          ban_postcode: "",
          ban_city: "",
          ban_type: "",
          ban_score: 0,
          ban_x: 0,
          ban_y: 0,
        },
        adresse_bien: {
          adresse_brut: "",
          code_postal_brut: "",
          nom_commune_brut: "",
          label_brut: "",
          label_brut_avec_complement: "",
          enum_statut_geocodage_ban_id: 1,
          ban_date_appel: "2024-01-15",
          ban_id: "",
          ban_label: "",
          ban_housenumber: "",
          ban_street: "",
          ban_citycode: "",
          ban_postcode: "",
          ban_city: "",
          ban_type: "",
          ban_score: 0,
          ban_x: 0,
          ban_y: 0,
        },
      },
    },
  },
  logement: {
    caracteristique_generale: {
      annee_construction: 0,
      enum_periode_construction_id: 1,
      enum_methode_application_dpe_log_id: 1,
      surface_habitable_logement: -10,
      nombre_niveau_immeuble: 0,
      nombre_niveau_logement: 0,
      hsp: 0,
    },
    meteo: {
      enum_zone_climatique_id: 1,
      enum_classe_altitude_id: 1,
      batiment_materiaux_anciens: 0,
    },
    enveloppe: {
      inertie: {
        inertie_plancher_bas_lourd: 0,
        inertie_plancher_haut_lourd: 0,
        inertie_paroi_verticale_lourd: 0,
        enum_classe_inertie_id: 1,
      },
      mur_collection: {
        mur: [],
      },
      plancher_bas_collection: {
        plancher_bas: [],
      },
      plancher_haut_collection: {
        plancher_haut: [],
      },
    },
    ventilation: {},
  },
};

export const mockStep1Data = {
  numero_dpe: "DPE-24-001-001-A",
  date_visite: "2024-01-15",
  proprietaire: {
    nom: "Jean Dupont",
  },
  adresse_logement: {
    adresse: "25 rue de la Paix, 75002 Paris",
  },
};

export const mockStep2Data = {
  caracteristiques_generales: {
    type_batiment: "maison",
    periode_construction: "1983-1988",
    surface_habitable: 85.5,
    nombre_niveaux: 2,
  },
};

export const mockStep2InvalidData = {
  caracteristiques_generales: {
    type_batiment: "maison",
    periode_construction: "1983-1988",
    surface_habitable: -10,
    nombre_niveaux: 100,
  },
};

/**
 * Crée un DPE complet pour les tests
 */
export function createMockDPE(overrides: Partial<DPEDocument> = {}): DPEDocument {
  return {
    ...mockDPEDocument,
    ...overrides,
    administratif: {
      ...mockDPEDocument.administratif,
      ...overrides.administratif,
    },
    logement: {
      ...mockDPEDocument.logement,
      ...overrides.logement,
      caracteristique_generale: {
        ...mockDPEDocument.logement.caracteristique_generale,
        ...overrides.logement?.caracteristique_generale,
      },
      meteo: {
        ...mockDPEDocument.logement.meteo,
        ...overrides.logement?.meteo,
      },
      enveloppe: {
        ...mockDPEDocument.logement.enveloppe,
        ...overrides.logement?.enveloppe,
      },
    },
  };
}

/**
 * Crée un DPE minimal pour les tests rapides
 */
export function createMinimalMockDPE(): Partial<DPEDocument> {
  return {
    version: "8.0.4",
    administratif: {
      date_visite_diagnostiqueur: "2024-01-15",
      date_etablissement_dpe: "2024-01-16",
      nom_proprietaire: "Test",
      enum_modele_dpe_id: EnumModeleDpe.LOGEMENT_EXISTANT,
      enum_version_id: EnumVersionDpe.V2_6,
      diagnostiqueur: {
        usr_logiciel_id: 1,
        version_logiciel: "1.0.0",
        nom_diagnostiqueur: "Test",
        prenom_diagnostiqueur: "Test",
        mail_diagnostiqueur: "test@test.com",
        telephone_diagnostiqueur: "0123456789",
        adresse_diagnostiqueur: "Test",
        entreprise_diagnostiqueur: "Test",
        numero_certification_diagnostiqueur: "CERT-001",
        organisme_certificateur: "Test",
      },
      geolocalisation: {
        adresses: {
          adresse_proprietaire: {
            adresse_brut: "Test",
            code_postal_brut: "75000",
            nom_commune_brut: "Paris",
            label_brut: "Test",
            label_brut_avec_complement: "Test",
            enum_statut_geocodage_ban_id: 1,
            ban_date_appel: "2024-01-15",
            ban_id: "test",
            ban_label: "Test",
            ban_housenumber: "1",
            ban_street: "Test",
            ban_citycode: "75000",
            ban_postcode: "75000",
            ban_city: "Paris",
            ban_type: "housenumber",
            ban_score: 0.9,
            ban_x: 2.35,
            ban_y: 48.85,
          },
          adresse_bien: {
            adresse_brut: "Test",
            code_postal_brut: "75000",
            nom_commune_brut: "Paris",
            label_brut: "Test",
            label_brut_avec_complement: "Test",
            enum_statut_geocodage_ban_id: 1,
            ban_date_appel: "2024-01-15",
            ban_id: "test",
            ban_label: "Test",
            ban_housenumber: "1",
            ban_street: "Test",
            ban_citycode: "75000",
            ban_postcode: "75000",
            ban_city: "Paris",
            ban_type: "housenumber",
            ban_score: 0.9,
            ban_x: 2.35,
            ban_y: 48.85,
          },
        },
      },
    },
    logement: {
      caracteristique_generale: {
        annee_construction: 2000,
        enum_periode_construction_id: EnumPeriodeConstruction.PERIODE_1989_2000,
        enum_methode_application_dpe_log_id: 1,
        surface_habitable_logement: 100,
        nombre_niveau_immeuble: 1,
        nombre_niveau_logement: 1,
        hsp: 2.5,
      },
      meteo: {
        enum_zone_climatique_id: EnumZoneClimatique.H1B,
        enum_classe_altitude_id: EnumClasseAltitude.INF_400M,
        batiment_materiaux_anciens: 0,
      },
      enveloppe: {
        inertie: {
          inertie_plancher_bas_lourd: 1,
          inertie_plancher_haut_lourd: 0,
          inertie_paroi_verticale_lourd: 1,
          enum_classe_inertie_id: 2,
        },
        mur_collection: {
          mur: [
            {
              donnee_entree: {
                reference: "MUR-001",
                enum_type_adjacence_id: EnumTypeAdjacence.EXTERIEUR,
                enum_orientation_id: EnumOrientation.NORD,
                surface_paroi_opaque: 50,
                paroi_lourde: 1,
                enum_type_isolation_id: 1,
                enum_methode_saisie_u_id: 1,
                enduit_isolant_paroi_ancienne: 0,
              },
              donnee_intermediaire: {
                b: 1,
                umur: 0.5,
              },
            },
          ],
        },
        baie_vitree_collection: {
          baie_vitree: [],
        },
        plancher_bas_collection: {
          plancher_bas: [
            {
              donnee_entree: {
                reference: "PB-001",
                enum_type_adjacence_id: EnumTypeAdjacence.VIDE_SANITAIRE,
                surface_paroi_opaque: 100,
                paroi_lourde: 1,
                enum_type_isolation_id: 1,
                enum_methode_saisie_u_id: 1,
              },
              donnee_intermediaire: {
                b: 0.85,
                upb: 0.4,
                upb_final: 0.34,
              },
            },
          ],
        },
        plancher_haut_collection: {
          plancher_haut: [
            {
              donnee_entree: {
                reference: "PH-001",
                enum_type_adjacence_id: EnumTypeAdjacence.COMBLE_FAIBLEMENT_VENTILE,
                surface_paroi_opaque: 100,
                paroi_lourde: 0,
                enum_type_isolation_id: 2,
                enum_methode_saisie_u_id: 1,
              },
              donnee_intermediaire: {
                b: 0.95,
                uph: 0.3,
              },
            },
          ],
        },
      },
    },
  };
}
