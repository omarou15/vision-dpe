/**
 * ExportService - Service d'export (PDF, XML ADEME)
 * Phase 1 - Core Services
 * 
 * Gère l'export des DPE vers différents formats:
 * - PDF (rapport complet)
 * - XML ADEME (format officiel v2.6)
 * - JSON (export données brutes)
 */

import {
  DPEDocument,
  EnumEtiquetteDpe,
} from "../types/dpe";
import { XMLGeneratorService } from "./XMLGeneratorService";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export enum ExportFormat {
  PDF = "pdf",
  XML = "xml",
  JSON = "json",
}

export enum ExportStatus {
  PENDING = "pending",
  GENERATING = "generating",
  SUCCESS = "success",
  ERROR = "error",
}

export interface ExportOptions {
  format: ExportFormat;
  includeAnnexes?: boolean;
  includePhotos?: boolean;
  includeSignatures?: boolean;
  quality?: "low" | "medium" | "high";
  language?: "fr" | "en";
}

export interface ExportResult {
  success: boolean;
  status: ExportStatus;
  data?: {
    content: string | Buffer;
    fileName: string;
    mimeType: string;
    fileSize: number;
  };
  error?: ExportError;
}

export interface ExportError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PDFGenerationOptions {
  template?: "standard" | "complet" | "simplifie";
  includeGraphs?: boolean;
  includeRecommendations?: boolean;
  colorScheme?: "color" | "grayscale";
}

export interface BatchExportResult {
  success: boolean;
  total: number;
  successCount: number;
  errorCount: number;
  results: ExportResult[];
  errors?: ExportError[];
}

export interface IExportService {
  /**
   * Exporte un DPE dans le format spécifié
   */
  export(dpe: DPEDocument, options: ExportOptions): Promise<ExportResult>;

  /**
   * Exporte en PDF
   */
  exportToPDF(dpe: DPEDocument, options?: PDFGenerationOptions): Promise<ExportResult>;

  /**
   * Exporte en XML ADEME
   */
  exportToXML(dpe: DPEDocument): Promise<ExportResult>;

  /**
   * Exporte en JSON
   */
  exportToJSON(dpe: DPEDocument, pretty?: boolean): Promise<ExportResult>;

  /**
   * Export par lot
   */
  batchExport(dpes: DPEDocument[], options: ExportOptions): Promise<BatchExportResult>;

  /**
   * Génère un aperçu du rapport
   */
  generatePreview(dpe: DPEDocument, format: ExportFormat): Promise<ExportResult>;

  /**
   * Valide avant export
   */
  validateBeforeExport(dpe: DPEDocument, format: ExportFormat): { valid: boolean; errors: string[] };
}

// ============================================================================
// SERVICE D'EXPORT
// ============================================================================

export class ExportService implements IExportService {
  private xmlService: XMLGeneratorService;

  constructor(xmlService?: XMLGeneratorService) {
    this.xmlService = xmlService ?? new XMLGeneratorService();
  }

  /**
   * Exporte un DPE dans le format spécifié
   */
  async export(dpe: DPEDocument, options: ExportOptions): Promise<ExportResult> {
    switch (options.format) {
      case ExportFormat.PDF:
        return this.exportToPDF(dpe, {
          template: options.quality === "high" ? "complet" : "standard",
          includeGraphs: options.quality !== "low",
        });
      case ExportFormat.XML:
        return this.exportToXML(dpe);
      case ExportFormat.JSON:
        return this.exportToJSON(dpe);
      default:
        return {
          success: false,
          status: ExportStatus.ERROR,
          error: {
            code: "UNSUPPORTED_FORMAT",
            message: `Format non supporté: ${options.format}`,
          },
        };
    }
  }

