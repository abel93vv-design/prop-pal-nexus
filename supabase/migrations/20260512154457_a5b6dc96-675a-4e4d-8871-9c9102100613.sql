
-- 1. Ampliar enum app_role con nuevos valores
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'socio';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordinadora';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'asesor';
