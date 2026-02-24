/**
 * XML Generator pour DPE ADEME v2.6
 * Génération complète de XML avec support de tous les cas edge
 * 
 * @module xml-generator
 * @version 2.6.0
 * 
 * CHANGELOG:
 * - 2.6.0: Support complet de tous les types DPE
 * - 2.6.0: Gestion des collections (mur, baie_vitree, etc.)
 * - 2.6.0: Support des installations (chauffage, ECS, ventilation)
 * - 2.6.0: Support complet de la section Sortie
 * - 2.6.0: Échappement XML sécurisé
 * - 2.6.0: Gestion des valeurs null/undefined
 * - 2.6.0: Validation avant génération
 */

import { XMLBuilder } from "fast-xml-parser";
import {
  DPEDocument,
  Administratif,
  Diagnostiqueur,
  Geolocalisation,
  Adresses,
  AdresseDetail,
  InformationFormulaireConsentement,
  Logement,
  CaracteristiqueGenerale,
  Meteo,
  Enveloppe,
  Inertie,
  MurCollection,
  Mur,
  MurDonneeEntree,
  MurDonneeIntermediaire,
  BaieVitreeCollection,
  BaieVitree,
  BaieVitreeDonneeEntree,
  BaieVitreeDonneeIntermediaire,
  PlancherBasCollection,
  PlancherBas,
  PlancherBasDonneeEntree,
  PlancherBasDonneeIntermediaire,
  PlancherHautCollection,
  PlancherHaut,
  PlancherHautDonneeEntree,
  PlancherHautDonneeIntermediaire,
  PorteCollection,
  Porte,
  PorteDonneeEntree,
  PorteDonneeIntermediaire,
  ETSCollection,
  ETS,
  ETSDonneeEntree,
  ETSDonneeIntermediaire,
  BaieETSCollection,
  BaieETS,
  BaieETSDonneeEntree,
  PontThermiqueCollection,
  PontThermique,
  PontThermiqueDonneeEntree,
  PontThermiqueDonneeIntermediaire,
  InstallationChauffageCollection,
  InstallationChauffage,
  InstallationChauffageDonneeEntree,
  InstallationChauffageDonneeIntermediaire,
  GenerateurChauffageCollection,
  GenerateurChauffage,
  GenerateurChauffageDonneeEntree,
  GenerateurChauffageDonneeIntermediaire,
  EmetteurChauffageCollection,
  EmetteurChauffage,
  EmetteurChauffageDonneeEntree,
  EmetteurChauffageDonneeIntermediaire,
  InstallationECSCollection,
  InstallationECS,
  InstallationECSDonneeEntree,
  InstallationECSDonneeIntermediaire,
  GenerateurECSCollection,
  GenerateurECS,
  GenerateurECSDonneeEntree,
  GenerateurECSDonneeIntermediaire,
  VentilationCollection,
  Ventilation,
  VentilationDonneeEntree,
  VentilationDonneeIntermediaire,
  ClimatisationCollection,
  Climatisation,
  ClimatisationDonneeEntree,
  ClimatisationDonneeIntermediaire,
  Sortie,
  SortieDeperdition,
  SortieApportEtBesoin,
  SortieEfConso,
  SortieEpConso,
  SortieEmissionGes,
  SortieCout,
  SortieProductionElectricite,
  SortieParEnergieCollection,
  SortieParEnergie,
  SortieConfortEte,
  SortieQualiteIsolation,
  XMLValidationResult,
} from "../types/dpe";

// ============================================================================
// CONSTANTES
// ============================================================================

