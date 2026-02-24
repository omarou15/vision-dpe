/**
 * Service de génération XML pour les DPE
 * Conforme au format XSD ADEME v2.6
 */

import { DPEDocument, XMLExportOptions, XMLValidationResult, EnumVersionDpe } from '../types';
import { XMLBuilder } from 'fast-xml-parser';

// ============================================================================
// TYPES
// ============================================================================

export interface XMLGenerationResult {
  success: boolean;
  xml?: string;
  error?: string;
}

export interface XMLParseResult {
  success: boolean;
  document?: DPEDocument;
  error?: string;
}

// ============================================================================
// CONSTANTES XML
// ============================================================================

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const XSD_NAMESPACE = 'http://www.ademe.fr/dpe';
const XSD_SCHEMA_LOCATION = 'https://www.ademe.fr/dpe/schema/2.6/dpe.xsd';

// ============================================================================
// SERVICE XML GENERATOR
// ============================================================================

export class XMLGeneratorService {
  private static instance: XMLGeneratorService;
  private xmlBuilder: XMLBuilder;

  private constructor() {
    this.xmlBuilder = new XMLBuilder({
      format: true,
      indentBy: '  ',
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      suppressEmptyNode: true,
    });
  }

  static getInstance(): XMLGeneratorService {
    if (!XMLGeneratorService.instance) {
      XMLGeneratorService.instance = new XMLGeneratorService();
    }
    return XMLGeneratorService.instance;
  }

  // ============================================================================
  // GÉNÉRATION XML
  // ============================================================================

