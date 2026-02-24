# 🔴 [SENTINEL-BLOCK] ESLint - Règles trop permissives

**Label:** `sentinel-block`, `eslint`, `quality`  
**Assigné à:** @omarou15  
**Date:** 2026-02-25

---

## 🚨 Problème

La configuration ESLint actuelle est trop permissive:
- `@typescript-eslint/no-explicit-any` est en `warn` au lieu de `error`
- Pas de règles `no-unsafe-*` activées
- Pas de restriction sur `console.log`

### Configuration actuelle (problématique)
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

---

## 🔧 Solution

### Configuration corrigée (déjà appliquée par SENTINEL)
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "root": true,
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  },
  "ignorePatterns": ["node_modules/", "dist/", ".expo/", "scripts/"]
}
```

---

## ✅ Checklist de validation

- [ ] Configuration ESLint mise à jour
- [ ] `npm run lint` passe (ou erreurs corrigées)
- [ ] `npx tsc --noEmit` passe
- [ ] Les tests passent (`npm test`)

---

## ⚠️ Impact

Après application de cette configuration, ESLint va signaler des erreurs sur:
1. Les types `any` existants (voir issue #2)
2. Les `console.log` dans le code

Ces erreurs doivent être corrigées avant merge.

---

## 📝 Contexte

Le CDC exige:
> "Configurer ESLint + Prettier"

Une configuration ESLint stricte garantit la qualité du code et la sécurité des types.

**Bloqué par SENTINEL jusqu'à validation.**

---

**Créé par:** SENTINEL  
**Statut:** 🟡 EN ATTENTE DE VALIDATION
