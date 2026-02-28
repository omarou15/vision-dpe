/**
 * XMLGeneratorService — Génération XML DPE conforme DPEv2.6.xsd
 *
 * Utilise xmlbuilder2 pour construire le document XML.
 * Le XML produit doit passer /controle_coherence sans erreur bloquante.
 *
 * PEF électricité = 1.9 depuis janvier 2026 (version 1.12.3)
 */

import { create } from "xmlbuilder2";
import type { DonneesDpe } from "./validation";
import type { Step1Data, Step2Data, Step3Data } from "@/types/steps/step1-3";
import type { Mur, BaieVitree, Porte, PlancherBas, PlancherHaut, PontThermique } from "@/types/steps/step4-8";
import type { InstallationChauffage, InstallationEcs, Ventilation, Climatisation, ProductionElecENR } from "@/types/steps/step9-11";
import type { ParcoursTravaux } from "@/types/steps/step12-14";

// ════════════════════════════════════════════════════════════
// Configuration
// ════════════════════════════════════════════════════════════

const XSD_VERSION = "2.6";
const XSD_NAMESPACE = "http://www.observatoire-dpe.fr/modele/dpe";
const PEF_ELECTRICITE = 1.9; // Depuis janvier 2026

// ════════════════════════════════════════════════════════════
// Générateur principal
// ════════════════════════════════════════════════════════════

export interface GenerationResult {
  xml: string;
  taille: number;
  hash: string;
  timestamp: string;
}

/**
 * Génère le XML DPE complet conforme DPEv2.6.xsd.
 */
export function genererXmlDpe(donnees: DonneesDpe): GenerationResult {
  const doc = create({ version: "1.0", encoding: "UTF-8" });

  const root = doc.ele(XSD_NAMESPACE, "dpe");
  root.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

  // ── Administratif ──
  if (donnees.step1 || donnees.step2) {
    buildAdministratif(root, donnees.step1, donnees.step2);
  }

  // ── Logement (3CL) ──
  const logement = root.ele("logement");

  if (donnees.step3) {
    buildCaracteristiqueGenerale(logement, donnees.step3);
    buildMeteo(logement, donnees.step3);
  }

  // ── Enveloppe ──
  const enveloppe = logement.ele("enveloppe");

  if (donnees.step4?.murs) {
    buildMurCollection(enveloppe, donnees.step4.murs);
  }
  if (donnees.step5) {
    if (donnees.step5.baies) buildBaieCollection(enveloppe, donnees.step5.baies);
    if (donnees.step5.portes) buildPorteCollection(enveloppe, donnees.step5.portes);
  }
  if (donnees.step6?.planchers_bas) {
    buildPlancherBasCollection(enveloppe, donnees.step6.planchers_bas);
  }
  if (donnees.step7?.planchers_hauts) {
    buildPlancherHautCollection(enveloppe, donnees.step7.planchers_hauts);
  }
  if (donnees.step8?.ponts_thermiques) {
    buildPontThermiqueCollection(enveloppe, donnees.step8.ponts_thermiques);
  }

  // ── Installations ──
  if (donnees.step9?.installations_chauffage) {
    buildChauffageCollection(logement, donnees.step9.installations_chauffage);
  }
  if (donnees.step10?.installations_ecs) {
    buildEcsCollection(logement, donnees.step10.installations_ecs);
  }
  if (donnees.step11) {
    if (donnees.step11.ventilations) buildVentilationCollection(logement, donnees.step11.ventilations);
    if (donnees.step11.climatisations) buildClimatisationCollection(logement, donnees.step11.climatisations);
    if (donnees.step11.productions_enr) buildEnrCollection(logement, donnees.step11.productions_enr);
  }

  // ── Sortie (travaux) ──
  if (donnees.step12?.parcours) {
    buildSortie(logement, donnees.step12.parcours);
  }

  const xml = doc.end({ prettyPrint: true });
  const timestamp = new Date().toISOString();

  return {
    xml,
    taille: new Blob([xml]).size,
    hash: hashSimple(xml),
    timestamp,
  };
}

