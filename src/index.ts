/**
 * Vision DPE - Point d'entrée principal
 */

// Types
export * from './types';

// Services
export { 
  AuthService, 
  createAuthService,
  getAuthService,
} from './services/AuthService';

export { 
  ValidationService,
  createValidationService,
  getValidationService,
} from './services/ValidationService';

export { 
  XMLGeneratorService,
  createXMLGeneratorService,
  getXMLGeneratorService,
} from './services/XMLGeneratorService';

// Version
export const VERSION = '0.1.0';
