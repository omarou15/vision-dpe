# VISION DPE - Documentation Technique

## Architecture

```
/src
├── /components     # Composants React Native réutilisables
├── /screens        # Écrans de l'application
├── /navigation     # Configuration navigation
├── /types          # Types TypeScript (générés XSD)
├── /services       # Services métier (API, validation)
├── /utils          # Utilitaires
├── /store          # State management
└── /hooks          # Custom hooks

/supabase
├── /migrations     # Migrations SQL
└── seed.sql        # Données initiales

/docs               # Documentation
/tests              # Tests unitaires et E2E
```

## Stack Technique

- React Native + Expo
- TypeScript
- React Native Paper (UI)
- React Navigation
- Supabase (Backend)

## Scripts

```bash
npm start        # Démarrer Expo
npm run android  # Build Android
npm run ios      # Build iOS (macOS uniquement)
npm run web      # Version web
npm run lint     # ESLint
npm run format   # Prettier
```

## Variables d'Environnement

Voir `.env.example`
