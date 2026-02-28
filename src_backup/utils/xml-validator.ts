/**
 * XML Validator pour DPE
 * Valide les fichiers XML contre le XSD ADEME v2.6
 * 
 * @module xml-validator
 * @version 2.6.0
 */

import { XMLValidationResult } from "../types/dpe";
import { XMLParser, XMLValidator as FastXMLValidator } from "fast-xml-parser";

/**
 * Classe pour valider des fichiers XML DPE
 */
export class XMLValidator {
  /**
   * Valide un fichier XML contre le XSD
   * @param xmlContent Le contenu XML à valider
   * @returns Résultat de la validation
   */
  public validate(xmlContent: string): XMLValidationResult {
    const errors: string[] = [];
    const coherenceErrors: string[] = [];

    // Validation XML de base avec fast-xml-parser
    const validationResult = FastXMLValidator.validate(xmlContent);
    if (validationResult !== true) {
      errors.push(`XML mal formé: ${validationResult.err.msg} à la ligne ${validationResult.err.line}`);
      return { valid: false, schema_errors: errors, coherence_errors: coherenceErrors };
    }

    try {
      // Parsing pour validation structurelle
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });
      
      const parsed = parser.parse(xmlContent);
      
      if (!parsed.dpe) {
        errors.push("L'élément racine doit être 'dpe'");
        return { valid: false, schema_errors: errors, coherence_errors: coherenceErrors };
      }

      // Validation structurelle
      this.validateStructure(parsed.dpe, errors);
      
      // Validation de cohérence
      this.validateCoherence(parsed.dpe, coherenceErrors);

    } catch (error) {
      errors.push(`Erreur de validation: ${error}`);
    }

    return {
      valid: errors.length === 0 && coherenceErrors.length === 0,
      schema_errors: errors,
      coherence_errors: coherenceErrors
    };
  }

  /**
   * Valide la structure du document XML
   */
  private validateStructure(dpe: Record<string, unknown>, errors: string[]): void {
    // Vérifier la version
    const version = dpe["@_version"];
    if (!version) {
      errors.push("L'attribut 'version' est requis sur l'élément dpe");
    }

    // Vérifier les sections obligatoires
    const administratif = dpe.administratif as Record<string, unknown>;
    if (!administratif) {
      errors.push("La section 'administratif' est obligatoire");
    } else {
      // Vérifier les champs obligatoires dans administratif
      const requiredFields = [
        "date_visite_diagnostiqueur",
        "date_etablissement_dpe",
        "nom_proprietaire",
        "enum_modele_dpe_id",
        "enum_version_id"
      ];

      for (const field of requiredFields) {
        if (!administratif[field]) {
          errors.push(`Le champ '${field}' est obligatoire dans administratif`);
        }
      }

      // Vérifier le diagnostiqueur
      if (!administratif.diagnostiqueur) {
        errors.push("La section 'diagnostiqueur' est obligatoire dans administratif");
      }

      // Vérifier la geolocalisation
      if (!administratif.geolocalisation) {
        errors.push("La section 'geolocalisation' est obligatoire dans administratif");
      }
    }

    const logement = dpe.logement as Record<string, unknown>;
    if (!logement) {
      errors.push("La section 'logement' est obligatoire");
    } else {
      // Vérifier les sous-sections obligatoires de logement
      if (!logement.caracteristique_generale) {
        errors.push("La section 'caracteristique_generale' est obligatoire dans logement");
      }

      if (!logement.meteo) {
        errors.push("La section 'meteo' est obligatoire dans logement");
      }

      if (!logement.enveloppe) {
        errors.push("La section 'enveloppe' est obligatoire dans logement");
      }
    }
  }

  /**
   * Valide la cohérence des données
   */
  private validateCoherence(dpe: Record<string, unknown>, errors: string[]): void {
    const logement = dpe.logement as Record<string, unknown>;
    if (!logement) return;

    const caracteristiqueGenerale = logement.caracteristique_generale as Record<string, unknown>;
    if (caracteristiqueGenerale) {
      const surfaceHabitable = caracteristiqueGenerale.surface_habitable_logement as number;
      
      if (surfaceHabitable !== undefined && surfaceHabitable <= 0) {
        errors.push("La surface habitable doit être supérieure à 0");
      }

      const hsp = caracteristiqueGenerale.hsp as number;
      if (hsp !== undefined && (hsp <= 0 || hsp > 10)) {
        errors.push("La hauteur sous plafond doit être comprise entre 0 et 10 mètres");
      }
    }

    const meteo = logement.meteo as Record<string, unknown>;
    if (meteo) {
      const zoneClimatique = meteo.enum_zone_climatique_id as number;
      if (zoneClimatique !== undefined && (zoneClimatique < 1 || zoneClimatique > 8)) {
        errors.push("La zone climatique doit être comprise entre 1 et 8");
      }

      const classeAltitude = meteo.enum_classe_altitude_id as number;
      if (classeAltitude !== undefined && (classeAltitude < 1 || classeAltitude > 3)) {
        errors.push("La classe d'altitude doit être comprise entre 1 et 3");
      }
    }

    // Vérifier la cohérence des sorties si présentes
    const sortie = logement.sortie as Record<string, unknown>;
    if (sortie) {
      const efConso = sortie.ef_conso as Record<string, unknown>;
      const epConso = sortie.ep_conso as Record<string, unknown>;
      
      if (efConso && epConso) {
        const conso5Usages = efConso.conso_5_usages as number;
        const epConso5Usages = epConso.ep_conso_5_usages as number;
        
        if (conso5Usages !== undefined && epConso5Usages !== undefined) {
          // EP doit être >= EF (principe énergétique)
          if (epConso5Usages < conso5Usages * 0.5) {
            errors.push("L'énergie primaire semble anormalement basse par rapport à l'énergie finale");
          }
        }
      }
    }
  }
}

/**
 * Fonction utilitaire pour valider un XML
 */
export function validateXML(xmlContent: string): XMLValidationResult {
  const validator = new XMLValidator();
  return validator.validate(xmlContent);
}
