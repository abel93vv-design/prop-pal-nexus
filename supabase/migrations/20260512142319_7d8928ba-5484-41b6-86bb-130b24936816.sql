ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS condition text DEFAULT '',
  ADD COLUMN IF NOT EXISTS unavailable_reason text DEFAULT '';