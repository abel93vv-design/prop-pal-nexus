
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS source_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_source_property_id ON public.clients(source_property_id);

CREATE OR REPLACE FUNCTION public.mark_clients_on_property_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    UPDATE public.clients
    SET source_property_id = NULL,
        source = 'vivienda_vendida'
    WHERE source_property_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_clients_on_property_soft_delete ON public.properties;
CREATE TRIGGER trg_mark_clients_on_property_soft_delete
AFTER UPDATE OF deleted_at ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.mark_clients_on_property_soft_delete();
