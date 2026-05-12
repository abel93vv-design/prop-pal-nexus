
-- 1. Columns for custom domain
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS domain_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS domain_verification_token text;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_custom_domain_unique
  ON public.tenants (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;

-- 2. Auto-generate verification token when custom_domain is set / changed
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
    ELSE
      IF TG_OP = 'INSERT' OR OLD.custom_domain IS DISTINCT FROM NEW.custom_domain THEN
        NEW.domain_verification_token := encode(gen_random_bytes(16), 'hex');
        NEW.domain_verified := false;
      END IF;
    END IF;
  ELSE
    NEW.domain_verification_token := NULL;
    NEW.domain_verified := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenants_handle_domain ON public.tenants;
CREATE TRIGGER trg_tenants_handle_domain
BEFORE INSERT OR UPDATE OF custom_domain ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.tenants_handle_domain();

-- 3. Public lookup by host (used pre-login by the SPA)
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(_host text)
RETURNS TABLE (id uuid, name text, slug text, custom_domain text, domain_verified boolean, is_active boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.custom_domain, t.domain_verified, t.is_active
  FROM public.tenants t
  WHERE t.deleted_at IS NULL
    AND lower(t.custom_domain) = lower(_host)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain(text) TO anon, authenticated;

-- 4. Update tenants RLS to allow super_admin (currently only legacy 'admin')
DROP POLICY IF EXISTS "Admins can delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update tenants" ON public.tenants;

CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can update tenants"
ON public.tenants FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can delete tenants"
ON public.tenants FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
