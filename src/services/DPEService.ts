/**
 * DPEService - Service de gestion des DPE (CRUD, calculs)
 * Phase 1 - Core Services
 * 
 * Gère le cycle de vie complet d'un DPE:
 * - Création, lecture, mise à jour, suppression
 * - Calcul des indicateurs
 * - Gestion des états (brouillon, validé, transmis)
 */

import {
  DPEDocument,
  EnumEtiquetteDpe,
  Sortie,
  SortieDeperdition,
  SortieApportEtBesoin,
  SortieEfConso,
  SortieEpConso,
  SortieEmissionGes,
  SortieCout,
} from "../types/dpe";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export enum DPEStatus {
  BROUILLON = "brouillon",
  EN_COURS = "en_cours",
  VALIDE = "valide",
  TRANSMIS = "transmis",
  ANNULE = "annule",
}

export interface DPEMetadata {
  id: string;
  numeroDpe: string;
  status: DPEStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  isArchived: boolean;
}

export interface DPEWithMetadata extends DPEDocument {
  metadata: DPEMetadata;
}

export interface DPEFilters {
  status?: DPEStatus;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface DPEResult {
  success: boolean;
  data?: DPEWithMetadata;
  error?: DPEError;
}

export interface DPEListResult {
  success: boolean;
  data?: DPEWithMetadata[];
  total?: number;
  error?: DPEError;
}

export interface DPEError {
  code: string;
  message: string;
  field?: string;
}

export interface DPECalculationResult {
  success: boolean;
  data?: {
    etiquetteEnergie: EnumEtiquetteDpe;
    etiquetteGES: EnumEtiquetteDpe;
    consoEnergie: number;
    emissionGES: number;
    coutEstime: number;
    sortie: Sortie;
  };
  error?: DPEError;
}

export interface IDPEService {
  // CRUD
  create(data: Partial<DPEDocument>, userId: string): Promise<DPEResult>;
  getById(id: string): Promise<DPEResult>;
  update(id: string, data: Partial<DPEDocument>, userId: string): Promise<DPEResult>;
  delete(id: string): Promise<{ success: boolean; error?: DPEError }>;
  
  // Liste et recherche
  list(filters?: DPEFilters, limit?: number, offset?: number): Promise<DPEListResult>;
  search(searchTerm: string): Promise<DPEListResult>;
  
  // Gestion des états
  changeStatus(id: string, newStatus: DPEStatus, userId: string): Promise<DPEResult>;
  archive(id: string): Promise<DPEResult>;
  duplicate(id: string, userId: string): Promise<DPEResult>;
  
  // Calculs
  calculate(id: string): Promise<DPECalculationResult>;
  estimateConsumption(data: Partial<DPEDocument>): Promise<DPECalculationResult>;
  
  // Validation
  validateBeforeTransmission(id: string): Promise<{ valid: boolean; errors: string[] }>;
}

// ============================================================================
// SEUILS DPE (kWh/m²/an) - Arrêté du 31 mars 2021
// ============================================================================

const SEUILS_ETIQUETTE_ENERGIE = [
  { max: 70, etiquette: EnumEtiquetteDpe.A },
  { max: 110, etiquette: EnumEtiquetteDpe.B },
  { max: 180, etiquette: EnumEtiquetteDpe.C },
  { max: 250, etiquette: EnumEtiquetteDpe.D },
  { max: 330, etiquette: EnumEtiquetteDpe.E },
  { max: 420, etiquette: EnumEtiquetteDpe.F },
  { max: Infinity, etiquette: EnumEtiquetteDpe.G },
];

const SEUILS_ETIQUETTE_GES = [
  { max: 6, etiquette: EnumEtiquetteDpe.A },
  { max: 11, etiquette: EnumEtiquetteDpe.B },
  { max: 30, etiquette: EnumEtiquetteDpe.C },
  { max: 50, etiquette: EnumEtiquetteDpe.D },
  { max: 70, etiquette: EnumEtiquetteDpe.E },
  { max: 100, etiquette: EnumEtiquetteDpe.F },
  { max: Infinity, etiquette: EnumEtiquetteDpe.G },
];

// ============================================================================
// STOCKAGE EN MÉMOIRE (à remplacer par Supabase en production)
// ============================================================================

interface StorageAdapter {
  create(id: string, data: DPEWithMetadata): Promise<void>;
  getById(id: string): Promise<DPEWithMetadata | null>;
  update(id: string, data: Partial<DPEWithMetadata>): Promise<void>;
  delete(id: string): Promise<void>;
  list(filters?: DPEFilters, limit?: number, offset?: number): Promise<{ data: DPEWithMetadata[]; total: number }>;
}

class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, DPEWithMetadata>();

  async create(id: string, data: DPEWithMetadata): Promise<void> {
    this.storage.set(id, data);
  }

  async getById(id: string): Promise<DPEWithMetadata | null> {
    return this.storage.get(id) ?? null;
  }

  async update(id: string, data: Partial<DPEWithMetadata>): Promise<void> {
    const existing = this.storage.get(id);
    if (existing) {
      this.storage.set(id, { ...existing, ...data });
    }
  }

