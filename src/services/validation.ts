/**
 * ValidationService — Contrôles de cohérence DPE locaux
 *
 * Implémente les contrôles bloquants ADEME en local pour feedback temps réel
 * étape par étape. Le XML final est ensuite soumis à /controle_coherence
 * pour validation officielle ADEME.
 *
 * Source de vérité : svc_controle_coherence du repo observatoire-dpe
 * Version moteur : 1.24.2 (3 novembre 2025)
 */

import type { Step1Data, Step2Data, Step3Data } from "@/types/steps/step1-3";
import type { Step4Data, Step5Data, Step6Data, Step7Data, Step8Data } from "@/types/steps/step4-8";
import type { Step9Data, Step10Data, Step11Data } from "@/types/steps/step9-11";
import type { Step12Data } from "@/types/steps/step12-14";
import { isGeocodageValide } from "@/types/steps/step1-3";
import { isAdjacenceLNC, isMethodeSaisieDirecte } from "@/types/steps/step4-8";
import { isChampRequis, GENERATEUR_CH_FIELDS, type CategorieGenerateurCh } from "@/types/steps/step9-11";
import { CLASSE_MINIMALE_PARCOURS, getEtapeFromXpath, type ResultatControle, type SeveriteControle } from "@/types/steps/step12-14";

// ════════════════════════════════════════════════════════════
// Types internes
// ════════════════════════════════════════════════════════════

export interface ErreurValidation {
  code: string;
  message: string;
  severite: SeveriteControle;
  etape: number;
  champ: string | null;
}

export interface ResultatValidationLocale {
  etape: number;
  erreurs: ErreurValidation[];
  valide: boolean;
}

// ════════════════════════════════════════════════════════════
// Validations par étape
// ════════════════════════════════════════════════════════════

function err(code: string, message: string, etape: number, champ: string | null = null, severite: SeveriteControle = "bloquant"): ErreurValidation {
  return { code, message, severite, etape, champ };
}

/** Étape 1 — Informations générales */
export function validerStep1(data: Partial<Step1Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.geocodage || !data.geocodage_valide) {
    errs.push(err("GEO_001", "Géocodage BAN obligatoire et valide (score ≥ 0.5)", 1, "geocodage"));
  }
  if (data.geocodage && !isGeocodageValide(data.geocodage.score)) {
    errs.push(err("GEO_002", `Score géocodage insuffisant : ${data.geocodage.score}. Minimum 0.5 requis par l'ADEME.`, 1, "geocodage"));
  }
  if (!data.date_visite) {
    errs.push(err("ADM_001", "Date de visite obligatoire", 1, "date_visite"));
  }
  if (!data.diagnostiqueur?.numero_certification) {
    errs.push(err("ADM_002", "Numéro de certification diagnostiqueur obligatoire", 1, "diagnostiqueur"));
  }

  return errs;
}

/** Étape 2 — Données administratives */
export function validerStep2(data: Partial<Step2Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.methode_application) {
    errs.push(err("ADM_010", "Type de logement obligatoire", 2, "methode_application"));
  }
  if (!data.surface_habitable_lot || data.surface_habitable_lot <= 0) {
    errs.push(err("ADM_011", "Surface habitable du lot obligatoire et > 0", 2, "surface_habitable_lot"));
  }
  if (!data.consentement_proprietaire) {
    errs.push(err("ADM_012", "Consentement du propriétaire obligatoire", 2, "consentement_proprietaire"));
  }
  if (!data.commanditaire?.nom) {
    errs.push(err("ADM_013", "Nom du commanditaire obligatoire", 2, "commanditaire"));
  }
  // Cohérence immeuble
  const isImmeuble = data.methode_application === "immeuble_collectif" || data.methode_application === "lot_copropriete" || data.methode_application === "appartement_depuis_immeuble";
  if (isImmeuble && (!data.surface_habitable_batiment || data.surface_habitable_batiment <= 0)) {
    errs.push(err("ADM_014", "Surface habitable bâtiment obligatoire pour un immeuble", 2, "surface_habitable_batiment"));
  }
  if (isImmeuble && data.surface_habitable_lot && data.surface_habitable_batiment && data.surface_habitable_lot > data.surface_habitable_batiment) {
    errs.push(err("ADM_015", "Surface lot ne peut pas dépasser surface bâtiment", 2, "surface_habitable_lot"));
  }

  return errs;
}

