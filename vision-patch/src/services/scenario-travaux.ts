/**
 * ScenarioTravauxService — Logique métier des scénarios de travaux
 *
 * Gère les 2 parcours obligatoires (DPE + Audit) :
 * - Parcours 1 : progressif, minimum 2 étapes, classe C minimum
 * - Parcours 2 : rénovation globale, classe B minimum
 *
 * Vérifie la conformité réglementaire (réforme 2021).
 */

import type { ClasseDpe, ParcoursTravaux, EtapeTravaux, Travail, PosteTravaux } from "@/types/steps/step12-14";
import { CLASSE_MINIMALE_PARCOURS, POSTE_LABELS } from "@/types/steps/step12-14";
import type { Parcours1Audit, Parcours2Audit, EtapeTravauxAudit, TravailAudit } from "@/types/steps/audit";
import { calculerEtiquette } from "@/types/steps/audit";

// ════════════════════════════════════════════════════════════
// Ordre des classes pour comparaison
// ════════════════════════════════════════════════════════════

const CLASSE_ORDRE: Record<ClasseDpe, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };

export function isClasseSuffisante(visee: ClasseDpe, minimum: ClasseDpe): boolean {
  return CLASSE_ORDRE[visee] <= CLASSE_ORDRE[minimum];
}

// ════════════════════════════════════════════════════════════
// Validation scénarios DPE (étape 12)
// ════════════════════════════════════════════════════════════

export interface ErreurScenario {
  parcours: 1 | 2;
  code: string;
  message: string;
}

export function validerScenariosDpe(parcours: ParcoursTravaux[]): ErreurScenario[] {
  const erreurs: ErreurScenario[] = [];

  if (parcours.length < 2) {
    erreurs.push({ parcours: 1, code: "SCE_001", message: "2 parcours de travaux sont obligatoires (réforme 2021)" });
    return erreurs;
  }

  for (const p of parcours) {
    const num = p.numero_parcours as 1 | 2;
    const classeMin = CLASSE_MINIMALE_PARCOURS[num];

    // Étiquette visée suffisante
    if (p.classe_visee && classeMin && !isClasseSuffisante(p.classe_visee, classeMin)) {
      erreurs.push({ parcours: num, code: "SCE_002", message: `Parcours ${num} : classe visée ${p.classe_visee} insuffisante (minimum ${classeMin})` });
    }

    // Au moins 1 étape
    if (p.etapes.length === 0) {
      erreurs.push({ parcours: num, code: "SCE_003", message: `Parcours ${num} : au moins une étape de travaux requise` });
    }

    // Parcours 1 : minimum 2 étapes
    if (num === 1 && p.etapes.length < 2) {
      erreurs.push({ parcours: 1, code: "SCE_004", message: "Parcours 1 (progressif) : minimum 2 étapes de travaux" });
    }

    // Au moins 1 travail par étape
    for (const et of p.etapes) {
      if (et.travaux.length === 0) {
        erreurs.push({ parcours: num, code: "SCE_005", message: `Parcours ${num}, étape ${et.numero} : au moins un travail requis` });
      }
    }
  }

  // Les 2 parcours doivent différer
  if (parcours.length >= 2) {
    const postesP1 = new Set(parcours[0].etapes.flatMap((e) => e.travaux.map((t) => t.poste)));
    const postesP2 = new Set(parcours[1].etapes.flatMap((e) => e.travaux.map((t) => t.poste)));
    const identiques = [...postesP1].every((p) => postesP2.has(p)) && [...postesP2].every((p) => postesP1.has(p));
    if (identiques && postesP1.size > 0) {
      erreurs.push({ parcours: 1, code: "SCE_006", message: "Les 2 parcours doivent être différents (au moins un poste doit différer)" });
    }
  }

  return erreurs;
}

// ════════════════════════════════════════════════════════════
// Validation scénarios Audit (étapes 13-17)
// ════════════════════════════════════════════════════════════

