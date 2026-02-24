# Database Schema

## Tables

### dpe_documents
Stockage des DPE complétés et validés.

| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Identifiant unique |
| user_id | uuid | Référence auth.users |
| numero_dpe | varchar(50) | Numéro ADEME |
| xml_content | text | XML généré |
| status | varchar(20) | draft/validated/submitted |
| created_at | timestamptz | Date création |
| updated_at | timestamptz | Date modification |

### dpe_drafts
Brouillons de DPE en cours de saisie.

| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Identifiant unique |
| user_id | uuid | Référence auth.users |
| data | jsonb | Données du formulaire |
| current_step | integer | Étape actuelle (1-13) |
| created_at | timestamptz | Date création |
| updated_at | timestamptz | Date modification |

### users_profiles
Profils des diagnostiqueurs.

| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Référence auth.users |
| full_name | varchar(255) | Nom complet |
| company | varchar(255) | Société |
| siret | varchar(14) | SIRET |
| phone | varchar(20) | Téléphone |

## RLS Policies

Toutes les tables ont RLS activé avec policies restrictives:
- Les utilisateurs ne peuvent voir que leurs propres données
- Admin peut tout voir (à configurer)
