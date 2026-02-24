/**
 * @jest-environment node
 */

module.exports = {
  // Environnement de test
  testEnvironment: 'node',
  
  // Extensions de fichiers à traiter
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Pattern de fichiers de test
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Transformation TypeScript
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
      }
    }]
  },
  
  // Fichier de setup
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Mocks automatiques
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1'
  },
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/types/**'
  ],
  
  // Seuils de couverture minimale (90% comme exigé)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Répertoire de couverture
  coverageDirectory: 'coverage',
  
  // Reporters de couverture
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],
  
  // Nettoyage entre les tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Verbosité
  verbose: true,
  
  // Timeout par défaut
  testTimeout: 10000,
  
  // Ignorer les fichiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};
