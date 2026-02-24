# 📚 API Documentation - VISION DPE

Documentation des services et APIs utilisés par l'application VISION DPE.

## Table des matières

- [Services Internes](#services-internes)
  - [AuthService](#authservice)
  - [ValidationService](#validationservice)
  - [XMLGeneratorService](#xmlgeneratorservice)
- [Supabase API](#supabase-api)
- [ADEME API](#ademe-api)
- [Types](#types)

---

## Services Internes

### AuthService

Service d'authentification et gestion des profils utilisateurs.

#### Singleton

```typescript
import { authService } from '../services';

// Utilisation
const result = await authService.signIn({ email, password });
```

#### Méthodes

##### `signUp(data: SignUpData): Promise<AuthResult>`

Inscription d'un nouvel utilisateur.

**Paramètres:**
```typescript
interface SignUpData {
  email: string;                    // Email valide
  password: string;                 // Min 8 caractères
  fullName: string;                 // Nom complet
  company?: string;                 // Société (optionnel)
  siret?: string;                   // SIRET 14 chiffres (optionnel)
  numeroDpeDiagnostiqueur?: string; // Numéro ADEME (optionnel)
  phone?: string;                   // Téléphone (optionnel)
}
```

**Retour:**
```typescript
interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthError;  // { code: string, message: string }
}
```

**Exemple:**
```typescript
const result = await authService.signUp({
  email: 'diagnostiqueur@example.com',
  password: 'securePassword123',
  fullName: 'Jean Dupont',
  company: 'DPE Expert',
  siret: '12345678901234',
  numeroDpeDiagnostiqueur: 'DPE-2024-001',
  phone: '0612345678'
});

if (result.success) {
  console.log('Utilisateur créé:', result.user);
} else {
  console.error('Erreur:', result.error?.message);
}
```

---

##### `signIn(data: SignInData): Promise<AuthResult>`

Connexion utilisateur.

**Paramètres:**
```typescript
interface SignInData {
  email: string;
  password: string;
}
```

**Exemple:**
```typescript
const result = await authService.signIn({
  email: 'diagnostiqueur@example.com',
  password: 'securePassword123'
});
```

---

##### `signOut(): Promise<void>`

Déconnexion de l'utilisateur.

**Exemple:**
```typescript
await authService.signOut();
```

---

##### `getCurrentUser(): Promise<User | null>`

Récupère l'utilisateur courant (avec cache).

**Retour:**
```typescript
interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

interface UserProfile {
  fullName: string;
  company?: string;
  siret?: string;
  numeroDpeDiagnostiqueur?: string;
  phone?: string;
  adressePro?: string;
  codePostalPro?: string;
  communePro?: string;
}
```

**Exemple:**
```typescript
const user = await authService.getCurrentUser();
if (user) {
  console.log('Connecté en tant que:', user.profile.fullName);
}
```

---

##### `updateProfile(data: ProfileUpdateData): Promise<AuthResult>`

Met à jour le profil utilisateur.

**Paramètres:**
```typescript
interface ProfileUpdateData {
  fullName?: string;
  company?: string;
  siret?: string;
  numeroDpeDiagnostiqueur?: string;
  phone?: string;
  adressePro?: string;
  codePostalPro?: string;
  communePro?: string;
}
```

**Exemple:**
```typescript
const result = await authService.updateProfile({
  phone: '0698765432',
  adressePro: '123 Rue de Paris'
});
```

---

##### `resetPassword(email: string): Promise<AuthResult>`

Demande de réinitialisation de mot de passe.

**Exemple:**
```typescript
const result = await authService.resetPassword('user@example.com');
if (result.success) {
  console.log('Email de réinitialisation envoyé');
}
```

---

##### `updatePassword(newPassword: string): Promise<AuthResult>`

Met à jour le mot de passe (après réinitialisation).

**Exemple:**
```typescript
const result = await authService.updatePassword('newSecurePassword123');
```

---

### ValidationService

Service de validation des données DPE selon les règles ADEME.

#### Singleton

```typescript
import { validationService } from '../services';
```

#### Méthodes

##### `validateDocument(document: DPEDocument): ValidationResult`

Valide l'intégralité d'un document DPE.

**Retour:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completedSteps: number[];
  currentStep: number;
}

interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  step?: number;
}
```

**Exemple:**
```typescript
const result = validationService.validateDocument(dpeDocument);

if (result.valid) {
  console.log('Document valide');
} else {
  console.log('Erreurs:', result.errors);
  console.log('Warnings:', result.warnings);
  console.log('Étapes complétées:', result.completedSteps);
  console.log('Étape actuelle:', result.currentStep);
}
```

---

##### `validateStep(document: DPEDocument, step: number): StepValidationResult`

Valide une étape spécifique du DPE (1-13).

**Retour:**
```typescript
interface StepValidationResult {
  step: number;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completedFields: string[];
  missingFields: string[];
}
```

**Exemple:**
```typescript
// Validation étape 1 (Administratif)
const step1Result = validationService.validateStep(dpeDocument, 1);

if (!step1Result.valid) {
  console.log('Champs manquants:', step1Result.missingFields);
}
```

**Règles par étape:**

| Étape | Nom | Règles principales |
|-------|-----|-------------------|
| 1 | Administratif | Dates, nom propriétaire, infos diagnostiqueur, adresse |
| 2 | Caractéristiques | Année construction, surface, niveaux, zone climatique |
| 3 | Murs | Au moins un mur, surfaces positives |
| 4 | Baies vitrées | Surfaces cohérentes |
| 5 | Planchers bas | Au moins un plancher |
| 6 | Planchers haut | Au moins un plancher |
| 7 | Ventilation | Type ventilation requis |
| 8 | Chauffage | Au moins un générateur |
| 9 | ECS | Au moins un générateur |
| 10 | Climatisation | Optionnel |
| 11 | ENR | Optionnel |
| 12 | Validation | - |
| 13 | Export | - |

---

##### `validateFieldValue(document: DPEDocument, fieldPath: string): { valid: boolean; error?: ValidationError }`

Valide un champ spécifique.

**Exemple:**
```typescript
const result = validationService.validateFieldValue(
  dpeDocument,
  'administratif.nom_proprietaire'
);

if (!result.valid) {
  console.log('Erreur:', result.error?.message);
}
```

---

##### `validateCoherence(document: DPEDocument): { errors: ValidationError[]; warnings: ValidationError[] }`

Valide les contraintes de cohérence métier.

**Contraintes vérifiées:**
- Surface habitable positive
- Surface habitable anormalement élevée (> 1000m²)
- Cohérence nombre de niveaux (logement ≤ immeuble)
- Cohérence dates (établissement ≥ visite)
- Cohérence année / période construction

**Exemple:**
```typescript
const { errors, warnings } = validationService.validateCoherence(dpeDocument);
```

---

### XMLGeneratorService

Service de génération XML conforme au format ADEME.

#### Singleton

```typescript
import { xmlGeneratorService } from '../services';
```

#### Méthodes

##### `generateXML(document: DPEDocument, options?: XMLExportOptions): XMLGenerationResult`

Génère le XML complet d'un DPE.

**Paramètres:**
```typescript
interface XMLExportOptions {
  include_validation: boolean;  // Valider avant génération
  format: 'standard' | 'complet';
}
```

**Retour:**
```typescript
interface XMLGenerationResult {
  success: boolean;
  xml?: string;
  error?: string;
}
```

**Exemple:**
```typescript
const result = xmlGeneratorService.generateXML(dpeDocument, {
  include_validation: true,
  format: 'standard'
});

if (result.success) {
  console.log('XML généré:', result.xml);
  // Envoyer à l'API ADEME
} else {
  console.error('Erreur:', result.error);
}
```

---

##### `generateAdministratifXML(document: DPEDocument): XMLGenerationResult`

Génère uniquement la partie administratif.

**Exemple:**
```typescript
const result = xmlGeneratorService.generateAdministratifXML(dpeDocument);
```

---

##### `generateLogementXML(document: DPEDocument): XMLGenerationResult`

Génère uniquement la partie logement.

**Exemple:**
```typescript
const result = xmlGeneratorService.generateLogementXML(dpeDocument);
```

---

##### `validateDocumentStructure(document: DPEDocument): XMLValidationResult`

Valide la structure du document avant génération.

**Retour:**
```typescript
interface XMLValidationResult {
  valid: boolean;
  schema_errors: string[];
  coherence_errors: string[];
}
```

---

##### `validateXMLAgainstSchema(xmlContent: string): Promise<XMLValidationResult>`

Valide le XML généré contre le schéma XSD ADEME.

**Note:** Nécessite une connexion API ADEME ou serveur de validation.

---

##### `escapeXml(str: string): string`

Échappe les caractères spéciaux XML.

**Exemple:**
```typescript
const safe = xmlGeneratorService.escapeXml('Texte avec <caractères> spéciaux');
// Résultat: 'Texte avec &lt;caractères&gt; spéciaux'
```

---

##### `formatDate(date: Date | string): string`

Formate une date au format ISO 8601 (YYYY-MM-DD).

---

## Supabase API

### Configuration

```typescript
import { supabase } from '../lib/supabase';
```

### Tables

#### users_profiles

```typescript
// Lecture
const { data, error } = await supabase
  .from('users_profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Mise à jour
const { error } = await supabase
  .from('users_profiles')
  .update({ full_name: 'Nouveau Nom' })
  .eq('id', userId);
```

#### dpe_drafts

```typescript
// Créer un brouillon
const { data, error } = await supabase
  .from('dpe_drafts')
  .insert({
    user_id: userId,
    current_step: 1,
    data: {},
  })
  .select()
  .single();

// Mettre à jour
const { error } = await supabase
  .from('dpe_drafts')
  .update({
    current_step: 3,
    data: { /* données DPE */ },
    last_saved_at: new Date().toISOString(),
  })
  .eq('id', draftId);

// Liste des brouillons
const { data, error } = await supabase
  .from('dpe_drafts')
  .select('*')
  .eq('user_id', userId)
  .order('updated_at', { ascending: false });
```

#### dpe_documents

```typescript
// Créer un document validé
const { data, error } = await supabase
  .from('dpe_documents')
  .insert({
    user_id: userId,
    numero_dpe: 'DPE-2024-001234',
    type_dpe: 'existant',
    status: 'validated',
    data: { /* données complètes */ },
    xml_content: xmlString,
  });

// Recherche
const { data, error } = await supabase
  .from('dpe_documents')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'validated')
  .gte('date_etablissement', '2024-01-01');
```

### Authentification

```typescript
// Inscription
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// Connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Déconnexion
await supabase.auth.signOut();

// Utilisateur courant
const { data: { user } } = await supabase.auth.getUser();
```

### Storage (Pièces jointes)

```typescript
// Upload
const { data, error } = await supabase
  .storage
  .from('dpe-attachments')
  .upload(`dpe/${dpeId}/${fileName}`, file);

// URL publique
const { data: { publicUrl } } = supabase
  .storage
  .from('dpe-attachments')
  .getPublicUrl(`dpe/${dpeId}/${fileName}`);
```

---

## ADEME API

### Configuration

```typescript
const ADEME_API_BASE_URL = 'https://api.ademe.fr/dpe';
```

### Endpoints

#### Contrôle de Cohérence

```typescript
POST /controle_coherence
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "dpe_data": { /* données DPE */ },
  "version": "2.6",
  "type_dpe": "existant"
}
```

**Réponse:**
```typescript
{
  "valid": boolean;
  "errors": AdemeError[];
  "warnings": AdemeWarning[];
  "metadata": {
    "version": string;
    "timestamp": string;
    "request_id": string;
  }
}
```

#### Traduction XML

```typescript
POST /traduction_xml
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "dpe_data": { /* données DPE */ },
  "version": "2.6",
  "format": "standard"
}
```

**Réponse:**
```typescript
{
  "success": boolean;
  "xml_content"?: string;
  "errors"?: AdemeError[];
  "metadata": { ... }
}
```

#### Validation XSD

```typescript
POST /validation_xsd
Content-Type: application/xml
Authorization: Bearer {api_key}

{xml_content}
```

**Réponse:**
```typescript
{
  "valid": boolean;
  "schema_errors": SchemaError[];
  "coherence_errors": AdemeError[];
  "metadata": { ... }
}
```

#### Enregistrement DPE

```typescript
POST /enregistrement
Content-Type: application/xml
Authorization: Bearer {api_key}

{xml_content}
```

---

## Types

### Import des types

```typescript
// Tous les types
import * as Types from '../types';

// Types spécifiques
import { DPEDocument, ValidationResult } from '../types';
import { SignUpData, AuthResult } from '../services';
```

### Types principaux

Voir les fichiers:
- `/src/types/dpe.ts` - Types DPE (enums, interfaces)
- `/src/types/validation.ts` - Types validation
- `/src/types/api-ademe.ts` - Types API ADEME
- `/src/types/auth.ts` - Types authentification
- `/src/types/tables-valeurs.ts` - Tables de valeurs 3CL

---

## Codes d'erreur

### AuthErrorCode

| Code | Description |
|------|-------------|
| `INVALID_EMAIL` | Format email invalide |
| `INVALID_PASSWORD` | Mot de passe trop court (< 8 caractères) |
| `INVALID_NAME` | Nom complet requis |
| `INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| `AUTH_ERROR` | Erreur d'authentification Supabase |
| `USER_CREATION_FAILED` | Échec création utilisateur |
| `PROFILE_CREATION_FAILED` | Échec création profil |
| `NOT_AUTHENTICATED` | Utilisateur non connecté |
| `UPDATE_FAILED` | Échec mise à jour |
| `RESET_FAILED` | Échec réinitialisation mot de passe |
| `UNKNOWN_ERROR` | Erreur inconnue |

### ValidationError Codes

| Code | Description |
|------|-------------|
| `STEP_{N}_{FIELD}` | Erreur sur un champ spécifique |
| `COHERENCE_*` | Erreur de cohérence métier |
| `MUR_*` | Erreur sur un mur spécifique |
| `BAIE_*` | Erreur sur une baie vitrée |
| `PLANCHER_*` | Erreur sur un plancher |

---

## Exemples complets

### Flux complet: Création et validation d'un DPE

```typescript
import { authService, validationService, xmlGeneratorService } from '../services';
import { DPEDocument, EnumPeriodeConstruction, EnumZoneClimatique } from '../types';

async function createAndValidateDPE() {
  // 1. Authentification
  const authResult = await authService.signIn({
    email: 'diagnostiqueur@example.com',
    password: 'password'
  });
  
  if (!authResult.success) {
    throw new Error(authResult.error?.message);
  }

  // 2. Créer un document DPE
  const dpeDocument: DPEDocument = {
    version: '8.0.4',
    administratif: {
      date_visite_diagnostiqueur: '2024-01-15',
      date_etablissement_dpe: '2024-01-16',
      nom_proprietaire: 'Martin',
      enum_modele_dpe_id: 1,
      enum_version_id: '2.6',
      diagnostiqueur: {
        usr_logiciel_id: 12345,
        version_logiciel: '1.0.0',
        nom_diagnostiqueur: 'Dupont',
        prenom_diagnostiqueur: 'Jean',
        mail_diagnostiqueur: 'jean@example.com',
        telephone_diagnostiqueur: '0612345678',
        adresse_diagnostiqueur: '123 Rue de Paris',
        entreprise_diagnostiqueur: 'DPE Expert',
        numero_certification_diagnostiqueur: 'CERT-2024-001',
        organisme_certificateur: 'CERTIF',
      },
      geolocalisation: {
        adresses: {
          adresse_proprietaire: { /* ... */ } as any,
          adresse_bien: { /* ... */ } as any,
        },
      },
    },
    logement: {
      caracteristique_generale: {
        annee_construction: 1985,
        enum_periode_construction_id: EnumPeriodeConstruction.PERIODE_1983_1988,
        enum_methode_application_dpe_log_id: 1,
        surface_habitable_logement: 85,
        nombre_niveau_immeuble: 2,
        nombre_niveau_logement: 1,
        hsp: 2.5,
      },
      meteo: {
        enum_zone_climatique_id: EnumZoneClimatique.H1B,
        enum_classe_altitude_id: 1,
        batiment_materiaux_anciens: 0,
      },
      enveloppe: {
        inertie: {
          inertie_plancher_bas_lourd: 0,
          inertie_plancher_haut_lourd: 0,
          inertie_paroi_verticale_lourd: 0,
          enum_classe_inertie_id: 2,
        },
        mur_collection: { mur: [] as any },
        baie_vitree_collection: { baie_vitree: [] as any },
        plancher_bas_collection: { plancher_bas: [] as any },
        plancher_haut_collection: { plancher_haut: [] as any },
      },
      ventilation: {} as any,
    },
  };

  // 3. Validation étape par étape
  for (let step = 1; step <= 13; step++) {
    const result = validationService.validateStep(dpeDocument, step);
    console.log(`Étape ${step}:`, result.valid ? '✅' : '❌');
    
    if (!result.valid) {
      console.log('  Erreurs:', result.errors.map(e => e.message));
    }
  }

  // 4. Validation complète
  const fullValidation = validationService.validateDocument(dpeDocument);
  console.log('Document valide:', fullValidation.valid);

  // 5. Génération XML
  const xmlResult = xmlGeneratorService.generateXML(dpeDocument, {
    include_validation: true,
    format: 'standard'
  });

  if (xmlResult.success) {
    console.log('XML généré avec succès');
    // Envoyer à l'API ADEME
  }
}
```

---

## Notes de sécurité

1. **Ne jamais** stocker les clés API en dur dans le code
2. Utiliser les variables d'environnement (`.env`)
3. Les tokens d'authentification sont gérés automatiquement par Supabase
4. Toutes les tables ont RLS activé
5. Valider les données côté client ET serveur