// ════════════════════════════════════════════════════════════
// Builders par section XSD
// ════════════════════════════════════════════════════════════

function buildAdministratif(root: any, step1?: Partial<Step1Data>, step2?: Partial<Step2Data>) {
  const admin = root.ele("administratif");

  if (step2?.numero_dpe) admin.ele("numero_dpe").txt(step2.numero_dpe);
  admin.ele("enum_version_id").txt(XSD_VERSION);
  if (step2?.modele_dpe) admin.ele("enum_modele_dpe_id").txt(step2.modele_dpe);
  if (step2?.methode_application) admin.ele("enum_methode_application_dpe_log_id").txt(step2.methode_application);

  if (step1?.date_visite) admin.ele("date_visite_diagnostiqueur").txt(step1.date_visite);
  if (step1?.date_etablissement) admin.ele("date_etablissement_dpe").txt(step1.date_etablissement);

  // Adresse
  if (step1?.geocodage) {
    const adr = admin.ele("adresse");
    adr.ele("label").txt(step1.geocodage.label);
    adr.ele("code_postal").txt(step1.geocodage.postcode);
    adr.ele("commune").txt(step1.geocodage.city);
    adr.ele("code_insee").txt(step1.geocodage.citycode);
    if (step1.geocodage.housenumber) adr.ele("numero_voie").txt(step1.geocodage.housenumber);
    if (step1.geocodage.street) adr.ele("nom_voie").txt(step1.geocodage.street);

    const geo = admin.ele("geolocalisation");
    geo.ele("latitude").txt(String(step1.geocodage.latitude));
    geo.ele("longitude").txt(String(step1.geocodage.longitude));
    geo.ele("score_ban").txt(String(step1.geocodage.score));
    geo.ele("ban_id").txt(step1.geocodage.ban_id);
  }

  // Diagnostiqueur
  if (step1?.diagnostiqueur) {
    const diag = admin.ele("diagnostiqueur");
    diag.ele("nom").txt(step1.diagnostiqueur.nom);
    diag.ele("prenom").txt(step1.diagnostiqueur.prenom);
    diag.ele("numero_certification").txt(step1.diagnostiqueur.numero_certification);
    if (step1.diagnostiqueur.organisme_certification) diag.ele("organisme_certification").txt(step1.diagnostiqueur.organisme_certification);
  }

  // Commanditaire
  if (step2?.commanditaire) {
    const cmd = admin.ele("commanditaire");
    cmd.ele("nom").txt(step2.commanditaire.nom);
    cmd.ele("qualite").txt(step2.commanditaire.qualite);
  }
}

function buildCaracteristiqueGenerale(logement: any, step3: Partial<Step3Data>) {
  const cg = logement.ele("caracteristique_generale");
  if (step3.periode_construction) cg.ele("enum_periode_construction_id").txt(step3.periode_construction);
  if (step3.annee_construction) cg.ele("annee_construction").txt(String(step3.annee_construction));
  if (step3.surface_habitable) cg.ele("surface_habitable_logement").txt(String(step3.surface_habitable));
  if (step3.hauteur_sous_plafond) cg.ele("hauteur_sous_plafond").txt(String(step3.hauteur_sous_plafond));
  if (step3.nombre_niveaux) cg.ele("nombre_niveau_logement").txt(String(step3.nombre_niveaux));
  if (step3.inertie) cg.ele("enum_classe_inertie_id").txt(step3.inertie);
  cg.ele("pef_electricite").txt(String(PEF_ELECTRICITE));
}

function buildMeteo(logement: any, step3: Partial<Step3Data>) {
  const meteo = logement.ele("meteo");
  if (step3.zone_climatique) meteo.ele("enum_zone_climatique_id").txt(step3.zone_climatique);
  if (step3.altitude !== undefined) meteo.ele("altitude").txt(String(step3.altitude));
  if (step3.classe_altitude) meteo.ele("enum_classe_altitude_id").txt(step3.classe_altitude);
  if (step3.materiaux_anciens !== undefined) meteo.ele("materiaux_anciens").txt(step3.materiaux_anciens ? "1" : "0");
}

