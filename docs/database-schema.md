# Database Schema VISION DPE

## Vue d'ensemble

Schema PostgreSQL conforme au CDC VISION et à la méthode 3CL ADEME v2.6.

## Tables

### users_profiles
Profils des diagnostiqueurs DPE.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Clé primaire (référence auth.users) |
| full_name | VARCHAR(255) | Nom complet du diagnostiqueur |
| company | VARCHAR(255) | Société |
| siret | VARCHAR(14) | Numéro SIRET |
| numero_dpe_diagnostiqueur | VARCHAR(50) | Numéro ADEME du diagnostiqueur |
| phone | VARCHAR(20) | Téléphone |
| email | VARCHAR(255) | Email |
| adresse_pro | VARCHAR(255) | Adresse professionnelle |
| code_postal_pro | VARCHAR(10) | Code postal |
| commune_pro | VARCHAR(100) | Commune |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Date de modification |

### dpe_drafts
Brouillons de DPE en cours de saisie (13 étapes).

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| user_id | UUID | Référence utilisateur |
| numero_dpe | VARCHAR(50) | Numéro DPE unique (généré auto) |
| current_step | INTEGER | Étape actuelle (1-13) |
| data | JSONB | Données du formulaire |
| validation_status | VARCHAR(20) | État: incomplete/valid/invalid |
| validation_errors | JSONB | Erreurs de validation |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Date de modification |
| last_saved_at | TIMESTAMPTZ | Dernière sauvegarde |

### dpe_documents
DPE complétés et validés.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| user_id | UUID | Référence utilisateur |
| numero_dpe | VARCHAR(50) | Numéro ADEME unique |
| type_dpe | VARCHAR(20) | Type: existant/neuf/tertiaire |
| status | VARCHAR(20) | État: draft/validated/submitted/rejected |
| date_visite | DATE | Date de visite |
| date_etablissement | DATE | Date d'établissement |
| date_validation | TIMESTAMPTZ | Date de validation |
| date_soumission | TIMESTAMPTZ | Date de soumission ADEME |
| data | JSONB | Données complètes DPE |
| resultats | JSONB | Résultats calculés |
| xml_content | TEXT | XML généré conforme XSD |
| xml_version | VARCHAR(10) | Version XSD (2.6) |
| ademe_validation_response | JSONB | Réponse API ADEME |
| ademe_request_id | VARCHAR(100) | ID requête ADEME |

### dpe_validations
Historique des validations (locale et ADEME).

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| dpe_id | UUID | Référence DPE |
| validation_type | VARCHAR(20) | Type: local/ademe_api/xsd |
| is_valid | BOOLEAN | Résultat validation |
| errors | JSONB | Erreurs détectées |
| warnings | JSONB | Warnings |
| raw_response | JSONB | Réponse brute ADEME |
| validated_at | TIMESTAMPTZ | Date validation |
| validated_by | UUID | Utilisateur validateur |

### enum_cache
Cache des enums et tables de valeurs ADEME.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| cache_type | VARCHAR(20) | Type: enum/table_valeur/xml_schema |
| enum_id | VARCHAR(100) | Identifiant enum |
| table_id | VARCHAR(100) | Identifiant table (optionnel) |
| data | JSONB | Données JSON |
| version | VARCHAR(20) | Version ADEME |
| valid_from | DATE | Date début validité |
| valid_until | DATE | Date fin validité |

### dpe_attachments
Pièces jointes (photos, documents).

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| dpe_id | UUID | Référence DPE |
| attachment_type | VARCHAR(50) | Type de pièce jointe |
| file_name | VARCHAR(255) | Nom fichier |
| file_size | INTEGER | Taille en octets |
| mime_type | VARCHAR(100) | Type MIME |
| storage_path | VARCHAR(500) | Chemin Supabase Storage |
| public_url | VARCHAR(500) | URL publique |
| description | TEXT | Description |
| uploaded_at | TIMESTAMPTZ | Date upload |
| uploaded_by | UUID | Utilisateur uploader |

## RLS (Row Level Security)

Toutes les tables ont RLS activé:
- **users_profiles**: Utilisateur ne voit que son profil
- **dpe_drafts**: Utilisateur ne voit que ses brouillons
- **dpe_documents**: Utilisateur ne voit que ses documents
- **dpe_validations**: Utilisateur ne voit que les validations de ses documents
- **dpe_attachments**: Utilisateur ne voit que les pièces jointes de ses documents
- **enum_cache**: Lecture publique pour tous les utilisateurs authentifiés

## Indexes

- `idx_dpe_drafts_user_id` sur dpe_drafts(user_id)
- `idx_dpe_drafts_numero_dpe` sur dpe_drafts(numero_dpe)
- `idx_dpe_documents_user_id` sur dpe_documents(user_id)
- `idx_dpe_documents_numero_dpe` sur dpe_documents(numero_dpe)
- `idx_dpe_documents_status` sur dpe_documents(status)
- `idx_enum_cache_type_id` sur enum_cache(cache_type, enum_id)

## Triggers

- `update_updated_at_column()`: Met à jour automatiquement `updated_at` sur toutes les tables