  /**
   * Exporte en PDF
   */
  async exportToPDF(dpe: DPEDocument, options?: PDFGenerationOptions): Promise<ExportResult> {
    try {
      // Validation
      const validation = this.validateBeforeExport(dpe, ExportFormat.PDF);
      if (!validation.valid) {
        return {
          success: false,
          status: ExportStatus.ERROR,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation échouée",
            details: { errors: validation.errors },
          },
        };
      }

      // Génération du contenu PDF (simulation pour Phase 1)
      const pdfContent = this.generatePDFContent(dpe, options);
      
      const fileName = `DPE_${dpe.administratif.nom_proprietaire.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

      return {
        success: true,
        status: ExportStatus.SUCCESS,
        data: {
          content: pdfContent,
          fileName,
          mimeType: "application/pdf",
          fileSize: Buffer.byteLength(pdfContent, "utf-8"),
        },
      };
    } catch (error) {
      return {
        success: false,
        status: ExportStatus.ERROR,
        error: {
          code: "PDF_GENERATION_ERROR",
          message: error instanceof Error ? error.message : "Erreur de génération PDF",
        },
      };
    }
  }

  /**
   * Génère le contenu PDF (HTML pour la Phase 1)
   * En production, utiliser une librairie comme puppeteer ou react-pdf
   */
  private generatePDFContent(dpe: DPEDocument, options?: PDFGenerationOptions): string {
    const template = options?.template ?? "standard";
    const cg = dpe.logement.caracteristique_generale;
    const sortie = dpe.logement.sortie;

    const etiquetteEnergie = sortie?.ep_conso.classe_bilan_dpe ?? "N/A";
    const etiquetteGES = sortie?.emission_ges.classe_emission_ges ?? "N/A";
    const consoEnergie = sortie?.ep_conso.ep_conso_5_usages_m2?.toFixed(0) ?? "N/A";
    const emissionGES = sortie?.emission_ges.emission_ges_5_usages_m2?.toFixed(0) ?? "N/A";

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>DPE - ${dpe.administratif.nom_proprietaire}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0066cc; padding-bottom: 20px; }
    .header h1 { color: #0066cc; font-size: 28px; margin-bottom: 10px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .etiquettes { display: flex; justify-content: center; gap: 40px; margin: 30px 0; }
    .etiquette { text-align: center; }
    .etiquette-letter { 
      width: 80px; height: 80px; 
      display: flex; align-items: center; justify-content: center;
      font-size: 36px; font-weight: bold; color: white;
      border-radius: 8px; margin: 0 auto 10px;
    }
    .etiquette-value { font-size: 24px; font-weight: bold; color: #333; }
    .etiquette-label { font-size: 12px; color: #666; }
    .section { margin: 25px 0; }
    .section h2 { color: #0066cc; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ddd; }
    .info-label { font-weight: bold; color: #555; }
    .info-value { color: #333; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
    .diagnostiqueur { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .diagnostiqueur h3 { color: #0066cc; margin-bottom: 10px; }
    ${this.getEtiquetteStyles()}
  </style>
</head>
<body>
  <div class="header">
    <h1>Diagnostic de Performance Énergétique</h1>
    <p class="subtitle">${dpe.administratif.enum_version_id} - Logement existant</p>
    <p class="subtitle">N° ${dpe.administratif.nom_proprietaire ? "DPE-" + Date.now().toString(36).toUpperCase() : "N/A"}</p>
  </div>

  <div class="etiquettes">
    <div class="etiquette">
      <div class="etiquette-letter ${etiquetteEnergie}">${etiquetteEnergie}</div>
      <div class="etiquette-value">${consoEnergie} kWh/m²/an</div>
      <div class="etiquette-label">Énergie primaire</div>
    </div>
    <div class="etiquette">
      <div class="etiquette-letter ${etiquetteGES}">${etiquetteGES}</div>
      <div class="etiquette-value">${emissionGES} kg CO₂/m²/an</div>
      <div class="etiquette-label">Émissions de gaz à effet de serre</div>
    </div>
  </div>

  <div class="section">
    <h2>Informations générales</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Adresse</span>
        <span class="info-value">${dpe.administratif.geolocalisation.adresses.adresse_bien.label_brut}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Surface habitable</span>
        <span class="info-value">${cg.surface_habitable_logement ?? "N/A"} m²</span>
      </div>
      <div class="info-item">
        <span class="info-label">Année de construction</span>
        <span class="info-value">${cg.annee_construction ?? "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nombre de niveaux</span>
        <span class="info-value">${cg.nombre_niveau_logement ?? "N/A"}</span>
      </div>
    </div>
  </div>

  ${template === "complet" ? this.generateDetailedSection(dpe) : ""}

  <div class="diagnostiqueur">
    <h3>Diagnostiqueur</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nom</span>
        <span class="info-value">${dpe.administratif.diagnostiqueur.prenom_diagnostiqueur} ${dpe.administratif.diagnostiqueur.nom_diagnostiqueur}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Certification</span>
        <span class="info-value">${dpe.administratif.diagnostiqueur.numero_certification_diagnostiqueur}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Organisme</span>
        <span class="info-value">${dpe.administratif.diagnostiqueur.organisme_certificateur}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date de visite</span>
        <span class="info-value">${dpe.administratif.date_visite_diagnostiqueur}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Ce document est un Diagnostic de Performance Énergétique conforme à la réglementation en vigueur.</p>
    <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} - Vision DPE</p>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Génère les styles CSS pour les étiquettes
   */
  private getEtiquetteStyles(): string {
    const colors: Record<EnumEtiquetteDpe, string> = {
      [EnumEtiquetteDpe.A]: "#009c6d",
      [EnumEtiquetteDpe.B]: "#52ae32",
      [EnumEtiquetteDpe.C]: "#c8d400",
      [EnumEtiquetteDpe.D]: "#ffed00",
      [EnumEtiquetteDpe.E]: "#fab600",
      [EnumEtiquetteDpe.F]: "#eb6709",
      [EnumEtiquetteDpe.G]: "#e3051b",
    };

    return Object.entries(colors)
      .map(([letter, color]) => `.${letter} { background-color: ${color}; }`)
      .join("\n");
  }

  /**
   * Génère la section détaillée pour le template complet
   */
  private generateDetailedSection(dpe: DPEDocument): string {
    const sortie = dpe.logement.sortie;
    if (!sortie) return "";

    return `
  <div class="section">
    <h2>Consommations détaillées</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Chauffage</span>
        <span class="info-value">${sortie.ef_conso.conso_ch?.toFixed(1) ?? "N/A"} kWh/an</span>
      </div>
      <div class="info-item">
        <span class="info-label">Eau chaude sanitaire</span>
        <span class="info-value">${sortie.ef_conso.conso_ecs?.toFixed(1) ?? "N/A"} kWh/an</span>
      </div>
      <div class="info-item">
        <span class="info-label">Éclairage</span>
        <span class="info-value">${sortie.ef_conso.conso_eclairage?.toFixed(1) ?? "N/A"} kWh/an</span>
      </div>
      <div class="info-item">
        <span class="info-label">Auxiliaires</span>
        <span class="info-value">${sortie.ef_conso.conso_totale_auxiliaire?.toFixed(1) ?? "N/A"} kWh/an</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Déperditions thermiques</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Murs</span>
        <span class="info-value">${sortie.deperdition.deperdition_mur?.toFixed(0) ?? "N/A"} kWh/an</span>
      </div>
      <div class="info-item">
        <span class="info-label">Plancher bas</span>
        <span class="info-value">${sortie.deperdition.deperdition_plancher_bas?.toFixed(0) ?? "N/A"} kWh/an</span>
      </div>
      <div class="info-item">
        <span class="info-label">Plancher haut</span>
        <span class="info-value">${sortie.deperdition.deperdition_plancher_haut?.toFixed(0) ?? "N/A"} kWh/an</span>
      </div>
      <div class="info-item">
        <span class="info-label">Baies vitrées</span>
        <span class="info-value">${sortie.deperdition.deperdition_baie_vitree?.toFixed(0) ?? "N/A"} kWh/an</span>
      </div>
    </div>
  </div>`;
  }

  /**
   * Exporte en XML ADEME
   */
  async exportToXML(dpe: DPEDocument): Promise<ExportResult> {
    try {
      // Validation
      const validation = this.validateBeforeExport(dpe, ExportFormat.XML);
      if (!validation.valid) {
        return {
          success: false,
          status: ExportStatus.ERROR,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation échouée",
            details: { errors: validation.errors },
          },
        };
      }

      // Utilise le XMLGeneratorService existant
      const xmlResult = this.xmlService.generate(dpe);

      if (xmlResult.status !== "success" || !xmlResult.xmlContent) {
        return {
          success: false,
          status: ExportStatus.ERROR,
          error: {
            code: "XML_GENERATION_ERROR",
            message: xmlResult.errors?.[0]?.message ?? "Erreur de génération XML",
          },
        };
      }

      return {
        success: true,
        status: ExportStatus.SUCCESS,
        data: {
          content: xmlResult.xmlContent,
          fileName: xmlResult.fileName ?? `DPE_${Date.now()}.xml`,
          mimeType: "application/xml",
          fileSize: xmlResult.fileSize ?? Buffer.byteLength(xmlResult.xmlContent, "utf-8"),
        },
      };
    } catch (error) {
      return {
        success: false,
        status: ExportStatus.ERROR,
        error: {
          code: "XML_EXPORT_ERROR",
          message: error instanceof Error ? error.message : "Erreur d'export XML",
        },
      };
    }
  }

  /**
   * Exporte en JSON
   */
  async exportToJSON(dpe: DPEDocument, pretty = true): Promise<ExportResult> {
    try {
      const jsonContent = JSON.stringify(dpe, null, pretty ? 2 : undefined);
      const fileName = `DPE_${dpe.administratif.nom_proprietaire.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;

      return {
        success: true,
        status: ExportStatus.SUCCESS,
        data: {
          content: jsonContent,
          fileName,
          mimeType: "application/json",
          fileSize: Buffer.byteLength(jsonContent, "utf-8"),
        },
      };
    } catch (error) {
      return {
        success: false,
        status: ExportStatus.ERROR,
        error: {
          code: "JSON_EXPORT_ERROR",
          message: error instanceof Error ? error.message : "Erreur d'export JSON",
        },
      };
    }
  }

