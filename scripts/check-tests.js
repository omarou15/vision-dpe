#!/usr/bin/env node
/**
 * Script de vérification de la qualité des tests
 * MIRROR - Contrôle qualité avant PR
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COVERAGE_THRESHOLD = 90;
const MIN_FIXTURES = 50;

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}: ${filePath}`, color);
  return exists;
}

function countFilesInDir(dirPath, extension) {
  if (!fs.existsSync(dirPath)) return 0;
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith(extension))
    .length;
}

function main() {
  log('\n🔍 Vérification de la qualité des tests - Vision DPE\n', 'blue');
  
  let allGood = true;

  // 1. Vérifier les fichiers de configuration
  log('📋 Configuration:', 'blue');
  allGood &= checkFileExists('jest.config.js', 'Configuration Jest');
  allGood &= checkFileExists('src/__tests__/setup.ts', 'Setup tests');
  allGood &= checkFileExists('.github/workflows/test.yml', 'Workflow CI');

  // 2. Vérifier les services testés
  log('\n🧪 Services testés:', 'blue');
  allGood &= checkFileExists('src/__tests__/unit/AuthService.test.ts', 'Tests AuthService');
  allGood &= checkFileExists('src/__tests__/unit/ValidationService.test.ts', 'Tests ValidationService');
  allGood &= checkFileExists('src/__tests__/unit/XMLGeneratorService.test.ts', 'Tests XMLGeneratorService');

  // 3. Vérifier les fixtures
  log('\n📦 Fixtures XML:', 'blue');
  const fixturesDir = 'src/__tests__/fixtures';
  const xmlCount = countFilesInDir(fixturesDir, '.xml');
  const fixturesOk = xmlCount >= 5; // Minimum 5 pour la phase 0.5
  log(`${fixturesOk ? '✅' : '❌'} Fichiers XML: ${xmlCount}/50 (minimum 5 pour Phase 0.5)`, fixturesOk ? 'green' : 'yellow');

  // 4. Vérifier les tests d'intégration
  log('\n🔗 Tests d\'intégration:', 'blue');
  allGood &= checkFileExists('src/__tests__/integration/Services.integration.test.ts', 'Tests intégration');

  // 5. Vérifier le rapport de couverture
  log('\n📊 Rapport de couverture:', 'blue');
  const coverageExists = fs.existsSync('coverage/lcov-report/index.html');
  if (coverageExists) {
    log('✅ Rapport de couverture généré', 'green');
    log('   → Ouvrir coverage/lcov-report/index.html pour voir les détails', 'yellow');
  } else {
    log('⚠️  Rapport de couverture non généré', 'yellow');
    log('   → Lancer: npm run test:coverage', 'yellow');
  }

  // 6. Résumé
  log('\n📈 Résumé:', 'blue');
  if (allGood) {
    log('✅ Tous les fichiers requis sont présents!', 'green');
    log('\n🚀 Prêt pour la Phase 1!', 'green');
  } else {
    log('❌ Certains fichiers sont manquants', 'red');
    process.exit(1);
  }

  // 7. Rappels
  log('\n💡 Prochaines étapes:', 'blue');
  log('   1. Compléter les mocks Supabase pour tests offline', 'yellow');
  log('   2. Ajouter 45 fixtures XML supplémentaires', 'yellow');
  log('   3. Atteindre 90% de couverture sur tous les services', 'yellow');
  log('   4. Intégrer Detox pour tests E2E', 'yellow');

  log('');
}

main();