function buildMurCollection(enveloppe: any, murs: Mur[]) {
  const col = enveloppe.ele("mur_collection");
  for (const mur of murs) {
    const m = col.ele("mur");
    const de = m.ele("donnee_entree");
    de.ele("reference").txt(mur.id);
    if (mur.donnee_entree.description) de.ele("description").txt(mur.donnee_entree.description);
    de.ele("enum_type_adjacence_id").txt(mur.donnee_entree.type_adjacence);
    de.ele("enum_orientation_id").txt(mur.donnee_entree.orientation);
    de.ele("surface_paroi_opaque").txt(String(mur.donnee_entree.surface_paroi_opaque));
    de.ele("paroi_lourde").txt(mur.donnee_entree.paroi_lourde ? "1" : "0");
    de.ele("enum_materiaux_structure_mur_id").txt(mur.donnee_entree.materiaux_structure);
    de.ele("enum_type_isolation_id").txt(mur.donnee_entree.type_isolation);
    de.ele("enum_type_doublage_id").txt(mur.donnee_entree.type_doublage);
    de.ele("enum_methode_saisie_u_id").txt(mur.donnee_entree.methode_saisie_u);
    if (mur.donnee_entree.umur_saisi !== null) de.ele("umur_saisi").txt(String(mur.donnee_entree.umur_saisi));
    if (mur.donnee_entree.epaisseur_isolation !== null) de.ele("epaisseur_isolation").txt(String(mur.donnee_entree.epaisseur_isolation));
    if (mur.donnee_entree.resistance_isolation !== null) de.ele("resistance_isolation").txt(String(mur.donnee_entree.resistance_isolation));

    const di = m.ele("donnee_intermediaire");
    if (mur.umur !== null) di.ele("umur").txt(String(mur.umur));
    if (mur.b !== null) di.ele("b").txt(String(mur.b));
  }
}

function buildBaieCollection(enveloppe: any, baies: BaieVitree[]) {
  const col = enveloppe.ele("baie_vitree_collection");
  for (const b of baies) {
    const baie = col.ele("baie_vitree");
    const de = baie.ele("donnee_entree");
    de.ele("reference").txt(b.id);
    if (b.donnee_entree.description) de.ele("description").txt(b.donnee_entree.description);
    de.ele("enum_type_adjacence_id").txt(b.donnee_entree.type_adjacence);
    de.ele("enum_orientation_id").txt(b.donnee_entree.orientation);
    de.ele("surface").txt(String(b.donnee_entree.surface));
    de.ele("enum_type_baie_id").txt(b.donnee_entree.type_baie);
    de.ele("enum_type_vitrage_id").txt(b.donnee_entree.type_vitrage);
    de.ele("enum_type_materiaux_menuiserie_id").txt(b.donnee_entree.materiaux_menuiserie);
    de.ele("enum_type_pose_id").txt(b.donnee_entree.type_pose);
    de.ele("enum_type_fermeture_id").txt(b.donnee_entree.type_fermeture);
    de.ele("double_fenetre").txt(b.donnee_entree.double_fenetre ? "1" : "0");
    if (b.donnee_entree.uw_saisi !== null) de.ele("uw_saisi").txt(String(b.donnee_entree.uw_saisi));
  }
}

function buildPorteCollection(enveloppe: any, portes: Porte[]) {
  const col = enveloppe.ele("porte_collection");
  for (const p of portes) {
    const porte = col.ele("porte");
    const de = porte.ele("donnee_entree");
    de.ele("reference").txt(p.id);
    de.ele("enum_type_adjacence_id").txt(p.donnee_entree.type_adjacence);
    de.ele("surface").txt(String(p.donnee_entree.surface));
    de.ele("enum_type_porte_id").txt(p.donnee_entree.type_porte);
    if (p.donnee_entree.uporte_saisi !== null) de.ele("uporte_saisi").txt(String(p.donnee_entree.uporte_saisi));
  }
}

