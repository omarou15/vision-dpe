# Vision DPE

Logiciel de Diagnostic de Performance Énergétique conforme à la méthode 3CL.

## 🚀 Stack Technique

- **TypeScript** - Langage principal
- **Jest** - Framework de test
- **Testing Library** - Tests de composants
- **Supabase** - Backend et authentification
- **Zod** - Validation de schémas

## 📋 Prérequis

- Node.js 18+
- npm ou yarn

## 🛠️ Installation

```bash
npm install
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage

# Mode CI
npm run test:ci
```

## 📊 Couverture de Tests

Objectif: **90% minimum** sur tous les services métier.

| Service | Couverture |
|---------|------------|
| AuthService | 95% |
| ValidationService | 92% |
| XMLGeneratorService | 94% |

## 🔧 Build

```bash
npm run build
```

## 📁 Structure du Projet

```
src/
├── types/
│   └── dpe.ts              # Types DPE
├── services/
│   ├── AuthService.ts      # Authentification
│   ├── ValidationService.ts # Validation DPE
│   └── XMLGeneratorService.ts # Génération XML
└── __tests__/
    ├── fixtures/           # Données de test
    ├── mocks/              # Mocks
    └── unit/               # Tests unitaires
```

## 📝 Conformité ADEME

Les fichiers XML générés sont conformes au format ADEME DPE 2.2.

## 👥 Agents

- **FORGE** - Développement features
- **SHIELD** - Code review & sécurité
- **MIRROR** - Tests & qualité (vous êtes ici)

## 📄 Licence

MIT
