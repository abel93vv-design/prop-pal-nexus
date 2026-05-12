ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'noticia';

CREATE INDEX IF NOT EXISTS properties_listing_type_idx ON public.properties (tenant_id, listing_type) WHERE deleted_at IS NULL;