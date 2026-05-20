ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS allow_password_recovery boolean NOT NULL DEFAULT true;

DROP FUNCTION IF EXISTS public.get_tenant_by_domain(text);

CREATE FUNCTION public.get_tenant_by_domain(_host text)
 RETURNS TABLE(id uuid, name text, slug text, custom_domain text, domain_verified boolean, is_active boolean, allow_password_recovery boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.id, t.name, t.slug, t.custom_domain, t.domain_verified, t.is_active, t.allow_password_recovery
  FROM public.tenants t
  WHERE t.deleted_at IS NULL
    AND lower(t.custom_domain) = lower(_host)
  LIMIT 1
$function$;