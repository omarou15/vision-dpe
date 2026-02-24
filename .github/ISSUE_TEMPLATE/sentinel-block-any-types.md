# 🔴 [SENTINEL-BLOCK] Types `any` non justifiés dans le code

**Label:** `sentinel-block`, `typescript`, `quality`  
**Assigné à:** @omarou15  
**Date:** 2026-02-25

---

## 🚨 Problème

Le code contient **4 occurrences** de `any` non justifiées, violant la règle TypeScript strict du CDC.

### Fichiers concernés

| Fichier | Ligne | Code |
|---------|-------|------|
| `src/types/validation.ts` | 59 | `check: (data: any) => boolean;` |
| `src/types/validation.ts` | 93 | `(sum: number, b: any) => sum + ...` |
| `src/types/api-ademe.ts` | 23 | `dpe_data: Record<string, any>;` |
| `src/types/api-ademe.ts` | 28 | `dpe_data: Record<string, any>;` |

---

## 🔧 Solutions

### 1. `src/types/validation.ts` L59
**Actuel:**
```typescript
check: (data: any) => boolean;
```

**Proposé:**
```typescript
// Utiliser unknown + type guard
check: (data: unknown) => boolean;
// Ou typer avec l'interface DPE si possible
check: (data: DPEDocument) => boolean;
```

### 2. `src/types/validation.ts` L93
**Actuel:**
```typescript
(sum: number, b: any) => sum + (b.surface || 0), 0
```

**Proposé:**
```typescript
interface BaieVitree {
  surface?: number;
}
(sum: number, b: BaieVitree) => sum + (b.surface || 0), 0
```

### 3. `src/types/api-ademe.ts` L23 et L28
**Actuel:**
```typescript
dpe_data: Record<string, any>;
```

**Proposé:**
```typescript
// Utiliser unknown pour plus de sécurité
dpe_data: Record<string, unknown>;
// Ou mieux, typer avec une interface DPE
dpe_data: Partial<DPEDocument>;
```

---

## ✅ Checklist de validation

- [ ] Tous les `any` remplacés par des types stricts
- [ ] `npx tsc --noEmit` passe sans erreurs
- [ ] ESLint passe (`npm run lint`)
- [ ] Les tests passent (`npm test`)

---

## 📝 Contexte

Le CDC exige:
> "Langage: TypeScript strict"

Les types `any` désactivent la vérification de type, ce qui va à l'encontre de la sécurité du projet.

**Bloqué par SENTINEL jusqu'à résolution.**

---

**Créé par:** SENTINEL  
**Statut:** 🔴 BLOQUÉ
