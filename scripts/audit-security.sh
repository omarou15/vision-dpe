#!/bin/bash
# =============================================================================
# SCRIPT D'AUDIT SÉCURITÉ - Vision DPE
# SENTINEL - Responsable Qualité & Sécurité
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0

echo "🔒 ==========================================="
echo "🔒 AUDIT SÉCURITÉ - Vision DPE"
echo "🔒 ==========================================="
echo ""

# -----------------------------------------------------------------------------
# 1. Vérification des secrets dans le code
# -----------------------------------------------------------------------------
echo "📋 Étape 1: Vérification des secrets en dur..."

# Patterns à rechercher
PATTERNS=(
    "api_key.*=.*['\"][a-zA-Z0-9_\-]{20,}['\"]"
    "apikey.*=.*['\"][a-zA-Z0-9_\-]{20,}['\"]"
    "token.*=.*['\"][a-zA-Z0-9_\-]{20,}['\"]"
    "password.*=.*['\"][^'\"]+['\"]"
    "secret.*=.*['\"][a-zA-Z0-9_\-]{10,}['\"]"
    "supabase.*key.*['\"]"
    "EXPO_TOKEN.*['\"]"
)

SECRET_FOUND=0
for pattern in "${PATTERNS[@]}"; do
    if grep -r -i -E "$pattern" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" src/ 2>/dev/null | grep -v "node_modules" | grep -v "__tests__" | grep -v ".spec." | grep -v "example" | grep -v "your-" | grep -v "placeholder"; then
        SECRET_FOUND=1
    fi
done

if [ $SECRET_FOUND -eq 1 ]; then
    echo -e "${RED}❌ ERREUR: Secrets potentiels détectés dans le code!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Aucun secret détecté dans le code${NC}"
fi

# -----------------------------------------------------------------------------
# 2. Vérification des fichiers .env
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 2: Vérification des fichiers .env..."

if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  ATTENTION: Fichier .env présent (vérifiez qu'il est dans .gitignore)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Pas de fichier .env dans le repo${NC}"
fi

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ Fichier .env.example présent${NC}"
else
    echo -e "${YELLOW}⚠️  ATTENTION: Fichier .env.example manquant${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# -----------------------------------------------------------------------------
# 3. Audit des dépendances npm
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 3: Audit des dépendances..."

if command -v npm &> /dev/null; then
    # Vérifier les vulnérabilités HIGH et CRITICAL
    VULN=$(npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' 2>/dev/null || echo "0")
    
    if [ "$VULN" -gt 0 ] 2>/dev/null; then
        echo -e "${RED}❌ ERREUR: $VULN vulnérabilités HIGH/CRITICAL détectées!${NC}"
        echo "   Exécutez 'npm audit' pour plus de détails"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ Pas de vulnérabilités HIGH/CRITICAL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npm non disponible, audit ignoré${NC}"
fi

# -----------------------------------------------------------------------------
# 4. Vérification TypeScript strict
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 4: Vérification TypeScript..."

if [ -f "tsconfig.json" ]; then
    if grep -q '"strict": true' tsconfig.json; then
        echo -e "${GREEN}✅ Mode strict activé dans tsconfig.json${NC}"
    else
        echo -e "${RED}❌ ERREUR: Mode strict non activé dans tsconfig.json!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ ERREUR: tsconfig.json manquant!${NC}"
    ERRORS=$((ERRORS + 1))
fi

# -----------------------------------------------------------------------------
# 5. Vérification ESLint
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 5: Vérification ESLint..."

if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    ESLINT_FILE=$(ls -a .eslintrc* 2>/dev/null | head -1)
    if grep -q 'no-explicit-any' "$ESLINT_FILE"; then
        if grep -q 'no-explicit-any.*error' "$ESLINT_FILE"; then
            echo -e "${GREEN}✅ ESLint: no-explicit-any en error${NC}"
        else
            echo -e "${YELLOW}⚠️  ESLint: no-explicit-any en warn (devrait être error)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  ESLint: règle no-explicit-any manquante${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Configuration ESLint non trouvée${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# -----------------------------------------------------------------------------
# 6. Vérification des types 'any'
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 6: Recherche de types 'any'..."

ANY_COUNT=$(grep -r ": any" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)

if [ "$ANY_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $ANY_COUNT occurrence(s) de ': any' trouvée(s)${NC}"
    echo "   Liste des occurrences:"
    grep -rn ": any" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
    if [ "$ANY_COUNT" -gt 10 ]; then
        echo "   ... et $((ANY_COUNT - 10)) autres"
    fi
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Aucun type 'any' trouvé${NC}"
fi

# -----------------------------------------------------------------------------
# 7. Vérification des console.log
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 7: Recherche de console.log..."

LOG_COUNT=$(grep -r "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)

if [ "$LOG_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $LOG_COUNT console.log trouvé(s)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Aucun console.log trouvé${NC}"
fi

# -----------------------------------------------------------------------------
# 8. Vérification des fichiers sensibles
# -----------------------------------------------------------------------------
echo ""
echo "📋 Étape 8: Vérification des fichiers sensibles..."

SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "*.pem"
    "*.key"
    "credentials.json"
    "service-account.json"
)

SENSITIVE_FOUND=0
for file in "${SENSITIVE_FILES[@]}"; do
    if ls $file 2>/dev/null | grep -q .; then
        echo -e "${RED}❌ Fichier sensible trouvé: $file${NC}"
        SENSITIVE_FOUND=1
    fi
done

if [ $SENSITIVE_FOUND -eq 1 ]; then
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Aucun fichier sensible trouvé${NC}"
fi

# -----------------------------------------------------------------------------
# RÉSUMÉ
# -----------------------------------------------------------------------------
echo ""
echo "🔒 ==========================================="
echo "🔒 RÉSUMÉ DE L'AUDIT"
echo "🔒 ==========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ AUDIT RÉUSSI - Aucun problème détecté${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  AUDIT TERMINÉ avec $WARNINGS avertissement(s)${NC}"
    exit 0
else
    echo -e "${RED}❌ AUDIT ÉCHOUÉ - $ERRORS erreur(s), $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "Corrigez les erreurs avant de continuer."
    exit 1
fi
