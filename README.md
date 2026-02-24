# 🏠 VISION - Application DPE Certifiée ADEME

[![CI](https://github.com/omarou15/vision-dpe/actions/workflows/ci.yml/badge.svg)](https://github.com/omarou15/vision-dpe/actions)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.io/)

Application mobile de Diagnostic de Performance Énergétique (DPE) certifiée par l'ADEME.

## 📊 Progression

### Phase 0 - Fondations ✅

| Phase | Description | Status | Avancement |
|-------|-------------|--------|------------|
| 🔧 0.1 | Setup projet Expo + React Native | ✅ Fait | 100% |
| 🔧 0.2 | Générer types TypeScript depuis XSD | ✅ Fait | 100% |
| 🔧 0.3 | Schema Supabase + migrations | ✅ Fait | 100% |
| 🔧 0.4 | Setup CI/CD GitHub Actions + EAS | ✅ Fait | 100% |
| 🔧 0.5 | Maquettes Figma complètes | ⏳ À faire | 0% |

**Phase 0 globale: 80%** ✅

### Phase 1 - Core Services ✅

| Phase | Description | Status | Avancement |
|-------|-------------|--------|------------|
| 📋 1.1 | AuthService - Authentification Supabase | ✅ Fait | 100% |
| 📋 1.2 | ValidationService - Validation DPE | ✅ Fait | 100% |
| 📋 1.3 | XMLGeneratorService - Export XML ADEME | ✅ Fait | 100% |
| 📋 1.4 | Documentation API et Architecture | ✅ Fait | 100% |
| 📋 1.5 | Tests et audit sécurité | ✅ Fait | 100% |

**Phase 1 globale: 100%** ✅

## 📦 Livrables

### Phase 0 - Fondations

#### Types TypeScript (`/src/types/`)
- `dpe.ts` - Enums et interfaces principaux DPE
- `tables-valeurs.ts` - Coefficients U, facteurs conversion, seuils étiquettes
- `validation.ts` - Règles de cohérence et validation
- `api-ademe.ts` - Types API ADEME
- `auth.ts` - Types authentification
- `index.ts` - Export centralisé

#### Database Schema (`/supabase/migrations/`)
- `users_profiles` - Profils diagnostiqueurs
- `dpe_drafts` - Brouillons DPE (13 étapes)
- `dpe_documents` - DPE validés
- `dpe_validations` - Historique validations
- `enum_cache` - Cache enums/tables ADEME
- `dpe_attachments` - Pièces jointes

### Phase 1 - Core Services

#### Services (`/src/services/`)
- `AuthService.ts` - Authentification et gestion profils
- `ValidationService.ts` - Validation des 13 étapes DPE
- `XMLGeneratorService.ts` - Génération XML ADEME v2.6
- `index.ts` - Export centralisé

#### Librairies (`/src/lib/`)
- `supabase.ts` - Client Supabase configuré

#### Documentation
- `docs/ARCHITECTURE.md` - Architecture complète
- `docs/API.md` - Documentation API des services
- `CHANGELOG.md` - Historique des changements

## 📱 Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React Native + Expo |
| **Langage** | TypeScript 5.9 |
| **UI** | React Native Paper |
| **Navigation** | React Navigation |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **CI/CD** | GitHub Actions + EAS |

## 🚀 Démarrage

```bash
# Installation
git clone https://github.com/omarou15/vision-dpe.git
cd vision-dpe
npm install

# Configuration
cp .env.example .env
# Remplir les variables Supabase et ADEME

# Lancement
npm start

# Lint et format
npm run lint
npm run format

# Type checking
npm run type-check
```

## 📁 Structure

```
/src
├── /components    # Composants React Native
├── /screens       # Écrans (13 étapes DPE)
├── /navigation    # Navigation
├── /types         # Types TypeScript ✅
├── /services      # Services métier ✅ Phase 1
│   ├── AuthService.ts
│   ├── ValidationService.ts
│   └── XMLGeneratorService.ts
├── /lib           # Configuration clients
│   └── supabase.ts
├── /utils         # Utilitaires
├── /hooks         # Custom hooks
└── /store         # State management

/supabase
├── /migrations    # Migrations SQL ✅
└── seed.sql       # Données initiales ✅

/.github
└── /workflows     # CI/CD GitHub Actions ✅
    ├── ci.yml
    └── eas-build.yml

/docs
├── ARCHITECTURE.md      # Architecture ✅ Phase 1
├── API.md               # Documentation API ✅ Phase 1
├── Cahier_des_Charges.md
├── database-schema.md
└── technical.md

CHANGELOG.md             # Historique ✅ Phase 1
```

## 📋 Phases de Développement

| Phase | Description | Semaines | Status |
|-------|-------------|----------|--------|
| 🔧 Phase 0 | Fondations | 2 | ✅ Terminé (80%) |
| 📋 Phase 1 | Core Services | 1 | ✅ Terminé (100%) |
| 🏠 Phase 2 | Enveloppe | 3 | ⏳ À faire |
| ⚡ Phase 3 | Installations | 3 | ⏳ À faire |
| ✅ Phase 4 | Validation & Export | 2 | ⏳ À faire |
| 🏢 Phase 5 | DPE Neuf & Tertiaire | 2 | ⏳ À faire |
| 🧪 Phase 6 | Beta & Corrections | 2 | ⏳ À faire |
| 🚀 Phase 7 | Release | 1 | ⏳ À faire |

## 📚 Documentation

- [Architecture Technique](docs/ARCHITECTURE.md)
- [Documentation API](docs/API.md)
- [Schema Base de Données](docs/database-schema.md)
- [Changelog](CHANGELOG.md)

## 📊 Suivi Projet

- [Tableau Monday](https://en-jco.monday.com/boards/18401030363)
- [Documentation](/docs)

## 🔒 Sécurité

- Row Level Security (RLS) sur toutes les tables
- Validation des entrées utilisateur
- Pas de secrets en dur dans le code
- Variables d'environnement pour les clés API

## 📄 Licence

MIT © 2026 EnergyCo