/** Étape 3 — Caractéristiques générales */
export function validerStep3(data: Partial<Step3Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.periode_construction) {
    errs.push(err("CAR_001", "Période de construction obligatoire", 3, "periode_construction"));
  }
  if (!data.surface_habitable || data.surface_habitable <= 0) {
    errs.push(err("CAR_002", "Surface habitable obligatoire et > 0", 3, "surface_habitable"));
  }
  if (!data.zone_climatique) {
    errs.push(err("CAR_003", "Zone climatique obligatoire (déduite du code postal)", 3, "zone_climatique"));
  }
  if (data.hauteur_sous_plafond && (data.hauteur_sous_plafond < 1.5 || data.hauteur_sous_plafond > 6)) {
    errs.push(err("CAR_004", "Hauteur sous plafond incohérente (1.5m à 6m)", 3, "hauteur_sous_plafond", "warning"));
  }

  return errs;
}

/** Étape 4 — Murs */
export function validerStep4(data: Partial<Step4Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.murs || data.murs.length === 0) {
    errs.push(err("ENV_001", "Au moins un mur est requis", 4, null, "warning"));
    return errs;
  }

  data.murs.forEach((mur, i) => {
    const d = mur.donnee_entree;
    if (!d.surface_paroi_opaque || d.surface_paroi_opaque <= 0) {
      errs.push(err("MUR_001", `Mur ${i + 1} : surface opaque obligatoire et > 0`, 4, "surface_paroi_opaque"));
    }
    if (isMethodeSaisieDirecte(d.methode_saisie_u) && (d.umur_saisi === null || d.umur_saisi === undefined)) {
      errs.push(err("MUR_002", `Mur ${i + 1} : U mur obligatoire en saisie directe`, 4, "umur_saisi"));
    }
    if (d.umur_saisi !== null && d.umur_saisi !== undefined && (d.umur_saisi < 0 || d.umur_saisi > 10)) {
      errs.push(err("MUR_003", `Mur ${i + 1} : U mur hors plage (0-10 W/m².K)`, 4, "umur_saisi", "warning"));
    }
  });

  return errs;
}

/** Étape 5 — Baies et portes */
export function validerStep5(data: Partial<Step5Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if ((!data.baies || data.baies.length === 0) && (!data.portes || data.portes.length === 0)) {
    errs.push(err("ENV_010", "Au moins une baie ou une porte recommandée", 5, null, "warning"));
  }

  data.baies?.forEach((b, i) => {
    if (!b.donnee_entree.surface || b.donnee_entree.surface <= 0) {
      errs.push(err("BAI_001", `Baie ${i + 1} : surface obligatoire et > 0`, 5, "surface"));
    }
    const ms = b.donnee_entree.methode_saisie;
    if ((ms === "saisie_uw" || ms === "justificatif_fabricant") && b.donnee_entree.uw_saisi === null) {
      errs.push(err("BAI_002", `Baie ${i + 1} : Uw obligatoire en saisie directe`, 5, "uw_saisi"));
    }
  });

  data.portes?.forEach((p, i) => {
    if (!p.donnee_entree.surface || p.donnee_entree.surface <= 0) {
      errs.push(err("POR_001", `Porte ${i + 1} : surface obligatoire et > 0`, 5, "surface"));
    }
  });

  return errs;
}

/** Étapes 6-7 — Planchers */
export function validerStep6(data: Partial<Step6Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];
  data.planchers_bas?.forEach((pb, i) => {
    if (!pb.donnee_entree.surface || pb.donnee_entree.surface <= 0) {
      errs.push(err("PLB_001", `Plancher bas ${i + 1} : surface obligatoire`, 6, "surface"));
    }
    if (isMethodeSaisieDirecte(pb.donnee_entree.methode_saisie_u) && pb.donnee_entree.upb_saisi === null) {
      errs.push(err("PLB_002", `Plancher bas ${i + 1} : Upb obligatoire en saisie directe`, 6, "upb_saisi"));
    }
  });
  return errs;
}

export function validerStep7(data: Partial<Step7Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];
  data.planchers_hauts?.forEach((ph, i) => {
    if (!ph.donnee_entree.surface || ph.donnee_entree.surface <= 0) {
      errs.push(err("PLH_001", `Plancher haut ${i + 1} : surface obligatoire`, 7, "surface"));
    }
  });
  return errs;
}