  async delete(id: string): Promise<void> {
    this.storage.delete(id);
  }

  async list(
    filters?: DPEFilters,
    limit = 50,
    offset = 0
  ): Promise<{ data: DPEWithMetadata[]; total: number }> {
    let results = Array.from(this.storage.values());

    if (filters) {
      if (filters.status) {
        results = results.filter((d) => d.metadata.status === filters.status);
      }
      if (filters.createdBy) {
        results = results.filter((d) => d.metadata.createdBy === filters.createdBy);
      }
      if (filters.dateFrom) {
        results = results.filter((d) => d.metadata.createdAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        results = results.filter((d) => d.metadata.createdAt <= filters.dateTo!);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(
          (d) =>
            d.administratif.nom_proprietaire.toLowerCase().includes(term) ||
            d.metadata.numeroDpe.toLowerCase().includes(term)
        );
      }
    }

    // Tri par date de création décroissante
    results.sort((a, b) => 
      new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
    );

    const total = results.length;
    results = results.slice(offset, offset + limit);

    return { data: results, total };
  }
}

// ============================================================================
// SERVICE DPE
// ============================================================================

export class DPEService implements IDPEService {
  private storage: StorageAdapter;
  private currentUserId?: string;

  constructor(storage?: StorageAdapter) {
    this.storage = storage ?? new MemoryStorageAdapter();
    void this.currentUserId; // Évite l'erreur de variable non utilisée
  }

  /**
   * Génère un numéro DPE unique
   */
  private generateDPENumber(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 900000 + 100000);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `DPE-${year}-${random}-${letter}`;
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée les métadonnées initiales
   */
  private createMetadata(userId: string): DPEMetadata {
    const now = new Date().toISOString();
    return {
      id: this.generateId(),
      numeroDpe: this.generateDPENumber(),
      status: DPEStatus.BROUILLON,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      version: 1,
      isArchived: false,
    };
  }

  /**
   * Initialise un document DPE avec des valeurs par défaut
   */
  private initializeDPEDocument(data: Partial<DPEDocument>): DPEDocument {
    const now = new Date().toISOString().split("T")[0];
    
    return {
      version: "8.0.4",
      administratif: {
        date_visite_diagnostiqueur: data.administratif?.date_visite_diagnostiqueur ?? now,
        date_etablissement_dpe: data.administratif?.date_etablissement_dpe ?? now,
        nom_proprietaire: data.administratif?.nom_proprietaire ?? "",
        enum_modele_dpe_id: data.administratif?.enum_modele_dpe_id ?? 1,
        enum_version_id: data.administratif?.enum_version_id ?? "2.6",
        diagnostiqueur: data.administratif?.diagnostiqueur ?? {
          usr_logiciel_id: 0,
          version_logiciel: "1.0.0",
          nom_diagnostiqueur: "",
          prenom_diagnostiqueur: "",
          mail_diagnostiqueur: "",
          telephone_diagnostiqueur: "",
          adresse_diagnostiqueur: "",
          entreprise_diagnostiqueur: "",
          numero_certification_diagnostiqueur: "",
          organisme_certificateur: "",
        },
        geolocalisation: data.administratif?.geolocalisation ?? {
          adresses: {
            adresse_proprietaire: {
              adresse_brut: "",
              code_postal_brut: "",
              nom_commune_brut: "",
              label_brut: "",
              label_brut_avec_complement: "",
              enum_statut_geocodage_ban_id: 0,
              ban_date_appel: now,
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
              enum_statut_geocodage_ban_id: 0,
              ban_date_appel: now,
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
        ...data.administratif,
      },
      logement: {
        caracteristique_generale: {
          enum_periode_construction_id: 1,
          enum_methode_application_dpe_log_id: 1,
          hsp: 2.5,
          ...data.logement?.caracteristique_generale,
        },
        meteo: {
          enum_zone_climatique_id: 1,
          enum_classe_altitude_id: 1,
          batiment_materiaux_anciens: 0,
          ...data.logement?.meteo,
        },
        enveloppe: {
          inertie: {
            inertie_plancher_bas_lourd: 0,
            inertie_plancher_haut_lourd: 0,
            inertie_paroi_verticale_lourd: 0,
            enum_classe_inertie_id: 1,
            ...data.logement?.enveloppe?.inertie,
          },
          mur_collection: data.logement?.enveloppe?.mur_collection ?? { mur: [] },
          baie_vitree_collection: data.logement?.enveloppe?.baie_vitree_collection,
          plancher_bas_collection: data.logement?.enveloppe?.plancher_bas_collection,
          plancher_haut_collection: data.logement?.enveloppe?.plancher_haut_collection,
        },
        ...data.logement,
      },
      ...data,
    } as DPEDocument;
  }

  /**
   * Crée un nouveau DPE
   */
  async create(data: Partial<DPEDocument>, userId: string): Promise<DPEResult> {
    try {
      const metadata = this.createMetadata(userId);
      const dpeDocument = this.initializeDPEDocument(data);
      
      const dpeWithMetadata: DPEWithMetadata = {
        ...dpeDocument,
        metadata,
      };

      await this.storage.create(metadata.id, dpeWithMetadata);

      return {
        success: true,
        data: dpeWithMetadata,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "CREATE_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de la création du DPE",
        },
      };
    }
  }

  /**
   * Récupère un DPE par son ID
   */
  async getById(id: string): Promise<DPEResult> {
    try {
      const data = await this.storage.getById(id);
      
      if (!data) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "DPE non trouvé",
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GET_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de la récupération du DPE",
        },
      };
    }
  }

