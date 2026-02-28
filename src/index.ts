/**
 * Vision DPE - Point d'entrée principal
 */

// Types
export * from './types';

// Services
export * as auth from './services/auth';
export * as validation from './services/validation';
export * as xmlGenerator from './services/xml-generator';
export * as sync from './services/sync';
export * as projet from './services/projet';

// Version
export const VERSION = '0.1.0';
