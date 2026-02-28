/**
 * EchantillonService — Règle d'échantillonnage copropriété
 *
 * Source : Arrêté du 31 mars 2021, méthode 3CL-DPE 2021, section 17.1.1
 * Identique pour DPE collectif et audit copropriété.
 */

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export type TypeLogementCopro = "T1" | "T2" | "T3" | "T4" | "T5" | "T6+";
export type Orientation = "nord" | "sud" | "est" | "ouest";
export type TypePlancher = "combles_perdus" | "combles_amenages" | "toiture_terrasse" | "rdc_terre_plein" | "rdc_vide_sanitaire" | "rdc_sous_sol";
export type Etage = "rdc" | "courant" | "dernier";

export interface LogementEchantillon {
  id: string;
  type_logement: TypeLogementCopro;
  etage: Etage;
  orientations: Orientation[];
  planchers: TypePlancher[];
  surface: number;
  description: string;
}

export interface CritereEchantillonnage {
  code: string;
  description: string;
  satisfait: boolean;
  detail: string;
}

export interface ResultatEchantillonnage {
  nb_logements: number;
  minimum_requis: number;
  criteres: CritereEchantillonnage[];
  tous_satisfaits: boolean;
  /** Pastille : blanc | jaune | rouge | vert */
  pastille: "blanc" | "jaune" | "rouge" | "vert";
}

// ════════════════════════════════════════════════════════════
// Seuils quantitatifs réglementaires
// ════════════════════════════════════════════════════════════

/**
 * Calcule le nombre minimum de logements à échantillonner.
 * ≤30 : 3 minimum
 * 31-100 : >10% du total
 * >100 : 10 minimum + >5% du total
 */
export function getMinimumEchantillon(totalLogements: number): number {
  if (totalLogements <= 30) return 3;
  if (totalLogements <= 100) return Math.ceil(totalLogements * 0.1) + 1; // >10% = au moins ceil+1
  return Math.max(10, Math.ceil(totalLogements * 0.05) + 1); // 10 min + >5%
}

// ════════════════════════════════════════════════════════════
// Vérification des critères qualitatifs
// ════════════════════════════════════════════════════════════

export function verifierEchantillonnage(
  logements: LogementEchantillon[],
  totalLogements: number,
  facadesImmeuble: Orientation[],
  planchersImmeuble: TypePlancher[],
  typesPresents: TypeLogementCopro[],
): ResultatEchantillonnage {
  const criteres: CritereEchantillonnage[] = [];

  // 1. Seuil quantitatif
  const minReqius = getMinimumEchantillon(totalLogements);
  const seuil = logements.length >= minReqius;
  criteres.push({
    code: "QTT_001",
    description: "Seuil quantitatif",
    satisfait: seuil,
    detail: seuil
      ? `${logements.length} logements ≥ ${minReqius} requis`
      : `${logements.length} logements < ${minReqius} requis`,
  });

  // 2. Au moins 1 logement RDC
  const hasRdc = logements.some((l) => l.etage === "rdc");
  criteres.push({
    code: "QUA_001",
    description: "Au moins 1 logement RDC",
    satisfait: hasRdc,
    detail: hasRdc ? "RDC représenté" : "Aucun logement RDC dans l'échantillon",
  });

  // 3. Au moins 1 logement en étage courant
  const hasCourant = logements.some((l) => l.etage === "courant");
  criteres.push({
    code: "QUA_002",
    description: "Au moins 1 logement en étage courant",
    satisfait: hasCourant,
    detail: hasCourant ? "Étage courant représenté" : "Aucun logement en étage courant",
  });

  // 4. Couverture planchers hauts
  const planchersCouvertsEch = new Set<TypePlancher>();
  logements.forEach((l) => l.planchers.forEach((p) => planchersCouvertsEch.add(p)));
  const planchersHauts = planchersImmeuble.filter((p) => ["combles_perdus", "combles_amenages", "toiture_terrasse"].includes(p));
  const planchersManquants = planchersHauts.filter((p) => !planchersCouvertsEch.has(p));
  const planchersOk = planchersManquants.length === 0;
  criteres.push({
    code: "QUA_003",
    description: "Couverture planchers hauts",
    satisfait: planchersOk,
    detail: planchersOk ? "Tous types de planchers hauts couverts" : `Manquant : ${planchersManquants.join(", ")}`,
  });

  // 5. Couverture orientations
  const orientationsCouvertes = new Set<Orientation>();
  logements.forEach((l) => l.orientations.forEach((o) => orientationsCouvertes.add(o)));
  const orientationsManquantes = facadesImmeuble.filter((o) => !orientationsCouvertes.has(o));
  const orientationsOk = orientationsManquantes.length === 0;
  criteres.push({
    code: "QUA_004",
    description: "Couverture orientations façades",
    satisfait: orientationsOk,
    detail: orientationsOk ? "Toutes orientations couvertes" : `Manquant : ${orientationsManquantes.join(", ")}`,
  });

  // 6. Couverture types de logements
  const typesCouvertsEch = new Set<TypeLogementCopro>();
  logements.forEach((l) => typesCouvertsEch.add(l.type_logement));
  const typesManquants = typesPresents.filter((t) => !typesCouvertsEch.has(t));
  const typesOk = typesManquants.length === 0;
  criteres.push({
    code: "QUA_005",
    description: "Couverture types de logements",
    satisfait: typesOk,
    detail: typesOk ? "Tous types représentés" : `Manquant : ${typesManquants.join(", ")}`,
  });

  // Pastille
  const tousOk = criteres.every((c) => c.satisfait);
  const aucunOuvert = logements.length === 0;
  let pastille: "blanc" | "jaune" | "rouge" | "vert";

  if (aucunOuvert) {
    pastille = "blanc";
  } else if (!seuil) {
    pastille = "rouge";
  } else if (tousOk) {
    pastille = "vert";
  } else {
    pastille = "jaune";
  }

  return {
    nb_logements: logements.length,
    minimum_requis: minReqius,
    criteres,
    tous_satisfaits: tousOk,
    pastille,
  };
}
