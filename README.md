# 🏠 VISION - Application DPE Certifiée ADEME

[![CI](https://github.com/omarou15/vision-dpe/actions/workflows/ci.yml/badge.svg)](https://github.com/omarou15/vision-dpe/actions)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2050-black)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

Application mobile de Diagnostic de Performance Énergétique (DPE) certifiée par l'ADEME.

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

## 📋 Phases de Développement

| Phase | Description | Status |
|-------|-------------|--------|
| 🔧 Phase 0 | Fondations | 🚧 En cours |
| 📋 Phase 1 | Administratif | ⏳ À faire |
| 🏠 Phase 2 | Enveloppe | ⏳ À faire |
| ⚡ Phase 3 | Installations | ⏳ À faire |
| ✅ Phase 4 | Validation & Export | ⏳ À faire |

## 📁 Structure

```
/src
├── /components    # Composants React Native
├── /screens       # Écrans
├── /navigation    # Navigation
├── /types         # Types TypeScript
├── /services      # Services métier
├── /utils         # Utilitaires
└── /store         # State management

/supabase
├── /migrations    # Migrations SQL
└── seed.sql       # Données initiales
```

## 📊 Suivi

- [Tableau Monday](https://en-jco.monday.com/boards/18401030363)
- [Documentation](/docs)

## 📄 Licence

MIT © 2026 EnergyCo
