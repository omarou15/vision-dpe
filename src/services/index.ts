/**
 * Index des services Vision DPE
 * Export centralisé de tous les services
 */

export {
  AuthService,
  createAuthService,
  getAuthService,
} from "./AuthService";

export {
  ValidationService,
  createValidationService,
  getValidationService,
} from "./ValidationService";

export {
  XMLGeneratorService,
  createXMLGeneratorService,
  getXMLGeneratorService,
} from "./XMLGeneratorService";

export {
  DPEService,
  createDPEService,
  getDPEService,
  resetDPEService,
  DPEStatus,
  type DPEMetadata,
  type DPEWithMetadata,
  type DPEFilters,
  type DPEResult,
  type DPEListResult,
  type DPEError,
  type DPECalculationResult,
  type IDPEService,
} from "./DPEService";

export {
  CalculationService,
  createCalculationService,
  getCalculationService,
  resetCalculationService,
  type CalculationContext,
  type CalculationResult,
  type CalculationError,
  type DeperditionResult,
  type BesoinsResult,
  type ICalculationService,
} from "./CalculationService";

export {
  ExportService,
  createExportService,
  getExportService,
  resetExportService,
  ExportFormat,
  ExportStatus,
  type ExportOptions,
  type ExportResult,
  type ExportError,
  type PDFGenerationOptions,
  type BatchExportResult,
  type IExportService,
} from "./ExportService";

export {
  SyncService,
  createSyncService,
  getSyncService,
  resetSyncService,
  SyncStatus,
  NetworkStatus,
  OperationType,
  type SyncOperation,
  type SyncState,
  type SyncResult,
  type SyncError,
  type ConflictResolution,
  type ISyncService,
} from "./SyncService";
