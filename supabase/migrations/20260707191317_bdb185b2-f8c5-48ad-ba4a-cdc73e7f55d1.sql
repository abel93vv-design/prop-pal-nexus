-- 1) Limpieza de match_scores huérfanos: filas cuyo cliente o propiedad ha sido soft-deleted
DELETE FROM public.match_scores ms
WHERE EXISTS (
  SELECT 1 FROM public.clients c
  WHERE c.id = ms.client_id AND c.deleted_at IS NOT NULL
)
OR EXISTS (
  SELECT 1 FROM public.properties p
  WHERE p.id = ms.property_id AND p.deleted_at IS NOT NULL
)
OR NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.id = ms.client_id
)
OR NOT EXISTS (
  SELECT 1 FROM public.properties p WHERE p.id = ms.property_id
);

-- 2) Trigger: al soft-deletar un cliente, eliminar sus match_scores
CREATE OR REPLACE FUNCTION public.cleanup_matches_on_client_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    DELETE FROM public.match_scores WHERE client_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_matches_on_client_soft_delete ON public.clients;
CREATE TRIGGER trg_cleanup_matches_on_client_soft_delete
AFTER UPDATE OF deleted_at ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_matches_on_client_soft_delete();

-- 3) Trigger: al soft-deletar una propiedad, eliminar sus match_scores
CREATE OR REPLACE FUNCTION public.cleanup_matches_on_property_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    DELETE FROM public.match_scores WHERE property_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_matches_on_property_soft_delete ON public.properties;
CREATE TRIGGER trg_cleanup_matches_on_property_soft_delete
AFTER UPDATE OF deleted_at ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_matches_on_property_soft_delete();