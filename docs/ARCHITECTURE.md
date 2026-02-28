# 🏗️ Architecture VISION DPE

## Vue d'ensemble

VISION DPE est une application mobile de Diagnostic de Performance Énergétique (DPE) certifiée par l'ADEME, développée avec React Native et TypeScript.

## Architecture Logicielle

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Screens   │  │ Components  │  │      Navigation         │  │
│  │  (13 étapes)│  │  (UI Kit)   │  │   (React Navigation)    │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│  ┌──────┴────────────────┴──────┐                               │
│  │         SERVICES             │                               │
│  │  ┌─────────┐ ┌────────────┐  │  ┌─────────────────────────┐  │
│  │  │  Auth   │ │ Validation │  │  │      State Mgmt         │  │
│  │  │ Service │ │  Service   │  │  │    (Zustand/Context)    │  │
│  │  └─────────┘ └────────────┘  │  └─────────────────────────┘  │
│  │  ┌─────────┐ ┌────────────┐  │                               │
│  │  │  XML    │ │    API     │  │                               │
│  │  │Generator│ │  Service   │  │                               │
│  │  └─────────┘ └────────────┘  │                               │
│  └──────────────────────────────┘                               │
│         │                                                       │
│  ┌──────┴────────────────┬──────┐                               │
│  │         TYPES          │      │                               │
│  │  ┌─────────┐ ┌────────┐│     │                               │
│  │  │   DPE   │ │ Tables ││     │                               │
│  │  │  Types  │ │Valeurs ││     │                               │
│  │  └─────────┘ └────────┘│     │                               │
│  └────────────────────────┘     │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│                        BACKEND   │                              │
│  ┌───────────────────────────────┴─────────────┐                 │
│  │              SUPABASE                        │                 │
│  │  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │                 │
│  │  │   Auth  │ │PostgreSQL│ │    Storage    │  │                 │
│  │  │(GoTrue) │ │ (DPE DB) │ │  (Documents)  │  │                 │
│  │  └─────────┘ └─────────┘ └───────────────┘  │                 │
│  └─────────────────────────────────────────────┘                 │
│                              │                                   │
│  ┌───────────────────────────┴──────────────────┐                │
│  │              API ADEME                        │                │
│  │  - Validation cohérence                      │                │
│  │  - Traduction XML                            │                │
│  │  - Enregistrement DPE                        │                │
│  └──────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

## Structure des Dossiers

```
/src
├── /components          # Composants React Native réutilisables
│   ├── /ui             # Composants UI de base (Button, Input, Card...)
│   ├── /forms          # Composants de formulaire spécifiques DPE
│   └── /layout         # Layouts (Header, Stepper, etc.)
│
├── /screens            # Écrans de l'application (13 étapes DPE)
│   ├── /step1-administratif
│   ├── /step2-caracteristiques
│   ├── /step3-murs
│   ├── /step4-baies
│   ├── /step5-planchers-bas
│   ├── /step6-planchers-haut
│   ├── /step7-ventilation
│   ├── /step8-chauffage
│   ├── /step9-ecs
│   ├── /step10-climatisation
│   ├── /step11-enr
│   ├── /step12-validation
│   └── /step13-export
│
├── /navigation         # Configuration React Navigation
│   ├── AppNavigator.tsx
│   └── AuthNavigator.tsx
│
├── /services           # Services métier (Core Services Phase 1)
│   ├── AuthService.ts      # Authentification Supabase
│   ├── ValidationService.ts # Validation des données DPE
│   ├── XMLGeneratorService.ts # Génération XML ADEME
│   └── APIService.ts       # Communication API ADEME
│
├── /types              # Types TypeScript
│   ├── dpe.ts          # Types DPE (XSD ADEME)
│   ├── validation.ts   # Types validation
│   ├── tables-valeurs.ts # Tables de valeurs 3CL
│   ├── api-ademe.ts    # Types API ADEME
│   ├── auth.ts         # Types authentification
│   └── index.ts        # Export centralisé
│
├── /lib                # Configuration clients
│   └── supabase.ts     # Client Supabase
│
├── /utils              # Utilitaires
│   ├── calculations.ts # Calculs thermiques 3CL
│   ├── formatters.ts   # Formatage données
│   └── validators.ts   # Validateurs utilitaires
│
├── /hooks              # Custom React Hooks
│   ├── useAuth.ts
│   ├── useDPE.ts
│   └── useValidation.ts
│
└── /store              # State Management
    ├── authStore.ts
    └── dpeStore.ts

/supabase
├── /migrations         # Migrations SQL
│   └── 001_initial_schema.sql
└── seed.sql           # Données initiales

/docs                   # Documentation
├── ARCHITECTURE.md     # Cette documentation
├── API.md             # Documentation API
├── database-schema.md # Schema SQL
└── Cahier_des_Charges.md # CDC VISION

/.github
└── /workflows          # CI/CD GitHub Actions
    ├── ci.yml
    └── eas-build.yml
```

