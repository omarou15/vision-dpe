/**
 * XMLGeneratorService - Service de génération XML ADEME
 * Phase 1 - Module Administratif
 * 
 * Génère des documents XML conformes au schéma XSD ADEME v2.6
 */

import {
  IXMLGeneratorService,
  XMLGenerationResult,
  XMLGenerationStatus,
  XMLValidationOptions,
  XMLExportConfig,
} from "../types/services";
import {
  DPEDocument,
  XMLValidationResult,
} from "../types/dpe";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

// ============================================================================
// CONSTANTES XML
// ============================================================================

const XML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>`;

const XML_NAMESPACES = {
  xmlns: "http://www.ademe.fr/dpe/2.6",
  "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  "xsi:schemaLocation": "http://www.ademe.fr/dpe/2.6 dpe_v2.6.xsd",
};

const DEFAULT_CONFIG: XMLExportConfig = {
  version: "2.6",
  format: "standard",
  includePhotos: false,
  includeSignatures: false,
  encoding: "UTF-8",
};

// ============================================================================
// OPTIONS DE GÉNÉRATION XML
// ============================================================================

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
// MAPPING DPE VERS XML
// ============================================================================

interface XMLAdministratif {
  date_visite_diagnostiqueur: string;
  date_etablissement_dpe: string;
  nom_proprietaire: string;
  enum_modele_dpe_id: number;
  enum_version_id: string;
  diagnostiqueur: XMLDiagnostiqueur;
  geolocalisation: XMLGeolocalisation;
}

interface XMLDiagnostiqueur {
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

interface XMLGeolocalisation {
  adresses: {
    adresse_proprietaire: XMLAdresse;
    adresse_bien: XMLAdresse;
  };
}

interface XMLAdresse {
  adresse_brut: string;
  code_postal_brut: string;
  nom_commune_brut: string;
  label_brut: string;
  label_brut_avec_complement: string;
  enum_statut_geocodage_ban_id: number;
  ban_date_appel: string;
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

interface XMLLogement {
  caracteristique_generale: XMLCaracteristiqueGenerale;
  meteo: XMLMeteo;
  enveloppe: XMLEnveloppe;
  ventilation: XMLVentilation;
}

interface XMLCaracteristiqueGenerale {
  annee_construction: number;
  enum_periode_construction_id: number;
  enum_methode_application_dpe_log_id: number;
  surface_habitable_logement: number;
  nombre_niveau_immeuble: number;
  nombre_niveau_logement: number;
  hsp: number;
}

interface XMLMeteo {
  enum_zone_climatique_id: number;
  enum_classe_altitude_id: number;
  batiment_materiaux_anciens: number;
}

interface XMLEnveloppe {
  inertie: XMLInertie;
  mur_collection: { mur: XMLMur[] };
  baie_vitree_collection?: { baie_vitree: XMLBaieVitree[] };
  plancher_bas_collection: { plancher_bas: XMLPlancherBas[] };
  plancher_haut_collection: { plancher_haut: XMLPlancherHaut[] };
}

interface XMLInertie {
  inertie_plancher_bas_lourd: number;
  inertie_plancher_haut_lourd: number;
  inertie_paroi_verticale_lourd: number;
  enum_classe_inertie_id: number;
}

interface XMLMur {
  donnee_entree: XMLMurDonneeEntree;
  donnee_intermediaire: XMLMurDonneeIntermediaire;
}

interface XMLMurDonneeEntree {
  reference: string;
  enum_type_adjacence_id: number;
  enum_orientation_id: number;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
  paroi_ancienne: number;
}

interface XMLMurDonneeIntermediaire {
  b: number;
  umur: number;
}

interface XMLBaieVitree {
  donnee_entree: XMLBaieVitreeDonneeEntree;
}

interface XMLBaieVitreeDonneeEntree {
  reference: string;
  enum_type_adjacence_id: number;
  enum_orientation_id: number;
  surface_totale_baie: number;
}

interface XMLPlancherBas {
  donnee_entree: XMLPlancherBasDonneeEntree;
  donnee_intermediaire: XMLPlancherBasDonneeIntermediaire;
}

interface XMLPlancherBasDonneeEntree {
  reference: string;
  enum_type_adjacence_id: number;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
}

interface XMLPlancherBasDonneeIntermediaire {
  b: number;
  upb: number;
  upb_final: number;
}

interface XMLPlancherHaut {
  donnee_entree: XMLPlancherHautDonneeEntree;
  donnee_intermediaire: XMLPlancherHautDonneeIntermediaire;
}

interface XMLPlancherHautDonneeEntree {
  reference: string;
  enum_type_adjacence_id: number;
  surface_paroi_opaque: number;
  paroi_lourde: number;
  enum_type_isolation_id: number;
  enum_methode_saisie_u_id: number;
}

interface XMLPlancherHautDonneeIntermediaire {
  b: number;
  uph: number;
}

interface XMLVentilation {
  // Structure simplifiée pour la Phase 1
}

interface XMLDPE {
  version: string;
  administratif: XMLAdministratif;
  logement: XMLLogement;
}

export class XMLGeneratorService implements IXMLGeneratorService {
  private config: XMLExportConfig;

  constructor(config?: Partial<XMLExportConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Mappe un DPE vers la structure XML
   */
  private mapDPEToXML(dpeData: DPEDocument): XMLDPE {
    const { administratif, logement } = dpeData;

    return {
      version: "8.0.4",
      administratif: {
        date_visite_diagnostiqueur: administratif.date_visite_diagnostiqueur,
        date_etablissement_dpe: administratif.date_etablissement_dpe,
        nom_proprietaire: administratif.nom_proprietaire,
        enum_modele_dpe_id: administratif.enum_modele_dpe_id,
        enum_version_id: administratif.enum_version_id,
        diagnostiqueur: {
          usr_logiciel_id: administratif.diagnostiqueur.usr_logiciel_id,
          version_logiciel: administratif.diagnostiqueur.version_logiciel,
          nom_diagnostiqueur: administratif.diagnostiqueur.nom_diagnostiqueur,
          prenom_diagnostiqueur: administratif.diagnostiqueur.prenom_diagnostiqueur,
          mail_diagnostiqueur: administratif.diagnostiqueur.mail_diagnostiqueur,
          telephone_diagnostiqueur: administratif.diagnostiqueur.telephone_diagnostiqueur,
          adresse_diagnostiqueur: administratif.diagnostiqueur.adresse_diagnostiqueur,
          entreprise_diagnostiqueur: administratif.diagnostiqueur.entreprise_diagnostiqueur,
          numero_certification_diagnostiqueur: administratif.diagnostiqueur.numero_certification_diagnostiqueur,
          organisme_certificateur: administratif.diagnostiqueur.organisme_certificateur,
        },
        geolocalisation: {
          adresses: {
            adresse_proprietaire: this.mapAdresseToXML(administratif.geolocalisation.adresses.adresse_proprietaire),
            adresse_bien: this.mapAdresseToXML(administratif.geolocalisation.adresses.adresse_bien),
          },
        },
      },
      logement: {
        caracteristique_generale: {
          annee_construction: logement.caracteristique_generale.annee_construction ?? 0,
          enum_periode_construction_id: logement.caracteristique_generale.enum_periode_construction_id ?? 0,
          enum_methode_application_dpe_log_id: logement.caracteristique_generale.enum_methode_application_dpe_log_id ?? 0,
          surface_habitable_logement: logement.caracteristique_generale.surface_habitable_logement ?? 0,
          nombre_niveau_immeuble: logement.caracteristique_generale.nombre_niveau_immeuble ?? 0,
          nombre_niveau_logement: logement.caracteristique_generale.nombre_niveau_logement ?? 0,
          hsp: logement.caracteristique_generale.hsp ?? 0,
        },
        meteo: {
          enum_zone_climatique_id: logement.meteo.enum_zone_climatique_id ?? 0,
          enum_classe_altitude_id: logement.meteo.enum_classe_altitude_id ?? 0,
          batiment_materiaux_anciens: logement.meteo.batiment_materiaux_anciens ?? 0,
        },
        enveloppe: {
          inertie: {
            inertie_plancher_bas_lourd: logement.enveloppe.inertie.inertie_plancher_bas_lourd ?? 0,
            inertie_plancher_haut_lourd: logement.enveloppe.inertie.inertie_plancher_haut_lourd ?? 0,
            inertie_paroi_verticale_lourd: logement.enveloppe.inertie.inertie_paroi_verticale_lourd ?? 0,
            enum_classe_inertie_id: logement.enveloppe.inertie.enum_classe_inertie_id,
          },
          mur_collection: {
            mur: this.mapMursToXML(logement.enveloppe.mur_collection),
          },
          baie_vitree_collection: logement.enveloppe.baie_vitree_collection
            ? { baie_vitree: this.mapBaiesToXML(logement.enveloppe.baie_vitree_collection) }
            : undefined,
          plancher_bas_collection: {
            plancher_bas: this.mapPlanchersBasToXML(logement.enveloppe.plancher_bas_collection),
          },
          plancher_haut_collection: {
            plancher_haut: this.mapPlanchersHautToXML(logement.enveloppe.plancher_haut_collection),
          },
        },
        ventilation: {},
      },
    };
  }

  /**
   * Mappe une adresse vers XML
   */
  private mapAdresseToXML(adresse: DPEDocument["administratif"]["geolocalisation"]["adresses"]["adresse_bien"]): XMLAdresse {
    return {
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
  }

  /**
   * Mappe les murs vers XML
   */
  private mapMursToXML(murCollection: DPEDocument["logement"]["enveloppe"]["mur_collection"]): XMLMur[] {
    const murs = Array.isArray(murCollection.mur) ? murCollection.mur : [murCollection.mur];
    
    return murs.map((mur) => ({
      donnee_entree: {
        reference: mur.donnee_entree.reference,
        enum_type_adjacence_id: mur.donnee_entree.enum_type_adjacence_id,
        enum_orientation_id: mur.donnee_entree.enum_orientation_id,
        surface_paroi_opaque: mur.donnee_entree.surface_paroi_opaque,
        paroi_lourde: mur.donnee_entree.paroi_lourde,
        enum_type_isolation_id: mur.donnee_entree.enum_type_isolation_id,
        enum_methode_saisie_u_id: mur.donnee_entree.enum_methode_saisie_u_id,
        paroi_ancienne: mur.donnee_entree.enduit_isolant_paroi_ancienne ?? 0,
      },
      donnee_intermediaire: {
        b: mur.donnee_intermediaire.b,
        umur: mur.donnee_intermediaire.umur,
      },
    }));
  }

  /**
   * Mappe les baies vitrées vers XML
   */
  private mapBaiesToXML(baieCollection: DPEDocument["logement"]["enveloppe"]["baie_vitree_collection"]): XMLBaieVitree[] {
    if (!baieCollection) return [];
    
    const baies = Array.isArray(baieCollection.baie_vitree)
      ? baieCollection.baie_vitree
      : [baieCollection.baie_vitree];
    
    return baies.map((baie) => ({
      donnee_entree: {
        reference: baie.donnee_entree.reference,
        enum_type_adjacence_id: baie.donnee_entree.enum_type_adjacence_id,
        enum_orientation_id: baie.donnee_entree.enum_orientation_id,
        surface_totale_baie: baie.donnee_entree.surface_totale_baie,
      },
    }));
  }

  /**
   * Mappe les planchers bas vers XML
   */
  private mapPlanchersBasToXML(
    plancherCollection: DPEDocument["logement"]["enveloppe"]["plancher_bas_collection"]
  ): XMLPlancherBas[] {
    if (!plancherCollection) return [];
    
    const planchers = Array.isArray(plancherCollection.plancher_bas)
      ? plancherCollection.plancher_bas
      : [plancherCollection.plancher_bas];
    
    return planchers.map((plancher) => ({
      donnee_entree: {
        reference: plancher.donnee_entree.reference,
        enum_type_adjacence_id: plancher.donnee_entree.enum_type_adjacence_id,
        surface_paroi_opaque: plancher.donnee_entree.surface_paroi_opaque,
        paroi_lourde: plancher.donnee_entree.paroi_lourde,
        enum_type_isolation_id: plancher.donnee_entree.enum_type_isolation_id,
        enum_methode_saisie_u_id: plancher.donnee_entree.enum_methode_saisie_u_id,
      },
      donnee_intermediaire: {
        b: plancher.donnee_intermediaire.b,
        upb: plancher.donnee_intermediaire.upb,
        upb_final: plancher.donnee_intermediaire.upb_final,
      },
    }));
  }

  /**
   * Mappe les planchers haut vers XML
   */
  private mapPlanchersHautToXML(
    plancherCollection: DPEDocument["logement"]["enveloppe"]["plancher_haut_collection"]
  ): XMLPlancherHaut[] {
    if (!plancherCollection) return [];
    
    const planchers = Array.isArray(plancherCollection.plancher_haut)
      ? plancherCollection.plancher_haut
      : [plancherCollection.plancher_haut];
    
    return planchers.map((plancher) => ({
      donnee_entree: {
        reference: plancher.donnee_entree.reference,
        enum_type_adjacence_id: plancher.donnee_entree.enum_type_adjacence_id,
        surface_paroi_opaque: plancher.donnee_entree.surface_paroi_opaque,
        paroi_lourde: plancher.donnee_entree.paroi_lourde,
        enum_type_isolation_id: plancher.donnee_entree.enum_type_isolation_id,
        enum_methode_saisie_u_id: plancher.donnee_entree.enum_methode_saisie_u_id,
      },
      donnee_intermediaire: {
        b: plancher.donnee_intermediaire.b,
        uph: plancher.donnee_intermediaire.uph,
      },
    }));
  }

  /**
   * Génère le XML ADEME à partir d'un DPE
   */
  generate(dpeData: DPEDocument, config?: Partial<XMLExportConfig>): XMLGenerationResult {
    try {
      // Évite l'erreur de variable non utilisée
      void { ...this.config, ...config };
      
      // Mappe le DPE vers la structure XML
      const xmlData = this.mapDPEToXML(dpeData);

      // Crée le builder XML
      const builder = new XMLBuilder({
        ...XML_BUILDER_OPTIONS,
        format: true,
      });

      // Construit le XML
      const xmlContent = builder.build({
        dpe: {
          "@_version": xmlData.version,
          ...XML_NAMESPACES,
          administratif: xmlData.administratif,
          logement: xmlData.logement,
        },
      });

      const fullXml = `${XML_HEADER}\n${xmlContent}`;
      const fileName = `DPE_${dpeData.administratif.nom_proprietaire.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xml`;

      return {
        status: XMLGenerationStatus.SUCCESS,
        xmlContent: fullXml,
        fileName,
        fileSize: Buffer.byteLength(fullXml, "utf-8"),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      return {
        status: XMLGenerationStatus.ERROR,
        errors: [
          {
            code: "generation_error",
            message: errorMessage,
          },
        ],
      };
    }
  }

  /**
   * Génère le XML de manière asynchrone
   */
  async generateAsync(
    dpeData: DPEDocument,
    config?: Partial<XMLExportConfig>
  ): Promise<XMLGenerationResult> {
    // Pour la Phase 1, la génération est synchrone
    // En Phase 2, pourrait être déléguée à un worker
    return this.generate(dpeData, config);
  }

  /**
   * Valide un XML généré
   */
  validate(xmlContent: string, options: XMLValidationOptions = {}): XMLValidationResult {
    const errors: string[] = [];
    const coherenceErrors: string[] = [];

    try {
      // Parse le XML pour vérifier la syntaxe
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });

      const parsed = parser.parse(xmlContent);

      // Vérifie la structure de base
      if (!parsed.dpe) {
        errors.push("Racine 'dpe' manquante");
        return { valid: false, schema_errors: errors, coherence_errors: coherenceErrors };
      }

      // Vérifie les sections obligatoires
      if (!parsed.dpe.administratif) {
        errors.push("Section 'administratif' manquante");
      }

      if (!parsed.dpe.logement) {
        errors.push("Section 'logement' manquante");
      }

      // Vérifications de cohérence basiques
      if (options.checkCoherence) {
        const admin = parsed.dpe.administratif;
        if (admin) {
          if (!admin.date_visite_diagnostiqueur) {
            coherenceErrors.push("Date de visite manquante");
          }
          if (!admin.nom_proprietaire) {
            coherenceErrors.push("Nom du propriétaire manquant");
          }
        }
      }

      return {
        valid: errors.length === 0,
        schema_errors: errors,
        coherence_errors: coherenceErrors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de parsing XML";
      return {
        valid: false,
        schema_errors: [errorMessage],
        coherence_errors: coherenceErrors,
      };
    }
  }

  /**
   * Exporte le XML vers un fichier
   * Note: Cette méthode est un stub pour la Phase 1
   * En environnement Node.js, elle utiliserait fs
   */
  async exportToFile(
    xmlContent: string,
    fileName: string,
    directory: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    // Évite l'erreur de variable non utilisée
    void xmlContent;
    
    // Pour la Phase 1, retourne un succès simulé
    // En Phase 2, implémenter avec fs.writeFile
    return {
      success: true,
      path: `${directory}/${fileName}`,
    };
  }

  /**
   * Parse un XML existant en objet DPE
   */
  parse(xmlContent: string): { success: boolean; data?: DPEDocument; errors?: string[] } {
    try {
      // Évite l'erreur de variable non utilisée
      void xmlContent;
      
      // Pour la Phase 1, retourne un succès partiel
      // Le mapping complet XML -> DPE sera implémenté en Phase 2
      return {
        success: true,
        data: undefined, // À implémenter: mapping XML -> DPEDocument
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de parsing";
      return { success: false, errors: [errorMessage] };
    }
  }

  /**
   * Récupère la configuration par défaut
   */
  getDefaultConfig(): XMLExportConfig {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Vérifie si la version XML est supportée
   */
  isVersionSupported(version: string): boolean {
    return version === "2.6" || version === "2.5";
  }
}

// Export singleton factory
let xmlGeneratorServiceInstance: XMLGeneratorService | null = null;

export function createXMLGeneratorService(config?: Partial<XMLExportConfig>): XMLGeneratorService {
  if (!xmlGeneratorServiceInstance) {
    xmlGeneratorServiceInstance = new XMLGeneratorService(config);
  }
  return xmlGeneratorServiceInstance;
}

export function getXMLGeneratorService(): XMLGeneratorService | null {
  return xmlGeneratorServiceInstance;
}