  /**
   * Génère le XML complet d'un DPE
   */
  generateXML(document: DPEDocument, options: XMLExportOptions = { include_validation: true, format: 'standard' }): XMLGenerationResult {
    try {
      // Validation préalable
      if (options.include_validation) {
        const validationResult = this.validateDocumentStructure(document);
        if (!validationResult.valid) {
          return {
            success: false,
            error: `Document invalide: ${validationResult.schema_errors.join(', ')}`,
          };
        }
      }

      // Construction de l'objet XML
      const xmlObject = this.buildXMLObject(document, options);

      // Génération XML
      const xmlContent = this.xmlBuilder.build(xmlObject);
      const fullXML = `${XML_DECLARATION}\n${xmlContent}`;

      return { success: true, xml: fullXML };
    } catch (error) {
      return {
        success: false,
        error: `Erreur génération XML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Génère uniquement la partie administratif en XML
   */
  generateAdministratifXML(document: DPEDocument): XMLGenerationResult {
    try {
      const xmlObject = {
        administratif: this.buildAdministratifNode(document.administratif),
      };

      const xmlContent = this.xmlBuilder.build(xmlObject);
      return { success: true, xml: `${XML_DECLARATION}\n${xmlContent}` };
    } catch (error) {
      return {
        success: false,
        error: `Erreur génération XML administratif: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Génère uniquement la partie logement en XML
   */
  generateLogementXML(document: DPEDocument): XMLGenerationResult {
    try {
      const xmlObject = {
        logement: this.buildLogementNode(document.logement),
      };

      const xmlContent = this.xmlBuilder.build(xmlObject);
      return { success: true, xml: `${XML_DECLARATION}\n${xmlContent}` };
    } catch (error) {
      return {
        success: false,
        error: `Erreur génération XML logement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ============================================================================
  // VALIDATION XML
  // ============================================================================

  /**
   * Valide la structure du document avant génération XML
   */
  validateDocumentStructure(document: DPEDocument): XMLValidationResult {
    const errors: string[] = [];

    // Vérification des champs obligatoires
    if (!document.administratif) {
      errors.push('Section administratif manquante');
    } else {
      if (!document.administratif.date_visite_diagnostiqueur) {
        errors.push('Date de visite manquante');
      }
      if (!document.administratif.date_etablissement_dpe) {
        errors.push('Date d\'établissement manquante');
      }
      if (!document.administratif.nom_proprietaire) {
        errors.push('Nom du propriétaire manquant');
      }
      if (!document.administratif.diagnostiqueur) {
        errors.push('Informations du diagnostiqueur manquantes');
      }
    }

    if (!document.logement) {
      errors.push('Section logement manquante');
    } else {
      if (!document.logement.caracteristique_generale) {
        errors.push('Caractéristiques générales manquantes');
      }
      if (!document.logement.enveloppe) {
        errors.push('Enveloppe manquante');
      }
    }

    return {
      valid: errors.length === 0,
      schema_errors: errors,
      coherence_errors: [],
    };
  }

  /**
   * Valide le XML généré contre le schéma XSD
   * Note: Nécessite une librairie de validation XSD côté serveur
   */
  async validateXMLAgainstSchema(xmlContent: string): Promise<XMLValidationResult> {
    // Cette méthode serait implémentée côté serveur ou via API ADEME
    // Pour le moment, on fait une validation basique
    const errors: string[] = [];

    // Vérification basique du XML
    if (!xmlContent.includes('<?xml version=')) {
      errors.push('Déclaration XML manquante');
    }

    if (!xmlContent.includes('<administratif>')) {
      errors.push('Section administratif manquante');
    }

    if (!xmlContent.includes('<logement>')) {
      errors.push('Section logement manquante');
    }

    return {
      valid: errors.length === 0,
      schema_errors: errors,
      coherence_errors: [],
    };
  }

  // ============================================================================
  // CONSTRUCTION DES NŒUDS XML
  // ============================================================================

  private buildXMLObject(document: DPEDocument, options: XMLExportOptions): unknown {
    const xmlObject: Record<string, unknown> = {
      '@_version': document.version || '8.0.4',
      '@_xmlns': XSD_NAMESPACE,
      '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      '@_xsi:schemaLocation': XSD_SCHEMA_LOCATION,
    };

    // Section administratif
    xmlObject.administratif = this.buildAdministratifNode(document.administratif);

    // Section logement
    xmlObject.logement = this.buildLogementNode(document.logement);

    return { dpe: xmlObject };
  }

  private buildAdministratifNode(administratif: DPEDocument['administratif']): unknown {
    return {
      date_visite_diagnostiqueur: administratif.date_visite_diagnostiqueur,
      date_etablissement_dpe: administratif.date_etablissement_dpe,
      nom_proprietaire: administratif.nom_proprietaire,
      ...(administratif.nom_proprietaire_installation_commune && {
        nom_proprietaire_installation_commune: administratif.nom_proprietaire_installation_commune,
      }),
      enum_modele_dpe_id: administratif.enum_modele_dpe_id,
      enum_version_id: administratif.enum_version_id,
      diagnostiqueur: this.buildDiagnostiqueurNode(administratif.diagnostiqueur),
      geolocalisation: this.buildGeolocalisationNode(administratif.geolocalisation),
    };
  }

  private buildDiagnostiqueurNode(diagnostiqueur: DPEDocument['administratif']['diagnostiqueur']): unknown {
    return {
      usr_logiciel_id: diagnostiqueur.usr_logiciel_id,
      version_logiciel: diagnostiqueur.version_logiciel,
      nom_diagnostiqueur: diagnostiqueur.nom_diagnostiqueur,
      prenom_diagnostiqueur: diagnostiqueur.prenom_diagnostiqueur,
      mail_diagnostiqueur: diagnostiqueur.mail_diagnostiqueur,
      telephone_diagnostiqueur: diagnostiqueur.telephone_diagnostiqueur,
      adresse_diagnostiqueur: diagnostiqueur.adresse_diagnostiqueur,
      entreprise_diagnostiqueur: diagnostiqueur.entreprise_diagnostiqueur,
      numero_certification_diagnostiqueur: diagnostiqueur.numero_certification_diagnostiqueur,
      organisme_certificateur: diagnostiqueur.organisme_certificateur,
    };
  }

  private buildGeolocalisationNode(geolocalisation: DPEDocument['administratif']['geolocalisation']): unknown {
    const node: Record<string, unknown> = {};

    if (geolocalisation.numero_fiscal_local) {
      node.numero_fiscal_local = geolocalisation.numero_fiscal_local;
    }
    if (geolocalisation.idpar) {
      node.idpar = geolocalisation.idpar;
    }
    if (geolocalisation.immatriculation_copropriete) {
      node.immatriculation_copropriete = geolocalisation.immatriculation_copropriete;
    }

    node.adresses = {
      adresse_proprietaire: this.buildAdresseNode(geolocalisation.adresses.adresse_proprietaire),
      adresse_bien: this.buildAdresseNode(geolocalisation.adresses.adresse_bien),
      ...(geolocalisation.adresses.adresse_proprietaire_installation_commune && {
        adresse_proprietaire_installation_commune: this.buildAdresseNode(
          geolocalisation.adresses.adresse_proprietaire_installation_commune
        ),
      }),
    };

    return node;
  }

  private buildAdresseNode(adresse: DPEDocument['administratif']['geolocalisation']['adresses']['adresse_bien']): unknown {
    const node: Record<string, unknown> = {
      adresse_brut: adresse.adresse_brut,
      code_postal_brut: adresse.code_postal_brut,
      nom_commune_brut: adresse.nom_commune_brut,
      label_brut: adresse.label_brut,
      label_brut_avec_complement: adresse.label_brut_avec_complement,
      enum_statut_geocodage_ban_id: adresse.enum_statut_geocodage_ban_id,
      ban_date_appel: adresse.ban_date_appel,
      ban_id: adresse.ban_id,
      ban_label: adresse.ban_label,
      ban_housenumber: adresse.ban_housenumber,
      ban_street: adresse.ban_street,
      ban_citycode: adresse.ban_citycode,
      ban_postcode: adresse.ban_postcode,
      ban_city: adresse.ban_city,
      ban_type: adresse.ban_type,
      ban_score: adresse.ban_score,
      ban_x: adresse.ban_x,
      ban_y: adresse.ban_y,
    };

    // Champs optionnels
    if (adresse.compl_nom_residence) node.compl_nom_residence = adresse.compl_nom_residence;
    if (adresse.compl_ref_batiment) node.compl_ref_batiment = adresse.compl_ref_batiment;
    if (adresse.compl_etage_appartement) node.compl_etage_appartement = adresse.compl_etage_appartement;
    if (adresse.compl_ref_cage_escalier) node.compl_ref_cage_escalier = adresse.compl_ref_cage_escalier;
    if (adresse.compl_ref_logement) node.compl_ref_logement = adresse.compl_ref_logement;

    return node;
  }

  private buildLogementNode(logement: DPEDocument['logement']): unknown {
    const node: Record<string, unknown> = {
      caracteristique_generale: this.buildCaracteristiqueGeneraleNode(logement.caracteristique_generale),
      meteo: this.buildMeteoNode(logement.meteo),
      enveloppe: this.buildEnveloppeNode(logement.enveloppe),
      ventilation: this.buildVentilationNode(logement.ventilation),
    };

    if (logement.installation_chauffage_collection) {
      node.installation_chauffage_collection = this.buildInstallationChauffageCollectionNode(
        logement.installation_chauffage_collection
      );
    }

    if (logement.installation_ecs_collection) {
      node.installation_ecs_collection = this.buildInstallationECSCollectionNode(logement.installation_ecs_collection);
    }

    return node;
  }

  private buildCaracteristiqueGeneraleNode(cg: DPEDocument['logement']['caracteristique_generale']): unknown {
    return {
      annee_construction: cg.annee_construction,
      enum_periode_construction_id: cg.enum_periode_construction_id,
      enum_methode_application_dpe_log_id: cg.enum_methode_application_dpe_log_id,
      surface_habitable_logement: cg.surface_habitable_logement,
      nombre_niveau_immeuble: cg.nombre_niveau_immeuble,
      nombre_niveau_logement: cg.nombre_niveau_logement,
      hsp: cg.hsp,
    };
  }

  private buildMeteoNode(meteo: DPEDocument['logement']['meteo']): unknown {
    return {
      enum_zone_climatique_id: meteo.enum_zone_climatique_id,
      enum_classe_altitude_id: meteo.enum_classe_altitude_id,
      batiment_materiaux_anciens: meteo.batiment_materiaux_anciens,
    };
  }

  private buildEnveloppeNode(enveloppe: DPEDocument['logement']['enveloppe']): unknown {
    return {
      inertie: this.buildInertieNode(enveloppe.inertie),
      mur_collection: this.buildMurCollectionNode(enveloppe.mur_collection),
      baie_vitree_collection: this.buildBaieVitreeCollectionNode(enveloppe.baie_vitree_collection),
      plancher_bas_collection: this.buildPlancherBasCollectionNode(enveloppe.plancher_bas_collection),
      plancher_haut_collection: this.buildPlancherHautCollectionNode(enveloppe.plancher_haut_collection),
    };
  }

  private buildInertieNode(inertie: DPEDocument['logement']['enveloppe']['inertie']): unknown {
    return {
      inertie_plancher_bas_lourd: inertie.inertie_plancher_bas_lourd,
      inertie_plancher_haut_lourd: inertie.inertie_plancher_haut_lourd,
      inertie_paroi_verticale_lourd: inertie.inertie_paroi_verticale_lourd,
      enum_classe_inertie_id: inertie.enum_classe_inertie_id,
    };
  }

  private buildMurCollectionNode(collection: DPEDocument['logement']['enveloppe']['mur_collection']): unknown {
    const murs = Array.isArray(collection.mur) ? collection.mur : [collection.mur];
    return {
      mur: murs.map(mur => ({
        donnee_entree: {
          reference: mur.donnee_entree.reference,
          ...(mur.donnee_entree.description && { description: mur.donnee_entree.description }),
          enum_type_adjacence_id: mur.donnee_entree.enum_type_adjacence_id,
          enum_orientation_id: mur.donnee_entree.enum_orientation_id,
          surface_paroi_opaque: mur.donnee_entree.surface_paroi_opaque,
          paroi_lourde: mur.donnee_entree.paroi_lourde,
          paroi_ancienne: mur.donnee_entree.paroi_ancienne,
          enum_type_isolation_id: mur.donnee_entree.enum_type_isolation_id,
          enum_methode_saisie_u_id: mur.donnee_entree.enum_methode_saisie_u_id,
          ...(mur.donnee_entree.tv_coef_reduction_deperdition_id && {
            tv_coef_reduction_deperdition_id: mur.donnee_entree.tv_coef_reduction_deperdition_id,
          }),
          ...(mur.donnee_entree.surface_paroi_totale && {
            surface_paroi_totale: mur.donnee_entree.surface_paroi_totale,
          }),
          ...(mur.donnee_entree.tv_umur0_id && { tv_umur0_id: mur.donnee_entree.tv_umur0_id }),
          ...(mur.donnee_entree.tv_umur_id && { tv_umur_id: mur.donnee_entree.tv_umur_id }),
          ...(mur.donnee_entree.epaisseur_structure && {
            epaisseur_structure: mur.donnee_entree.epaisseur_structure,
          }),
          ...(mur.donnee_entree.enum_materiaux_structure_mur_id && {
            enum_materiaux_structure_mur_id: mur.donnee_entree.enum_materiaux_structure_mur_id,
          }),
          ...(mur.donnee_entree.enum_methode_saisie_u0_id && {
            enum_methode_saisie_u0_id: mur.donnee_entree.enum_methode_saisie_u0_id,
          }),
          ...(mur.donnee_entree.enum_type_doublage_id && {
            enum_type_doublage_id: mur.donnee_entree.enum_type_doublage_id,
          }),
        },
        donnee_intermediaire: {
          b: mur.donnee_intermediaire.b,
          umur: mur.donnee_intermediaire.umur,
          ...(mur.donnee_intermediaire.umur0 && { umur0: mur.donnee_intermediaire.umur0 }),
        },
      })),
    };
  }

  private buildBaieVitreeCollectionNode(
    collection: DPEDocument['logement']['enveloppe']['baie_vitree_collection']
  ): unknown {
    if (!collection?.baie_vitree) return { baie_vitree: [] };

    const baies = Array.isArray(collection.baie_vitree) ? collection.baie_vitree : [collection.baie_vitree];
    return {
      baie_vitree: baies.map(baie => ({
        donnee_entree: {
          reference: baie.donnee_entree.reference,
          ...(baie.donnee_entree.description && { description: baie.donnee_entree.description }),
          enum_type_adjacence_id: baie.donnee_entree.enum_type_adjacence_id,
          enum_orientation_id: baie.donnee_entree.enum_orientation_id,
          surface_totale_baie: baie.donnee_entree.surface_totale_baie,
          ...(baie.donnee_entree.reference_paroi && { reference_paroi: baie.donnee_entree.reference_paroi }),
        },
        ...(baie.donnee_intermediaire && {
          donnee_intermediaire: {
            sw: baie.donnee_intermediaire.sw,
            ubat: baie.donnee_intermediaire.ubat,
          },
        }),
      })),
    };
  }

  private buildPlancherBasCollectionNode(
    collection: DPEDocument['logement']['enveloppe']['plancher_bas_collection']
  ): unknown {
    const planchers = Array.isArray(collection.plancher_bas) ? collection.plancher_bas : [collection.plancher_bas];
    return {
      plancher_bas: planchers.map(plancher => ({
        donnee_entree: {
          reference: plancher.donnee_entree.reference,
          ...(plancher.donnee_entree.description && { description: plancher.donnee_entree.description }),
          enum_type_adjacence_id: plancher.donnee_entree.enum_type_adjacence_id,
          surface_paroi_opaque: plancher.donnee_entree.surface_paroi_opaque,
          paroi_lourde: plancher.donnee_entree.paroi_lourde,
          enum_type_isolation_id: plancher.donnee_entree.enum_type_isolation_id,
          enum_methode_saisie_u_id: plancher.donnee_entree.enum_methode_saisie_u_id,
          ...(plancher.donnee_entree.tv_upb0_id && { tv_upb0_id: plancher.donnee_entree.tv_upb0_id }),
          ...(plancher.donnee_entree.tv_upb_id && { tv_upb_id: plancher.donnee_entree.tv_upb_id }),
        },
        donnee_intermediaire: {
          b: plancher.donnee_intermediaire.b,
          upb: plancher.donnee_intermediaire.upb,
          upb_final: plancher.donnee_intermediaire.upb_final,
        },
      })),
    };
  }

  private buildPlancherHautCollectionNode(
    collection: DPEDocument['logement']['enveloppe']['plancher_haut_collection']
  ): unknown {
    const planchers = Array.isArray(collection.plancher_haut) ? collection.plancher_haut : [collection.plancher_haut];
    return {
      plancher_haut: planchers.map(plancher => ({
        donnee_entree: {
          reference: plancher.donnee_entree.reference,
          ...(plancher.donnee_entree.description && { description: plancher.donnee_entree.description }),
          enum_type_adjacence_id: plancher.donnee_entree.enum_type_adjacence_id,
          surface_paroi_opaque: plancher.donnee_entree.surface_paroi_opaque,
          paroi_lourde: plancher.donnee_entree.paroi_lourde,
          enum_type_isolation_id: plancher.donnee_entree.enum_type_isolation_id,
          enum_methode_saisie_u_id: plancher.donnee_entree.enum_methode_saisie_u_id,
          ...(plancher.donnee_entree.tv_uph0_id && { tv_uph0_id: plancher.donnee_entree.tv_uph0_id }),
          ...(plancher.donnee_entree.tv_uph_id && { tv_uph_id: plancher.donnee_entree.tv_uph_id }),
        },
        donnee_intermediaire: {
          b: plancher.donnee_intermediaire.b,
          uph: plancher.donnee_intermediaire.uph,
        },
      })),
    };
  }

  private buildVentilationNode(ventilation: DPEDocument['logement']['ventilation']): unknown {
    // Placeholder - à compléter selon XSD
    return ventilation || {};
  }

  private buildInstallationChauffageCollectionNode(
    collection: NonNullable<DPEDocument['logement']['installation_chauffage_collection']>
  ): unknown {
    const installations = Array.isArray(collection.installation_chauffage)
      ? collection.installation_chauffage
      : [collection.installation_chauffage];
    return {
      installation_chauffage: installations,
    };
  }

  private buildInstallationECSCollectionNode(
    collection: NonNullable<DPEDocument['logement']['installation_ecs_collection']>
  ): unknown {
    const installations = Array.isArray(collection.installation_ecs)
      ? collection.installation_ecs
      : [collection.installation_ecs];
    return {
      installation_ecs: installations,
    };
  }

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  /**
   * Échappe les caractères spéciaux XML
   */
  escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Formate une date pour XML (ISO 8601)
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }
}

// Export singleton
export const xmlGeneratorService = XMLGeneratorService.getInstance();