## Flux de Données

### 1. Création d'un DPE

```
User ──▶ Screen ──▶ dpeStore ──▶ Supabase (dpe_drafts)
                      │
                      ▼
               ValidationService
                      │
                      ▼
               XMLGeneratorService (export final)
```

### 2. Authentification

```
User ──▶ LoginScreen ──▶ AuthService ──▶ Supabase Auth
                              │
                              ▼
                         authStore
                              │
                              ▼
                         AppNavigator
```

### 3. Validation

```
Input ──▶ ValidationService.validateStep() ──▶ Résultat
                │
                ├──▶ Règles par étape (STEP_VALIDATION_RULES)
                │
                └──▶ Contraintes cohérence (validateCoherence)
```

## Services Core (Phase 1)

### AuthService

**Responsabilités:**
- Authentification utilisateur (email/password)
- Gestion des sessions
- CRUD profil diagnostiqueur
- Réinitialisation mot de passe

**Dépendances:**
- `@supabase/supabase-js`
- Table `users_profiles`

### ValidationService

**Responsabilités:**
- Validation des 13 étapes du DPE
- Contraintes de cohérence métier
- Validation en temps réel des champs

**Règles de validation:**
- Champs requis par étape (`STEP_VALIDATION_RULES`)
- Types: string, number, date, enum, array
- Contraintes: min, max, pattern, customValidator

### XMLGeneratorService

**Responsabilités:**
- Génération XML conforme XSD ADEME v2.6
- Validation structurelle avant export
- Formatage des dates et nombres

**Structure XML générée:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<dpe version="8.0.4" xmlns="http://www.ademe.fr/dpe" ...>
  <administratif>
    <date_visite_diagnostiqueur>...  </date_visite_diagnostiqueur>
    <diagnostiqueur>...</diagnostiqueur>
    <geolocalisation>...</geolocalisation>
  </administratif>
  <logement>
    <caracteristique_generale>...</caracteristique_generale>
    <enveloppe>...</enveloppe>
    <installation_chauffage_collection>...</installation_chauffage_collection>
    ...
  </logement>
</dpe>
```

## Base de Données

### Tables Principales

| Table | Description | RLS |
|-------|-------------|-----|
| `users_profiles` | Profils diagnostiqueurs | User = owner |
| `dpe_drafts` | Brouillons DPE (13 étapes) | User = owner |
| `dpe_documents` | DPE validés | User = owner |
| `dpe_validations` | Historique validations | Document owner |
| `dpe_attachments` | Pièces jointes | Document owner |
| `enum_cache` | Cache enums ADEME | Read public |

### Relations

```
auth.users ──1:1──▶ users_profiles
     │
     ├──1:N──▶ dpe_drafts
     │
     └──1:N──▶ dpe_documents ──1:N──▶ dpe_validations
                              ──1:N──▶ dpe_attachments
```

## Sécurité

### Authentification
- JWT tokens avec refresh automatique
- Sessions persistantes
- Row Level Security (RLS) sur toutes les tables

### Validation
- Validation côté client (UX)
- Validation côté serveur (sécurité)
- Échappement XML pour prévenir injections

### Données Sensibles
- Variables d'environnement pour clés API
- Pas de secrets en dur dans le code
- Validation SIRET et numéro de certification

## Performance

### Optimisations
- Lazy loading des étapes
- Cache des enums ADEME
- Debounce sur la validation en temps réel
- Pagination pour l'historique DPE

### Métriques Cibles
- Time to Interactive: < 3s
- Validation step: < 100ms
- Génération XML: < 500ms

## Déploiement

### CI/CD Pipeline

```
Push/PR ──▶ GitHub Actions ──▶ Lint + Type Check + Test
                                    │
                                    ▼ (si main)
                              EAS Build ──▶ Android/iOS
```

### Environnements

| Environnement | Branch | Backend |
|---------------|--------|---------|
| Development | `feature/*` | Supabase staging |
| Staging | `develop` | Supabase staging |
| Production | `main` | Supabase production |

## Standards de Code

### TypeScript
- Strict mode activé
- Types explicites pour les retours de fonction
- Pas de `any` (warning ESLint)

### ESLint
- `@typescript-eslint/recommended`
- `react-hooks/recommended`
- Règles personnalisées dans `.eslintrc.json`

### Nommage
- **PascalCase**: Classes, Interfaces, Components, Enums
- **camelCase**: Variables, Fonctions, Instances
- **UPPER_SNAKE_CASE**: Constantes, Enums values
- **kebab-case**: Fichiers, Dossiers

## Prochaines Évolutions

### Phase 2 - Enveloppe
- Calculs thermiques 3CL complets
- Gestion des ponts thermiques
- Saisie assistée des parois

### Phase 3 - Installations
- Modules chauffage/ECS/climatisation
- Calculs de consommation
- Rendements des générateurs

### Phase 4 - Validation & Export
- Intégration API ADEME complète
- Signature électronique
- Soumission automatique
