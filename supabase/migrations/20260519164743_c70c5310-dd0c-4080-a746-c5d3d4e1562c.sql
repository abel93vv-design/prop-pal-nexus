ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS contact_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_notes text DEFAULT '';