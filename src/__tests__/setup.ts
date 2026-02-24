/**
 * Setup pour les tests Jest
 */

// Configuration globale pour les tests

// Mock de console pour réduire le bruit dans les tests
global.console = {
  ...console,
  // Décommenter pour voir les logs pendant les tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Configuration des timeouts
jest.setTimeout(10000);
