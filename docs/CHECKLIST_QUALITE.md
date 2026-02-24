# ✅ CHECKLIST QUALITÉ - Vision DPE

> Document de référence pour garantir la qualité et la sécurité du projet Vision DPE

---

## 🔒 RÈGLES ABSOLUES (Non négociables)

### 1. Sécurité
- [ ] **AUCUN secret en dur dans le code**
  - Pas de clés API
  - Pas de tokens
  - Pas de mots de passe
  - Pas d'URLs de base de données avec credentials
- [ ] Tous les secrets passent par variables d'environnement
- [ ] Le fichier `.env` est dans `.gitignore`
- [ ] Pas de `console.log` de données sensibles

### 2. TypeScript Strict
- [ ] **AUCUN `any` non justifié**
  - Utiliser `unknown` si le type est inconnu
  - Utiliser des types génériques si nécessaire
  - Documenter avec commentaire si `any` est inévitable
- [ ] `strict: true` activé dans `tsconfig.json`
- [ ] Toutes les fonctions ont des types de retour explicites
- [ ] Pas de `ts-ignore` sans justification écrite

### 3. Validation CDC
- [ ] Les types correspondent au XSD ADEME v2.6
- [ ] Les enums utilisent les valeurs ADEME officielles
- [ ] Les tables de valeurs sont à jour

---

## 🧪 Tests

### Couverture minimale
| Type | Minimum | Cible |
|------|---------|-------|
| Unit tests | 80% | 95% |
| Integration tests | 60% | 80% |
| E2E tests | - | 50% |

### Checklist tests
- [ ] Tous les tests passent (`npm test`)
- [ ] Pas de tests `.only` ou `.skip` oubliés
- [ ] Les mocks sont propres et isolés
- [ ] Les tests sont déterministes (pas de flaky tests)

---

## 📐 Code Quality

### ESLint
- [ ] `npm run lint` passe sans erreurs
- [ ] Pas de warnings ignorés
- [ ] Pas de `eslint-disable` global

### Formatage
- [ ] Prettier est configuré et utilisé
- [ ] `npm run format` (ou équivalent) a été exécuté

### Documentation
- [ ] Les fonctions publiques sont documentées (JSDoc)
- [ ] Les types complexes ont des commentaires
- [ ] Le README est à jour si nécessaire

---

## 🏗️ Architecture

### Structure des fichiers
```
src/
├── types/          # Types TypeScript
├── services/       # Logique métier
├── components/     # Composants React Native
├── hooks/          # Custom hooks
├── utils/          # Fonctions utilitaires
├── constants/      # Constantes
└── __tests__/      # Tests
    ├── unit/
    ├── integration/
    └── fixtures/
```

### Règles
- [ ] Pas de logique métier dans les composants UI
- [ ] Les services sont testables (pas de dépendances cachées)
- [ ] Les types sont dans `/types`, pas dispersés

---

## 🔄 CI/CD

### Avant push
- [ ] `npm run lint` passe
- [ ] `npx tsc --noEmit` passe
- [ ] `npm test` passe
- [ ] `npm audit` ne montre pas de vulnérabilités HIGH/CRITICAL

### Git
- [ ] Les commits sont signés (signed commits)
- [ ] Les messages de commit suivent la convention
- [ ] Pas de fichiers sensibles dans l'historique

---

## 📋 REVIEW CHECKLIST (Pour reviewers)

### Pour chaque PR:
1. [ ] Lire la description et comprendre le besoin
2. [ ] Vérifier les tests ajoutés/modifiés
3. [ ] Vérifier qu'il n'y a pas de secrets
4. [ ] Vérifier les types TypeScript
5. [ ] Vérifier la conformité CDC
6. [ ] Tester localement si nécessaire

### Questions à se poser:
- Est-ce que ce code est maintenable ?
- Est-ce que les noms de variables/fonctions sont clairs ?
- Y a-t-il des cas d'erreur non gérés ?
- Est-ce performant ?

---

## 🚨 PROCESSUS DE BLOCAGE SENTINEL

SENTINEL peut bloquer une PR si:

1. **Secrets détectés** → Blocage immédiat
2. **`any` TypeScript non justifié** → Blocage immédiat
3. **Vulnérabilité HIGH/CRITICAL** → Blocage immédiat
4. **Non-conformité CDC majeure** → Blocage après discussion
5. **Couverture tests < 80%** → Blocage si nouveau code

### Procédure de déblocage:
1. Créer une issue avec label `sentinel-block`
2. Corriger le problème
3. Demander re-review à SENTINEL
4. SENTINEL approuve et retire le blocage

---

## 📚 RÉFÉRENCES

- [CDC Vision DPE](./Cahier_des_Charges.md)
- [Rapport Audit SENTINEL](./RAPPORT_AUDIT_SENTINEL.md)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

**Version:** 1.0  
**Dernière mise à jour:** 2026-02-25  
**Maintenu par:** SENTINEL
