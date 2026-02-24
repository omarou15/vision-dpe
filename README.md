# 🏠 VISION - Application DPE Certifiée ADEME

[![CI](https://github.com/omarou15/vision-dpe/actions/workflows/ci.yml/badge.svg)](https://github.com/omarou15/vision-dpe/actions)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2050-black)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

Application mobile de Diagnostic de Performance Énergétique (DPE) certifiée par l'ADEME.

## 📊 Progression Phase 0

| Phase | Description | Status | Avancement |
|-------|-------------|--------|------------|
| 🔧 0.1 | Setup projet Expo + React Native | ✅ Fait | 100% |
| 🔧 0.2 | Générer types TypeScript depuis XSD | ✅ Fait | 100% |
| 🔧 0.3 | Schema Supabase + migrations | ⏳ À faire | 0% |
| 🔧 0.4 | Setup CI/CD GitHub Actions + EAS | ✅ Fait | 100% |
| 🔧 0.5 | Maquettes Figma complètes | ⏳ À faire | 0% |

**Phase 0 globale: 60%** ✅

## 📦 Types Générés

```typescript
/src/types/
├── dpe.ts              # Types principaux DPE (enums, interfaces)
├── tables-valeurs.ts   # Tables ADEME (coefficients U, facteurs)
├── validation.ts       # Règles de validation
├── api-ademe.ts        # Types API ADEME
└── index.ts            # Export centralisé
```

### Enums disponibles
- `EnumTypeBatiment` - Maison / Appartement
- `EnumPeriodeConstruction` - Périodes de construction
- `EnumTypeParoi` - Types de parois
- `EnumTypeVitrage` - Simple / Double / Triple vitrage
- `EnumTypeVmc` - Types de ventilation
- `EnumTypeGenerateurChauffage` - Chaudières, PAC, poêles...
- `EnumEtiquetteDpe` - A à G

### Interfaces principales
- `DPEDocument` - Document DPE complet
- `CaracteristiquesGenerales` - Type, surface, période
- `Enveloppe` - Murs, baies, planchers, PT
- `Installations` - Chauffage, ECS, ventilation
- `Resultats` - Consommations, émissions, étiquettes

## 📱 Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React Native + Expo |
| **Langage** | TypeScript |
| **UI** | React Native Paper |
| **Navigation** | React Navigation |
| **Backend** | Supabase (PostgreSQL, Auth) |
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
├── /migrations    # Migrations SQL
└── seed.sql       # Données initiales

/.github
└── /workflows     # CI/CD GitHub Actions
```

## 📋 Phases de Développement

| Phase | Description | Semaines | Status |
|-------|-------------|----------|--------|
| 🔧 Phase 0 | Fondations | 2 | 🚧 En cours (60%) |
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
