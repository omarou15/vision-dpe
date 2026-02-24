# 🏠 VISION - Application DPE Certifiée ADEME

[![CI](https://github.com/omarou15/vision-dpe/actions/workflows/ci.yml/badge.svg)](https://github.com/omarou15/vision-dpe/actions)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2050-black)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.io/)

Application mobile de Diagnostic de Performance Énergétique (DPE) certifiée par l'ADEME.

## 📊 Progression Phase 0

| Phase | Description | Status | Avancement |
|-------|-------------|--------|------------|
| 🔧 0.1 | Setup projet Expo + React Native | ✅ Fait | 100% |
| 🔧 0.2 | Générer types TypeScript depuis XSD | ✅ Fait | 100% |
| 🔧 0.3 | Schema Supabase + migrations | ✅ Fait | 100% |
| 🔧 0.4 | Setup CI/CD GitHub Actions + EAS | ✅ Fait | 100% |
| 🔧 0.5 | Maquettes Figma complètes | ⏳ À faire | 0% |

**Phase 0 globale: 80%** ✅

## 📦 Livrables Phase 0

### Types TypeScript (`/src/types/`)
- `dpe.ts` - Enums et interfaces principaux DPE
- `tables-valeurs.ts` - Coefficients U, facteurs conversion, seuils étiquettes
- `validation.ts` - Règles de cohérence et validation
- `api-ademe.ts` - Types API ADEME
- `index.ts` - Export centralisé

### Database Schema (`/supabase/migrations/`)
- `users_profiles` - Profils diagnostiqueurs
- `dpe_drafts` - Brouillons DPE (13 étapes)
- `dpe_documents` - DPE validés
- `dpe_validations` - Historique validations
- `enum_cache` - Cache enums/tables ADEME
- `dpe_attachments` - Pièces jointes

### CI/CD (`/.github/workflows/`)
- `ci.yml` - Lint, type-check, test
- `eas-build.yml` - Build EAS Android/iOS

## 📱 Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React Native + Expo |
| **Langage** | TypeScript |
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
```

## 📁 Structure

```
/src
├── /components    # Composants React Native
├── /screens       # Écrans
├── /navigation    # Navigation
├── /types         # Types TypeScript ✅
├── /services      # Services métier
├── /utils         # Utilitaires
└── /store         # State management

/supabase
├── /migrations    # Migrations SQL ✅
└── seed.sql       # Données initiales ✅

/.github
└── /workflows     # CI/CD GitHub Actions ✅

/docs
├── Cahier_des_Charges.md  # CDC VISION
├── database-schema.md     # Schema SQL
└── technical.md           # Documentation technique
```

## 📋 Phases de Développement

| Phase | Description | Semaines | Status |
|-------|-------------|----------|--------|
| 🔧 Phase 0 | Fondations | 2 | 🚧 En cours (80%) |
| 📋 Phase 1 | Administratif | 1 | ⏳ À faire |
| 🏠 Phase 2 | Enveloppe | 3 | ⏳ À faire |
| ⚡ Phase 3 | Installations | 3 | ⏳ À faire |
| ✅ Phase 4 | Validation & Export | 2 | ⏳ À faire |
| 🏢 Phase 5 | DPE Neuf & Tertiaire | 2 | ⏳ À faire |
| 🧪 Phase 6 | Beta & Corrections | 2 | ⏳ À faire |
| 🚀 Phase 7 | Release | 1 | ⏳ À faire |

## 📊 Suivi Projet

- [Tableau Monday](https://en-jco.monday.com/boards/18401030363)
- [Documentation](/docs)

## 📄 Licence

MIT © 2026 EnergyCo