  /**
   * Export par lot
   */
  async batchExport(dpes: DPEDocument[], options: ExportOptions): Promise<BatchExportResult> {
    const results: ExportResult[] = [];
    const errors: ExportError[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const dpe of dpes) {
      const result = await this.export(dpe, options);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        if (result.error) {
          errors.push(result.error);
        }
      }
    }

    return {
      success: errorCount === 0,
      total: dpes.length,
      successCount,
      errorCount,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Génère un aperçu du rapport
   */
  async generatePreview(dpe: DPEDocument, format: ExportFormat): Promise<ExportResult> {
    // Pour l'aperçu, on génère avec des options légères
    const previewOptions: ExportOptions = {
      format,
      quality: "low",
      includeAnnexes: false,
      includePhotos: false,
    };

    return this.export(dpe, previewOptions);
  }

  /**
   * Valide avant export
   */
  validateBeforeExport(dpe: DPEDocument, format: ExportFormat): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validations communes
    if (!dpe.administratif.nom_proprietaire) {
      errors.push("Le nom du propriétaire est requis");
    }

    if (!dpe.administratif.diagnostiqueur.numero_certification_diagnostiqueur) {
      errors.push("Le numéro de certification du diagnostiqueur est requis");
    }

    if (!dpe.logement.caracteristique_generale.surface_habitable_logement ||
        dpe.logement.caracteristique_generale.surface_habitable_logement <= 0) {
      errors.push("La surface habitable doit être supérieure à 0");
    }

    // Validations spécifiques au format
    if (format === ExportFormat.XML) {
      if (!dpe.logement.sortie) {
        errors.push("Les calculs doivent être effectués avant l'export XML");
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Sauvegarde un fichier exporté
   * Note: Cette méthode est un stub pour la Phase 1
   * En environnement Node.js, elle utiliserait fs
   */
  async saveToFile(content: string | Buffer, filePath: string): Promise<{ success: boolean; error?: string }> {
    // Évite l'erreur de variable non utilisée
    void content;
    void filePath;
    
    // Pour la Phase 1, retourne un succès simulé
    return { success: true };
  }
}

// Export singleton factory
let exportServiceInstance: ExportService | null = null;

export function createExportService(xmlService?: XMLGeneratorService): ExportService {
  if (!exportServiceInstance) {
    exportServiceInstance = new ExportService(xmlService);
  }
  return exportServiceInstance;
}

export function getExportService(): ExportService | null {
  return exportServiceInstance;
}

export function resetExportService(): void {
  exportServiceInstance = null;
}