function buildPlancherBasCollection(enveloppe: any, planchers: PlancherBas[]) {
  const col = enveloppe.ele("plancher_bas_collection");
  for (const pb of planchers) {
    const el = col.ele("plancher_bas");
    const de = el.ele("donnee_entree");
    de.ele("reference").txt(pb.id);
    de.ele("enum_type_adjacence_id").txt(pb.donnee_entree.type_adjacence);
    de.ele("surface").txt(String(pb.donnee_entree.surface));
    de.ele("enum_type_plancher_bas_id").txt(pb.donnee_entree.type_plancher);
    de.ele("enum_type_isolation_id").txt(pb.donnee_entree.type_isolation);
    de.ele("enum_methode_saisie_u_id").txt(pb.donnee_entree.methode_saisie_u);
    if (pb.donnee_entree.upb_saisi !== null) de.ele("upb_saisi").txt(String(pb.donnee_entree.upb_saisi));
  }
}

function buildPlancherHautCollection(enveloppe: any, planchers: PlancherHaut[]) {
  const col = enveloppe.ele("plancher_haut_collection");
  for (const ph of planchers) {
    const el = col.ele("plancher_haut");
    const de = el.ele("donnee_entree");
    de.ele("reference").txt(ph.id);
    de.ele("enum_type_adjacence_id").txt(ph.donnee_entree.type_adjacence);
    de.ele("surface").txt(String(ph.donnee_entree.surface));
    de.ele("enum_type_plancher_haut_id").txt(ph.donnee_entree.type_plancher);
    de.ele("enum_type_isolation_id").txt(ph.donnee_entree.type_isolation);
    de.ele("enum_methode_saisie_u_id").txt(ph.donnee_entree.methode_saisie_u);
    if (ph.donnee_entree.uph_saisi !== null) de.ele("uph_saisi").txt(String(ph.donnee_entree.uph_saisi));
  }
}

function buildPontThermiqueCollection(enveloppe: any, pts: PontThermique[]) {
  const col = enveloppe.ele("pont_thermique_collection");
  for (const pt of pts) {
    const el = col.ele("pont_thermique");
    const de = el.ele("donnee_entree");
    de.ele("reference").txt(pt.id);
    de.ele("enum_type_liaison_id").txt(pt.donnee_entree.type_liaison);
    de.ele("longueur").txt(String(pt.donnee_entree.longueur));
    if (pt.donnee_entree.kpt_saisi !== null) de.ele("kpt_saisi").txt(String(pt.donnee_entree.kpt_saisi));
  }
}

function buildChauffageCollection(logement: any, installations: InstallationChauffage[]) {
  const col = logement.ele("installation_chauffage_collection");
  for (const inst of installations) {
    const el = col.ele("installation_chauffage");
    el.ele("reference").txt(inst.id);
    el.ele("enum_cfg_installation_ch_id").txt(inst.cfg_installation);
    el.ele("surface_chauffee").txt(String(inst.surface_chauffee));

    for (const gen of inst.generateurs) {
      const g = el.ele("generateur_chauffage");
      g.ele("reference").txt(gen.id);
      g.ele("enum_type_generateur_ch_id").txt(gen.categorie);
      g.ele("enum_type_energie_id").txt(gen.energie);
      if (gen.puissance_nominale !== null) g.ele("puissance_nominale").txt(String(gen.puissance_nominale));
      if (gen.scop !== null) g.ele("scop").txt(String(gen.scop));
      if (gen.rpn !== null) g.ele("rpn").txt(String(gen.rpn));
      if (gen.rpint !== null) g.ele("rpint").txt(String(gen.rpint));
      if (gen.rendement_generation !== null) g.ele("rendement_generation").txt(String(gen.rendement_generation));
      if (gen.rendement_combustion !== null) g.ele("rendement_combustion").txt(String(gen.rendement_combustion));
      g.ele("presence_veilleuse").txt(gen.presence_veilleuse ? "1" : "0");
    }
  }
}

