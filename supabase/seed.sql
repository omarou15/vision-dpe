-- ============================================================================
-- SEED DATA - Données initiales pour tests
-- ============================================================================

-- Insertion d'un profil utilisateur test (nécessite un utilisateur auth existant)
-- Note: Exécuter après création d'un utilisateur dans auth.users

INSERT INTO public.users_profiles (
    id, 
    full_name, 
    company, 
    siret, 
    numero_dpe_diagnostiqueur,
    phone,
    email,
    adresse_pro,
    code_postal_pro,
    commune_pro
)
SELECT 
    id,
    'Diagnostiqueur Test',
    'EnergyCo Diagnostics',
    '12345678901234',
    'DPE-TEST-001',
    '+33612345678',
    email,
    '123 Rue de la République',
    '75001',
    'Paris'
FROM auth.users
WHERE email = 'test@energyco.fr'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CACHE ENUMS ADEME - Exemples
-- ============================================================================

-- Enum: Type de bâtiment
INSERT INTO public.enum_cache (
    cache_type, 
    enum_id, 
    data, 
    version, 
    valid_from
) VALUES (
    'enum',
    'enum_type_batiment',
    '[
        {"id": "maison", "label": "Maison individuelle"},
        {"id": "appartement", "label": "Appartement"}
    ]'::jsonb,
    '2.6',
    '2024-01-01'
) ON CONFLICT (cache_type, enum_id, version) DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();

-- Enum: Période de construction
INSERT INTO public.enum_cache (
    cache_type, 
    enum_id, 
    data, 
    version, 
    valid_from
) VALUES (
    'enum',
    'enum_periode_construction',
    '[
        {"id": "avant_1948", "label": "Avant 1948", "annee_debut": null, "annee_fin": 1948},
        {"id": "1948_1974", "label": "1948-1974", "annee_debut": 1948, "annee_fin": 1974},
        {"id": "1975_1977", "label": "1975-1977", "annee_debut": 1975, "annee_fin": 1977},
        {"id": "1978_1982", "label": "1978-1982", "annee_debut": 1978, "annee_fin": 1982},
        {"id": "1983_1988", "label": "1983-1988", "annee_debut": 1983, "annee_fin": 1988},
        {"id": "1989_1999", "label": "1989-1999", "annee_debut": 1989, "annee_fin": 1999},
        {"id": "2000_2005", "label": "2000-2005", "annee_debut": 2000, "annee_fin": 2005},
        {"id": "2006_2012", "label": "2006-2012", "annee_debut": 2006, "annee_fin": 2012},
        {"id": "2013_2021", "label": "2013-2021", "annee_debut": 2013, "annee_fin": 2021},
        {"id": "apres_2021", "label": "Après 2021", "annee_debut": 2022, "annee_fin": null}
    ]'::jsonb,
    '2.6',
    '2024-01-01'
) ON CONFLICT (cache_type, enum_id, version) DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();

-- Table de valeurs: Coefficients U des murs non isolés
INSERT INTO public.enum_cache (
    cache_type, 
    enum_id, 
    table_id,
    data, 
    version, 
    valid_from
) VALUES (
    'table_valeur',
    'tv_coef_transmission_thermique',
    'mur_non_isole',
    '{
        "avant_1948": 1.4,
        "1948_1974": 1.0,
        "1975_1977": 0.85,
        "1978_1982": 0.70,
        "1983_1988": 0.55,
        "1989_1999": 0.45,
        "2000_2005": 0.40,
        "2006_2012": 0.35,
        "2013_2021": 0.28,
        "apres_2021": 0.20
    }'::jsonb,
    '2.6',
    '2024-01-01'
) ON CONFLICT (cache_type, enum_id, version) DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();

-- Table de valeurs: Coefficients U des vitrages
INSERT INTO public.enum_cache (
    cache_type, 
    enum_id, 
    table_id,
    data, 
    version, 
    valid_from
) VALUES (
    'table_valeur',
    'tv_coef_transmission_thermique',
    'vitrage',
    '{
        "simple_vitrage": 5.8,
        "double_vitrage": 2.9,
        "double_vitrage_renove": 1.8,
        "triple_vitrage": 1.6
    }'::jsonb,
    '2.6',
    '2024-01-01'
) ON CONFLICT (cache_type, enum_id, version) DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();

-- Table de valeurs: Seuils étiquettes DPE
INSERT INTO public.enum_cache (
    cache_type, 
    enum_id, 
    table_id,
    data, 
    version, 
    valid_from
) VALUES (
    'table_valeur',
    'tv_seuils_etiquette',
    'energie',
    '{
        "A": 50,
        "B": 90,
        "C": 150,
        "D": 230,
        "E": 330,
        "F": 450
    }'::jsonb,
    '2.6',
    '2024-01-01'
) ON CONFLICT (cache_type, enum_id, version) DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();

-- Table de valeurs: Seuils étiquettes climat
INSERT INTO public.enum_cache (
    cache_type, 
    enum_id, 
    table_id,
    data, 
    version, 
    valid_from
) VALUES (
    'table_valeur',
    'tv_seuils_etiquette',
    'climat',
    '{
        "A": 6,
        "B": 11,
        "C": 30,
        "D": 50,
        "E": 70,
        "F": 100
    }'::jsonb,
    '2.6',
    '2024-01-01'
) ON CONFLICT (cache_type, enum_id, version) DO UPDATE SET 
    data = EXCLUDED.data,
    updated_at = NOW();
