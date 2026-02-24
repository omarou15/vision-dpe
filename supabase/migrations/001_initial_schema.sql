-- ============================================================================
-- MIGRATION 001 - Schema Supabase VISION DPE
-- Basé sur CDC VISION - Cahier des Charges
-- Conforme méthode 3CL ADEME v2.6
-- ============================================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: users_profiles
-- Profils des diagnostiqueurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations professionnelles
    full_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    siret VARCHAR(14),
    numero_dpe_diagnostiqueur VARCHAR(50),
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Adresse professionnelle
    adresse_pro VARCHAR(255),
    code_postal_pro VARCHAR(10),
    commune_pro VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.users_profiles IS 'Profils des diagnostiqueurs DPE';

-- ============================================================================
-- TABLE: dpe_drafts
-- Brouillons de DPE en cours de saisie
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dpe_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identifiant unique du DPE (généré automatiquement)
    numero_dpe VARCHAR(50) UNIQUE,
    
    -- Étape actuelle du wizard (1-13)
    current_step INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 13),
    
    -- Données du formulaire (JSONB flexible)
    data JSONB DEFAULT '{}',
    
    -- État de validation
    validation_status VARCHAR(20) DEFAULT 'incomplete' 
        CHECK (validation_status IN ('incomplete', 'valid', 'invalid')),
    validation_errors JSONB DEFAULT '[]',
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.dpe_drafts IS 'Brouillons de DPE en cours de saisie (13 étapes)';

-- Index pour recherche rapide
CREATE INDEX idx_dpe_drafts_user_id ON public.dpe_drafts(user_id);
CREATE INDEX idx_dpe_drafts_numero_dpe ON public.dpe_drafts(numero_dpe);

-- ============================================================================
-- TABLE: dpe_documents
-- DPE complétés et validés
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dpe_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identifiant unique ADEME
    numero_dpe VARCHAR(50) UNIQUE NOT NULL,
    
    -- Type de DPE
    type_dpe VARCHAR(20) NOT NULL 
        CHECK (type_dpe IN ('existant', 'neuf', 'tertiaire')),
    
    -- Statut du document
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'validated', 'submitted', 'rejected')),
    
    -- Dates importantes
    date_visite DATE,
    date_etablissement DATE DEFAULT CURRENT_DATE,
    date_validation TIMESTAMP WITH TIME ZONE,
    date_soumission TIMESTAMP WITH TIME ZONE,
    
    -- Données complètes du DPE
    data JSONB NOT NULL,
    
    -- Résultats calculés
    resultats JSONB,
    
    -- Contenu XML généré
    xml_content TEXT,
    xml_version VARCHAR(10) DEFAULT '2.6',
    
    -- Validation ADEME
    ademe_validation_response JSONB,
    ademe_request_id VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.dpe_documents IS 'DPE complétés et validés prêts pour soumission ADEME';

-- Index
CREATE INDEX idx_dpe_documents_user_id ON public.dpe_documents(user_id);
CREATE INDEX idx_dpe_documents_numero_dpe ON public.dpe_documents(numero_dpe);
CREATE INDEX idx_dpe_documents_status ON public.dpe_documents(status);
CREATE INDEX idx_dpe_documents_date_etablissement ON public.dpe_documents(date_etablissement);

-- ============================================================================
-- TABLE: dpe_validations
-- Historique des validations (locale et ADEME)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dpe_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dpe_id UUID NOT NULL REFERENCES public.dpe_documents(id) ON DELETE CASCADE,
    
    -- Type de validation
    validation_type VARCHAR(20) NOT NULL 
        CHECK (validation_type IN ('local', 'ademe_api', 'xsd')),
    
    -- Résultat
    is_valid BOOLEAN NOT NULL,
    
    -- Erreurs et warnings
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    
    -- Réponse brute ADEME (si applicable)
    raw_response JSONB,
    
    -- Métadonnées
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.dpe_validations IS 'Historique des validations DPE';

CREATE INDEX idx_dpe_validations_dpe_id ON public.dpe_validations(dpe_id);

-- ============================================================================
-- TABLE: enum_cache
-- Cache des tables de valeurs et enums ADEME
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enum_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Type de donnée
    cache_type VARCHAR(20) NOT NULL 
        CHECK (cache_type IN ('enum', 'table_valeur', 'xml_schema')),
    
    -- Identifiant
    enum_id VARCHAR(100) NOT NULL,
    table_id VARCHAR(100),
    
    -- Données
    data JSONB NOT NULL,
    
    -- Version et date
    version VARCHAR(20) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique
    UNIQUE(cache_type, enum_id, version)
);

COMMENT ON TABLE public.enum_cache IS 'Cache des enums et tables de valeurs ADEME';

CREATE INDEX idx_enum_cache_type_id ON public.enum_cache(cache_type, enum_id);
CREATE INDEX idx_enum_cache_version ON public.enum_cache(version);

-- ============================================================================
-- TABLE: dpe_attachments
-- Pièces jointes (photos, documents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dpe_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dpe_id UUID NOT NULL REFERENCES public.dpe_documents(id) ON DELETE CASCADE,
    
    -- Type de pièce jointe
    attachment_type VARCHAR(50) NOT NULL,
    
    -- Métadonnées fichier
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- URL Supabase Storage
    storage_path VARCHAR(500),
    public_url VARCHAR(500),
    
    -- Description
    description TEXT,
    
    -- Métadonnées
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.dpe_attachments IS 'Pièces jointes des DPE (photos, documents)';

CREATE INDEX idx_dpe_attachments_dpe_id ON public.dpe_attachments(dpe_id);

-- ============================================================================
-- FONCTIONS TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_profiles_updated_at 
    BEFORE UPDATE ON public.users_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dpe_drafts_updated_at 
    BEFORE UPDATE ON public.dpe_drafts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dpe_documents_updated_at 
    BEFORE UPDATE ON public.dpe_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enum_cache_updated_at 
    BEFORE UPDATE ON public.enum_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpe_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpe_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpe_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpe_attachments ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can only access their own profile"
    ON public.users_profiles FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users can only access their own drafts"
    ON public.dpe_drafts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own documents"
    ON public.dpe_documents FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access validations of their documents"
    ON public.dpe_validations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.dpe_documents 
        WHERE id = dpe_validations.dpe_id 
        AND user_id = auth.uid()
    ));

CREATE POLICY "Users can only access attachments of their documents"
    ON public.dpe_attachments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.dpe_documents 
        WHERE id = dpe_attachments.dpe_id 
        AND user_id = auth.uid()
    ));

-- enum_cache: lecture publique, écriture admin uniquement
CREATE POLICY "Enum cache is readable by all authenticated users"
    ON public.enum_cache FOR SELECT
    TO authenticated USING (true);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN public.dpe_drafts.data IS 'Données JSONB du formulaire DPE (13 étapes)';
COMMENT ON COLUMN public.dpe_documents.data IS 'Données complètes du DPE validé';
COMMENT ON COLUMN public.dpe_documents.resultats IS 'Résultats calculés (consommations, émissions, étiquettes)';
COMMENT ON COLUMN public.dpe_documents.xml_content IS 'XML généré conforme XSD ADEME v2.6';
