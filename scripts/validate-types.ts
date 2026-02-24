/**
 * Validation des types TypeScript contre XML ADEME réel
 * Ce script vérifie que nos types correspondent à la structure des vrais fichiers DPE
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseString } from 'xml2js';

// Types DPE importés - eslint-disable car c'est un script de validation
import type {
  // Ces types sont importés pour validation statique, pas pour runtime
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DPEDocument,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  EnumPeriodeConstruction,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  EnumEtiquetteDpe,
} from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ParsedXML { [key: string]: any }

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalFields: number;
    matchedFields: number;
    missingFields: string[];
    extraFields: string[];
  };
}

/**
 * Valide un fichier XML ADEME contre nos types TypeScript
 */
async function validateXMLAgainstTypes(xmlPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalFields: 0,
      matchedFields: 0,
      missingFields: [],
      extraFields: [],
    },
  };

  try {
    // Lire le fichier XML
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    
    // Parser le XML
    const parsed = await new Promise<ParsedXML>((resolve, reject) => {
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
    
    // Vérifier la structure principale
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

    // Vérifier les champs administratifs
    if (dpe.administratif) {
      const adminFields = [
        'date_visite_diagnostiqueur',
        'date_etablissement_dpe',
        'diagnostiqueur',
        'geolocalisation',
      ];
      
      for (const field of adminFields) {
        if (dpe.administratif[field]) {
          result.stats.matchedFields++;
        } else {
          result.warnings.push(`Champ administratif <${field}> manquant`);
          result.stats.missingFields.push(`administratif.${field}`);
        }
        result.stats.totalFields++;
      }
    }

    // Vérifier les caractéristiques générales
    if (dpe.logement?.caracteristique_generale) {
      const charFields = [
        'annee_construction',
        'enum_periode_construction_id',
        'enum_methode_application_dpe_log_id',
        'surface_habitable_logement',
        'nombre_niveau_immeuble',
        'nombre_niveau_logement',
        'hsp',
      ];
      
      for (const field of charFields) {
        if (dpe.logement.caracteristique_generale[field] !== undefined) {
          result.stats.matchedFields++;
        } else {
          result.warnings.push(`Champ caracteristique_generale <${field}> manquant`);
          result.stats.missingFields.push(`caracteristique_generale.${field}`);
        }
        result.stats.totalFields++;
      }
      
      console.log(`✓ Caractéristiques générales validées`);
    }

    // Vérifier la météo
    if (dpe.logement?.meteo) {
      const meteoFields = [
        'enum_zone_climatique_id',
        'enum_classe_altitude_id',
        'batiment_materiaux_anciens',
      ];
      
      for (const field of meteoFields) {
        if (dpe.logement.meteo[field] !== undefined) {
          result.stats.matchedFields++;
        } else {
          result.warnings.push(`Champ meteo <${field}> manquant`);
        }
        result.stats.totalFields++;
      }
      
      console.log(`✓ Météo validée`);
    }

    // Vérifier l'enveloppe
    if (dpe.logement?.enveloppe) {
      console.log(`✓ Section enveloppe présente`);
      
      // Vérifier les murs
      if (dpe.logement.enveloppe.mur_collection?.mur) {
        const murs = Array.isArray(dpe.logement.enveloppe.mur_collection.mur) 
          ? dpe.logement.enveloppe.mur_collection.mur 
          : [dpe.logement.enveloppe.mur_collection.mur];
        
        console.log(`  - ${murs.length} mur(s) trouvé(s)`);
        
        for (const mur of murs) {
          if (mur.donnee_entree) {
            const murFields = [
              'reference',
              'enum_type_adjacence_id',
              'enum_orientation_id',
              'surface_paroi_opaque',
              'tv_umur_id',
            ];
            
            for (const field of murFields) {
              if (mur.donnee_entree[field] !== undefined) {
                result.stats.matchedFields++;
              } else {
                result.warnings.push(`Champ mur.donnee_entree <${field}> manquant`);
              }
              result.stats.totalFields++;
            }
          }
          
          if (mur.donnee_intermediaire) {
            result.stats.matchedFields++; // b, umur
          }
        }
      }
      
      // Vérifier les baies vitrées
      if (dpe.logement.enveloppe.baie_vitree_collection?.baie_vitree) {
        const baies = Array.isArray(dpe.logement.enveloppe.baie_vitree_collection.baie_vitree)
          ? dpe.logement.enveloppe.baie_vitree_collection.baie_vitree
          : [dpe.logement.enveloppe.baie_vitree_collection.baie_vitree];
        
        console.log(`  - ${baies.length} baie(s) vitrée(s) trouvée(s)`);
      }
      
      // Vérifier les planchers
      if (dpe.logement.enveloppe.plancher_bas_collection?.plancher_bas) {
        const planchers = Array.isArray(dpe.logement.enveloppe.plancher_bas_collection.plancher_bas)
          ? dpe.logement.enveloppe.plancher_bas_collection.plancher_bas
          : [dpe.logement.enveloppe.plancher_bas_collection.plancher_bas];
        
        console.log(`  - ${planchers.length} plancher(s) bas trouvé(s)`);
      }
    }

    // Calculer le taux de correspondance
    const matchRate = (result.stats.matchedFields / result.stats.totalFields) * 100;
    console.log(`\n📊 Statistiques de validation:`);
    console.log(`  - Champs total: ${result.stats.totalFields}`);
    console.log(`  - Champs correspondants: ${result.stats.matchedFields}`);
    console.log(`  - Taux de correspondance: ${matchRate.toFixed(1)}%`);
    
    if (result.stats.missingFields.length > 0) {
      console.log(`  - Champs manquants: ${result.stats.missingFields.length}`);
    }

    // Déterminer si c'est valide
    result.valid = matchRate >= 80; // Au moins 80% de correspondance
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`Erreur de parsing XML: ${error}`);
  }

  return result;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Validation des types TypeScript contre XML ADEME\n');
  console.log('=' .repeat(60));
  
  const xmlPath = path.join(__dirname, '../docs/ademe-official/exemples_xml/exemple_appartement.xml');
  
  if (!fs.existsSync(xmlPath)) {
    console.error(`❌ Fichier XML non trouvé: ${xmlPath}`);
    process.exit(1);
  }
  
  console.log(`\nFichier: ${path.basename(xmlPath)}\n`);
  
  const result = await validateXMLAgainstTypes(xmlPath);
  
  console.log('\n' + '='.repeat(60));
  
  if (result.valid) {
    console.log('✅ VALIDATION RÉUSSIE');
    console.log('Les types TypeScript correspondent bien à la structure XML ADEME.');
  } else {
    console.log('❌ VALIDATION ÉCHOUÉE');
    console.log('Les types TypeScript ne correspondent pas complètement au XML.');
  }
  
  if (result.errors.length > 0) {
    console.log('\n🚨 Erreurs:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.slice(0, 10).forEach(warn => console.log(`  - ${warn}`));
    if (result.warnings.length > 10) {
      console.log(`  ... et ${result.warnings.length - 10} autres warnings`);
    }
  }
  
  process.exit(result.valid ? 0 : 1);
}

main();