/** Étape 8 — Ponts thermiques */
export function validerStep8(data: Partial<Step8Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];
  data.ponts_thermiques?.forEach((pt, i) => {
    if (!pt.donnee_entree.longueur || pt.donnee_entree.longueur <= 0) {
      errs.push(err("PT_001", `Pont thermique ${i + 1} : longueur obligatoire`, 8, "longueur"));
    }
    const ms = pt.donnee_entree.methode_saisie;
    if ((ms === "expert" || ms === "mesure") && pt.donnee_entree.kpt_saisi === null) {
      errs.push(err("PT_002", `Pont thermique ${i + 1} : kpt obligatoire en saisie experte`, 8, "kpt_saisi"));
    }
  });
  return errs;
}

/** Étape 9 — Chauffage (variables_requises/interdites) */
export function validerStep9(data: Partial<Step9Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.installations_chauffage || data.installations_chauffage.length === 0) {
    errs.push(err("CH_001", "Au moins une installation de chauffage requise", 9, null));
    return errs;
  }

  data.installations_chauffage.forEach((inst, ii) => {
    if (!inst.surface_chauffee || inst.surface_chauffee <= 0) {
      errs.push(err("CH_002", `Installation ${ii + 1} : surface chauffée obligatoire`, 9, "surface_chauffee"));
    }

    inst.generateurs.forEach((gen, gi) => {
      const cat = gen.categorie;
      const regles = GENERATEUR_CH_FIELDS[cat];
      if (!regles) return;

      // Vérifier variables requises
      for (const champ of regles.requis) {
        const val = (gen as unknown as Record<string, unknown>)[champ];
        if (val === null || val === undefined || val === 0) {
          errs.push(err(
            "CH_REQ",
            `Installation ${ii + 1}, générateur ${gi + 1} (${cat}) : ${champ} est requis`,
            9, champ
          ));
        }
      }

      // Vérifier variables interdites non remplies
      for (const champ of regles.interdits) {
        const val = (gen as unknown as Record<string, unknown>)[champ];
        if (val !== null && val !== undefined && val !== 0 && val !== false) {
          errs.push(err(
            "CH_INT",
            `Installation ${ii + 1}, générateur ${gi + 1} (${cat}) : ${champ} est interdit pour ce type`,
            9, champ, "warning"
          ));
        }
      }
    });
  });

  return errs;
}

/** Étape 10 — ECS */
export function validerStep10(data: Partial<Step10Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.installations_ecs || data.installations_ecs.length === 0) {
    errs.push(err("ECS_001", "Au moins une installation ECS requise", 10, null));
    return errs;
  }

  data.installations_ecs.forEach((inst, i) => {
    inst.generateurs.forEach((gen, gi) => {
      if (!gen.energie) {
        errs.push(err("ECS_002", `Installation ${i + 1}, générateur ${gi + 1} : énergie obligatoire`, 10, "energie"));
      }
    });
    if (inst.solaire) {
      if (inst.solaire.surface_capteurs <= 0) {
        errs.push(err("ECS_003", `Installation ${i + 1} : surface capteurs solaires > 0`, 10, "surface_capteurs"));
      }
    }
  });

  return errs;
}

/** Étape 11 — Ventilation / Clim / ENR */
export function validerStep11(data: Partial<Step11Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.ventilations || data.ventilations.length === 0) {
    errs.push(err("VEN_001", "Au moins un système de ventilation recommandé", 11, null, "warning"));
  }

  data.climatisations?.forEach((c, i) => {
    if (!c.seer || c.seer <= 0) {
      errs.push(err("CLI_001", `Climatisation ${i + 1} : SEER obligatoire et > 0`, 11, "seer"));
    }
    if (!c.surface_climatisee || c.surface_climatisee <= 0) {
      errs.push(err("CLI_002", `Climatisation ${i + 1} : surface climatisée obligatoire`, 11, "surface_climatisee"));
    }
  });

  data.productions_enr?.forEach((enr, i) => {
    if (!enr.surface || enr.surface <= 0) {
      errs.push(err("ENR_001", `Production ENR ${i + 1} : surface obligatoire`, 11, "surface"));
    }
  });

  return errs;
}