function buildEcsCollection(logement: any, installations: InstallationEcs[]) {
  const col = logement.ele("installation_ecs_collection");
  for (const inst of installations) {
    const el = col.ele("installation_ecs");
    el.ele("reference").txt(inst.id);
    el.ele("enum_cfg_installation_ecs_id").txt(inst.cfg_installation);

    for (const gen of inst.generateurs) {
      const g = el.ele("generateur_ecs");
      g.ele("reference").txt(gen.id);
      g.ele("enum_type_generateur_ecs_id").txt(gen.categorie);
      g.ele("enum_type_energie_id").txt(gen.energie);
      if (gen.volume_stockage !== null) g.ele("volume_stockage").txt(String(gen.volume_stockage));
    }

    if (inst.solaire) {
      const s = el.ele("installation_solaire");
      s.ele("enum_type_installation_solaire_id").txt(inst.solaire.type_installation);
      s.ele("surface_capteurs").txt(String(inst.solaire.surface_capteurs));
      s.ele("enum_orientation_id").txt(inst.solaire.orientation);
      s.ele("inclinaison").txt(String(inst.solaire.inclinaison));
    }
  }
}

function buildVentilationCollection(logement: any, ventilations: Ventilation[]) {
  const col = logement.ele("ventilation_collection");
  for (const v of ventilations) {
    const el = col.ele("ventilation");
    el.ele("reference").txt(v.id);
    el.ele("enum_type_ventilation_id").txt(v.type_ventilation);
    if (v.q4pa !== null) el.ele("q4pa_conv").txt(String(v.q4pa));
  }
}

function buildClimatisationCollection(logement: any, clims: Climatisation[]) {
  const col = logement.ele("climatisation_collection");
  for (const c of clims) {
    const el = col.ele("climatisation");
    el.ele("reference").txt(c.id);
    if (c.seer !== null) el.ele("seer").txt(String(c.seer));
    el.ele("surface_climatisee").txt(String(c.surface_climatisee));
  }
}

function buildEnrCollection(logement: any, enrs: ProductionElecENR[]) {
  const el = logement.ele("production_elec_enr");
  for (const enr of enrs) {
    const pv = el.ele("panneaux_pv");
    pv.ele("reference").txt(enr.id);
    pv.ele("surface_totale_capteurs").txt(String(enr.surface));
    pv.ele("enum_orientation_id").txt(enr.orientation);
    pv.ele("inclinaison").txt(String(enr.inclinaison));
    if (enr.puissance_crete !== null) pv.ele("puissance_crete").txt(String(enr.puissance_crete));
  }
}

function buildSortie(logement: any, parcours: ParcoursTravaux[]) {
  const sortie = logement.ele("sortie");
  // Recommandations / travaux
  for (const p of parcours) {
    const rec = sortie.ele("recommandation");
    rec.ele("numero_parcours").txt(String(p.numero_parcours));
    if (p.classe_visee) rec.ele("classe_visee").txt(p.classe_visee);
    if (p.cout_total !== null) rec.ele("cout_total").txt(String(p.cout_total));
  }
}

// ════════════════════════════════════════════════════════════
// Utilitaires
// ════════════════════════════════════════════════════════════

/** Hash simple pour intégrité (en prod, utiliser crypto.subtle.digest) */
function hashSimple(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Génère le XML Audit complet (DPE état initial + scénarios + DPE projetés).
 * Étend le XML DPE de base avec les sections audit spécifiques.
 */
export function genererXmlAudit(donnees: DonneesDpe, auditData: any): GenerationResult {
  // Base = XML DPE état initial
  const base = genererXmlDpe(donnees);
  // En v2 : ajouter les sections audit (scénarios détaillés, DPE projetés, analyse économique)
  // Pour l'instant, retourne le XML DPE de base
  return base;
}