const XML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>`;

const XML_NAMESPACES = {
  "@_xmlns": "http://www.ademe.fr/dpe/2.6",
  "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  "@_xsi:schemaLocation": "http://www.ademe.fr/dpe/2.6 dpe_v2.6.xsd",
};

const XML_BUILDER_OPTIONS = {
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  ignoreAttributes: false,
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
  preserveOrder: true,
};

// ============================================================================
// OPTIONS DE GÉNÉRATION
// ============================================================================

export interface XMLGeneratorOptions {
  includeNullValues?: boolean;
  includeEmptyCollections?: boolean;
  validateBeforeGenerate?: boolean;
  formatOutput?: boolean;
  encoding?: "UTF-8";
}

const DEFAULT_OPTIONS: XMLGeneratorOptions = {
  includeNullValues: false,
  includeEmptyCollections: true,
  validateBeforeGenerate: false,
  formatOutput: true,
  encoding: "UTF-8",
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class XMLGenerator {
  private options: XMLGeneratorOptions;

  constructor(options: XMLGeneratorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Génère le XML complet à partir d'un DPE
   */
  generate(dpe: DPEDocument): string {
    if (this.options.validateBeforeGenerate) {
      const validation = this.validate(dpe);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.schema_errors.join(", ")}`);
      }
    }

    const xmlData = this.buildXMLDPE(dpe);

    const builder = new XMLBuilder({
      ...XML_BUILDER_OPTIONS,
      format: this.options.formatOutput,
    });

    // Pour fast-xml-parser v4, on passe directement l'objet avec la racine
    const xmlContent = builder.build(xmlData);
    return `${XML_HEADER}\n${xmlContent}`;
  }

  /**
   * Construit la structure XML du DPE
   */
  private buildXMLDPE(dpe: DPEDocument): Record<string, unknown> {
    return {
      dpe: {
        "@_version": dpe.version || "8.0.4",
        ...XML_NAMESPACES,
        administratif: this.buildXMLAdministratif(dpe.administratif),
        logement: this.buildXMLLogement(dpe.logement),
      }
    };
  }

  // ============================================================================
  // SECTION ADMINISTRATIF
  // ============================================================================

  private buildXMLAdministratif(admin: Administratif): Record<string, unknown> {
    const result: Record<string, unknown> = {
      date_visite_diagnostiqueur: admin.date_visite_diagnostiqueur,
      date_etablissement_dpe: admin.date_etablissement_dpe,
      nom_proprietaire: this.escapeXml(admin.nom_proprietaire),
      enum_modele_dpe_id: admin.enum_modele_dpe_id,
      enum_version_id: admin.enum_version_id,
      diagnostiqueur: this.buildXMLDiagnostiqueur(admin.diagnostiqueur),
      geolocalisation: this.buildXMLGeolocalisation(admin.geolocalisation),
    };

    if (admin.nom_proprietaire_installation_commune) {
      result.nom_proprietaire_installation_commune = this.escapeXml(admin.nom_proprietaire_installation_commune);
    }

    if (admin.enum_consentement_formulaire_id !== undefined) {
      result.enum_consentement_formulaire_id = admin.enum_consentement_formulaire_id;
    }

    if (admin.enum_commanditaire_id !== undefined) {
      result.enum_commanditaire_id = admin.enum_commanditaire_id;
    }

    if (admin.information_formulaire_consentement) {
      result.information_formulaire_consentement = this.buildXMLInformationFormulaireConsentement(admin.information_formulaire_consentement);
    }

    if (admin.horodatage_historisation) {
      result.horodatage_historisation = admin.horodatage_historisation;
    }

    return result;
  }

  private buildXMLDiagnostiqueur(diag: Diagnostiqueur): Record<string, unknown> {
    return {
      usr_logiciel_id: diag.usr_logiciel_id,
      version_logiciel: diag.version_logiciel,
      nom_diagnostiqueur: this.escapeXml(diag.nom_diagnostiqueur),
      prenom_diagnostiqueur: this.escapeXml(diag.prenom_diagnostiqueur),
      mail_diagnostiqueur: diag.mail_diagnostiqueur,
      telephone_diagnostiqueur: diag.telephone_diagnostiqueur,
      adresse_diagnostiqueur: this.escapeXml(diag.adresse_diagnostiqueur),
      entreprise_diagnostiqueur: this.escapeXml(diag.entreprise_diagnostiqueur),
      numero_certification_diagnostiqueur: diag.numero_certification_diagnostiqueur,
      organisme_certificateur: diag.organisme_certificateur,
    };
  }

  private buildXMLGeolocalisation(geo: Geolocalisation): Record<string, unknown> {
    const result: Record<string, unknown> = {
      adresses: this.buildXMLAdresses(geo.adresses),
    };

    if (geo.numero_fiscal_local) {
      result.numero_fiscal_local = geo.numero_fiscal_local;
    }

    if (geo.idpar) {
      result.idpar = geo.idpar;
    }

    if (geo.immatriculation_copropriete) {
      result.immatriculation_copropriete = geo.immatriculation_copropriete;
    }

    return result;
  }

  private buildXMLAdresses(adresses: Adresses): Record<string, unknown> {
    const result: Record<string, unknown> = {
      adresse_proprietaire: this.buildXMLAdresse(adresses.adresse_proprietaire),
      adresse_bien: this.buildXMLAdresse(adresses.adresse_bien),
    };

    if (adresses.adresse_proprietaire_installation_commune) {
      result.adresse_proprietaire_installation_commune = this.buildXMLAdresse(adresses.adresse_proprietaire_installation_commune);
    }

    return result;
  }

  private buildXMLAdresse(adresse: AdresseDetail): Record<string, unknown> {
    const result: Record<string, unknown> = {
      adresse_brut: this.escapeXml(adresse.adresse_brut),
      code_postal_brut: adresse.code_postal_brut,
      nom_commune_brut: this.escapeXml(adresse.nom_commune_brut),
      label_brut: this.escapeXml(adresse.label_brut),
      label_brut_avec_complement: this.escapeXml(adresse.label_brut_avec_complement),
      enum_statut_geocodage_ban_id: adresse.enum_statut_geocodage_ban_id,
      ban_date_appel: adresse.ban_date_appel,
      ban_id: adresse.ban_id,
      ban_label: this.escapeXml(adresse.ban_label),
      ban_housenumber: adresse.ban_housenumber,
      ban_street: this.escapeXml(adresse.ban_street),
      ban_citycode: adresse.ban_citycode,
      ban_postcode: adresse.ban_postcode,
      ban_city: this.escapeXml(adresse.ban_city),
      ban_type: adresse.ban_type,
      ban_score: adresse.ban_score,
      ban_x: adresse.ban_x,
      ban_y: adresse.ban_y,
    };

    // Champs optionnels
    if (adresse.compl_nom_residence) result.compl_nom_residence = this.escapeXml(adresse.compl_nom_residence);
    if (adresse.compl_ref_batiment) result.compl_ref_batiment = adresse.compl_ref_batiment;
    if (adresse.compl_etage_appartement) result.compl_etage_appartement = adresse.compl_etage_appartement;
    if (adresse.compl_ref_cage_escalier) result.compl_ref_cage_escalier = adresse.compl_ref_cage_escalier;
    if (adresse.compl_ref_logement) result.compl_ref_logement = adresse.compl_ref_logement;

    return result;
  }

  private buildXMLInformationFormulaireConsentement(info: InformationFormulaireConsentement): Record<string, unknown> {
    return {
      nom_formulaire: this.escapeXml(info.nom_formulaire),
      personne_morale: info.personne_morale,
      siren_formulaire: info.siren_formulaire,
      mail: info.mail,
      telephone: info.telephone,
      label_adresse: this.escapeXml(info.label_adresse),
      label_adresse_avec_complement: this.escapeXml(info.label_adresse_avec_complement),
    };
  }

  // ============================================================================
  // SECTION LOGEMENT
  // ============================================================================

  private buildXMLLogement(logement: Logement): Record<string, unknown> {
    const result: Record<string, unknown> = {
      caracteristique_generale: this.buildXMLCaracteristiqueGenerale(logement.caracteristique_generale),
      meteo: this.buildXMLMeteo(logement.meteo),
      enveloppe: this.buildXMLEnveloppe(logement.enveloppe),
    };

    if (logement.installation_chauffage_collection) {
      result.installation_chauffage_collection = this.buildXMLInstallationChauffageCollection(logement.installation_chauffage_collection);
    }

    if (logement.installation_ecs_collection) {
      result.installation_ecs_collection = this.buildXMLInstallationECSCollection(logement.installation_ecs_collection);
    }

    if (logement.ventilation_collection) {
      result.ventilation_collection = this.buildXMLVentilationCollection(logement.ventilation_collection);
    }

    if (logement.climatisation_collection) {
      result.climatisation_collection = this.buildXMLClimatisationCollection(logement.climatisation_collection);
    }

    if (logement.sortie) {
      result.sortie = this.buildXMLSortie(logement.sortie);
    }

    return result;
  }

  private buildXMLCaracteristiqueGenerale(cg: CaracteristiqueGenerale): Record<string, unknown> {
    const result: Record<string, unknown> = {
      enum_periode_construction_id: cg.enum_periode_construction_id,
      enum_methode_application_dpe_log_id: cg.enum_methode_application_dpe_log_id,
      hsp: cg.hsp,
    };

    if (cg.annee_construction !== undefined) result.annee_construction = cg.annee_construction;
    if (cg.enum_calcul_echantillonnage_id !== undefined) result.enum_calcul_echantillonnage_id = cg.enum_calcul_echantillonnage_id;
    if (cg.surface_habitable_logement !== undefined) result.surface_habitable_logement = cg.surface_habitable_logement;
    if (cg.nombre_niveau_immeuble !== undefined) result.nombre_niveau_immeuble = cg.nombre_niveau_immeuble;
    if (cg.nombre_niveau_logement !== undefined) result.nombre_niveau_logement = cg.nombre_niveau_logement;
    if (cg.surface_habitable_immeuble !== undefined) result.surface_habitable_immeuble = cg.surface_habitable_immeuble;
    if (cg.surface_tertiaire_immeuble !== undefined) result.surface_tertiaire_immeuble = cg.surface_tertiaire_immeuble;
    if (cg.nombre_appartement !== undefined) result.nombre_appartement = cg.nombre_appartement;
    if (cg.appartement_non_visite !== undefined) result.appartement_non_visite = cg.appartement_non_visite;

    return result;
  }

  private buildXMLMeteo(meteo: Meteo): Record<string, unknown> {
    const result: Record<string, unknown> = {
      enum_zone_climatique_id: meteo.enum_zone_climatique_id,
      enum_classe_altitude_id: meteo.enum_classe_altitude_id,
      batiment_materiaux_anciens: meteo.batiment_materiaux_anciens,
    };

    if (meteo.altitude !== undefined) result.altitude = meteo.altitude;

    return result;
  }

  // ============================================================================
  // SECTION ENVELOPPE
  // ============================================================================

  private buildXMLEnveloppe(enveloppe: Enveloppe): Record<string, unknown> {
    const result: Record<string, unknown> = {
      inertie: this.buildXMLInertie(enveloppe.inertie),
      mur_collection: this.buildXMLMurCollection(enveloppe.mur_collection),
    };

    if (enveloppe.baie_vitree_collection) {
      result.baie_vitree_collection = this.buildXMLBaieVitreeCollection(enveloppe.baie_vitree_collection);
    }

    if (enveloppe.plancher_bas_collection) {
      result.plancher_bas_collection = this.buildXMLPlancherBasCollection(enveloppe.plancher_bas_collection);
    }

    if (enveloppe.plancher_haut_collection) {
      result.plancher_haut_collection = this.buildXMLPlancherHautCollection(enveloppe.plancher_haut_collection);
    }

    if (enveloppe.porte_collection) {
      result.porte_collection = this.buildXMLPorteCollection(enveloppe.porte_collection);
    }

    if (enveloppe.ets_collection) {
      result.ets_collection = this.buildXMLETSCollection(enveloppe.ets_collection);
    }

    if (enveloppe.pont_thermique_collection) {
      result.pont_thermique_collection = this.buildXMLPontThermiqueCollection(enveloppe.pont_thermique_collection);
    }

    return result;
  }

  private buildXMLInertie(inertie: Inertie): Record<string, unknown> {
    return {
      inertie_plancher_bas_lourd: inertie.inertie_plancher_bas_lourd,
      inertie_plancher_haut_lourd: inertie.inertie_plancher_haut_lourd,
      inertie_paroi_verticale_lourd: inertie.inertie_paroi_verticale_lourd,
      enum_classe_inertie_id: inertie.enum_classe_inertie_id,
    };
  }

  // ============================================================================
  // COLLECTIONS ENVELOPPE
  // ============================================================================

  private buildXMLMurCollection(collection: MurCollection): Record<string, unknown> {
    const murs = this.normalizeToArray(collection.mur);
    return {
      mur: murs.map((mur) => this.buildXMLMur(mur)),
    };
  }

  private buildXMLMur(mur: Mur): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLMurDonneeEntree(mur.donnee_entree),
      donnee_intermediaire: this.buildXMLMurDonneeIntermediaire(mur.donnee_intermediaire),
    };
  }

  private buildXMLMurDonneeEntree(de: MurDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_adjacence_id: de.enum_type_adjacence_id,
      enum_orientation_id: de.enum_orientation_id,
      surface_paroi_opaque: de.surface_paroi_opaque,
      paroi_lourde: de.paroi_lourde,
      enum_type_isolation_id: de.enum_type_isolation_id,
      enum_methode_saisie_u_id: de.enum_methode_saisie_u_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.reference_lnc) result.reference_lnc = de.reference_lnc;
    if (de.tv_coef_reduction_deperdition_id !== undefined) result.tv_coef_reduction_deperdition_id = de.tv_coef_reduction_deperdition_id;
    if (de.surface_aiu !== undefined) result.surface_aiu = de.surface_aiu;
    if (de.surface_aue !== undefined) result.surface_aue = de.surface_aue;
    if (de.enum_cfg_isolation_lnc_id !== undefined) result.enum_cfg_isolation_lnc_id = de.enum_cfg_isolation_lnc_id;
    if (de.surface_paroi_totale !== undefined) result.surface_paroi_totale = de.surface_paroi_totale;
    if (de.umur0_saisi !== undefined) result.umur0_saisi = de.umur0_saisi;
    if (de.umur_saisi !== undefined) result.umur_saisi = de.umur_saisi;
    if (de.tv_umur0_id !== undefined) result.tv_umur0_id = de.tv_umur0_id;
    if (de.tv_umur_id !== undefined) result.tv_umur_id = de.tv_umur_id;
    if (de.epaisseur_structure !== undefined) result.epaisseur_structure = de.epaisseur_structure;
    if (de.enum_materiaux_structure_mur_id !== undefined) result.enum_materiaux_structure_mur_id = de.enum_materiaux_structure_mur_id;
    if (de.enum_methode_saisie_u0_id !== undefined) result.enum_methode_saisie_u0_id = de.enum_methode_saisie_u0_id;
    if (de.enum_type_doublage_id !== undefined) result.enum_type_doublage_id = de.enum_type_doublage_id;
    if (de.enduit_isolant_paroi_ancienne !== undefined) result.enduit_isolant_paroi_ancienne = de.enduit_isolant_paroi_ancienne;
    if (de.epaisseur_isolation !== undefined) result.epaisseur_isolation = de.epaisseur_isolation;
    if (de.resistance_isolation !== undefined) result.resistance_isolation = de.resistance_isolation;

    return result;
  }

  private buildXMLMurDonneeIntermediaire(di: MurDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      b: di.b,
      umur: di.umur,
    };

    if (di.umur0 !== undefined) result.umur0 = di.umur0;

    return result;
  }

  private buildXMLBaieVitreeCollection(collection: BaieVitreeCollection): Record<string, unknown> {
    const baies = this.normalizeToArray(collection.baie_vitree);
    return {
      baie_vitree: baies.map((baie) => this.buildXMLBaieVitree(baie)),
    };
  }

  private buildXMLBaieVitree(baie: BaieVitree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      donnee_entree: this.buildXMLBaieVitreeDonneeEntree(baie.donnee_entree),
    };

    if (baie.donnee_intermediaire) {
      result.donnee_intermediaire = this.buildXMLBaieVitreeDonneeIntermediaire(baie.donnee_intermediaire);
    }

    return result;
  }

  private buildXMLBaieVitreeDonneeEntree(de: BaieVitreeDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_adjacence_id: de.enum_type_adjacence_id,
      enum_orientation_id: de.enum_orientation_id,
      surface_totale_baie: de.surface_totale_baie,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.reference_paroi) result.reference_paroi = de.reference_paroi;
    if (de.tv_coef_reduction_deperdition_id !== undefined) result.tv_coef_reduction_deperdition_id = de.tv_coef_reduction_deperdition_id;
    if (de.nb_baie !== undefined) result.nb_baie = de.nb_baie;
    if (de.tv_ug_id !== undefined) result.tv_ug_id = de.tv_ug_id;
    if (de.enum_type_vitrage_id !== undefined) result.enum_type_vitrage_id = de.enum_type_vitrage_id;
    if (de.enum_inclinaison_vitrage_id !== undefined) result.enum_inclinaison_vitrage_id = de.enum_inclinaison_vitrage_id;
    if (de.enum_methode_saisie_perf_vitrage_id !== undefined) result.enum_methode_saisie_perf_vitrage_id = de.enum_methode_saisie_perf_vitrage_id;
    if (de.tv_uw_id !== undefined) result.tv_uw_id = de.tv_uw_id;
    if (de.enum_type_materiaux_menuiserie_id !== undefined) result.enum_type_materiaux_menuiserie_id = de.enum_type_materiaux_menuiserie_id;
    if (de.enum_type_baie_id !== undefined) result.enum_type_baie_id = de.enum_type_baie_id;
    if (de.double_fenetre !== undefined) result.double_fenetre = de.double_fenetre;
    if (de.tv_deltar_id !== undefined) result.tv_deltar_id = de.tv_deltar_id;
    if (de.tv_ujn_id !== undefined) result.tv_ujn_id = de.tv_ujn_id;
    if (de.enum_type_fermeture_id !== undefined) result.enum_type_fermeture_id = de.enum_type_fermeture_id;
    if (de.presence_protection_solaire_hors_fermeture !== undefined) result.presence_protection_solaire_hors_fermeture = de.presence_protection_solaire_hors_fermeture;
    if (de.presence_retour_isolation !== undefined) result.presence_retour_isolation = de.presence_retour_isolation;
    if (de.presence_joint !== undefined) result.presence_joint = de.presence_joint;
    if (de.largeur_dormant !== undefined) result.largeur_dormant = de.largeur_dormant;
    if (de.tv_sw_id !== undefined) result.tv_sw_id = de.tv_sw_id;
    if (de.enum_type_pose_id !== undefined) result.enum_type_pose_id = de.enum_type_pose_id;
    if (de.tv_coef_masque_proche_id !== undefined) result.tv_coef_masque_proche_id = de.tv_coef_masque_proche_id;
    if (de.masque_lointain_non_homogene_collection) result.masque_lointain_non_homogene_collection = de.masque_lointain_non_homogene_collection;

    return result;
  }

  private buildXMLBaieVitreeDonneeIntermediaire(di: BaieVitreeDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      b: di.b,
    };

    if (di.ug !== undefined) result.ug = di.ug;
    if (di.uw !== undefined) result.uw = di.uw;
    if (di.ujn !== undefined) result.ujn = di.ujn;
    if (di.u_menuiserie !== undefined) result.u_menuiserie = di.u_menuiserie;
    if (di.sw !== undefined) result.sw = di.sw;
    if (di.fe1 !== undefined) result.fe1 = di.fe1;
    if (di.fe2 !== undefined) result.fe2 = di.fe2;

    return result;
  }

  private buildXMLPlancherBasCollection(collection: PlancherBasCollection): Record<string, unknown> {
    const planchers = this.normalizeToArray(collection.plancher_bas);
    return {
      plancher_bas: planchers.map((plancher) => this.buildXMLPlancherBas(plancher)),
    };
  }

  private buildXMLPlancherBas(plancher: PlancherBas): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLPlancherBasDonneeEntree(plancher.donnee_entree),
      donnee_intermediaire: this.buildXMLPlancherBasDonneeIntermediaire(plancher.donnee_intermediaire),
    };
  }

  private buildXMLPlancherBasDonneeEntree(de: PlancherBasDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_adjacence_id: de.enum_type_adjacence_id,
      surface_paroi_opaque: de.surface_paroi_opaque,
      paroi_lourde: de.paroi_lourde,
      enum_type_isolation_id: de.enum_type_isolation_id,
      enum_methode_saisie_u_id: de.enum_methode_saisie_u_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.tv_coef_reduction_deperdition_id !== undefined) result.tv_coef_reduction_deperdition_id = de.tv_coef_reduction_deperdition_id;
    if (de.tv_upb0_id !== undefined) result.tv_upb0_id = de.tv_upb0_id;
    if (de.tv_upb_id !== undefined) result.tv_upb_id = de.tv_upb_id;
    if (de.enum_type_plancher_bas_id !== undefined) result.enum_type_plancher_bas_id = de.enum_type_plancher_bas_id;
    if (de.enum_methode_saisie_u0_id !== undefined) result.enum_methode_saisie_u0_id = de.enum_methode_saisie_u0_id;
    if (de.enum_periode_isolation_id !== undefined) result.enum_periode_isolation_id = de.enum_periode_isolation_id;
    if (de.calcul_ue !== undefined) result.calcul_ue = de.calcul_ue;
    if (de.perimetre_ue !== undefined) result.perimetre_ue = de.perimetre_ue;
    if (de.surface_ue !== undefined) result.surface_ue = de.surface_ue;
    if (de.ue !== undefined) result.ue = de.ue;

    return result;
  }

  private buildXMLPlancherBasDonneeIntermediaire(di: PlancherBasDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      b: di.b,
      upb: di.upb,
      upb_final: di.upb_final,
    };

    if (di.upb0 !== undefined) result.upb0 = di.upb0;

    return result;
  }

  private buildXMLPlancherHautCollection(collection: PlancherHautCollection): Record<string, unknown> {
    const planchers = this.normalizeToArray(collection.plancher_haut);
    return {
      plancher_haut: planchers.map((plancher) => this.buildXMLPlancherHaut(plancher)),
    };
  }

  private buildXMLPlancherHaut(plancher: PlancherHaut): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLPlancherHautDonneeEntree(plancher.donnee_entree),
      donnee_intermediaire: this.buildXMLPlancherHautDonneeIntermediaire(plancher.donnee_intermediaire),
    };
  }

  private buildXMLPlancherHautDonneeEntree(de: PlancherHautDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_adjacence_id: de.enum_type_adjacence_id,
      surface_paroi_opaque: de.surface_paroi_opaque,
      paroi_lourde: de.paroi_lourde,
      enum_type_isolation_id: de.enum_type_isolation_id,
      enum_methode_saisie_u_id: de.enum_methode_saisie_u_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.tv_coef_reduction_deperdition_id !== undefined) result.tv_coef_reduction_deperdition_id = de.tv_coef_reduction_deperdition_id;
    if (de.surface_aiu !== undefined) result.surface_aiu = de.surface_aiu;
    if (de.surface_aue !== undefined) result.surface_aue = de.surface_aue;
    if (de.enum_cfg_isolation_lnc_id !== undefined) result.enum_cfg_isolation_lnc_id = de.enum_cfg_isolation_lnc_id;
    if (de.tv_uph0_id !== undefined) result.tv_uph0_id = de.tv_uph0_id;
    if (de.tv_uph_id !== undefined) result.tv_uph_id = de.tv_uph_id;
    if (de.enum_type_plancher_haut_id !== undefined) result.enum_type_plancher_haut_id = de.enum_type_plancher_haut_id;
    if (de.enum_methode_saisie_u0_id !== undefined) result.enum_methode_saisie_u0_id = de.enum_methode_saisie_u0_id;
    if (de.enum_periode_isolation_id !== undefined) result.enum_periode_isolation_id = de.enum_periode_isolation_id;

    return result;
  }

  private buildXMLPlancherHautDonneeIntermediaire(di: PlancherHautDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      b: di.b,
      uph: di.uph,
    };

    if (di.uph0 !== undefined) result.uph0 = di.uph0;

    return result;
  }

  private buildXMLPorteCollection(collection: PorteCollection): Record<string, unknown> {
    const portes = this.normalizeToArray(collection.porte);
    return {
      porte: portes.map((porte) => this.buildXMLPorte(porte)),
    };
  }

  private buildXMLPorte(porte: Porte): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLPorteDonneeEntree(porte.donnee_entree),
      donnee_intermediaire: this.buildXMLPorteDonneeIntermediaire(porte.donnee_intermediaire),
    };
  }

  private buildXMLPorteDonneeEntree(de: PorteDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_adjacence_id: de.enum_type_adjacence_id,
      surface_porte: de.surface_porte,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.tv_coef_reduction_deperdition_id !== undefined) result.tv_coef_reduction_deperdition_id = de.tv_coef_reduction_deperdition_id;
    if (de.surface_aiu !== undefined) result.surface_aiu = de.surface_aiu;
    if (de.surface_aue !== undefined) result.surface_aue = de.surface_aue;
    if (de.enum_cfg_isolation_lnc_id !== undefined) result.enum_cfg_isolation_lnc_id = de.enum_cfg_isolation_lnc_id;
    if (de.tv_uporte_id !== undefined) result.tv_uporte_id = de.tv_uporte_id;
    if (de.nb_porte !== undefined) result.nb_porte = de.nb_porte;
    if (de.largeur_dormant !== undefined) result.largeur_dormant = de.largeur_dormant;
    if (de.presence_retour_isolation !== undefined) result.presence_retour_isolation = de.presence_retour_isolation;
    if (de.presence_joint !== undefined) result.presence_joint = de.presence_joint;
    if (de.enum_methode_saisie_uporte_id !== undefined) result.enum_methode_saisie_uporte_id = de.enum_methode_saisie_uporte_id;
    if (de.enum_type_porte_id !== undefined) result.enum_type_porte_id = de.enum_type_porte_id;
    if (de.enum_type_pose_id !== undefined) result.enum_type_pose_id = de.enum_type_pose_id;

    return result;
  }

  private buildXMLPorteDonneeIntermediaire(di: PorteDonneeIntermediaire): Record<string, unknown> {
    return {
      b: di.b,
      uporte: di.uporte,
    };
  }

  private buildXMLETSCollection(collection: ETSCollection): Record<string, unknown> {
    const etsList = this.normalizeToArray(collection.ets);
    return {
      ets: etsList.map((ets) => this.buildXMLETS(ets)),
    };
  }

  private buildXMLETS(ets: ETS): Record<string, unknown> {
    const result: Record<string, unknown> = {
      donnee_entree: this.buildXMLETSDonneeEntree(ets.donnee_entree),
      donnee_intermediaire: this.buildXMLETSDonneeIntermediaire(ets.donnee_intermediaire),
    };

    if (ets.baie_ets_collection) {
      result.baie_ets_collection = this.buildXMLBaieETSCollection(ets.baie_ets_collection);
    }

    return result;
  }

  private buildXMLETSDonneeEntree(de: ETSDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.tv_coef_reduction_deperdition_id !== undefined) result.tv_coef_reduction_deperdition_id = de.tv_coef_reduction_deperdition_id;
    if (de.enum_cfg_isolation_lnc_id !== undefined) result.enum_cfg_isolation_lnc_id = de.enum_cfg_isolation_lnc_id;
    if (de.tv_coef_transparence_ets_id !== undefined) result.tv_coef_transparence_ets_id = de.tv_coef_transparence_ets_id;

    return result;
  }

  private buildXMLETSDonneeIntermediaire(di: ETSDonneeIntermediaire): Record<string, unknown> {
    return {
      coef_transparence_ets: di.coef_transparence_ets,
      bver: di.bver,
    };
  }

  private buildXMLBaieETSCollection(collection: BaieETSCollection): Record<string, unknown> {
    const baies = this.normalizeToArray(collection.baie_ets);
    return {
      baie_ets: baies.map((baie) => this.buildXMLBaieETS(baie)),
    };
  }

  private buildXMLBaieETS(baie: BaieETS): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLBaieETSDonneeEntree(baie.donnee_entree),
    };
  }

  private buildXMLBaieETSDonneeEntree(de: BaieETSDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_orientation_id: de.enum_orientation_id,
      surface_totale_baie: de.surface_totale_baie,
    };

    if (de.enum_inclinaison_vitrage_id !== undefined) result.enum_inclinaison_vitrage_id = de.enum_inclinaison_vitrage_id;
    if (de.nb_baie !== undefined) result.nb_baie = de.nb_baie;

    return result;
  }

  private buildXMLPontThermiqueCollection(collection: PontThermiqueCollection): Record<string, unknown> {
    const ponts = this.normalizeToArray(collection.pont_thermique);
    return {
      pont_thermique: ponts.map((pont) => this.buildXMLPontThermique(pont)),
    };
  }

  private buildXMLPontThermique(pont: PontThermique): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLPontThermiqueDonneeEntree(pont.donnee_entree),
      donnee_intermediaire: this.buildXMLPontThermiqueDonneeIntermediaire(pont.donnee_intermediaire),
    };
  }

  private buildXMLPontThermiqueDonneeEntree(de: PontThermiqueDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      l: de.l,
      enum_type_liaison_id: de.enum_type_liaison_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.tv_pont_thermique_id !== undefined) result.tv_pont_thermique_id = de.tv_pont_thermique_id;
    if (de.enum_methode_saisie_pont_thermique_id !== undefined) result.enum_methode_saisie_pont_thermique_id = de.enum_methode_saisie_pont_thermique_id;
    if (de.pourcentage_valeur_pont_thermique !== undefined) result.pourcentage_valeur_pont_thermique = de.pourcentage_valeur_pont_thermique;

    return result;
  }

  private buildXMLPontThermiqueDonneeIntermediaire(di: PontThermiqueDonneeIntermediaire): Record<string, unknown> {
    return {
      k: di.k,
    };
  }

  // ============================================================================
  // INSTALLATIONS
  // ============================================================================

  private buildXMLInstallationChauffageCollection(collection: InstallationChauffageCollection): Record<string, unknown> {
    const installations = this.normalizeToArray(collection.installation_chauffage);
    return {
      installation_chauffage: installations.map((inst) => this.buildXMLInstallationChauffage(inst)),
    };
  }

  private buildXMLInstallationChauffage(inst: InstallationChauffage): Record<string, unknown> {
    const result: Record<string, unknown> = {
      donnee_entree: this.buildXMLInstallationChauffageDonneeEntree(inst.donnee_entree),
      donnee_intermediaire: this.buildXMLInstallationChauffageDonneeIntermediaire(inst.donnee_intermediaire),
    };

    if (inst.generateur_chauffage_collection) {
      result.generateur_chauffage_collection = this.buildXMLGenerateurChauffageCollection(inst.generateur_chauffage_collection);
    }

    if (inst.emetteur_chauffage_collection) {
      result.emetteur_chauffage_collection = this.buildXMLEmetteurChauffageCollection(inst.emetteur_chauffage_collection);
    }

    return result;
  }

  private buildXMLInstallationChauffageDonneeEntree(de: InstallationChauffageDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      surface_chauffee: de.surface_chauffee,
      rdim: de.rdim,
      nombre_niveau_installation_ch: de.nombre_niveau_installation_ch,
      enum_cfg_installation_ch_id: de.enum_cfg_installation_ch_id,
      enum_type_installation_id: de.enum_type_installation_id,
      enum_methode_calcul_conso_id: de.enum_methode_calcul_conso_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.nombre_logement_echantillon !== undefined) result.nombre_logement_echantillon = de.nombre_logement_echantillon;
    if (de.ratio_virtualisation !== undefined) result.ratio_virtualisation = de.ratio_virtualisation;
    if (de.coef_ifc !== undefined) result.coef_ifc = de.coef_ifc;
    if (de.cle_repartition_ch !== undefined) result.cle_repartition_ch = de.cle_repartition_ch;
    if (de.enum_methode_saisie_fact_couv_sol_id !== undefined) result.enum_methode_saisie_fact_couv_sol_id = de.enum_methode_saisie_fact_couv_sol_id;
    if (de.tv_facteur_couverture_solaire_id !== undefined) result.tv_facteur_couverture_solaire_id = de.tv_facteur_couverture_solaire_id;
    if (de.fch_saisi !== undefined) result.fch_saisi = de.fch_saisi;

    return result;
  }

  private buildXMLInstallationChauffageDonneeIntermediaire(di: InstallationChauffageDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      besoin_ch: di.besoin_ch,
      besoin_ch_depensier: di.besoin_ch_depensier,
      conso_ch: di.conso_ch,
      conso_ch_depensier: di.conso_ch_depensier,
    };

    if (di.production_ch_solaire !== undefined) result.production_ch_solaire = di.production_ch_solaire;
    if (di.fch !== undefined) result.fch = di.fch;

    return result;
  }

  private buildXMLGenerateurChauffageCollection(collection: GenerateurChauffageCollection): Record<string, unknown> {
    const generateurs = this.normalizeToArray(collection.generateur_chauffage);
    return {
      generateur_chauffage: generateurs.map((gen) => this.buildXMLGenerateurChauffage(gen)),
    };
  }

  private buildXMLGenerateurChauffage(gen: GenerateurChauffage): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLGenerateurChauffageDonneeEntree(gen.donnee_entree),
      donnee_intermediaire: this.buildXMLGenerateurChauffageDonneeIntermediaire(gen.donnee_intermediaire),
    };
  }

  private buildXMLGenerateurChauffageDonneeEntree(de: GenerateurChauffageDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_generateur_ch_id: de.enum_type_generateur_ch_id,
      enum_usage_generateur_id: de.enum_usage_generateur_id,
      enum_type_energie_id: de.enum_type_energie_id,
      position_volume_chauffe: de.position_volume_chauffe,
      enum_methode_saisie_carac_sys_id: de.enum_methode_saisie_carac_sys_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.enum_lien_generateur_emetteur_id !== undefined) result.enum_lien_generateur_emetteur_id = de.enum_lien_generateur_emetteur_id;
    if (de.ref_produit_generateur_ch) result.ref_produit_generateur_ch = de.ref_produit_generateur_ch;
    if (de.tv_rendement_generation_id !== undefined) result.tv_rendement_generation_id = de.tv_rendement_generation_id;
    if (de.tv_scop_id !== undefined) result.tv_scop_id = de.tv_scop_id;
    if (de.identifiant_reseau_chaleur) result.identifiant_reseau_chaleur = de.identifiant_reseau_chaleur;
    if (de.date_arrete_reseau_chaleur) result.date_arrete_reseau_chaleur = de.date_arrete_reseau_chaleur;
    if (de.tv_reseau_chaleur_id !== undefined) result.tv_reseau_chaleur_id = de.tv_reseau_chaleur_id;

    return result;
  }

  private buildXMLGenerateurChauffageDonneeIntermediaire(di: GenerateurChauffageDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      conso_ch: di.conso_ch,
      conso_ch_depensier: di.conso_ch_depensier,
    };

    if (di.rendement_generation !== undefined) result.rendement_generation = di.rendement_generation;
    if (di.scop !== undefined) result.scop = di.scop;

    return result;
  }

  private buildXMLEmetteurChauffageCollection(collection: EmetteurChauffageCollection): Record<string, unknown> {
    const emetteurs = this.normalizeToArray(collection.emetteur_chauffage);
    return {
      emetteur_chauffage: emetteurs.map((em) => this.buildXMLEmetteurChauffage(em)),
    };
  }

  private buildXMLEmetteurChauffage(em: EmetteurChauffage): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLEmetteurChauffageDonneeEntree(em.donnee_entree),
      donnee_intermediaire: this.buildXMLEmetteurChauffageDonneeIntermediaire(em.donnee_intermediaire),
    };
  }

  private buildXMLEmetteurChauffageDonneeEntree(de: EmetteurChauffageDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      surface_chauffee: de.surface_chauffee,
      tv_intermittence_id: de.tv_intermittence_id,
      tv_rendement_emission_id: de.tv_rendement_emission_id,
      tv_rendement_distribution_ch_id: de.tv_rendement_distribution_ch_id,
      tv_rendement_regulation_id: de.tv_rendement_regulation_id,
      enum_type_emission_distribution_id: de.enum_type_emission_distribution_id,
      enum_equipement_intermittence_id: de.enum_equipement_intermittence_id,
      enum_type_regulation_id: de.enum_type_regulation_id,
      enum_type_chauffage_id: de.enum_type_chauffage_id,
      enum_temp_distribution_ch_id: de.enum_temp_distribution_ch_id,
      enum_periode_installation_emetteur_id: de.enum_periode_installation_emetteur_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.enum_lien_generateur_emetteur_id !== undefined) result.enum_lien_generateur_emetteur_id = de.enum_lien_generateur_emetteur_id;

    return result;
  }

  private buildXMLEmetteurChauffageDonneeIntermediaire(di: EmetteurChauffageDonneeIntermediaire): Record<string, unknown> {
    return {
      rendement_emission: di.rendement_emission,
      rendement_distribution: di.rendement_distribution,
      rendement_regulation: di.rendement_regulation,
      i0: di.i0,
    };
  }

  private buildXMLInstallationECSCollection(collection: InstallationECSCollection): Record<string, unknown> {
    const installations = this.normalizeToArray(collection.installation_ecs);
    return {
      installation_ecs: installations.map((inst) => this.buildXMLInstallationECS(inst)),
    };
  }

  private buildXMLInstallationECS(inst: InstallationECS): Record<string, unknown> {
    const result: Record<string, unknown> = {
      donnee_entree: this.buildXMLInstallationECSDonneeEntree(inst.donnee_entree),
      donnee_intermediaire: this.buildXMLInstallationECSDonneeIntermediaire(inst.donnee_intermediaire),
    };

    if (inst.generateur_ecs_collection) {
      result.generateur_ecs_collection = this.buildXMLGenerateurECSCollection(inst.generateur_ecs_collection);
    }

    return result;
  }

  private buildXMLInstallationECSDonneeEntree(de: InstallationECSDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_cfg_installation_ecs_id: de.enum_cfg_installation_ecs_id,
      enum_type_installation_id: de.enum_type_installation_id,
      enum_methode_calcul_conso_id: de.enum_methode_calcul_conso_id,
      surface_habitable: de.surface_habitable,
      nombre_logement: de.nombre_logement,
      rdim: de.rdim,
      nombre_niveau_installation_ecs: de.nombre_niveau_installation_ecs,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.ratio_virtualisation !== undefined) result.ratio_virtualisation = de.ratio_virtualisation;
    if (de.cle_repartition_ecs !== undefined) result.cle_repartition_ecs = de.cle_repartition_ecs;
    if (de.fecs_saisi !== undefined) result.fecs_saisi = de.fecs_saisi;
    if (de.tv_facteur_couverture_solaire_id !== undefined) result.tv_facteur_couverture_solaire_id = de.tv_facteur_couverture_solaire_id;
    if (de.enum_methode_saisie_fact_couv_sol_id !== undefined) result.enum_methode_saisie_fact_couv_sol_id = de.enum_methode_saisie_fact_couv_sol_id;
    if (de.enum_type_installation_solaire_id !== undefined) result.enum_type_installation_solaire_id = de.enum_type_installation_solaire_id;
    if (de.tv_rendement_distribution_ecs_id !== undefined) result.tv_rendement_distribution_ecs_id = de.tv_rendement_distribution_ecs_id;
    if (de.enum_bouclage_reseau_ecs_id !== undefined) result.enum_bouclage_reseau_ecs_id = de.enum_bouclage_reseau_ecs_id;
    if (de.reseau_distribution_isole !== undefined) result.reseau_distribution_isole = de.reseau_distribution_isole;

    return result;
  }

  private buildXMLInstallationECSDonneeIntermediaire(di: InstallationECSDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      rendement_distribution: di.rendement_distribution,
      besoin_ecs: di.besoin_ecs,
      besoin_ecs_depensier: di.besoin_ecs_depensier,
      conso_ecs: di.conso_ecs,
      conso_ecs_depensier: di.conso_ecs_depensier,
    };

    if (di.fecs !== undefined) result.fecs = di.fecs;
    if (di.production_ecs_solaire !== undefined) result.production_ecs_solaire = di.production_ecs_solaire;

    return result;
  }

  private buildXMLGenerateurECSCollection(collection: GenerateurECSCollection): Record<string, unknown> {
    const generateurs = this.normalizeToArray(collection.generateur_ecs);
    return {
      generateur_ecs: generateurs.map((gen) => this.buildXMLGenerateurECS(gen)),
    };
  }

  private buildXMLGenerateurECS(gen: GenerateurECS): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLGenerateurECSDonneeEntree(gen.donnee_entree),
      donnee_intermediaire: this.buildXMLGenerateurECSDonneeIntermediaire(gen.donnee_intermediaire),
    };
  }

  private buildXMLGenerateurECSDonneeEntree(de: GenerateurECSDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      enum_type_generateur_ecs_id: de.enum_type_generateur_ecs_id,
      enum_usage_generateur_id: de.enum_usage_generateur_id,
      enum_type_energie_id: de.enum_type_energie_id,
      enum_methode_saisie_carac_sys_id: de.enum_methode_saisie_carac_sys_id,
      position_volume_chauffe: de.position_volume_chauffe,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.reference_generateur_mixte) result.reference_generateur_mixte = de.reference_generateur_mixte;
    if (de.ref_produit_generateur_ecs) result.ref_produit_generateur_ecs = de.ref_produit_generateur_ecs;
    if (de.tv_generateur_combustion_id !== undefined) result.tv_generateur_combustion_id = de.tv_generateur_combustion_id;
    if (de.tv_pertes_stockage_id !== undefined) result.tv_pertes_stockage_id = de.tv_pertes_stockage_id;
    if (de.tv_scop_id !== undefined) result.tv_scop_id = de.tv_scop_id;
    if (de.enum_periode_installation_ecs_thermo_id !== undefined) result.enum_periode_installation_ecs_thermo_id = de.enum_periode_installation_ecs_thermo_id;
    if (de.identifiant_reseau_chaleur) result.identifiant_reseau_chaleur = de.identifiant_reseau_chaleur;
    if (de.date_arrete_reseau_chaleur) result.date_arrete_reseau_chaleur = de.date_arrete_reseau_chaleur;
    if (de.tv_reseau_chaleur_id !== undefined) result.tv_reseau_chaleur_id = de.tv_reseau_chaleur_id;
    if (de.enum_type_stockage_ecs_id !== undefined) result.enum_type_stockage_ecs_id = de.enum_type_stockage_ecs_id;
    if (de.position_volume_chauffe_stockage !== undefined) result.position_volume_chauffe_stockage = de.position_volume_chauffe_stockage;
    if (de.volume_stockage !== undefined) result.volume_stockage = de.volume_stockage;
    if (de.presence_ventouse !== undefined) result.presence_ventouse = de.presence_ventouse;

    return result;
  }

  private buildXMLGenerateurECSDonneeIntermediaire(di: GenerateurECSDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      ratio_besoin_ecs: di.ratio_besoin_ecs,
      conso_ecs: di.conso_ecs,
      conso_ecs_depensier: di.conso_ecs_depensier,
    };

    if (di.pn !== undefined) result.pn = di.pn;
    if (di.qp0 !== undefined) result.qp0 = di.qp0;
    if (di.pveilleuse !== undefined) result.pveilleuse = di.pveilleuse;
    if (di.rpn !== undefined) result.rpn = di.rpn;
    if (di.cop !== undefined) result.cop = di.cop;
    if (di.rendement_generation !== undefined) result.rendement_generation = di.rendement_generation;
    if (di.rendement_generation_stockage !== undefined) result.rendement_generation_stockage = di.rendement_generation_stockage;
    if (di.rendement_stockage !== undefined) result.rendement_stockage = di.rendement_stockage;

    return result;
  }

  private buildXMLVentilationCollection(collection: VentilationCollection): Record<string, unknown> {
    const ventilations = this.normalizeToArray(collection.ventilation);
    return {
      ventilation: ventilations.map((vent) => this.buildXMLVentilation(vent)),
    };
  }

  private buildXMLVentilation(vent: Ventilation): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLVentilationDonneeEntree(vent.donnee_entree),
      donnee_intermediaire: this.buildXMLVentilationDonneeIntermediaire(vent.donnee_intermediaire),
    };
  }

  private buildXMLVentilationDonneeEntree(de: VentilationDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      plusieurs_facade_exposee: de.plusieurs_facade_exposee,
      surface_ventile: de.surface_ventile,
      enum_methode_saisie_q4pa_conv_id: de.enum_methode_saisie_q4pa_conv_id,
      tv_debits_ventilation_id: de.tv_debits_ventilation_id,
      enum_type_ventilation_id: de.enum_type_ventilation_id,
      ventilation_post_2012: de.ventilation_post_2012,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.tv_q4pa_conv_id !== undefined) result.tv_q4pa_conv_id = de.tv_q4pa_conv_id;
    if (de.q4pa_conv_saisi !== undefined) result.q4pa_conv_saisi = de.q4pa_conv_saisi;
    if (de.ref_produit_ventilation) result.ref_produit_ventilation = de.ref_produit_ventilation;
    if (de.cle_repartition_ventilation !== undefined) result.cle_repartition_ventilation = de.cle_repartition_ventilation;

    return result;
  }

  private buildXMLVentilationDonneeIntermediaire(di: VentilationDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      q4pa_conv: di.q4pa_conv,
      conso_auxiliaire_ventilation: di.conso_auxiliaire_ventilation,
      hperm: di.hperm,
      hvent: di.hvent,
    };

    if (di.pvent_moy !== undefined) result.pvent_moy = di.pvent_moy;

    return result;
  }

  private buildXMLClimatisationCollection(collection: ClimatisationCollection): Record<string, unknown> {
    const climatisations = this.normalizeToArray(collection.climatisation);
    return {
      climatisation: climatisations.map((clim) => this.buildXMLClimatisation(clim)),
    };
  }

  private buildXMLClimatisation(clim: Climatisation): Record<string, unknown> {
    return {
      donnee_entree: this.buildXMLClimatisationDonneeEntree(clim.donnee_entree),
      donnee_intermediaire: this.buildXMLClimatisationDonneeIntermediaire(clim.donnee_intermediaire),
    };
  }

  private buildXMLClimatisationDonneeEntree(de: ClimatisationDonneeEntree): Record<string, unknown> {
    const result: Record<string, unknown> = {
      reference: de.reference,
      surface_clim: de.surface_clim,
      enum_methode_calcul_conso_id: de.enum_methode_calcul_conso_id,
    };

    if (de.description) result.description = this.escapeXml(de.description);
    if (de.ref_produit_fr) result.ref_produit_fr = de.ref_produit_fr;
    if (de.tv_seer_id !== undefined) result.tv_seer_id = de.tv_seer_id;
    if (de.nombre_logement_echantillon !== undefined) result.nombre_logement_echantillon = de.nombre_logement_echantillon;
    if (de.enum_periode_installation_fr_id !== undefined) result.enum_periode_installation_fr_id = de.enum_periode_installation_fr_id;
    if (de.enum_type_energie_id !== undefined) result.enum_type_energie_id = de.enum_type_energie_id;
    if (de.enum_type_generateur_fr_id !== undefined) result.enum_type_generateur_fr_id = de.enum_type_generateur_fr_id;
    if (de.enum_methode_saisie_carac_sys_id !== undefined) result.enum_methode_saisie_carac_sys_id = de.enum_methode_saisie_carac_sys_id;

    return result;
  }

  private buildXMLClimatisationDonneeIntermediaire(di: ClimatisationDonneeIntermediaire): Record<string, unknown> {
    const result: Record<string, unknown> = {
      besoin_fr: di.besoin_fr,
      conso_fr: di.conso_fr,
      conso_fr_depensier: di.conso_fr_depensier,
    };

    if (di.eer !== undefined) result.eer = di.eer;

    return result;
  }

  // ============================================================================
  // SECTION SORTIE
  // ============================================================================

  private buildXMLSortie(sortie: Sortie): Record<string, unknown> {
    const result: Record<string, unknown> = {
      deperdition: this.buildXMLSortieDeperdition(sortie.deperdition),
      apport_et_besoin: this.buildXMLSortieApportEtBesoin(sortie.apport_et_besoin),
      ef_conso: this.buildXMLSortieEfConso(sortie.ef_conso),
      ep_conso: this.buildXMLSortieEpConso(sortie.ep_conso),
      emission_ges: this.buildXMLSortieEmissionGes(sortie.emission_ges),
      cout: this.buildXMLSortieCout(sortie.cout),
    };

    if (sortie.production_electricite) {
      result.production_electricite = this.buildXMLSortieProductionElectricite(sortie.production_electricite);
    }

    if (sortie.sortie_par_energie_collection) {
      result.sortie_par_energie_collection = this.buildXMLSortieParEnergieCollection(sortie.sortie_par_energie_collection);
    }

    if (sortie.confort_ete) {
      result.confort_ete = this.buildXMLSortieConfortEte(sortie.confort_ete);
    }

    if (sortie.qualite_isolation) {
      result.qualite_isolation = this.buildXMLSortieQualiteIsolation(sortie.qualite_isolation);
    }

    return result;
  }

  private buildXMLSortieDeperdition(deperdition: SortieDeperdition): Record<string, unknown> {
    return {
      hvent: deperdition.hvent,
      hperm: deperdition.hperm,
      deperdition_renouvellement_air: deperdition.deperdition_renouvellement_air,
      deperdition_mur: deperdition.deperdition_mur,
      deperdition_plancher_bas: deperdition.deperdition_plancher_bas,
      deperdition_plancher_haut: deperdition.deperdition_plancher_haut,
      deperdition_baie_vitree: deperdition.deperdition_baie_vitree,
      deperdition_porte: deperdition.deperdition_porte,
      deperdition_pont_thermique: deperdition.deperdition_pont_thermique,
      deperdition_enveloppe: deperdition.deperdition_enveloppe,
    };
  }

  private buildXMLSortieApportEtBesoin(apport: SortieApportEtBesoin): Record<string, unknown> {
    return {
      surface_sud_equivalente: apport.surface_sud_equivalente,
      apport_solaire_fr: apport.apport_solaire_fr,
      apport_interne_fr: apport.apport_interne_fr,
      apport_solaire_ch: apport.apport_solaire_ch,
      apport_interne_ch: apport.apport_interne_ch,
      fraction_apport_gratuit_ch: apport.fraction_apport_gratuit_ch,
      fraction_apport_gratuit_depensier_ch: apport.fraction_apport_gratuit_depensier_ch,
      pertes_distribution_ecs_recup: apport.pertes_distribution_ecs_recup,
      pertes_distribution_ecs_recup_depensier: apport.pertes_distribution_ecs_recup_depensier,
      pertes_stockage_ecs_recup: apport.pertes_stockage_ecs_recup,
      pertes_generateur_ch_recup: apport.pertes_generateur_ch_recup,
      pertes_generateur_ch_recup_depensier: apport.pertes_generateur_ch_recup_depensier,
      nadeq: apport.nadeq,
      v40_ecs_journalier: apport.v40_ecs_journalier,
      v40_ecs_journalier_depensier: apport.v40_ecs_journalier_depensier,
      besoin_ch: apport.besoin_ch,
      besoin_ch_depensier: apport.besoin_ch_depensier,
      besoin_ecs: apport.besoin_ecs,
      besoin_ecs_depensier: apport.besoin_ecs_depensier,
      besoin_fr: apport.besoin_fr,
      besoin_fr_depensier: apport.besoin_fr_depensier,
    };
  }

  private buildXMLSortieEfConso(ef: SortieEfConso): Record<string, unknown> {
    const result: Record<string, unknown> = {
      conso_ch: ef.conso_ch,
      conso_ch_depensier: ef.conso_ch_depensier,
      conso_ecs: ef.conso_ecs,
      conso_ecs_depensier: ef.conso_ecs_depensier,
      conso_eclairage: ef.conso_eclairage,
      conso_auxiliaire_generation_ch: ef.conso_auxiliaire_generation_ch,
      conso_auxiliaire_generation_ch_depensier: ef.conso_auxiliaire_generation_ch_depensier,
      conso_auxiliaire_distribution_ch: ef.conso_auxiliaire_distribution_ch,
      conso_auxiliaire_generation_ecs: ef.conso_auxiliaire_generation_ecs,
      conso_auxiliaire_generation_ecs_depensier: ef.conso_auxiliaire_generation_ecs_depensier,
      conso_auxiliaire_distribution_ecs: ef.conso_auxiliaire_distribution_ecs,
      conso_auxiliaire_ventilation: ef.conso_auxiliaire_ventilation,
      conso_totale_auxiliaire: ef.conso_totale_auxiliaire,
      conso_fr: ef.conso_fr,
      conso_fr_depensier: ef.conso_fr_depensier,
      conso_5_usages: ef.conso_5_usages,
      conso_5_usages_m2: ef.conso_5_usages_m2,
    };

    if (ef.conso_auxiliaire_distribution_fr !== undefined) {
      result.conso_auxiliaire_distribution_fr = ef.conso_auxiliaire_distribution_fr;
    }

    return result;
  }

  private buildXMLSortieEpConso(ep: SortieEpConso): Record<string, unknown> {
    const result: Record<string, unknown> = {
      ep_conso_ch: ep.ep_conso_ch,
      ep_conso_ch_depensier: ep.ep_conso_ch_depensier,
      ep_conso_ecs: ep.ep_conso_ecs,
      ep_conso_ecs_depensier: ep.ep_conso_ecs_depensier,
      ep_conso_eclairage: ep.ep_conso_eclairage,
      ep_conso_auxiliaire_generation_ch: ep.ep_conso_auxiliaire_generation_ch,
      ep_conso_auxiliaire_generation_ch_depensier: ep.ep_conso_auxiliaire_generation_ch_depensier,
      ep_conso_auxiliaire_distribution_ch: ep.ep_conso_auxiliaire_distribution_ch,
      ep_conso_auxiliaire_generation_ecs: ep.ep_conso_auxiliaire_generation_ecs,
      ep_conso_auxiliaire_generation_ecs_depensier: ep.ep_conso_auxiliaire_generation_ecs_depensier,
      ep_conso_auxiliaire_distribution_ecs: ep.ep_conso_auxiliaire_distribution_ecs,
      ep_conso_auxiliaire_ventilation: ep.ep_conso_auxiliaire_ventilation,
      ep_conso_totale_auxiliaire: ep.ep_conso_totale_auxiliaire,
      ep_conso_fr: ep.ep_conso_fr,
      ep_conso_fr_depensier: ep.ep_conso_fr_depensier,
      ep_conso_5_usages: ep.ep_conso_5_usages,
      ep_conso_5_usages_m2: ep.ep_conso_5_usages_m2,
      classe_bilan_dpe: ep.classe_bilan_dpe,
    };

    if (ep.ep_conso_auxiliaire_distribution_fr !== undefined) {
      result.ep_conso_auxiliaire_distribution_fr = ep.ep_conso_auxiliaire_distribution_fr;
    }

    return result;
  }

  private buildXMLSortieEmissionGes(emission: SortieEmissionGes): Record<string, unknown> {
    const result: Record<string, unknown> = {
      emission_ges_ch: emission.emission_ges_ch,
      emission_ges_ch_depensier: emission.emission_ges_ch_depensier,
      emission_ges_ecs: emission.emission_ges_ecs,
      emission_ges_ecs_depensier: emission.emission_ges_ecs_depensier,
      emission_ges_eclairage: emission.emission_ges_eclairage,
      emission_ges_auxiliaire_generation_ch: emission.emission_ges_auxiliaire_generation_ch,
      emission_ges_auxiliaire_generation_ch_depensier: emission.emission_ges_auxiliaire_generation_ch_depensier,
      emission_ges_auxiliaire_distribution_ch: emission.emission_ges_auxiliaire_distribution_ch,
      emission_ges_auxiliaire_generation_ecs: emission.emission_ges_auxiliaire_generation_ecs,
      emission_ges_auxiliaire_generation_ecs_depensier: emission.emission_ges_auxiliaire_generation_ecs_depensier,
      emission_ges_auxiliaire_distribution_ecs: emission.emission_ges_auxiliaire_distribution_ecs,
      emission_ges_auxiliaire_ventilation: emission.emission_ges_auxiliaire_ventilation,
      emission_ges_totale_auxiliaire: emission.emission_ges_totale_auxiliaire,
      emission_ges_fr: emission.emission_ges_fr,
      emission_ges_fr_depensier: emission.emission_ges_fr_depensier,
      emission_ges_5_usages: emission.emission_ges_5_usages,
      emission_ges_5_usages_m2: emission.emission_ges_5_usages_m2,
      classe_emission_ges: emission.classe_emission_ges,
    };

    if (emission.emission_ges_auxiliaire_distribution_fr !== undefined) {
      result.emission_ges_auxiliaire_distribution_fr = emission.emission_ges_auxiliaire_distribution_fr;
    }

    return result;
  }

  private buildXMLSortieCout(cout: SortieCout): Record<string, unknown> {
    const result: Record<string, unknown> = {
      cout_ch: cout.cout_ch,
      cout_ch_depensier: cout.cout_ch_depensier,
      cout_ecs: cout.cout_ecs,
      cout_ecs_depensier: cout.cout_ecs_depensier,
      cout_eclairage: cout.cout_eclairage,
      cout_auxiliaire_generation_ch: cout.cout_auxiliaire_generation_ch,
      cout_auxiliaire_generation_ch_depensier: cout.cout_auxiliaire_generation_ch_depensier,
      cout_auxiliaire_distribution_ch: cout.cout_auxiliaire_distribution_ch,
      cout_auxiliaire_generation_ecs: cout.cout_auxiliaire_generation_ecs,
      cout_auxiliaire_generation_ecs_depensier: cout.cout_auxiliaire_generation_ecs_depensier,
      cout_auxiliaire_distribution_ecs: cout.cout_auxiliaire_distribution_ecs,
      cout_auxiliaire_ventilation: cout.cout_auxiliaire_ventilation,
      cout_total_auxiliaire: cout.cout_total_auxiliaire,
      cout_fr: cout.cout_fr,
      cout_fr_depensier: cout.cout_fr_depensier,
      cout_5_usages: cout.cout_5_usages,
    };

    if (cout.cout_auxiliaire_distribution_fr !== undefined) {
      result.cout_auxiliaire_distribution_fr = cout.cout_auxiliaire_distribution_fr;
    }

    return result;
  }

  private buildXMLSortieProductionElectricite(pe: SortieProductionElectricite): Record<string, unknown> {
    return {
      production_pv: pe.production_pv,
      conso_elec_ac: pe.conso_elec_ac,
      conso_elec_ac_ch: pe.conso_elec_ac_ch,
      conso_elec_ac_ecs: pe.conso_elec_ac_ecs,
      conso_elec_ac_fr: pe.conso_elec_ac_fr,
      conso_elec_ac_eclairage: pe.conso_elec_ac_eclairage,
      conso_elec_ac_auxiliaire: pe.conso_elec_ac_auxiliaire,
      conso_elec_ac_autre_usage: pe.conso_elec_ac_autre_usage,
    };
  }

  private buildXMLSortieParEnergieCollection(collection: SortieParEnergieCollection): Record<string, unknown> {
    const sorties = this.normalizeToArray(collection.sortie_par_energie);
    return {
      sortie_par_energie: sorties.map((s) => this.buildXMLSortieParEnergie(s)),
    };
  }

  private buildXMLSortieParEnergie(spe: SortieParEnergie): Record<string, unknown> {
    return {
      conso_ch: spe.conso_ch,
      conso_ecs: spe.conso_ecs,
      conso_5_usages: spe.conso_5_usages,
      enum_type_energie_id: spe.enum_type_energie_id,
      emission_ges_ch: spe.emission_ges_ch,
      emission_ges_ecs: spe.emission_ges_ecs,
      emission_ges_5_usages: spe.emission_ges_5_usages,
      cout_ch: spe.cout_ch,
      cout_ecs: spe.cout_ecs,
      cout_5_usages: spe.cout_5_usages,
    };
  }

  private buildXMLSortieConfortEte(ce: SortieConfortEte): Record<string, unknown> {
    return {
      isolation_toiture: ce.isolation_toiture,
      protection_solaire_exterieure: ce.protection_solaire_exterieure,
      aspect_traversant: ce.aspect_traversant,
      brasseur_air: ce.brasseur_air,
      inertie_lourde: ce.inertie_lourde,
      enum_indicateur_confort_ete_id: ce.enum_indicateur_confort_ete_id,
    };
  }

  private buildXMLSortieQualiteIsolation(qi: SortieQualiteIsolation): Record<string, unknown> {
    return {
      ubat: qi.ubat,
      qualite_isol_enveloppe: qi.qualite_isol_enveloppe,
      qualite_isol_mur: qi.qualite_isol_mur,
      qualite_isol_plancher_haut_toit_terrasse: qi.qualite_isol_plancher_haut_toit_terrasse,
      qualite_isol_plancher_bas: qi.qualite_isol_plancher_bas,
      qualite_isol_menuiserie: qi.qualite_isol_menuiserie,
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private normalizeToArray<T>(data: T | T[]): T[] {
    if (Array.isArray(data)) return data;
    return data ? [data] : [];
  }

  private escapeXml(str: string): string {
    if (!str) return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Valide un DPE avant génération
   */
  validate(dpe: DPEDocument): XMLValidationResult {
    const errors: string[] = [];
    const coherenceErrors: string[] = [];

    // Validation de base
    if (!dpe.administratif) {
      errors.push("Section administratif manquante");
    } else {
      if (!dpe.administratif.date_visite_diagnostiqueur) {
        errors.push("Date de visite diagnostiqueur manquante");
      }
      if (!dpe.administratif.date_etablissement_dpe) {
        errors.push("Date d'établissement DPE manquante");
      }
      if (!dpe.administratif.nom_proprietaire) {
        errors.push("Nom du propriétaire manquant");
      }
    }

    if (!dpe.logement) {
      errors.push("Section logement manquante");
    } else {
      if (!dpe.logement.caracteristique_generale) {
        errors.push("Caractéristiques générales manquantes");
      }
      if (!dpe.logement.meteo) {
        errors.push("Données météo manquantes");
      }
      if (!dpe.logement.enveloppe) {
        errors.push("Enveloppe manquante");
      }
    }

    // Validation de cohérence
    if (dpe.logement?.caracteristique_generale?.surface_habitable_logement !== undefined) {
      if (dpe.logement.caracteristique_generale.surface_habitable_logement <= 0) {
        coherenceErrors.push("La surface habitable doit être positive");
      }
      if (dpe.logement.caracteristique_generale.surface_habitable_logement > 10000) {
        coherenceErrors.push("La surface habitable semble anormalement élevée");
      }
    }

    if (dpe.logement?.meteo?.enum_zone_climatique_id) {
      const zone = dpe.logement.meteo.enum_zone_climatique_id;
      if (zone < 1 || zone > 8) {
        coherenceErrors.push("Zone climatique invalide (doit être entre 1 et 8)");
      }
    }

    return {
      valid: errors.length === 0,
      schema_errors: errors,
      coherence_errors: coherenceErrors,
    };
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ============================================================================

/**
 * Génère un XML à partir d'un DPE
 */
export function generateXML(dpe: DPEDocument, options?: XMLGeneratorOptions): string {
  const generator = new XMLGenerator(options);
  return generator.generate(dpe);
}

/**
 * Génère un XML avec validation
 */
export function generateXMLWithValidation(dpe: DPEDocument, options?: XMLGeneratorOptions): { xml: string; validation: XMLValidationResult } {
  const generator = new XMLGenerator({ ...options, validateBeforeGenerate: false });
  const validation = generator.validate(dpe);
  const xml = generator.generate(dpe);
  return { xml, validation };
}

export default XMLGenerator;
