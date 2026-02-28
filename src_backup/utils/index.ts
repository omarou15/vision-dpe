/**
 * Index des utilitaires XML
 * Export centralisé des fonctions utilitaires
 */

export { XMLGenerator, generateXML, generateXMLWithValidation } from "./xml-generator";
export type { XMLGeneratorOptions } from "./xml-generator";

export {
  DPEXMLParser,
  parseDPEXML,
  parseDPEXMLStrict,
  parseDPEXMLWithDefaults,
} from "./xml-parser";
export type {
  ParseResult,
  ParseError,
  ParseWarning,
  ParseOptions,
} from "./xml-parser";

export { XMLValidator, validateXML } from "./xml-validator";
