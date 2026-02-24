/**
 * Validation robuste des types TypeScript contre XML ADEME réel
 * Script basé sur le briefing informaticien
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// Configuration du parser
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseNumber: true,
  trimValues: true,
};

const parser = new XMLParser(parserOptions);

function validateXMLStructure(xmlPath) {
  console.log(`\n🔍 Validation de: ${path.basename(xmlPath)}\n`);
  
  try {
    // Lire et parser le XML
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const parsed = parser.parse(xmlContent);
    const dpe = parsed.dpe;
    
    if (!dpe) {
      console.error('❌ ERREUR CRITIQUE: Racine <dpe> non trouvée');
      return { valid: false, errors: ['Racine dpe manquante'] };
    }
    
    console.log(`✓ XML parsé avec succès`);
    console.log(`  Version DPE: ${dpe['@_version'] || dpe.version || 'non spécifiée'}`);
    
    // Vérifications critiques
    const checks = [];
    
    // 1. Structure racine
    checks.push({
      name: 'numero_dpe (string)',
      result: typeof dpe.numero_dpe === 'string',
      value: dpe.numero_dpe
    });
    
    checks.push({
      name: 'enum_version_id (nombre)',
      result: typeof dpe.enum_version_id === 'number' || typeof dpe.enum_version_id === 'string',
      value: dpe.enum_version_id
    });
    
    checks.push({
      name: 'enum_modele_dpe_id (nombre)',
      result: typeof dpe.enum_modele_dpe_id === 'number',
      value: dpe.enum_modele_dpe_id
    });
    
    // 2. Section administratif
    checks.push({
      name: 'administratif (objet)',
      result: dpe.administratif !== undefined && typeof dpe.administratif === 'object',
      value: typeof dpe.administratif
    });
    
    if (dpe.administratif) {
      checks.push({
        name: 'administratif.date_visite_diagnostiqueur (string)',
        result: typeof dpe.administratif.date_visite_diagnostiqueur === 'string',
        value: dpe.administratif.date_visite_diagnostiqueur
      });
      
      checks.push({
        name: 'administratif.diagnostiqueur (objet)',
        result: typeof dpe.administratif.diagnostiqueur === 'object',
        value: typeof dpe.administratif.diagnostiqueur
      });
      
      checks.push({
        name: 'administratif.geolocalisation (objet)',
        result: typeof dpe.administratif.geolocalisation === 'object',
        value: typeof dpe.administratif.geolocalisation
      });
    }
    
    // 3. Section logement
    checks.push({
      name: 'logement (objet)',
      result: dpe.logement !== undefined && typeof dpe.logement === 'object',
      value: typeof dpe.logement
    });
    
    if (dpe.logement) {
      // Caractéristiques générales
      checks.push({
        name: 'logement.caracteristique_generale (objet)',
        result: typeof dpe.logement.caracteristique_generale === 'object',
        value: typeof dpe.logement.caracteristique_generale
      });
      
      if (dpe.logement.caracteristique_generale) {
        checks.push({
          name: 'caracteristique_generale.annee_construction (nombre)',
          result: typeof dpe.logement.caracteristique_generale.annee_construction === 'number',
          value: dpe.logement.caracteristique_generale.annee_construction
        });
        
        checks.push({
          name: 'caracteristique_generale.enum_periode_construction_id (nombre)',
          result: typeof dpe.logement.caracteristique_generale.enum_periode_construction_id === 'number',
          value: dpe.logement.caracteristique_generale.enum_periode_construction_id
        });
        
        checks.push({
          name: 'caracteristique_generale.surface_habitable_logement (nombre)',
          result: typeof dpe.logement.caracteristique_generale.surface_habitable_logement === 'number',
          value: dpe.logement.caracteristique_generale.surface_habitable_logement
        });
        
        checks.push({
          name: 'caracteristique_generale.enum_methode_application_dpe_log_id (nombre)',
          result: typeof dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id === 'number',
          value: dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id
        });
      }
      
      // Météo
      checks.push({
        name: 'logement.meteo (objet)',
        result: typeof dpe.logement.meteo === 'object',
        value: typeof dpe.logement.meteo
      });
      
      if (dpe.logement.meteo) {
        checks.push({
          name: 'meteo.enum_zone_climatique_id (nombre)',
          result: typeof dpe.logement.meteo.enum_zone_climatique_id === 'number',
          value: dpe.logement.meteo.enum_zone_climatique_id
        });
        
        checks.push({
          name: 'meteo.enum_classe_altitude_id (nombre)',
          result: typeof dpe.logement.meteo.enum_classe_altitude_id === 'number',
          value: dpe.logement.meteo.enum_classe_altitude_id
        });
      }
      
      // Enveloppe
      checks.push({
        name: 'logement.enveloppe (objet)',
        result: typeof dpe.logement.enveloppe === 'object',
        value: typeof dpe.logement.enveloppe
      });
      
      if (dpe.logement.enveloppe) {
        // Murs
        const murCollection = dpe.logement.enveloppe.mur_collection;
        checks.push({
          name: 'enveloppe.mur_collection (objet/array)',
          result: murCollection !== undefined,
          value: typeof murCollection
        });
        
        if (murCollection) {
          const murs = Array.isArray(murCollection.mur) ? murCollection.mur : [murCollection.mur];
          checks.push({
            name: `enveloppe.mur_collection.mur (${murs.length} murs)`,
            result: murs.length > 0,
            value: murs.length
          });
        }
        
        // Baies vitrées
        const baieCollection = dpe.logement.enveloppe.baie_vitree_collection;
        checks.push({
          name: 'enveloppe.baie_vitree_collection (objet/array)',
          result: baieCollection !== undefined,
          value: typeof baieCollection
        });
        
        // Planchers bas
        const plancherBasCollection = dpe.logement.enveloppe.plancher_bas_collection;
        checks.push({
          name: 'enveloppe.plancher_bas_collection (objet/array)',
          result: plancherBasCollection !== undefined,
          value: typeof plancherBasCollection
        });
        
        // Planchers hauts
        const plancherHautCollection = dpe.logement.enveloppe.plancher_haut_collection;
        checks.push({
          name: 'enveloppe.plancher_haut_collection (objet/array)',
          result: plancherHautCollection !== undefined,
          value: typeof plancherHautCollection
        });
      }
      
      // Installations
      checks.push({
        name: 'logement.installation_chauffage_collection (objet/array)',
        result: dpe.logement.installation_chauffage_collection !== undefined,
        value: typeof dpe.logement.installation_chauffage_collection
      });
      
      checks.push({
        name: 'logement.installation_ecs_collection (objet/array)',
        result: dpe.logement.installation_ecs_collection !== undefined,
        value: typeof dpe.logement.installation_ecs_collection
      });
      
      checks.push({
        name: 'logement.ventilation (objet)',
        result: typeof dpe.logement.ventilation === 'object',
        value: typeof dpe.logement.ventilation
      });
    }
    
    // Afficher les résultats
    console.log('\n' + '='.repeat(70));
    console.log('RÉSULTATS DES VÉRIFICATIONS');
    console.log('='.repeat(70));
    
    let passed = 0;
    let failed = 0;
    
    checks.forEach(check => {
      if (check.result) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(`❌ ${check.name}`);
        console.log(`   Valeur trouvée: ${JSON.stringify(check.value).substring(0, 100)}`);
        failed++;
      }
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`RÉSUMÉ: ${passed} OK / ${failed} ÉCHECS`);
    console.log(`Taux de réussite: ${((passed / checks.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(70));
    
    // Afficher la structure complète pour analyse
    console.log('\n📋 STRUCTURE COMPLÈTE DU XML:');
    console.log('Clés racine:', Object.keys(dpe).slice(0, 10));
    if (dpe.logement) {
      console.log('Clés logement:', Object.keys(dpe.logement).slice(0, 15));
      if (dpe.logement.enveloppe) {
        console.log('Clés enveloppe:', Object.keys(dpe.logement.enveloppe));
      }
    }
    
    return {
      valid: failed === 0,
      passed,
      failed,
      total: checks.length,
      dpe
    };
    
  } catch (error) {
    console.error(`❌ ERREUR: ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
}

// Fonction principale
async function main() {
  console.log('🔍 VALIDATION ROBUSTE DES TYPES TYPESCRIPT');
  console.log('Comparaison avec XML ADEME réel\n');
  
  // Tester avec plusieurs fichiers
  const testFiles = [
    'docs/ademe-official/exemples_xml/exemple_appartement.xml',
    'docs/exemples_metier/cas_test_maison_1_valid_thermodynamique_multi_generateur.xml',
    'docs/exemples_metier/cas_test_immeuble_1_valid.xml',
  ];
  
  for (const file of testFiles) {
    const xmlPath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(xmlPath)) {
      const result = validateXMLStructure(xmlPath);
      
      if (result.valid) {
        console.log('\n✅ VALIDATION RÉUSSIE pour ce fichier');
      } else {
        console.log('\n❌ VALIDATION ÉCHOUÉE - Des champs sont manquants ou incorrects');
      }
    } else {
      console.log(`\n⚠️ Fichier non trouvé: ${file}`);
    }
    
    console.log('\n' + '='.repeat(70));
  }
}

main();
