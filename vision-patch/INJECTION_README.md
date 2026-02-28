# VISION DPE — PATCH KIT D'INJECTION
# Instructions pour AMIA — Février 2026

## CONTENU DU PATCH (117 fichiers)

### Ce que ce patch contient
- src/types/steps/     → Types TypeScript 14 étapes DPE + 20 étapes audit (conformes XSD DPEv2.6)
- src/types/database.ts → Types Supabase multi-tenant (organisations, profiles, projets, invitations)
- src/pages/wizard/    → 14 pages wizard DPE (Step1 à Step14)
- src/pages/audit/     → 9 pages audit (AuditStep12 à AuditStep20 + routes)
- src/services/        → 11 services métier (auth, sync, BAN, validation, ADEME API, XMLGen, scénarios, échantillon)
- src/components/ui/   → 11 composants UI (Alert, Badge, Button, Card, Chip, Input, Select, etc.)
- src/hooks/           → 6 hooks (useAuth, useAddressSearch, useOnlineStatus, usePWAInstall, usePWAUpdate, useSync)
- src/store/           → 2 stores Zustand (authStore, projetStore)
- e2e/                 → 5 fichiers tests Playwright (132 tests E2E)
- src/types/__tests__/ → 7 fichiers tests Vitest (113 tests unitaires)

### Ce que ce patch NE contient PAS (garder les fichiers du repo)
- package.json, tsconfig.json, vite.config.ts, tailwind.config.ts → garder ceux du repo
- index.html, public/ → garder ceux du repo
- supabase/ → garder celui du repo
- .github/ → garder celui du repo

## PROCÉDURE D'INJECTION

### Étape 1 — Backup
```bash
cd /root/.openclaw/workspace/vision-dpe
git stash   # ou commit ce qui est en cours
cp -r src src_backup_$(date +%Y%m%d_%H%M)
```

### Étape 2 — Supprimer les anciens fichiers qui seront remplacés
```bash
# Supprimer les services existants (nos versions sont plus complètes)
rm -f src/services/AuthService.ts src/services/CalculationService.ts
rm -f src/services/DPEService.ts src/services/ExportService.ts
rm -f src/services/SyncService.ts src/services/ValidationService.ts
rm -f src/services/XMLGeneratorService.ts

# Supprimer les anciens types (remplacés par notre structure steps/)
rm -f src/types/api-ademe.ts src/types/auth.ts src/types/services.ts
rm -f src/types/tables-valeurs.ts src/types/utils.ts src/types/validation.ts

# Supprimer les anciennes pages/stores si elles existent avec d'autres noms
rm -f src/stores/authStore.ts src/stores/index.ts
rm -f src/utils/xml-generator.ts src/utils/xml-parser.ts src/utils/xml-validator.ts

# Supprimer lib/ (remplacé par services/)
rm -f src/lib/db.ts src/lib/supabase.ts src/lib/utils.ts
```

### Étape 3 — Extraire le patch
```bash
# Depuis le dossier contenant vision-patch/
cp -r vision-patch/src/* src/
cp -r vision-patch/e2e .
```

### Étape 4 — Adapter les imports
Les fichiers du repo qui importent depuis les anciens chemins doivent être mis à jour.

```bash
# Remplacer les imports PascalCase par les nouveaux noms
# AVANT: import { AuthService } from "@/services/AuthService"
# APRÈS: import * as authService from "@/services/auth"

# AVANT: import { ... } from "@/lib/supabase"
# APRÈS: import { supabase } from "@/services/supabase"

# AVANT: import { ... } from "@/lib/db"
# APRÈS: import { db } from "@/services/db"

# AVANT: import { ... } from "@/stores/authStore"
# APRÈS: import { useAuthStore } from "@/store/authStore"

# AVANT: import type { DPEData } from "@/types/dpe"
# APRÈS: import type { Step1Data, Step2Data, ... } from "@/types/steps"
```

### Étape 5 — Garder src/types/dpe.ts
Le fichier dpe.ts existant contient les enums ADEME. NE PAS le supprimer.
Notre src/types/index.ts fait un barrel export qui inclut dpe.ts + steps/.
Si conflit : fusionner les enums de dpe.ts avec nos types steps/.

### Étape 6 — Restaurer tsconfig.json strict
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Étape 7 — Vérifier
```bash
npx tsc --noEmit 2>&1 | head -30
npm test -- --run 2>&1 | tail -20
npm run build
```

## MAPPING ANCIEN → NOUVEAU

| Ancien fichier (repo)         | Nouveau fichier (patch)        |
|-------------------------------|-------------------------------|
| src/services/AuthService.ts   | src/services/auth.ts          |
| src/services/ValidationService.ts | src/services/validation.ts |
| src/services/XMLGeneratorService.ts | src/services/xml-generator.ts |
| src/services/SyncService.ts   | src/services/sync.ts          |
| src/services/DPEService.ts    | src/services/projet.ts        |
| src/services/ExportService.ts | (intégré dans xml-generator.ts) |
| src/services/CalculationService.ts | (intégré dans validation.ts) |
| src/lib/supabase.ts           | src/services/supabase.ts      |
| src/lib/db.ts                 | src/services/db.ts            |
| src/stores/authStore.ts       | src/store/authStore.ts        |
| src/types/dpe.ts              | GARDER + src/types/steps/*    |
| src/types/api-ademe.ts        | src/services/ademe-api.ts     |
| src/types/validation.ts       | src/services/validation.ts    |

## ARCHITECTURE FINALE ATTENDUE

```
src/
├── components/
│   ├── layout/         (AppLayout, WizardLayout)
│   ├── ui/             (11 composants : Alert, Badge, Button, Card, Chip, Input, Select, etc.)
│   ├── InstallPrompt, OfflineBanner, ProtectedRoute, UpdatePrompt
├── hooks/              (useAuth, useAddressSearch, useOnlineStatus, usePWAInstall, usePWAUpdate, useSync)
├── pages/
│   ├── auth/           (Login, Signup, ForgotPassword, AcceptInvitation)
│   ├── wizard/         (Step1-14 DPE + WizardStepPage)
│   ├── audit/          (AuditStep12-20 + routes)
│   ├── Dashboard, NotFound, Profil, Projets
├── services/           (auth, ban, db, supabase, sync, projet, validation, ademe-api, xml-generator, scenario-travaux, echantillon)
├── store/              (authStore, projetStore)
├── types/
│   ├── steps/          (step1-3, step4-8, step9-11, step12-14, audit)
│   ├── database.ts     (types Supabase multi-tenant)
│   ├── dpe.ts          (enums ADEME — GARDER l'existant)
│   ├── index.ts        (barrel export)
├── utils/              (cn, constants)
├── locales/            (fr, en)
├── i18n.ts, main.tsx, App.tsx
e2e/                    (5 fichiers Playwright, 132 tests)
```