/** Étape 12 — Scénarios de travaux */
export function validerStep12(data: Partial<Step12Data>): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (!data.parcours || data.parcours.length < 2) {
    errs.push(err("TRV_001", "2 parcours de travaux obligatoires (réforme 2021)", 12, null));
    return errs;
  }

  data.parcours.forEach((p) => {
    const classeMin = CLASSE_MINIMALE_PARCOURS[p.numero_parcours];
    if (p.classe_visee && classeMin) {
      const ordre: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };
      if ((ordre[p.classe_visee] || 7) > (ordre[classeMin] || 3)) {
        errs.push(err("TRV_002", `Parcours ${p.numero_parcours} : classe visée ${p.classe_visee} insuffisante (minimum ${classeMin})`, 12, "classe_visee"));
      }
    }
    if (p.etapes.length === 0) {
      errs.push(err("TRV_003", `Parcours ${p.numero_parcours} : au moins une étape de travaux requise`, 12, null));
    }
  });

  return errs;
}

// ════════════════════════════════════════════════════════════
// Validation globale
// ════════════════════════════════════════════════════════════

export interface DonneesDpe {
  step1?: Partial<Step1Data>;
  step2?: Partial<Step2Data>;
  step3?: Partial<Step3Data>;
  step4?: Partial<Step4Data>;
  step5?: Partial<Step5Data>;
  step6?: Partial<Step6Data>;
  step7?: Partial<Step7Data>;
  step8?: Partial<Step8Data>;
  step9?: Partial<Step9Data>;
  step10?: Partial<Step10Data>;
  step11?: Partial<Step11Data>;
  step12?: Partial<Step12Data>;
}

/** Validation locale complète — toutes les étapes */
export function validerDpeComplet(donnees: DonneesDpe): ErreurValidation[] {
  const errs: ErreurValidation[] = [];

  if (donnees.step1) errs.push(...validerStep1(donnees.step1));
  if (donnees.step2) errs.push(...validerStep2(donnees.step2));
  if (donnees.step3) errs.push(...validerStep3(donnees.step3));
  if (donnees.step4) errs.push(...validerStep4(donnees.step4));
  if (donnees.step5) errs.push(...validerStep5(donnees.step5));
  if (donnees.step6) errs.push(...validerStep6(donnees.step6));
  if (donnees.step7) errs.push(...validerStep7(donnees.step7));
  if (donnees.step8) errs.push(...validerStep8(donnees.step8));
  if (donnees.step9) errs.push(...validerStep9(donnees.step9));
  if (donnees.step10) errs.push(...validerStep10(donnees.step10));
  if (donnees.step11) errs.push(...validerStep11(donnees.step11));
  if (donnees.step12) errs.push(...validerStep12(donnees.step12));

  // Cohérence surfaces
  if (donnees.step2?.surface_habitable_lot && donnees.step9?.installations_chauffage) {
    const surfTot = donnees.step9.installations_chauffage.reduce((s, inst) => s + (inst.surface_chauffee || 0), 0);
    if (surfTot > donnees.step2.surface_habitable_lot * 1.1) {
      errs.push(err("COH_SURF", "Somme surfaces chauffées > surface habitable du lot (+10% tolérance)", 9, "surface_chauffee", "warning"));
    }
  }

  return errs;
}

/** Validation d'une seule étape (feedback temps réel) */
export function validerEtape(etape: number, donnees: DonneesDpe): ErreurValidation[] {
  const validators: Record<number, () => ErreurValidation[]> = {
    1: () => donnees.step1 ? validerStep1(donnees.step1) : [],
    2: () => donnees.step2 ? validerStep2(donnees.step2) : [],
    3: () => donnees.step3 ? validerStep3(donnees.step3) : [],
    4: () => donnees.step4 ? validerStep4(donnees.step4) : [],
    5: () => donnees.step5 ? validerStep5(donnees.step5) : [],
    6: () => donnees.step6 ? validerStep6(donnees.step6) : [],
    7: () => donnees.step7 ? validerStep7(donnees.step7) : [],
    8: () => donnees.step8 ? validerStep8(donnees.step8) : [],
    9: () => donnees.step9 ? validerStep9(donnees.step9) : [],
    10: () => donnees.step10 ? validerStep10(donnees.step10) : [],
    11: () => donnees.step11 ? validerStep11(donnees.step11) : [],
    12: () => donnees.step12 ? validerStep12(donnees.step12) : [],
  };

  return (validators[etape] || (() => []))();
}

/** Compte les bloquants et warnings */
export function compterErreurs(errs: ErreurValidation[]): { bloquants: number; warnings: number } {
  return {
    bloquants: errs.filter(e => e.severite === "bloquant").length,
    warnings: errs.filter(e => e.severite === "warning").length,
  };
}
