# 🛡️ SENTINEL - Guide de Surveillance des PRs

> Procédures pour auditer les PRs créées par FORGE, NEXUS, et MIRROR

---

## 🎯 Mission

SENTINEL est responsable de la qualité et de la sécurité du code. Aucune PR ne merge sans approbation explicite de SENTINEL.

---

## 📋 Checklist d'Audit de PR

### 1. Pré-requis (avant review)
- [ ] Lire la description de la PR
- [ ] Vérifier les issues liées
- [ ] Comprendre le besoin métier

### 2. Sécurité 🔒
- [ ] **Aucun secret en dur**
  - Pas de clés API
  - Pas de tokens
  - Pas de mots de passe
  - Pas d'URLs avec credentials
- [ ] Pas de `console.log` de données sensibles
- [ ] Pas de données personnelles exposées

### 3. TypeScript Strict 📘
- [ ] **Aucun `any` non justifié**
  - Si `any` présent: demander justification ou correction
  - Préférer `unknown` ou typer correctement
- [ ] Fonctions avec types de retour explicites
- [ ] Pas de `ts-ignore` sans commentaire

### 4. Qualité du Code ✨
- [ ] ESLint passe (`npm run lint`)
- [ ] TypeScript compile (`npx tsc --noEmit`)
- [ ] Tests passent (`npm test`)
- [ ] Pas de code mort (commentaires, console.log)
- [ ] Noms de variables/fonctions explicites

### 5. Conformité CDC 📖
- [ ] Types cohérents avec XSD ADEME
- [ ] Enums ADEME correctement utilisés
- [ ] Tables de valeurs à jour
- [ ] Documentation mise à jour si nécessaire

### 6. Tests 🧪
- [ ] Tests unitaires présents pour le nouveau code
- [ ] Tests d'intégration si nécessaire
- [ ] Couverture > 95% pour le nouveau code

---

## 🔴 Critères de Blocage (BLOCK)

Une PR est **BLOQUÉE** si:

| Critère | Action |
|---------|--------|
| Secrets en dur | 🚫 Blocage immédiat |
| `any` non justifié | 🚫 Blocage immédiat |
| Vulnérabilité HIGH/CRITICAL | 🚫 Blocage immédiat |
| ESLint échoue | 🚫 Blocage immédiat |
| Tests échouent | 🚫 Blocage immédiat |
| Non-conformité CDC majeure | 🚫 Blocage après discussion |

---

## 🟡 Critères d'Attention (WARNING)

Demander des modifications si:

- `console.log` non justifiés
- Commentaires en français/anglais mélangés
- Fonctions trop longues (>50 lignes)
- Pas de documentation JSDoc
- Complexité cyclomatique élevée

---

## ✅ Processus d'Approbation

### Si la PR est OK:
1. Approuver la PR sur GitHub
2. Ajouter le label `sentinel-approved`
3. Commenter: "✅ Approuvé par SENTINEL"

### Si la PR doit être corrigée:
1. Demander des changements (Request changes)
2. Créer une issue avec label `sentinel-block` si nécessaire
3. Décrire précisément les problèmes
4. Attendre les corrections

---

## 📝 Template de Commentaire SENTINEL

### Approbation:
```
## ✅ SENTINEL APPROVAL

- [x] Sécurité: OK
- [x] TypeScript: OK
- [x] Qualité: OK
- [x] Tests: OK
- [x] CDC: OK

**Statut:** APPROUVÉ pour merge
```

### Blocage:
```
## 🔴 SENTINEL BLOCK

**Problèmes identifiés:**
1. [Description du problème 1]
2. [Description du problème 2]

**Actions requises:**
- [ ] Action 1
- [ ] Action 2

**Issue créée:** #XXX

**Statut:** BLOQUÉ jusqu'à correction
```

---

## 🔄 Workflow de Surveillance

### Quotidien:
1. Vérifier les nouvelles PRs
2. Auditer les PRs en attente
3. Relancer si nécessaire

### Hebdomadaire:
1. Revue des PRs mergées
2. Analyse des tendances de qualité
3. Mise à jour des règles si nécessaire

---

## 📊 Métriques à Suivre

- Nombre de PRs auditées/semaine
- Taux de blocage
- Temps moyen de review
- Taux de conformité TypeScript

---

**Document maintenu par:** SENTINEL  
**Dernière mise à jour:** 2026-02-25
