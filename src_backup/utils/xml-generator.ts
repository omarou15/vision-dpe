/**
 * XML Generator simplifié pour DPE ADEME v2.6
 * 
 * @module xml-generator
 * @version 2.6.0
 */

import { DPEDocument, XMLValidationResult, Mur, PlancherBas, PlancherHaut } from "../types/dpe";

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

    const lines: string[] = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(`<dpe version="${this.escapeXml(dpe.version || "8.0.4")}" xmlns="http://www.ademe.fr/dpe/2.6" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ademe.fr/dpe/2.6 dpe_v2.6.xsd">`);
    
    this.generateAdministratif(lines, dpe.administratif, 1);
    this.generateLogement(lines, dpe.logement, 1);
    
    lines.push(`</dpe>`);
    
    return lines.join(this.options.formatOutput ? '\n' : '');
  }

  private generateAdministratif(lines: string[], admin: DPEDocument["administratif"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<administratif>`);
    
    lines.push(`${this.getIndent(indent + 1)}<date_visite_diagnostiqueur>${this.escapeXml(admin.date_visite_diagnostiqueur)}</date_visite_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<date_etablissement_dpe>${this.escapeXml(admin.date_etablissement_dpe)}</date_etablissement_dpe>`);
    lines.push(`${this.getIndent(indent + 1)}<nom_proprietaire>${this.escapeXml(admin.nom_proprietaire)}</nom_proprietaire>`);
    lines.push(`${this.getIndent(indent + 1)}<enum_modele_dpe_id>${admin.enum_modele_dpe_id}</enum_modele_dpe_id>`);
    lines.push(`${this.getIndent(indent + 1)}<enum_version_id>${this.escapeXml(admin.enum_version_id)}</enum_version_id>`);
    
    this.generateDiagnostiqueur(lines, admin.diagnostiqueur, indent + 1);
    this.generateGeolocalisation(lines, admin.geolocalisation, indent + 1);
    
    lines.push(`${ind}</administratif>`);
  }

  private generateDiagnostiqueur(lines: string[], diag: DPEDocument["administratif"]["diagnostiqueur"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<diagnostiqueur>`);
    
    lines.push(`${this.getIndent(indent + 1)}<usr_logiciel_id>${diag.usr_logiciel_id}</usr_logiciel_id>`);
    lines.push(`${this.getIndent(indent + 1)}<version_logiciel>${this.escapeXml(diag.version_logiciel)}</version_logiciel>`);
    lines.push(`${this.getIndent(indent + 1)}<nom_diagnostiqueur>${this.escapeXml(diag.nom_diagnostiqueur)}</nom_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<prenom_diagnostiqueur>${this.escapeXml(diag.prenom_diagnostiqueur)}</prenom_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<mail_diagnostiqueur>${this.escapeXml(diag.mail_diagnostiqueur)}</mail_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<telephone_diagnostiqueur>${this.escapeXml(diag.telephone_diagnostiqueur)}</telephone_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<adresse_diagnostiqueur>${this.escapeXml(diag.adresse_diagnostiqueur)}</adresse_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<entreprise_diagnostiqueur>${this.escapeXml(diag.entreprise_diagnostiqueur)}</entreprise_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<numero_certification_diagnostiqueur>${this.escapeXml(diag.numero_certification_diagnostiqueur)}</numero_certification_diagnostiqueur>`);
    lines.push(`${this.getIndent(indent + 1)}<organisme_certificateur>${this.escapeXml(diag.organisme_certificateur)}</organisme_certificateur>`);
    
    lines.push(`${ind}</diagnostiqueur>`);
  }

  private generateGeolocalisation(lines: string[], geo: DPEDocument["administratif"]["geolocalisation"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<geolocalisation>`);
    
    this.generateAdresses(lines, geo.adresses, indent + 1);
    
    lines.push(`${ind}</geolocalisation>`);
  }

  private generateAdresses(lines: string[], adresses: DPEDocument["administratif"]["geolocalisation"]["adresses"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<adresses>`);
    
    this.generateAdresse(lines, adresses.adresse_proprietaire, "adresse_proprietaire", indent + 1);
    this.generateAdresse(lines, adresses.adresse_bien, "adresse_bien", indent + 1);
    
    lines.push(`${ind}</adresses>`);
  }

  private generateAdresse(lines: string[], adresse: DPEDocument["administratif"]["geolocalisation"]["adresses"]["adresse_bien"], tagName: string, indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<${tagName}>`);
    
    lines.push(`${this.getIndent(indent + 1)}<adresse_brut>${this.escapeXml(adresse.adresse_brut)}</adresse_brut>`);
    lines.push(`${this.getIndent(indent + 1)}<code_postal_brut>${this.escapeXml(adresse.code_postal_brut)}</code_postal_brut>`);
    lines.push(`${this.getIndent(indent + 1)}<nom_commune_brut>${this.escapeXml(adresse.nom_commune_brut)}</nom_commune_brut>`);
    lines.push(`${this.getIndent(indent + 1)}<label_brut>${this.escapeXml(adresse.label_brut)}</label_brut>`);
    lines.push(`${this.getIndent(indent + 1)}<label_brut_avec_complement>${this.escapeXml(adresse.label_brut_avec_complement)}</label_brut_avec_complement>`);
    lines.push(`${this.getIndent(indent + 1)}<enum_statut_geocodage_ban_id>${adresse.enum_statut_geocodage_ban_id}</enum_statut_geocodage_ban_id>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_date_appel>${this.escapeXml(adresse.ban_date_appel)}</ban_date_appel>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_id>${this.escapeXml(adresse.ban_id)}</ban_id>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_label>${this.escapeXml(adresse.ban_label)}</ban_label>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_housenumber>${this.escapeXml(adresse.ban_housenumber)}</ban_housenumber>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_street>${this.escapeXml(adresse.ban_street)}</ban_street>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_citycode>${this.escapeXml(adresse.ban_citycode)}</ban_citycode>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_postcode>${this.escapeXml(adresse.ban_postcode)}</ban_postcode>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_city>${this.escapeXml(adresse.ban_city)}</ban_city>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_type>${this.escapeXml(adresse.ban_type)}</ban_type>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_score>${adresse.ban_score}</ban_score>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_x>${adresse.ban_x}</ban_x>`);
    lines.push(`${this.getIndent(indent + 1)}<ban_y>${adresse.ban_y}</ban_y>`);
    
    lines.push(`${ind}</${tagName}>`);
  }

  private generateLogement(lines: string[], logement: DPEDocument["logement"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<logement>`);
    
    this.generateCaracteristiqueGenerale(lines, logement.caracteristique_generale, indent + 1);
    this.generateMeteo(lines, logement.meteo, indent + 1);
    this.generateEnveloppe(lines, logement.enveloppe, indent + 1);
    
    lines.push(`${ind}</logement>`);
  }

  private generateCaracteristiqueGenerale(lines: string[], cg: DPEDocument["logement"]["caracteristique_generale"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<caracteristique_generale>`);
    
    if (cg.annee_construction !== undefined) {
      lines.push(`${this.getIndent(indent + 1)}<annee_construction>${cg.annee_construction}</annee_construction>`);
    }
    lines.push(`${this.getIndent(indent + 1)}<enum_periode_construction_id>${cg.enum_periode_construction_id}</enum_periode_construction_id>`);
    lines.push(`${this.getIndent(indent + 1)}<enum_methode_application_dpe_log_id>${cg.enum_methode_application_dpe_log_id}</enum_methode_application_dpe_log_id>`);
    if (cg.surface_habitable_logement !== undefined) {
      lines.push(`${this.getIndent(indent + 1)}<surface_habitable_logement>${cg.surface_habitable_logement}</surface_habitable_logement>`);
    }
    lines.push(`${this.getIndent(indent + 1)}<hsp>${cg.hsp}</hsp>`);
    
    lines.push(`${ind}</caracteristique_generale>`);
  }

  private generateMeteo(lines: string[], meteo: DPEDocument["logement"]["meteo"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<meteo>`);
    
    lines.push(`${this.getIndent(indent + 1)}<enum_zone_climatique_id>${meteo.enum_zone_climatique_id}</enum_zone_climatique_id>`);
    lines.push(`${this.getIndent(indent + 1)}<enum_classe_altitude_id>${meteo.enum_classe_altitude_id}</enum_classe_altitude_id>`);
    lines.push(`${this.getIndent(indent + 1)}<batiment_materiaux_anciens>${meteo.batiment_materiaux_anciens}</batiment_materiaux_anciens>`);
    
    lines.push(`${ind}</meteo>`);
  }

  private generateEnveloppe(lines: string[], enveloppe: DPEDocument["logement"]["enveloppe"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<enveloppe>`);
    
    this.generateInertie(lines, enveloppe.inertie, indent + 1);
    this.generateMurCollection(lines, enveloppe.mur_collection, indent + 1);
    
    if (enveloppe.plancher_bas_collection) {
      this.generatePlancherBasCollection(lines, enveloppe.plancher_bas_collection, indent + 1);
    }
    
    if (enveloppe.plancher_haut_collection) {
      this.generatePlancherHautCollection(lines, enveloppe.plancher_haut_collection, indent + 1);
    }
    
    lines.push(`${ind}</enveloppe>`);
  }

  private generateInertie(lines: string[], inertie: DPEDocument["logement"]["enveloppe"]["inertie"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<inertie>`);
    
    lines.push(`${this.getIndent(indent + 1)}<inertie_plancher_bas_lourd>${inertie.inertie_plancher_bas_lourd}</inertie_plancher_bas_lourd>`);
    lines.push(`${this.getIndent(indent + 1)}<inertie_plancher_haut_lourd>${inertie.inertie_plancher_haut_lourd}</inertie_plancher_haut_lourd>`);
    lines.push(`${this.getIndent(indent + 1)}<inertie_paroi_verticale_lourd>${inertie.inertie_paroi_verticale_lourd}</inertie_paroi_verticale_lourd>`);
    lines.push(`${this.getIndent(indent + 1)}<enum_classe_inertie_id>${inertie.enum_classe_inertie_id}</enum_classe_inertie_id>`);
    
    lines.push(`${ind}</inertie>`);
  }

  private generateMurCollection(lines: string[], collection: DPEDocument["logement"]["enveloppe"]["mur_collection"], indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<mur_collection>`);
    
    const murs = Array.isArray(collection.mur) ? collection.mur : [collection.mur];
    for (const mur of murs) {
      this.generateMur(lines, mur, indent + 1);
    }
    
    lines.push(`${ind}</mur_collection>`);
  }

  private generateMur(lines: string[], mur: Mur, indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<mur>`);
    
    lines.push(`${this.getIndent(indent + 1)}<donnee_entree>`);
    lines.push(`${this.getIndent(indent + 2)}<reference>${this.escapeXml(mur.donnee_entree.reference)}</reference>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_type_adjacence_id>${mur.donnee_entree.enum_type_adjacence_id}</enum_type_adjacence_id>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_orientation_id>${mur.donnee_entree.enum_orientation_id}</enum_orientation_id>`);
    lines.push(`${this.getIndent(indent + 2)}<surface_paroi_opaque>${mur.donnee_entree.surface_paroi_opaque}</surface_paroi_opaque>`);
    lines.push(`${this.getIndent(indent + 2)}<paroi_lourde>${mur.donnee_entree.paroi_lourde}</paroi_lourde>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_type_isolation_id>${mur.donnee_entree.enum_type_isolation_id}</enum_type_isolation_id>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_methode_saisie_u_id>${mur.donnee_entree.enum_methode_saisie_u_id}</enum_methode_saisie_u_id>`);
    lines.push(`${this.getIndent(indent + 1)}</donnee_entree>`);
    
    lines.push(`${this.getIndent(indent + 1)}<donnee_intermediaire>`);
    lines.push(`${this.getIndent(indent + 2)}<b>${mur.donnee_intermediaire.b}</b>`);
    lines.push(`${this.getIndent(indent + 2)}<umur>${mur.donnee_intermediaire.umur}</umur>`);
    lines.push(`${this.getIndent(indent + 1)}</donnee_intermediaire>`);
    
    lines.push(`${ind}</mur>`);
  }

  private generatePlancherBasCollection(lines: string[], collection: NonNullable<DPEDocument["logement"]["enveloppe"]["plancher_bas_collection"]>, indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<plancher_bas_collection>`);
    
    const planchers = Array.isArray(collection.plancher_bas) ? collection.plancher_bas : [collection.plancher_bas];
    for (const plancher of planchers) {
      this.generatePlancherBas(lines, plancher, indent + 1);
    }
    
    lines.push(`${ind}</plancher_bas_collection>`);
  }

  private generatePlancherBas(lines: string[], plancher: PlancherBas, indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<plancher_bas>`);
    
    lines.push(`${this.getIndent(indent + 1)}<donnee_entree>`);
    lines.push(`${this.getIndent(indent + 2)}<reference>${this.escapeXml(plancher.donnee_entree.reference)}</reference>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_type_adjacence_id>${plancher.donnee_entree.enum_type_adjacence_id}</enum_type_adjacence_id>`);
    lines.push(`${this.getIndent(indent + 2)}<surface_paroi_opaque>${plancher.donnee_entree.surface_paroi_opaque}</surface_paroi_opaque>`);
    lines.push(`${this.getIndent(indent + 2)}<paroi_lourde>${plancher.donnee_entree.paroi_lourde}</paroi_lourde>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_type_isolation_id>${plancher.donnee_entree.enum_type_isolation_id}</enum_type_isolation_id>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_methode_saisie_u_id>${plancher.donnee_entree.enum_methode_saisie_u_id}</enum_methode_saisie_u_id>`);
    lines.push(`${this.getIndent(indent + 1)}</donnee_entree>`);
    
    lines.push(`${this.getIndent(indent + 1)}<donnee_intermediaire>`);
    lines.push(`${this.getIndent(indent + 2)}<b>${plancher.donnee_intermediaire.b}</b>`);
    lines.push(`${this.getIndent(indent + 2)}<upb>${plancher.donnee_intermediaire.upb}</upb>`);
    lines.push(`${this.getIndent(indent + 2)}<upb_final>${plancher.donnee_intermediaire.upb_final}</upb_final>`);
    lines.push(`${this.getIndent(indent + 1)}</donnee_intermediaire>`);
    
    lines.push(`${ind}</plancher_bas>`);
  }

  private generatePlancherHautCollection(lines: string[], collection: NonNullable<DPEDocument["logement"]["enveloppe"]["plancher_haut_collection"]>, indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<plancher_haut_collection>`);
    
    const planchers = Array.isArray(collection.plancher_haut) ? collection.plancher_haut : [collection.plancher_haut];
    for (const plancher of planchers) {
      this.generatePlancherHaut(lines, plancher, indent + 1);
    }
    
    lines.push(`${ind}</plancher_haut_collection>`);
  }

  private generatePlancherHaut(lines: string[], plancher: PlancherHaut, indent: number): void {
    const ind = this.getIndent(indent);
    lines.push(`${ind}<plancher_haut>`);
    
    lines.push(`${this.getIndent(indent + 1)}<donnee_entree>`);
    lines.push(`${this.getIndent(indent + 2)}<reference>${this.escapeXml(plancher.donnee_entree.reference)}</reference>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_type_adjacence_id>${plancher.donnee_entree.enum_type_adjacence_id}</enum_type_adjacence_id>`);
    lines.push(`${this.getIndent(indent + 2)}<surface_paroi_opaque>${plancher.donnee_entree.surface_paroi_opaque}</surface_paroi_opaque>`);
    lines.push(`${this.getIndent(indent + 2)}<paroi_lourde>${plancher.donnee_entree.paroi_lourde}</paroi_lourde>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_type_isolation_id>${plancher.donnee_entree.enum_type_isolation_id}</enum_type_isolation_id>`);
    lines.push(`${this.getIndent(indent + 2)}<enum_methode_saisie_u_id>${plancher.donnee_entree.enum_methode_saisie_u_id}</enum_methode_saisie_u_id>`);
    lines.push(`${this.getIndent(indent + 1)}</donnee_entree>`);
    
    lines.push(`${this.getIndent(indent + 1)}<donnee_intermediaire>`);
    lines.push(`${this.getIndent(indent + 2)}<b>${plancher.donnee_intermediaire.b}</b>`);
    lines.push(`${this.getIndent(indent + 2)}<uph>${plancher.donnee_intermediaire.uph}</uph>`);
    lines.push(`${this.getIndent(indent + 1)}</donnee_intermediaire>`);
    
    lines.push(`${ind}</plancher_haut>`);
  }

  private getIndent(level: number): string {
    if (!this.options.formatOutput) return '';
    return '  '.repeat(level);
  }

  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
