-- Enable RLS
alter table if exists public.dpe_documents enable row level security;
alter table if exists public.dpe_drafts enable row level security;
alter table if exists public.users_profiles enable row level security;

-- DPE Documents table
CREATE TABLE IF NOT EXISTS public.dpe_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_dpe VARCHAR(50) UNIQUE NOT NULL,
    xml_content TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DPE Drafts table
CREATE TABLE IF NOT EXISTS public.dpe_drafts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users profiles table
CREATE TABLE IF NOT EXISTS public.users_profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(255),
    company VARCHAR(255),
    siret VARCHAR(14),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can only access their own documents"
    ON public.dpe_documents FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own drafts"
    ON public.dpe_drafts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own profile"
    ON public.users_profiles FOR ALL
    USING (auth.uid() = id);
