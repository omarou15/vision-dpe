# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Added
- Phase 1: Core Services
  - `AuthService` - Service d'authentification Supabase
  - `ValidationService` - Validation des données DPE (13 étapes)
  - `XMLGeneratorService` - Génération XML conforme ADEME v2.6
  - Types d'authentification (`auth.ts`)
  - Client Supabase configuré (`lib/supabase.ts`)

### Changed
- Mise à jour de `package.json` avec scripts de lint/format/test
- Ajout dépendance `@supabase/supabase-js`
- Déplacement de `fast-xml-parser` en dépendance principale

### Documentation
- Création `docs/ARCHITECTURE.md` - Architecture complète
- Création `docs/API.md` - Documentation API des services
- Mise à jour `README.md` - Progression Phase 1

## [1.0.0] - 2024-02-25

### Added
- Phase 0: Fondations
  - Setup projet Expo SDK 50 + React Native 0.73
  - Configuration TypeScript avec strict mode
  - ESLint + Prettier configurés
  - Types TypeScript générés depuis XSD ADEME v2.6
    - `dpe.ts` - Enums et interfaces principaux
    - `tables-valeurs.ts` - Coefficients U, facteurs conversion
    - `validation.ts` - Règles de validation
    - `api-ademe.ts` - Types API ADEME
  - Schema Supabase complet
    - `users_profiles` - Profils diagnostiqueurs
    - `dpe_drafts` - Brouillons DPE
    - `dpe_documents` - DPE validés
    - `dpe_validations` - Historique validations
    - `enum_cache` - Cache enums ADEME
    - `dpe_attachments` - Pièces jointes
  - CI/CD GitHub Actions
    - `ci.yml` - Lint, type-check, test
    - `eas-build.yml` - Build EAS Android/iOS
  - Documentation initiale
    - `Cahier_des_Charges.md`
    - `database-schema.md`
    - `technical.md`

### Security
- Row Level Security (RLS) sur toutes les tables
- Politiques d'accès utilisateur
- Validation des entrées utilisateur

## Types de changements

- `Added` pour les nouvelles fonctionnalités.
- `Changed` pour les changements de fonctionnalités existantes.
- `Deprecated` pour les fonctionnalités qui seront bientôt supprimées.
- `Removed` pour les fonctionnalités supprimées.
- `Fixed` pour les corrections de bugs.
- `Security` pour les améliorations de sécurité.

## Tags de versions

- `[Unreleased]` - Changements en cours de développement
- `[X.Y.Z]` - Versions release

## Références

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