export function validerParcours1Audit(parcours: Parcours1Audit): ErreurScenario[] {
  const erreurs: ErreurScenario[] = [];

  if (parcours.etapes.length < 2) {
    erreurs.push({ parcours: 1, code: "AUD_P1_001", message: "Parcours 1 audit : minimum 2 étapes de travaux" });
  }

  for (const et of parcours.etapes) {
    if (et.travaux.length === 0) {
      erreurs.push({ parcours: 1, code: "AUD_P1_002", message: `Étape ${et.numero} : au moins un travail requis` });
    }
    for (const t of et.travaux) {
      if (!t.produit_preconise) {
        erreurs.push({ parcours: 1, code: "AUD_P1_003", message: `Étape ${et.numero} : produit préconisé obligatoire pour l'audit` });
      }
    }
  }

  if (parcours.dpe_projete) {
    if (!isClasseSuffisante(parcours.dpe_projete.etiquette_energie, "C")) {
      erreurs.push({ parcours: 1, code: "AUD_P1_004", message: `Classe projetée ${parcours.dpe_projete.etiquette_energie} insuffisante (minimum C)` });
    }
  }

  return erreurs;
}

export function validerParcours2Audit(parcours: Parcours2Audit): ErreurScenario[] {
  const erreurs: ErreurScenario[] = [];

  if (parcours.travaux.length === 0) {
    erreurs.push({ parcours: 2, code: "AUD_P2_001", message: "Parcours 2 audit : au moins un poste de travaux requis" });
  }

  for (const t of parcours.travaux) {
    if (!t.produit_preconise) {
      erreurs.push({ parcours: 2, code: "AUD_P2_002", message: "Produit préconisé obligatoire pour chaque poste de l'audit" });
    }
  }

  if (parcours.dpe_projete) {
    if (!isClasseSuffisante(parcours.dpe_projete.etiquette_energie, "B")) {
      erreurs.push({ parcours: 2, code: "AUD_P2_003", message: `Classe projetée ${parcours.dpe_projete.etiquette_energie} insuffisante (minimum B)` });
    }
  }

  return erreurs;
}

// ════════════════════════════════════════════════════════════
// Calculs utilitaires
// ════════════════════════════════════════════════════════════

/** Calcule le coût total cumulé d'un parcours */
export function calculerCoutTotalParcours(etapes: (EtapeTravaux | EtapeTravauxAudit)[]): number {
  return etapes.reduce((total, et) => {
    const coutEtape = et.travaux.reduce((s, t) => s + (t.cout_estime || 0), 0);
    return total + coutEtape;
  }, 0);
}

/** Calcule le coût total d'une liste de travaux */
export function calculerCoutTotalTravaux(travaux: (Travail | TravailAudit)[]): number {
  return travaux.reduce((s, t) => s + (t.cout_estime || 0), 0);
}

/** Liste les postes couverts par un parcours */
export function getPostesCouvertsParours(etapes: (EtapeTravaux | EtapeTravauxAudit)[]): PosteTravaux[] {
  const postes = new Set<PosteTravaux>();
  for (const et of etapes) {
    for (const t of et.travaux) postes.add(t.poste);
  }
  return [...postes];
}

/** Vérifie que les 2 parcours couvrent des postes différents */
export function parcoursDifferent(parcours1Postes: PosteTravaux[], parcours2Postes: PosteTravaux[]): boolean {
  const set1 = new Set(parcours1Postes);
  const set2 = new Set(parcours2Postes);
  // Au moins un poste doit différer
  const union = new Set([...set1, ...set2]);
  return union.size > Math.max(set1.size, set2.size) || set1.size !== set2.size;
}

/** Estimation du gain énergétique par poste (forfaitaire simplifié) */
export const GAIN_FORFAITAIRE_PAR_POSTE: Record<PosteTravaux, { cep: number; eges: number }> = {
  isolation_murs: { cep: 40, eges: 8 },
  isolation_planchers_bas: { cep: 15, eges: 3 },
  isolation_toiture: { cep: 35, eges: 7 },
  remplacement_fenetres: { cep: 20, eges: 4 },
  chauffage: { cep: 60, eges: 15 },
  ecs: { cep: 25, eges: 5 },
  ventilation: { cep: 15, eges: 2 },
  climatisation: { cep: 10, eges: 2 },
  enr_photovoltaique: { cep: 30, eges: 5 },
  enr_solaire_thermique: { cep: 20, eges: 3 },
};

/** Estime le gain total d'un ensemble de travaux */
export function estimerGainTotal(postes: PosteTravaux[]): { cep: number; eges: number } {
  return postes.reduce(
    (acc, p) => ({
      cep: acc.cep + (GAIN_FORFAITAIRE_PAR_POSTE[p]?.cep || 0),
      eges: acc.eges + (GAIN_FORFAITAIRE_PAR_POSTE[p]?.eges || 0),
    }),
    { cep: 0, eges: 0 }
  );
}
