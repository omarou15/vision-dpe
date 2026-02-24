# 🔴 [SENTINEL-BLOCK] Vulnérabilités HIGH/CRITICAL dans les dépendances

**Label:** `sentinel-block`, `security`, `high-priority`  
**Assigné à:** @omarou15  
**Date:** 2026-02-25

---

## 🚨 Problème

L'audit npm révèle **22 vulnérabilités HIGH/CRITICAL**, principalement liées à `minimatch` < 10.2.1.

### Vulnérabilité détectée
- **Package:** `minimatch`
- **Version affectée:** < 10.2.1
- **Sévérité:** HIGH
- **Type:** ReDoS (Regular Expression Denial of Service)
- **CVE:** [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26)

### Impact
Attaque par déni de service via des patterns wildcards répétés.

---

## 🔧 Solution

### Option 1: Mise à jour automatique (recommandée)
```bash
npm audit fix
```

### Option 2: Mise à jour manuelle
```bash
npm update minimatch
npm audit fix --force  # Si nécessaire
```

### Option 3: Forcer la version
Dans `package.json`:
```json
"overrides": {
  "minimatch": "^10.2.1"
}
```

---

## ✅ Checklist de validation

- [ ] `npm audit` ne montre plus de vulnérabilités HIGH/CRITICAL
- [ ] L'application démarre correctement (`npm start`)
- [ ] Les tests passent (`npm test`)
- [ ] Le build fonctionne (`eas build` local si possible)

---

## 📝 Contexte

Cette vulnérabilité affecte plusieurs packages transitifs:
- `eslint`
- `@expo/cli`
- `react-native`
- `glob`

**Bloqué par SENTINEL jusqu'à résolution.**

---

**Créé par:** SENTINEL  
**Statut:** 🔴 BLOQUÉ
