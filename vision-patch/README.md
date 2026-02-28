# Vision DPE

Application web PWA pour diagnostiqueurs DPE et Audit énergétique réglementaire, certifiée ADEME.

## Stack

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Routing** : React Router v6
- **State** : Zustand
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Offline** : Dexie.js (IndexedDB)
- **i18n** : react-i18next
- **Tests** : Vitest + Playwright
- **Deploy** : Vercel → vision.energyco.fr

## Démarrage

```bash
npm install
cp .env.example .env   # Configurer Supabase + ADEME API
npm run dev             # http://localhost:5173
```

## Scripts

| Commande | Action |
|----------|--------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run lint` | ESLint strict |
| `npm run typecheck` | Vérification TypeScript |
| `npm run test` | Tests unitaires Vitest |
| `npm run test:coverage` | Tests + couverture (seuil 90%) |
| `npm run test:e2e` | Tests E2E Playwright (3 navigateurs) |

## Structure

```
src/
  components/    Composants React réutilisables
  pages/         Pages / routes
  hooks/         Custom hooks
  services/      Services métier (ValidationService, XMLGenerator...)
  types/         Types TypeScript ADEME (générés depuis XSD)
  store/         Zustand stores
  utils/         Utilitaires (cn, constants)
  styles/        Tailwind config + CSS
  locales/       Traductions i18n (fr, en)
  test/          Setup tests
public/          Assets statiques + PWA manifest
supabase/        Migrations SQL
e2e/             Tests Playwright
```

## Licence

Propriétaire — Energyco 2026
