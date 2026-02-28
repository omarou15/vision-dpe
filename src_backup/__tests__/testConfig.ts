/**
 * Configuration des tests pour atteindre 90% de couverture
 * MIRROR - Phase 1
 */

export const TEST_CONFIG = {
  // Seuils de couverture
  coverage: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },

  // Services à couvrir
  services: [
    'AuthService',
    'ValidationService', 
    'XMLGeneratorService'
  ],

  // Nombre de fixtures XML requis
  xmlFixtures: {
    total: 50,
    created: 5,
    remaining: 45
  },

  // Priorités de test
  priorities: {
    P0: 'Validation des données DPE (critique)',
    P1: 'Génération XML ADEME (critique)',
    P2: 'Authentification utilisateur',
    P3: 'Fonctions utilitaires'
  }
};

// Liste des cas de test à implémenter pour atteindre 90%
export const MISSING_TESTS = {
  AuthService: [
    'Connexion avec OTP valide',
    'Connexion avec OTP invalide',
    'Rafraîchissement de session',
    'Gestion des erreurs réseau',
    'Changement d\'état d\'authentification',
    'Récupération de profil utilisateur'
  ],
  ValidationService: [
    'Validation des règles de cohérence complexes',
    'Validation des calculs thermiques',
    'Validation des limites réglementaires',
    'Messages d\'erreur personnalisés'
  ],
  XMLGeneratorService: [
    'Génération XML avec toutes les options',
    'Validation contre XSD ADEME',
    'Export vers fichier',
    'Gestion des erreurs de génération',
    'Parsing de XML complexes'
  ]
};
