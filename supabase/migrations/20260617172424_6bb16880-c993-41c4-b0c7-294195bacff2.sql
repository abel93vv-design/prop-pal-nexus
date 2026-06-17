ALTER TABLE public.daily_global_metrics
  ADD COLUMN IF NOT EXISTS emails_respondidos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS personas_escaparate integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS citas_alquiler integer NOT NULL DEFAULT 0;