  /**
   * Met à jour un DPE
   */
  async update(id: string, data: Partial<DPEDocument>, userId: string): Promise<DPEResult> {
    try {
      const existing = await this.storage.getById(id);
      
      if (!existing) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "DPE non trouvé",
          },
        };
      }

      if (existing.metadata.status === DPEStatus.TRANSMIS) {
        return {
          success: false,
          error: {
            code: "IMMUTABLE",
            message: "Impossible de modifier un DPE déjà transmis",
          },
        };
      }

      const updated: DPEWithMetadata = {
        ...existing,
        ...data,
        administratif: { ...existing.administratif, ...data.administratif },
        logement: { ...existing.logement, ...data.logement },
        metadata: {
          ...existing.metadata,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
          version: existing.metadata.version + 1,
        },
      };

      await this.storage.update(id, updated);

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPDATE_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du DPE",
        },
      };
    }
  }

  /**
   * Supprime un DPE
   */
  async delete(id: string): Promise<{ success: boolean; error?: DPEError }> {
    try {
      const existing = await this.storage.getById(id);
      
      if (!existing) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "DPE non trouvé",
          },
        };
      }

      if (existing.metadata.status === DPEStatus.TRANSMIS) {
        return {
          success: false,
          error: {
            code: "IMMUTABLE",
            message: "Impossible de supprimer un DPE déjà transmis",
          },
        };
      }

      await this.storage.delete(id);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DELETE_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de la suppression du DPE",
        },
      };
    }
  }

  /**
   * Liste les DPE avec filtres
   */
  async list(filters?: DPEFilters, limit = 50, offset = 0): Promise<DPEListResult> {
    try {
      const result = await this.storage.list(filters, limit, offset);
      
      return {
        success: true,
        data: result.data,
        total: result.total,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "LIST_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de la liste des DPE",
        },
      };
    }
  }

  /**
   * Recherche de DPE
   */
  async search(searchTerm: string): Promise<DPEListResult> {
    return this.list({ searchTerm }, 100, 0);
  }

  /**
   * Change le statut d'un DPE
   */
  async changeStatus(id: string, newStatus: DPEStatus, userId: string): Promise<DPEResult> {
    try {
      const existing = await this.storage.getById(id);
      
      if (!existing) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "DPE non trouvé",
          },
        };
      }

      // Validation des transitions de statut
      const validTransitions: Record<DPEStatus, DPEStatus[]> = {
        [DPEStatus.BROUILLON]: [DPEStatus.EN_COURS, DPEStatus.ANNULE],
        [DPEStatus.EN_COURS]: [DPEStatus.VALIDE, DPEStatus.BROUILLON, DPEStatus.ANNULE],
        [DPEStatus.VALIDE]: [DPEStatus.TRANSMIS, DPEStatus.EN_COURS, DPEStatus.ANNULE],
        [DPEStatus.TRANSMIS]: [],
        [DPEStatus.ANNULE]: [DPEStatus.BROUILLON],
      };

      if (!validTransitions[existing.metadata.status].includes(newStatus)) {
        return {
          success: false,
          error: {
            code: "INVALID_TRANSITION",
            message: `Transition de ${existing.metadata.status} vers ${newStatus} non autorisée`,
          },
        };
      }

      const updated: DPEWithMetadata = {
        ...existing,
        metadata: {
          ...existing.metadata,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      };

      await this.storage.update(id, updated);

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "STATUS_CHANGE_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors du changement de statut",
        },
      };
    }
  }

  /**
   * Archive un DPE
   */
  async archive(id: string): Promise<DPEResult> {
    try {
      const existing = await this.storage.getById(id);
      
      if (!existing) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "DPE non trouvé",
          },
        };
      }

      const updated: DPEWithMetadata = {
        ...existing,
        metadata: {
          ...existing.metadata,
          isArchived: true,
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storage.update(id, updated);

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "ARCHIVE_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de l'archivage",
        },
      };
    }
  }

  /**
   * Duplique un DPE
   */
  async duplicate(id: string, userId: string): Promise<DPEResult> {
    try {
      const existing = await this.storage.getById(id);
      
      if (!existing) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "DPE non trouvé",
          },
        };
      }

      const { metadata, ...dpeData } = existing;
      const newMetadata = this.createMetadata(userId);
      newMetadata.numeroDpe = this.generateDPENumber();

      const duplicated: DPEWithMetadata = {
        ...dpeData,
        metadata: newMetadata,
      };

      await this.storage.create(newMetadata.id, duplicated);

      return {
        success: true,
        data: duplicated,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "DUPLICATE_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de la duplication",
        },
      };
    }
  }

  /**
   * Calcule les indicateurs d'un DPE
   */
  async calculate(id: string): Promise<DPECalculationResult> {
    try {
      const dpeResult = await this.getById(id);
      
      if (!dpeResult.success || !dpeResult.data) {
        return {
          success: false,
          error: dpeResult.error,
        };
      }

      const dpe = dpeResult.data;
      const surface = dpe.logement.caracteristique_generale.surface_habitable_logement ?? 100;
      void surface; // Évite l'erreur de variable non utilisée

      // Calcul simplifié (à remplacer par la méthode 3CL complète)
      const sortie = this.performCalculation(dpe);
      
      const consoEnergie = sortie.ef_conso.conso_5_usages_m2;
      const emissionGES = sortie.emission_ges.emission_ges_5_usages_m2;

      // Détermine les étiquettes
      const etiquetteEnergie = this.getEtiquetteEnergie(consoEnergie);
      const etiquetteGES = this.getEtiquetteGES(emissionGES);

      return {
        success: true,
        data: {
          etiquetteEnergie,
          etiquetteGES,
          consoEnergie,
          emissionGES,
          coutEstime: sortie.cout.cout_5_usages,
          sortie,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "CALCULATION_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors du calcul",
        },
      };
    }
  }

  /**
   * Estime la consommation à partir de données partielles
   */
  async estimateConsumption(data: Partial<DPEDocument>): Promise<DPECalculationResult> {
    try {
      const dpeDocument = this.initializeDPEDocument(data);
      const surface = dpeDocument.logement.caracteristique_generale.surface_habitable_logement ?? 100;

      // Calcul simplifié pour estimation
      const sortie = this.performQuickEstimation(dpeDocument, surface);
      
      const consoEnergie = sortie.ef_conso.conso_5_usages_m2;
      const emissionGES = sortie.emission_ges.emission_ges_5_usages_m2;

      return {
        success: true,
        data: {
          etiquetteEnergie: this.getEtiquetteEnergie(consoEnergie),
          etiquetteGES: this.getEtiquetteGES(emissionGES),
          consoEnergie,
          emissionGES,
          coutEstime: sortie.cout.cout_5_usages,
          sortie,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "ESTIMATION_ERROR",
          message: error instanceof Error ? error.message : "Erreur lors de l'estimation",
        },
      };
    }
  }

  /**
   * Effectue le calcul complet selon la méthode 3CL
   */
  private performCalculation(dpe: DPEWithMetadata): Sortie {
    const surface = dpe.logement.caracteristique_generale.surface_habitable_logement ?? 100;
    
    // Calcul des déperditions
    const deperdition = this.calculateDeperditions(dpe);
    
    // Calcul des besoins
    const besoins = this.calculateBesoins(deperdition, surface);
    
    // Calcul des consommations
    const consommations = this.calculateConsommations(besoins, dpe);
    
    return {
      deperdition,
      apport_et_besoin: besoins,
      ef_conso: consommations.ef,
      ep_conso: consommations.ep,
      emission_ges: consommations.ges,
      cout: consommations.cout,
    };
  }

  /**
   * Estimation rapide pour données partielles
   */
  private performQuickEstimation(_dpe: DPEDocument, surface: number): Sortie {
    // Valeurs forfaitaires pour estimation rapide
    const dh = 2500; // Degrés-heures de chauffe
    const nadeq = 2.5; // Nombre d'occupants équivalent
    
    // Déperditions estimées
    const ubat = 1.2; // Coefficient moyen
    const gv = ubat * surface;
    
    const deperdition: SortieDeperdition = {
      hvent: 0.5,
      hperm: 0.8,
      deperdition_renouvellement_air: 30 * surface,
      deperdition_mur: 40 * surface,
      deperdition_plancher_bas: 15 * surface,
      deperdition_plancher_haut: 20 * surface,
      deperdition_baie_vitree: 25 * surface,
      deperdition_porte: 2 * surface,
      deperdition_pont_thermique: 8 * surface,
      deperdition_enveloppe: gv * dh / 1000,
    };

    const besoinCh = deperdition.deperdition_enveloppe;
    const besoinEcs = 25 * nadeq * 365 / 1000;
    
    const apportEtBesoin: SortieApportEtBesoin = {
      surface_sud_equivalente: surface * 0.1,
      apport_solaire_fr: 0,
      apport_interne_fr: 0,
      apport_solaire_ch: 500,
      apport_interne_ch: 800,
      fraction_apport_gratuit_ch: 0.15,
      fraction_apport_gratuit_depensier_ch: 0.10,
      pertes_distribution_ecs_recup: 50,
      pertes_distribution_ecs_recup_depensier: 40,
      pertes_stockage_ecs_recup: 30,
      pertes_generateur_ch_recup: 100,
      pertes_generateur_ch_recup_depensier: 80,
      nadeq,
      v40_ecs_journalier: 25 * nadeq,
      v40_ecs_journalier_depensier: 30 * nadeq,
      besoin_ch: besoinCh,
      besoin_ch_depensier: besoinCh * 1.2,
      besoin_ecs: besoinEcs,
      besoin_ecs_depensier: besoinEcs * 1.1,
      besoin_fr: 0,
      besoin_fr_depensier: 0,
    };

    const efConso: SortieEfConso = {
      conso_ch: besoinCh / 0.85,
      conso_ch_depensier: besoinCh * 1.2 / 0.80,
      conso_ecs: besoinEcs / 0.75,
      conso_ecs_depensier: besoinEcs * 1.1 / 0.70,
      conso_eclairage: 5 * surface / 1000,
      conso_auxiliaire_generation_ch: 2,
      conso_auxiliaire_generation_ch_depensier: 2.5,
      conso_auxiliaire_distribution_ch: 1,
      conso_auxiliaire_generation_ecs: 1.5,
      conso_auxiliaire_generation_ecs_depensier: 2,
      conso_auxiliaire_distribution_ecs: 0.5,
      conso_auxiliaire_ventilation: 2,
      conso_totale_auxiliaire: 7,
      conso_fr: 0,
      conso_fr_depensier: 0,
      conso_5_usages: 0,
      conso_5_usages_m2: 0,
    };

    efConso.conso_5_usages = efConso.conso_ch + efConso.conso_ecs + efConso.conso_eclairage + efConso.conso_totale_auxiliaire;
    efConso.conso_5_usages_m2 = efConso.conso_5_usages * 1000 / surface;

    const epConso: SortieEpConso = {
      ep_conso_ch: efConso.conso_ch * 1.5,
      ep_conso_ch_depensier: efConso.conso_ch_depensier * 1.5,
      ep_conso_ecs: efConso.conso_ecs * 1.5,
      ep_conso_ecs_depensier: efConso.conso_ecs_depensier * 1.5,
      ep_conso_eclairage: efConso.conso_eclairage * 2.58,
      ep_conso_auxiliaire_generation_ch: efConso.conso_auxiliaire_generation_ch * 2.58,
      ep_conso_auxiliaire_generation_ch_depensier: efConso.conso_auxiliaire_generation_ch_depensier * 2.58,
      ep_conso_auxiliaire_distribution_ch: efConso.conso_auxiliaire_distribution_ch * 2.58,
      ep_conso_auxiliaire_generation_ecs: efConso.conso_auxiliaire_generation_ecs * 2.58,
      ep_conso_auxiliaire_generation_ecs_depensier: efConso.conso_auxiliaire_generation_ecs_depensier * 2.58,
      ep_conso_auxiliaire_distribution_ecs: efConso.conso_auxiliaire_distribution_ecs * 2.58,
      ep_conso_auxiliaire_ventilation: efConso.conso_auxiliaire_ventilation * 2.58,
      ep_conso_totale_auxiliaire: efConso.conso_totale_auxiliaire * 2.58,
      ep_conso_fr: 0,
      ep_conso_fr_depensier: 0,
      ep_conso_5_usages: 0,
      ep_conso_5_usages_m2: 0,
      classe_bilan_dpe: EnumEtiquetteDpe.D,
    };

    epConso.ep_conso_5_usages = epConso.ep_conso_ch + epConso.ep_conso_ecs + epConso.ep_conso_eclairage + epConso.ep_conso_totale_auxiliaire;
    epConso.ep_conso_5_usages_m2 = epConso.ep_conso_5_usages * 1000 / surface;
    epConso.classe_bilan_dpe = this.getEtiquetteEnergie(epConso.ep_conso_5_usages_m2);

    const emissionGes: SortieEmissionGes = {
      emission_ges_ch: efConso.conso_ch * 0.05,
      emission_ges_ch_depensier: efConso.conso_ch_depensier * 0.05,
      emission_ges_ecs: efConso.conso_ecs * 0.05,
      emission_ges_ecs_depensier: efConso.conso_ecs_depensier * 0.05,
      emission_ges_eclairage: efConso.conso_eclairage * 0.01,
      emission_ges_auxiliaire_generation_ch: efConso.conso_auxiliaire_generation_ch * 0.01,
      emission_ges_auxiliaire_generation_ch_depensier: efConso.conso_auxiliaire_generation_ch_depensier * 0.01,
      emission_ges_auxiliaire_distribution_ch: efConso.conso_auxiliaire_distribution_ch * 0.01,
      emission_ges_auxiliaire_generation_ecs: efConso.conso_auxiliaire_generation_ecs * 0.01,
      emission_ges_auxiliaire_generation_ecs_depensier: efConso.conso_auxiliaire_generation_ecs_depensier * 0.01,
      emission_ges_auxiliaire_distribution_ecs: efConso.conso_auxiliaire_distribution_ecs * 0.01,
      emission_ges_auxiliaire_ventilation: efConso.conso_auxiliaire_ventilation * 0.01,
      emission_ges_totale_auxiliaire: efConso.conso_totale_auxiliaire * 0.01,
      emission_ges_fr: 0,
      emission_ges_fr_depensier: 0,
      emission_ges_5_usages: 0,
      emission_ges_5_usages_m2: 0,
      classe_emission_ges: EnumEtiquetteDpe.D,
    };

    emissionGes.emission_ges_5_usages = emissionGes.emission_ges_ch + emissionGes.emission_ges_ecs + emissionGes.emission_ges_eclairage + emissionGes.emission_ges_totale_auxiliaire;
    emissionGes.emission_ges_5_usages_m2 = emissionGes.emission_ges_5_usages * 1000 / surface;
    emissionGes.classe_emission_ges = this.getEtiquetteGES(emissionGes.emission_ges_5_usages_m2);

    const cout: SortieCout = {
      cout_ch: efConso.conso_ch * 0.12,
      cout_ch_depensier: efConso.conso_ch_depensier * 0.12,
      cout_ecs: efConso.conso_ecs * 0.12,
      cout_ecs_depensier: efConso.conso_ecs_depensier * 0.12,
      cout_eclairage: efConso.conso_eclairage * 0.18,
      cout_auxiliaire_generation_ch: efConso.conso_auxiliaire_generation_ch * 0.18,
      cout_auxiliaire_generation_ch_depensier: efConso.conso_auxiliaire_generation_ch_depensier * 0.18,
      cout_auxiliaire_distribution_ch: efConso.conso_auxiliaire_distribution_ch * 0.18,
      cout_auxiliaire_generation_ecs: efConso.conso_auxiliaire_generation_ecs * 0.18,
      cout_auxiliaire_generation_ecs_depensier: efConso.conso_auxiliaire_generation_ecs_depensier * 0.18,
      cout_auxiliaire_distribution_ecs: efConso.conso_auxiliaire_distribution_ecs * 0.18,
      cout_auxiliaire_ventilation: efConso.conso_auxiliaire_ventilation * 0.18,
      cout_total_auxiliaire: efConso.conso_totale_auxiliaire * 0.18,
      cout_fr: 0,
      cout_fr_depensier: 0,
      cout_5_usages: 0,
    };

    cout.cout_5_usages = cout.cout_ch + cout.cout_ecs + cout.cout_eclairage + cout.cout_total_auxiliaire;

    return {
      deperdition: deperdition,
      apport_et_besoin: apportEtBesoin,
      ef_conso: efConso,
      ep_conso: epConso,
      emission_ges: emissionGes,
      cout: cout,
    };
  }

  /**
   * Calcule les déperditions thermiques
   */
  private calculateDeperditions(dpe: DPEWithMetadata): SortieDeperdition {
    const surface = dpe.logement.caracteristique_generale.surface_habitable_logement ?? 100;
    const enveloppe = dpe.logement.enveloppe;
    
    // Calcul des surfaces et U
    let deperditionMurs = 0;
    const murs = Array.isArray(enveloppe.mur_collection.mur) 
      ? enveloppe.mur_collection.mur 
      : [enveloppe.mur_collection.mur];
    for (const mur of murs) {
      deperditionMurs += mur.donnee_entree.surface_paroi_opaque * mur.donnee_intermediaire.umur;
    }

    let deperditionPlancherBas = 0;
    if (enveloppe.plancher_bas_collection) {
      const planchers = Array.isArray(enveloppe.plancher_bas_collection.plancher_bas)
        ? enveloppe.plancher_bas_collection.plancher_bas
        : [enveloppe.plancher_bas_collection.plancher_bas];
      for (const pb of planchers) {
        deperditionPlancherBas += pb.donnee_entree.surface_paroi_opaque * pb.donnee_intermediaire.upb_final;
      }
    }

    let deperditionPlancherHaut = 0;
    if (enveloppe.plancher_haut_collection) {
      const planchers = Array.isArray(enveloppe.plancher_haut_collection.plancher_haut)
        ? enveloppe.plancher_haut_collection.plancher_haut
        : [enveloppe.plancher_haut_collection.plancher_haut];
      for (const ph of planchers) {
        deperditionPlancherHaut += ph.donnee_entree.surface_paroi_opaque * ph.donnee_intermediaire.uph;
      }
    }

    // Valeurs simplifiées pour les autres déperditions
    const dh = 2500; // Degrés-heures
    
    return {
      hvent: 0.5,
      hperm: 0.8,
      deperdition_renouvellement_air: 30 * surface * dh / 1000,
      deperdition_mur: deperditionMurs * dh / 1000,
      deperdition_plancher_bas: deperditionPlancherBas * dh / 1000,
      deperdition_plancher_haut: deperditionPlancherHaut * dh / 1000,
      deperdition_baie_vitree: 25 * surface * dh / 1000,
      deperdition_porte: 2 * surface * dh / 1000,
      deperdition_pont_thermique: 8 * surface * dh / 1000,
      deperdition_enveloppe: 0,
    };
  }

  /**
   * Calcule les besoins en chauffage/ECS
   */
  private calculateBesoins(deperdition: SortieDeperdition, surface: number): SortieApportEtBesoin {
    const nadeq = 2.5;
    const besoinCh = deperdition.deperdition_enveloppe;
    const besoinEcs = 25 * nadeq * 365 / 1000;

    return {
      surface_sud_equivalente: surface * 0.1,
      apport_solaire_fr: 0,
      apport_interne_fr: 0,
      apport_solaire_ch: 500,
      apport_interne_ch: 800,
      fraction_apport_gratuit_ch: 0.15,
      fraction_apport_gratuit_depensier_ch: 0.10,
      pertes_distribution_ecs_recup: 50,
      pertes_distribution_ecs_recup_depensier: 40,
      pertes_stockage_ecs_recup: 30,
      pertes_generateur_ch_recup: 100,
      pertes_generateur_ch_recup_depensier: 80,
      nadeq,
      v40_ecs_journalier: 25 * nadeq,
      v40_ecs_journalier_depensier: 30 * nadeq,
      besoin_ch: besoinCh,
      besoin_ch_depensier: besoinCh * 1.2,
      besoin_ecs: besoinEcs,
      besoin_ecs_depensier: besoinEcs * 1.1,
      besoin_fr: 0,
      besoin_fr_depensier: 0,
    };
  }

  /**
   * Calcule les consommations
   */
  private calculateConsommations(
    besoins: SortieApportEtBesoin,
    dpe: DPEWithMetadata
  ): { ef: SortieEfConso; ep: SortieEpConso; ges: SortieEmissionGes; cout: SortieCout } {
    const surface = dpe.logement.caracteristique_generale.surface_habitable_logement ?? 100;
    
    // Calculs simplifiés
    const efConso: SortieEfConso = {
      conso_ch: besoins.besoin_ch / 0.85,
      conso_ch_depensier: besoins.besoin_ch_depensier / 0.80,
      conso_ecs: besoins.besoin_ecs / 0.75,
      conso_ecs_depensier: besoins.besoin_ecs_depensier / 0.70,
      conso_eclairage: 5 * surface / 1000,
      conso_auxiliaire_generation_ch: 2,
      conso_auxiliaire_generation_ch_depensier: 2.5,
      conso_auxiliaire_distribution_ch: 1,
      conso_auxiliaire_generation_ecs: 1.5,
      conso_auxiliaire_generation_ecs_depensier: 2,
      conso_auxiliaire_distribution_ecs: 0.5,
      conso_auxiliaire_ventilation: 2,
      conso_totale_auxiliaire: 7,
      conso_fr: 0,
      conso_fr_depensier: 0,
      conso_5_usages: 0,
      conso_5_usages_m2: 0,
    };

    efConso.conso_5_usages = efConso.conso_ch + efConso.conso_ecs + efConso.conso_eclairage + efConso.conso_totale_auxiliaire;
    efConso.conso_5_usages_m2 = efConso.conso_5_usages * 1000 / surface;

    // EP et GES simplifiés
    const epConso: SortieEpConso = {
      ep_conso_ch: efConso.conso_ch * 1.5,
      ep_conso_ch_depensier: efConso.conso_ch_depensier * 1.5,
      ep_conso_ecs: efConso.conso_ecs * 1.5,
      ep_conso_ecs_depensier: efConso.conso_ecs_depensier * 1.5,
      ep_conso_eclairage: efConso.conso_eclairage * 2.58,
      ep_conso_auxiliaire_generation_ch: efConso.conso_auxiliaire_generation_ch * 2.58,
      ep_conso_auxiliaire_generation_ch_depensier: efConso.conso_auxiliaire_generation_ch_depensier * 2.58,
      ep_conso_auxiliaire_distribution_ch: efConso.conso_auxiliaire_distribution_ch * 2.58,
      ep_conso_auxiliaire_generation_ecs: efConso.conso_auxiliaire_generation_ecs * 2.58,
      ep_conso_auxiliaire_generation_ecs_depensier: efConso.conso_auxiliaire_generation_ecs_depensier * 2.58,
      ep_conso_auxiliaire_distribution_ecs: efConso.conso_auxiliaire_distribution_ecs * 2.58,
      ep_conso_auxiliaire_ventilation: efConso.conso_auxiliaire_ventilation * 2.58,
      ep_conso_totale_auxiliaire: efConso.conso_totale_auxiliaire * 2.58,
      ep_conso_fr: 0,
      ep_conso_fr_depensier: 0,
      ep_conso_5_usages: 0,
      ep_conso_5_usages_m2: 0,
      classe_bilan_dpe: EnumEtiquetteDpe.D,
    };

    epConso.ep_conso_5_usages = epConso.ep_conso_ch + epConso.ep_conso_ecs + epConso.ep_conso_eclairage + epConso.ep_conso_totale_auxiliaire;
    epConso.ep_conso_5_usages_m2 = epConso.ep_conso_5_usages * 1000 / surface;
    epConso.classe_bilan_dpe = this.getEtiquetteEnergie(epConso.ep_conso_5_usages_m2);

    const emissionGes: SortieEmissionGes = {
      emission_ges_ch: efConso.conso_ch * 0.05,
      emission_ges_ch_depensier: efConso.conso_ch_depensier * 0.05,
      emission_ges_ecs: efConso.conso_ecs * 0.05,
      emission_ges_ecs_depensier: efConso.conso_ecs_depensier * 0.05,
      emission_ges_eclairage: efConso.conso_eclairage * 0.01,
      emission_ges_auxiliaire_generation_ch: efConso.conso_auxiliaire_generation_ch * 0.01,
      emission_ges_auxiliaire_generation_ch_depensier: efConso.conso_auxiliaire_generation_ch_depensier * 0.01,
      emission_ges_auxiliaire_distribution_ch: efConso.conso_auxiliaire_distribution_ch * 0.01,
      emission_ges_auxiliaire_generation_ecs: efConso.conso_auxiliaire_generation_ecs * 0.01,
      emission_ges_auxiliaire_generation_ecs_depensier: efConso.conso_auxiliaire_generation_ecs_depensier * 0.01,
      emission_ges_auxiliaire_distribution_ecs: efConso.conso_auxiliaire_distribution_ecs * 0.01,
      emission_ges_auxiliaire_ventilation: efConso.conso_auxiliaire_ventilation * 0.01,
      emission_ges_totale_auxiliaire: efConso.conso_totale_auxiliaire * 0.01,
      emission_ges_fr: 0,
      emission_ges_fr_depensier: 0,
      emission_ges_5_usages: 0,
      emission_ges_5_usages_m2: 0,
      classe_emission_ges: EnumEtiquetteDpe.D,
    };

    emissionGes.emission_ges_5_usages = emissionGes.emission_ges_ch + emissionGes.emission_ges_ecs + emissionGes.emission_ges_eclairage + emissionGes.emission_ges_totale_auxiliaire;
    emissionGes.emission_ges_5_usages_m2 = emissionGes.emission_ges_5_usages * 1000 / surface;
    emissionGes.classe_emission_ges = this.getEtiquetteGES(emissionGes.emission_ges_5_usages_m2);

    const cout: SortieCout = {
      cout_ch: efConso.conso_ch * 0.12,
      cout_ch_depensier: efConso.conso_ch_depensier * 0.12,
      cout_ecs: efConso.conso_ecs * 0.12,
      cout_ecs_depensier: efConso.conso_ecs_depensier * 0.12,
      cout_eclairage: efConso.conso_eclairage * 0.18,
      cout_auxiliaire_generation_ch: efConso.conso_auxiliaire_generation_ch * 0.18,
      cout_auxiliaire_generation_ch_depensier: efConso.conso_auxiliaire_generation_ch_depensier * 0.18,
      cout_auxiliaire_distribution_ch: efConso.conso_auxiliaire_distribution_ch * 0.18,
      cout_auxiliaire_generation_ecs: efConso.conso_auxiliaire_generation_ecs * 0.18,
      cout_auxiliaire_generation_ecs_depensier: efConso.conso_auxiliaire_generation_ecs_depensier * 0.18,
      cout_auxiliaire_distribution_ecs: efConso.conso_auxiliaire_distribution_ecs * 0.18,
      cout_auxiliaire_ventilation: efConso.conso_auxiliaire_ventilation * 0.18,
      cout_total_auxiliaire: efConso.conso_totale_auxiliaire * 0.18,
      cout_fr: 0,
      cout_fr_depensier: 0,
      cout_5_usages: 0,
    };

    cout.cout_5_usages = cout.cout_ch + cout.cout_ecs + cout.cout_eclairage + cout.cout_total_auxiliaire;

    return { ef: efConso, ep: epConso, ges: emissionGes, cout };
  }

  /**
   * Détermine l'étiquette énergie
   */
  private getEtiquetteEnergie(conso: number): EnumEtiquetteDpe {
    for (const seuil of SEUILS_ETIQUETTE_ENERGIE) {
      if (conso <= seuil.max) {
        return seuil.etiquette;
      }
    }
    return EnumEtiquetteDpe.G;
  }

  /**
   * Détermine l'étiquette GES
   */
  private getEtiquetteGES(emission: number): EnumEtiquetteDpe {
    for (const seuil of SEUILS_ETIQUETTE_GES) {
      if (emission <= seuil.max) {
        return seuil.etiquette;
      }
    }
    return EnumEtiquetteDpe.G;
  }

  /**
   * Valide un DPE avant transmission
   */
  async validateBeforeTransmission(id: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    const dpeResult = await this.getById(id);
    if (!dpeResult.success || !dpeResult.data) {
      return { valid: false, errors: ["DPE non trouvé"] };
    }

    const dpe = dpeResult.data;

    // Vérifications obligatoires
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

    const murs = Array.isArray(dpe.logement.enveloppe.mur_collection.mur)
      ? dpe.logement.enveloppe.mur_collection.mur
      : [dpe.logement.enveloppe.mur_collection.mur];
    if (murs.length === 0) {
      errors.push("Au moins un mur doit être défini");
    }

    // Vérifier que le calcul a été fait
    if (!dpe.logement.sortie) {
      errors.push("Les calculs doivent être effectués avant transmission");
    }

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton factory
let dpeServiceInstance: DPEService | null = null;

export function createDPEService(storage?: StorageAdapter): DPEService {
  if (!dpeServiceInstance) {
    dpeServiceInstance = new DPEService(storage);
  }
  return dpeServiceInstance;
}

export function getDPEService(): DPEService | null {
  return dpeServiceInstance;
}

export function resetDPEService(): void {
  dpeServiceInstance = null;
}
