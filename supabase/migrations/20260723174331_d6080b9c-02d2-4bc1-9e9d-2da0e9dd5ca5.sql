CREATE OR REPLACE FUNCTION public.mark_clients_on_property_soft_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    UPDATE public.clients
    SET source_property_id = NULL,
        source = 'vivienda_eliminada'
    WHERE source_property_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;