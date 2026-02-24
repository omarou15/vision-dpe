# 🔧 Setup Protections GitHub - Guide SENTINEL

> Ce document décrit les protections à configurer sur le repo Vision DPE

---

## 🛡️ Branch Protection Rules (main)

### Configuration recommandée

1. **Aller dans:** Settings → Branches → Add rule

2. **Branch name pattern:** `main`

3. **Protect matching branches:**
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: **1**
     - ✅ Dismiss stale PR approvals when new commits are pushed
     - ✅ Require review from SENTINEL (code owners)
   
   - ✅ **Require status checks to pass**
     - ✅ Require branches to be up to date before merging
     - Status checks:
       - `lint-and-test` (from ci.yml)
       - `Type check` (from ci.yml)
       - `Test` (from ci.yml)
   
   - ✅ **Require conversation resolution before merging**
   
   - ✅ **Require signed commits**
   
   - ✅ **Include administrators** (même les admins doivent suivre les règles)

---

## 👥 Code Owners

Créer un fichier `.github/CODEOWNERS`:

```
# Global - SENTINEL doit approuver tout changement
* @omarou15 @sentinel

# Configuration critique
/.github/ @sentinel
/tsconfig.json @sentinel
.eslintrc.json @sentinel
package.json @sentinel

# Documentation
docs/ @omarou15 @sentinel

# Scripts de sécurité
scripts/audit-security.sh @sentinel
```

---

## 🔒 Security Settings

### Secret Scanning
1. Settings → Security → Secret scanning
2. ✅ Enable secret scanning
3. ✅ Enable push protection

### Dependabot
1. Settings → Security → Dependabot
2. ✅ Enable Dependabot alerts
3. ✅ Enable Dependabot security updates

---

## 📝 Required Status Checks

Dans `.github/workflows/ci.yml`, les jobs suivants doivent passer:

```yaml
jobs:
  lint-and-test:
    # Ce job doit inclure:
    # - ESLint
    # - TypeScript check
    # - Tests avec coverage
```

### À ajouter au workflow CI:

```yaml
- name: Security audit
  run: npm audit --audit-level=high

- name: Run security script
  run: ./scripts/audit-security.sh || true
```

---

## 🚫 Merge Requirements

Avant de merger une PR:

1. ✅ **Review requise:** Minimum 1 approval
2. ✅ **Review SENTINEL:** Obligatoire pour les fichiers critiques
3. ✅ **Status checks:** Tous doivent passer
4. ✅ **Conversations resolved:** Tous les threads fermés
5. ✅ **Up to date:** Branch à jour avec main
6. ✅ **No conflicts:** Pas de conflits de merge

---

## 🔄 Processus de Développement

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Feature   │────▶│     PR      │────▶│   Review    │
│   Branch    │     │   Created   │     │  (1+ dev)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                       ┌───────────────────────┘
                       ▼
              ┌─────────────┐     ┌─────────────┐
              │   SENTINEL  │────▶│    Merge    │
              │   Approval  │     │   to main   │
              └─────────────┘     └─────────────┘
```

---

## 📋 Checklist de Configuration

- [ ] Branch protection rule créée pour `main`
- [ ] Require PR + 1 approval activé
- [ ] Status checks requis configurés
- [ ] CODEOWNERS créé
- [ ] Secret scanning activé
- [ ] Dependabot activé
- [ ] Push protection activé

---

**Document maintenu par:** SENTINEL  
**Dernière mise à jour:** 2026-02-25
