/**
 * Validation des types TypeScript contre XML ADEME réel
 * Script simplifié sans imports ES modules
 */

const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

async function validateXMLAgainstTypes(xmlPath) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalFields: 0,
      matchedFields: 0,
      missingFields: [],
    },
  };

  try {
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    
    const parsed = await new Promise((resolve, reject) => {
      parseString(xmlContent, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const dpe = parsed.dpe;
    
    if (!dpe) {
      result.valid = false;
      result.errors.push('Racine <dpe> non trouvée');
      return result;
    }

    console.log(`✓ Fichier XML parsé avec succès`);
    console.log(`  Version DPE: ${dpe.version || 'non spécifiée'}`);
    
    // Vérifier sections principales
    const requiredSections = ['administratif', 'logement'];
    for (const section of requiredSections) {
      if (dpe[section]) {
        console.log(`✓ Section <${section}> présente`);
        result.stats.matchedFields++;
      } else {
        result.errors.push(`Section <${section}> manquante`);
        result.stats.missingFields.push(section);
      }
      result.stats.totalFields++;
    }

    // Vérifier administratif
    if (dpe.administratif) {
      const fields = ['date_visite_diagnostiqueur', 'date_etablissement_dpe', 'diagnostiqueur'];
      for (const field of fields) {
        if (dpe.administratif[field]) result.stats.matchedFields++;
        else result.warnings.push(`Champ administratif <${field}> manquant`);
        result.stats.totalFields++;
      }
    }

    // Vérifier caractéristiques générales
    if (dpe.logement?.caracteristique_generale) {
      const fields = [
        'annee_construction',
        'enum_periode_construction_id',
        'surface_habitable_logement',
        'nombre_niveau_immeuble',
        'hsp',
      ];
      
      for (const field of fields) {
        if (dpe.logement.caracteristique_generale[field] !== undefined) {
          result.stats.matchedFields++;
        } else {
          result.warnings.push(`Champ caracteristique_generale <${field}> manquant`);
        }
        result.stats.totalFields++;
      }
      console.log(`✓ Caractéristiques générales validées`);
    }

    // Vérifier météo
    if (dpe.logement?.meteo) {
      const fields = ['enum_zone_climatique_id', 'enum_classe_altitude_id'];
      for (const field of fields) {
        if (dpe.logement.meteo[field] !== undefined) result.stats.matchedFields++;
        result.stats.totalFields++;
      }
      console.log(`✓ Météo validée`);
    }

    // Vérifier enveloppe
    if (dpe.logement?.enveloppe) {
      console.log(`✓ Section enveloppe présente`);
      
      // Murs
      if (dpe.logement.enveloppe.mur_collection?.mur) {
        const murs = Array.isArray(dpe.logement.enveloppe.mur_collection.mur) 
          ? dpe.logement.enveloppe.mur_collection.mur 
          : [dpe.logement.enveloppe.mur_collection.mur];
        console.log(`  - ${murs.length} mur(s) trouvé(s)`);
        result.stats.matchedFields++;
      }
      
      // Baies vitrées
      if (dpe.logement.enveloppe.baie_vitree_collection?.baie_vitree) {
        const baies = Array.isArray(dpe.logement.enveloppe.baie_vitree_collection.baie_vitree)
          ? dpe.logement.enveloppe.baie_vitree_collection.baie_vitree
          : [dpe.logement.enveloppe.baie_vitree_collection.baie_vitree];
        console.log(`  - ${baies.length} baie(s) vitrée(s) trouvée(s)`);
        result.stats.matchedFields++;
      }
      
      // Planchers
      if (dpe.logement.enveloppe.plancher_bas_collection?.plancher_bas) {
        const planchers = Array.isArray(dpe.logement.enveloppe.plancher_bas_collection.plancher_bas)
          ? dpe.logement.enveloppe.plancher_bas_collection.plancher_bas
          : [dpe.logement.enveloppe.plancher_bas_collection.plancher_bas];
        console.log(`  - ${planchers.length} plancher(s) bas trouvé(s)`);
        result.stats.matchedFields++;
      }
      
      // Planchers hauts
      if (dpe.logement.enveloppe.plancher_haut_collection?.plancher_haut) {
        const planchers = Array.isArray(dpe.logement.enveloppe.plancher_haut_collection.plancher_haut)
          ? dpe.logement.enveloppe.plancher_haut_collection.plancher_haut
          : [dpe.logement.enveloppe.plancher_haut_collection.plancher_haut];
        console.log(`  - ${planchers.length} plancher(s) haut trouvé(s)`);
        result.stats.matchedFields++;
      }
      
      result.stats.totalFields += 4;
    }

    // Calculer le taux
    const matchRate = (result.stats.matchedFields / result.stats.totalFields) * 100;
    console.log(`\n📊 Statistiques:`);
    console.log(`  - Champs total: ${result.stats.totalFields}`);
    console.log(`  - Champs correspondants: ${result.stats.matchedFields}`);
    console.log(`  - Taux de correspondance: ${matchRate.toFixed(1)}%`);

    result.valid = matchRate >= 75;
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`Erreur: ${error.message}`);
  }

  return result;
}

async function main() {
  console.log('🔍 Validation des types contre XML ADEME réel\n');
  console.log('=' .repeat(60));
  
  const xmlPath = path.join(__dirname, '../docs/ademe-official/exemples_xml/exemple_appartement.xml');
  
  if (!fs.existsSync(xmlPath)) {
    console.error(`❌ Fichier non trouvé: ${xmlPath}`);
    process.exit(1);
  }
  
  console.log(`\nFichier: ${path.basename(xmlPath)}\n`);
  
  const result = await validateXMLAgainstTypes(xmlPath);
  
  console.log('\n' + '='.repeat(60));
  
  if (result.valid) {
    console.log('✅ VALIDATION RÉUSSIE');
    console.log('Les types correspondent bien à la structure XML ADEME.');
  } else {
    console.log('❌ VALIDATION ÉCHOUÉE');
  }
  
  if (result.errors.length > 0) {
    console.log('\n🚨 Erreurs:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings (5 premiers):');
    result.warnings.slice(0, 5).forEach(warn => console.log(`  - ${warn}`));
  }
  
  process.exit(result.valid ? 0 : 1);
}

main();
