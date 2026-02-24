/**
 * XML Parser simplifié pour DPE ADEME v2.6
 * 
 * @module xml-parser
 * @version 2.6.0
 */

import { XMLParser, XMLValidator as FastXMLValidator } from "fast-xml-parser";
import { DPEDocument } from "../types/dpe";

// ============================================================================
// INTERFACES DE RÉSULTAT
// ============================================================================

export interface ParseResult {
  success: boolean;
  data?: DPEDocument;
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface ParseError {
  code: string;
  message: string;
  path: string;
  value?: unknown;
}

export interface ParseWarning {
  code: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ParseOptions {
  strict?: boolean;
  validateSchema?: boolean;
  defaultValues?: boolean;
  allowPartial?: boolean;
  warningsAsErrors?: boolean;
}

// ============================================================================
// OPTIONS DE PARSING
// ============================================================================

const DEFAULT_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  parseNumber: true,
  cdataPropName: "__cdata",
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class DPEXMLParser {
  private options: ParseOptions;
  private errors: ParseError[];
  private warnings: ParseWarning[];

  constructor(options: ParseOptions = {}) {
    this.options = {
      strict: false,
      validateSchema: true,
      defaultValues: true,
      allowPartial: false,
      warningsAsErrors: false,
      ...options,
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Parse un contenu XML en objet DPEDocument
   */
  parse(xmlContent: string): ParseResult {
    this.errors = [];
    this.warnings = [];

    try {
      // Validation XML de base
      if (this.options.validateSchema) {
        const validationResult = FastXMLValidator.validate(xmlContent);
        if (validationResult !== true) {
          this.errors.push({
            code: "XML_VALIDATION_ERROR",
            message: `XML invalide: ${validationResult.err.msg}`,
            path: validationResult.err.line?.toString() || "unknown",
          });
          if (this.options.strict) {
            return { success: false, errors: this.errors, warnings: this.warnings };
          }
        }
      }

      // Parsing XML
      const parser = new XMLParser(DEFAULT_PARSER_OPTIONS);
      const parsed = parser.parse(xmlContent);

      if (!parsed.dpe) {
        this.errors.push({
          code: "MISSING_ROOT_ELEMENT",
          message: "L'élément racine 'dpe' est manquant",
          path: "/",
        });
        return { success: false, errors: this.errors, warnings: this.warnings };
      }

      // Construction du DPE (simplifiée)
      const dpe = this.buildDPEDocument(parsed.dpe);

      return {
        success: (this.errors.length === 0 || this.options.allowPartial) as boolean,
        data: dpe,
        errors: this.errors,
        warnings: this.warnings,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      this.errors.push({
        code: "PARSE_EXCEPTION",
        message: errorMessage,
        path: "/",
      });
      return { success: false, errors: this.errors, warnings: this.warnings };
    }
  }

  /**
   * Construit un DPEDocument à partir des données XML parsées
   * Version simplifiée - mapping partiel
   */
  private buildDPEDocument(data: Record<string, unknown>): DPEDocument {
    // Construction basique - les champs manquants seront complétés
    const dpe: DPEDocument = {
      version: this.extractString(data, "@_version", "8.0.4"),
      administratif: this.buildAdministratif(data.administratif as Record<string, unknown>),
      logement: this.buildLogement(data.logement as Record<string, unknown>),
    };

    return dpe;
  }

  private buildAdministratif(data: Record<string, unknown> | undefined): DPEDocument["administratif"] {
    if (!data) {
      this.errors.push({ code: "MISSING_ADMINISTRATIF", message: "Section administratif manquante", path: "/administratif" });
      throw new Error("Administratif manquant");
    }

    const diag = data.diagnostiqueur as Record<string, unknown>;
    const geo = data.geolocalisation as Record<string, unknown>;
    const adresses = geo?.adresses as Record<string, unknown>;

    return {
      date_visite_diagnostiqueur: this.extractString(data, "date_visite_diagnostiqueur", ""),
      date_etablissement_dpe: this.extractString(data, "date_etablissement_dpe", ""),
      nom_proprietaire: this.extractString(data, "nom_proprietaire", ""),
      enum_modele_dpe_id: this.extractNumber(data, "enum_modele_dpe_id", 1),
      enum_version_id: (this.extractString(data, "enum_version_id", "2.6") as DPEDocument["administratif"]["enum_version_id"]),
      diagnostiqueur: {
        usr_logiciel_id: this.extractNumber(diag, "usr_logiciel_id", 0),
        version_logiciel: this.extractString(diag, "version_logiciel", ""),
        nom_diagnostiqueur: this.extractString(diag, "nom_diagnostiqueur", ""),
        prenom_diagnostiqueur: this.extractString(diag, "prenom_diagnostiqueur", ""),
        mail_diagnostiqueur: this.extractString(diag, "mail_diagnostiqueur", ""),
        telephone_diagnostiqueur: this.extractString(diag, "telephone_diagnostiqueur", ""),
        adresse_diagnostiqueur: this.extractString(diag, "adresse_diagnostiqueur", ""),
        entreprise_diagnostiqueur: this.extractString(diag, "entreprise_diagnostiqueur", ""),
        numero_certification_diagnostiqueur: this.extractString(diag, "numero_certification_diagnostiqueur", ""),
        organisme_certificateur: this.extractString(diag, "organisme_certificateur", ""),
      },
      geolocalisation: {
        adresses: {
          adresse_proprietaire: this.buildAdresse(adresses?.adresse_proprietaire as Record<string, unknown>),
          adresse_bien: this.buildAdresse(adresses?.adresse_bien as Record<string, unknown>),
        },
      },
    };
  }

  private buildAdresse(data: Record<string, unknown> | undefined): DPEDocument["administratif"]["geolocalisation"]["adresses"]["adresse_bien"] {
    if (!data) {
      return {
        adresse_brut: "",
        code_postal_brut: "",
        nom_commune_brut: "",
        label_brut: "",
        label_brut_avec_complement: "",
        enum_statut_geocodage_ban_id: 1,
        ban_date_appel: "",
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
      };
    }

    return {
      adresse_brut: this.extractString(data, "adresse_brut", ""),
      code_postal_brut: this.extractString(data, "code_postal_brut", ""),
      nom_commune_brut: this.extractString(data, "nom_commune_brut", ""),
      label_brut: this.extractString(data, "label_brut", ""),
      label_brut_avec_complement: this.extractString(data, "label_brut_avec_complement", ""),
      enum_statut_geocodage_ban_id: this.extractNumber(data, "enum_statut_geocodage_ban_id", 1),
      ban_date_appel: this.extractString(data, "ban_date_appel", ""),
      ban_id: this.extractString(data, "ban_id", ""),
      ban_label: this.extractString(data, "ban_label", ""),
      ban_housenumber: this.extractString(data, "ban_housenumber", ""),
      ban_street: this.extractString(data, "ban_street", ""),
      ban_citycode: this.extractString(data, "ban_citycode", ""),
      ban_postcode: this.extractString(data, "ban_postcode", ""),
      ban_city: this.extractString(data, "ban_city", ""),
      ban_type: this.extractString(data, "ban_type", ""),
      ban_score: this.extractNumber(data, "ban_score", 0),
      ban_x: this.extractNumber(data, "ban_x", 0),
      ban_y: this.extractNumber(data, "ban_y", 0),
    };
  }

  private buildLogement(data: Record<string, unknown> | undefined): DPEDocument["logement"] {
    if (!data) {
      this.errors.push({ code: "MISSING_LOGEMENT", message: "Section logement manquante", path: "/logement" });
      throw new Error("Logement manquant");
    }

    const cg = data.caracteristique_generale as Record<string, unknown>;
    const meteo = data.meteo as Record<string, unknown>;
    const enveloppe = data.enveloppe as Record<string, unknown>;

    return {
      caracteristique_generale: {
        enum_periode_construction_id: this.extractNumber(cg, "enum_periode_construction_id", 1),
        enum_methode_application_dpe_log_id: this.extractNumber(cg, "enum_methode_application_dpe_log_id", 1),
        hsp: this.extractNumber(cg, "hsp", 2.5),
      },
      meteo: {
        enum_zone_climatique_id: this.extractNumber(meteo, "enum_zone_climatique_id", 1),
        enum_classe_altitude_id: this.extractNumber(meteo, "enum_classe_altitude_id", 1),
        batiment_materiaux_anciens: this.extractNumber(meteo, "batiment_materiaux_anciens", 0),
      },
      enveloppe: {
        inertie: {
          inertie_plancher_bas_lourd: 0,
          inertie_plancher_haut_lourd: 0,
          inertie_paroi_verticale_lourd: 0,
          enum_classe_inertie_id: 1,
        },
        mur_collection: this.buildMurCollection(enveloppe?.mur_collection as Record<string, unknown>),
        plancher_bas_collection: { plancher_bas: [] },
        plancher_haut_collection: { plancher_haut: [] },
      },
    };
  }

  private buildMurCollection(data: Record<string, unknown> | undefined): DPEDocument["logement"]["enveloppe"]["mur_collection"] {
    if (!data || !data.mur) {
      return { mur: [] };
    }

    const murs = Array.isArray(data.mur) ? data.mur : [data.mur];
    
    return {
      mur: murs.map((mur) => ({
        donnee_entree: {
          reference: this.extractString((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "reference", "MUR-UNKNOWN"),
          enum_type_adjacence_id: this.extractNumber((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "enum_type_adjacence_id", 1),
          enum_orientation_id: this.extractNumber((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "enum_orientation_id", 1),
          surface_paroi_opaque: this.extractNumber((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "surface_paroi_opaque", 0),
          paroi_lourde: this.extractNumber((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "paroi_lourde", 0),
          enum_type_isolation_id: this.extractNumber((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "enum_type_isolation_id", 1),
          enum_methode_saisie_u_id: this.extractNumber((mur as Record<string, unknown>)?.donnee_entree as Record<string, unknown> | undefined, "enum_methode_saisie_u_id", 1),
        },
        donnee_intermediaire: {
          b: this.extractNumber((mur as Record<string, unknown>)?.donnee_intermediaire as Record<string, unknown> | undefined, "b", 1),
          umur: this.extractNumber((mur as Record<string, unknown>)?.donnee_intermediaire as Record<string, unknown> | undefined, "umur", 0),
        },
      })),
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private extractString(data: Record<string, unknown> | undefined, key: string, defaultValue?: string): string {
    if (!data) return defaultValue ?? "";
    const value = data[key];
    if (value === undefined || value === null) {
      return defaultValue ?? "";
    }
    return String(value);
  }

  private extractNumber(data: Record<string, unknown> | undefined, key: string, defaultValue?: number): number {
    if (!data) return defaultValue ?? 0;
    const value = data[key];
    if (value === undefined || value === null) {
      return defaultValue ?? 0;
    }
    const num = Number(value);
    return isNaN(num) ? (defaultValue ?? 0) : num;
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ============================================================================

/**
 * Parse un XML DPE en objet DPEDocument
 */
export function parseDPEXML(xmlContent: string, options?: ParseOptions): ParseResult {
  const parser = new DPEXMLParser(options);
  return parser.parse(xmlContent);
}

/**
 * Parse un XML DPE de manière stricte (erreurs fatales)
 */
export function parseDPEXMLStrict(xmlContent: string): ParseResult {
  const parser = new DPEXMLParser({ strict: true, validateSchema: true });
  return parser.parse(xmlContent);
}

/**
 * Parse un XML DPE avec valeurs par défaut (permissif)
 */
export function parseDPEXMLWithDefaults(xmlContent: string): ParseResult {
  const parser = new DPEXMLParser({ strict: false, defaultValues: true, allowPartial: true });
  return parser.parse(xmlContent);
}

export default DPEXMLParser;
