ALTER TABLE public.zone_sheets RENAME COLUMN has_use TO is_vpo;
ALTER TABLE public.zone_sheets ADD COLUMN IF NOT EXISTS has_accessible_access boolean NOT NULL DEFAULT false;
ALTER TABLE public.zone_sheets ADD COLUMN IF NOT EXISTS building_year integer;