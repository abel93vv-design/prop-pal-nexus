
-- Track whether the custom domain has been added in Lovable's
-- Project Settings -> Domains (a manual, external step SSL/routing depend on).
-- Without this, it's easy to forget when onboarding several tenants in parallel.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS lovable_domain_added boolean NOT NULL DEFAULT false;

-- Reset the flag whenever the custom domain changes, same lifecycle as domain_verified.
CREATE OR REPLACE FUNCTION public.tenants_handle_domain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.custom_domain IS NOT NULL THEN
    NEW.custom_domain := lower(trim(NEW.custom_domain));
    IF NEW.custom_domain = '' THEN
      NEW.custom_domain := NULL;
      NEW.domain_verification_token := NULL;
      NEW.domain_verified := false;
      NEW.lovable_domain_added := false;
    ELSE
      IF TG_OP = 'INSERT' OR OLD.custom_domain IS DISTINCT FROM NEW.custom_domain THEN
        NEW.domain_verification_token := encode(gen_random_bytes(16), 'hex');
        NEW.domain_verified := false;
        NEW.lovable_domain_added := false;
      END IF;
    END IF;
  ELSE
    NEW.domain_verification_token := NULL;
    NEW.domain_verified := false;
    NEW.lovable_domain_added := false;
  END IF;
  RETURN NEW;
END;
$$;

-- Expose the new flag to the same admins who can already see domain info.
CREATE OR REPLACE FUNCTION public.get_tenant_domain_info(_tenant_id uuid)
RETURNS TABLE(custom_domain text, domain_verified boolean, domain_verification_token text, lovable_domain_added boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.custom_domain, t.domain_verified, t.domain_verification_token, t.lovable_domain_added
  FROM public.tenants t
  WHERE t.id = _tenant_id
    AND (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(auth.uid(), _tenant_id))
$$;

-- Note: `authenticated` currently has unrestricted column SELECT on public.tenants
-- (see 20260610161835), so no additional GRANT is needed for this column.
