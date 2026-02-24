-- Seed data for testing
INSERT INTO public.users_profiles (id, full_name, company, siret, phone)
SELECT 
    id,
    'Test User',
    'Test Company',
    '12345678901234',
    '+33123456789'
FROM auth.users
LIMIT 1;
