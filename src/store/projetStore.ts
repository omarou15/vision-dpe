import { create } from "zustand";
import * as projetService from "@/services/projet";
import type { LocalProjet } from "@/services/db";
import type { ProjectType, ProjectStatus, LogementType } from "@/types";

interface ProjetState {
  /** Liste des projets de l'organisation */
  projets: LocalProjet[];
  /** Projet actuellement ouvert dans le wizard */
  activeProjet: LocalProjet | null;
  /** Compteurs par statut */
  statusCounts: Record<ProjectStatus, number>;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur */
  error: string | null;
}

interface ProjetActions {
  // ── Chargement ──
  /** Charge la liste des projets de l'organisation */
  loadProjets: (organisationId: string, filters?: {
    status?: ProjectStatus;
    projectType?: ProjectType;
    assignedTo?: string;
  }) => Promise<void>;

  /** Charge un projet spécifique et le met en actif */
  loadProjet: (projetId: string) => Promise<void>;

  /** Rafraîchit les compteurs par statut */
  loadStatusCounts: (organisationId: string) => Promise<void>;

  // ── CRUD ──
  /** Crée un nouveau projet */
  createProjet: (input: {
    organisationId: string;
    createdBy: string;
    projectType: ProjectType;
    logementType: LogementType;
    name: string;
  }) => Promise<string>;

  /** Met à jour le projet actif */
  updateActiveProjet: (updates: Partial<Pick<LocalProjet,
    "name" | "status" | "assigned_to" | "logement_type" |
    "address" | "postal_code" | "city" |
    "etiquette_energie" | "etiquette_climat" |
    "current_step" | "steps_completed"
  >>) => Promise<void>;

  /** Marque une étape comme complétée */
  completeStep: (stepNumber: number) => Promise<void>;

  /** Supprime un projet */
  deleteProjet: (projetId: string) => Promise<void>;

  /** Duplique un projet */
  duplicateProjet: (projetId: string, newName?: string) => Promise<string>;

  // ── Transformation ──
  /** Transforme le projet actif DPE → Audit */
  transformerEnAudit: () => Promise<void>;

  /** Transforme le projet actif Audit → DPE */
  transformerEnDpe: () => Promise<void>;

  // ── Lifecycle ──
  /** Valide le projet actif */
  validateProjet: () => Promise<void>;

  /** Exporte le projet actif */
  exportProjet: () => Promise<void>;

  /** Archive le projet actif */
  archiveProjet: () => Promise<void>;

  // ── Utils ──
  clearActiveProjet: () => void;
  clearError: () => void;
}

export const useProjetStore = create<ProjetState & ProjetActions>((set, get) => ({
  // ── State ──
  projets: [],
  activeProjet: null,
  statusCounts: { draft: 0, in_progress: 0, validated: 0, exported: 0, archived: 0 },
  isLoading: false,
  error: null,

  // ── Chargement ──
  loadProjets: async (organisationId, filters) => {
    set({ isLoading: true, error: null });
    try {
      const projets = await projetService.listProjets(organisationId, filters);
      set({ projets, isLoading: false });
    } catch (err) {
      set({ error: "Erreur chargement projets", isLoading: false });
      console.error(err);
    }
  },

  loadProjet: async (projetId) => {
    set({ isLoading: true, error: null });
    try {
      const projet = await projetService.getProjet(projetId);
      set({ activeProjet: projet, isLoading: false });
    } catch (err) {
      set({ error: "Projet introuvable", isLoading: false });
      console.error(err);
    }
  },

  loadStatusCounts: async (organisationId) => {
    try {
      const counts = await projetService.countByStatus(organisationId);
      set({ statusCounts: counts });
    } catch (err) {
      console.error(err);
    }
  },

  // ── CRUD ──
  createProjet: async (input) => {
    set({ error: null });
    try {
      const id = await projetService.createProjet(input);
      // Recharger la liste
      await get().loadProjets(input.organisationId);
      await get().loadStatusCounts(input.organisationId);
      return id;
    } catch (err) {
      set({ error: "Erreur création projet" });
      throw err;
    }
  },

  updateActiveProjet: async (updates) => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.updateProjet(activeProjet.id, updates);
      // Recharger le projet actif
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur mise à jour projet" });
      console.error(err);
    }
  },

  completeStep: async (stepNumber) => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.completeStep(activeProjet.id, stepNumber);
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur complétion étape" });
      console.error(err);
    }
  },

  deleteProjet: async (projetId) => {
    try {
      await projetService.deleteProjet(projetId);
      set((state) => ({
        projets: state.projets.filter((p) => p.id !== projetId),
        activeProjet: state.activeProjet?.id === projetId ? null : state.activeProjet,
      }));
    } catch (err) {
      set({ error: "Erreur suppression projet" });
      console.error(err);
    }
  },

  duplicateProjet: async (projetId, newName) => {
    try {
      const newId = await projetService.duplicateProjet(projetId, newName);
      return newId;
    } catch (err) {
      set({ error: "Erreur duplication projet" });
      throw err;
    }
  },

  // ── Transformation ──
  transformerEnAudit: async () => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.transformerEnAudit(activeProjet.id);
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur transformation en audit" });
      console.error(err);
    }
  },

  transformerEnDpe: async () => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.transformerEnDpe(activeProjet.id);
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur transformation en DPE" });
      console.error(err);
    }
  },

  // ── Lifecycle ──
  validateProjet: async () => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.validateProjet(activeProjet.id);
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur validation projet" });
      console.error(err);
    }
  },

  exportProjet: async () => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.exportProjet(activeProjet.id);
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur export projet" });
      console.error(err);
    }
  },

  archiveProjet: async () => {
    const { activeProjet } = get();
    if (!activeProjet) return;

    try {
      await projetService.archiveProjet(activeProjet.id);
      const refreshed = await projetService.getProjet(activeProjet.id);
      set({ activeProjet: refreshed });
    } catch (err) {
      set({ error: "Erreur archivage projet" });
      console.error(err);
    }
  },

  // ── Utils ──
  clearActiveProjet: () => set({ activeProjet: null }),
  clearError: () => set({ error: null }),
}));
