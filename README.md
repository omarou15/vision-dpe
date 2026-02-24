# SHIELD v2 - PWA

Application DPE (Diagnostic de Performance Énergétique) pour diagnostiqueurs immobiliers.

## 🚀 Migration React Native → PWA

Cette version est une Progressive Web App (PWA) basée sur :
- **Vite** - Build tool rapide
- **React 18** - UI library
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling utilitaire
- **Radix UI** - Composants headless accessibles
- **Zustand** - State management
- **Dexie.js** - IndexedDB wrapper pour offline-first
- **Vite PWA Plugin** - Service worker et manifest

## 📱 Fonctionnalités PWA

- ✅ **Offline-first** - Fonctionne sans connexion
- ✅ **Installation** - Installable sur mobile/desktop
- ✅ **Push notifications** - Support natif
- ✅ **Background sync** - Synchronisation des données
- ✅ **IndexedDB** - Stockage local des DPE

## 🛠️ Installation

```bash
npm install
```

## 🚀 Développement

```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🧪 Tests

```bash
npm test
```

## 📁 Structure

```
src/
├── components/
│   ├── layout/       # Layout, navigation
│   └── ui/           # Composants UI (shadcn/radix)
├── pages/
│   ├── auth/         # Login
│   ├── dashboard/    # Tableau de bord
│   └── dpe/          # Wizard DPE 13 étapes
├── stores/           # Zustand stores
├── hooks/            # Custom React hooks
├── lib/              # Utilitaires
├── services/         # FORGE - Services métier
└── types/            # NEXUS - Types TypeScript
```

## 🔒 Contraintes

- Mobile-first design
- Offline-first avec IndexedDB
- Ne jamais modifier `src/services/` (FORGE)
- Ne jamais modifier `src/types/` (NEXUS)

## 📝 License

Propriétaire - EnergyCo
