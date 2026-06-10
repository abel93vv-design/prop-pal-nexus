
DROP POLICY IF EXISTS "Anyone can read login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can update login attempts" ON public.login_attempts;
REVOKE ALL ON public.login_attempts FROM anon, authenticated;
GRANT ALL ON public.login_attempts TO service_role;

DROP POLICY IF EXISTS "Authenticated users can read their tenant" ON public.tenants;
CREATE POLICY "Users can read their own tenant"
  ON public.tenants FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (id = public.get_user_tenant_id() OR public.is_super_admin(auth.uid()))
  );

DROP FUNCTION IF EXISTS public.get_tenant_by_domain(text);
CREATE FUNCTION public.get_tenant_by_domain(_host text)
RETURNS TABLE(
  id uuid, name text, slug text, plan text, is_active boolean, is_demo boolean,
  subscription_status text, custom_domain text, domain_verified boolean,
  allow_password_recovery boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.plan, t.is_active, t.is_demo,
         COALESCE(t.subscription_status,'active'), t.custom_domain, t.domain_verified,
         t.allow_password_recovery
  FROM public.tenants t
  WHERE t.deleted_at IS NULL AND lower(t.custom_domain) = lower(_host)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(_slug text)
RETURNS TABLE(
  id uuid, name text, slug text, plan text, is_active boolean, is_demo boolean,
  subscription_status text, allow_password_recovery boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.plan, t.is_active, t.is_demo,
         COALESCE(t.subscription_status,'active'), t.allow_password_recovery
  FROM public.tenants t
  WHERE t.deleted_at IS NULL AND t.slug = lower(_slug) AND t.is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_demo_tenant()
RETURNS TABLE(
  id uuid, name text, slug text, plan text, is_active boolean, is_demo boolean,
  subscription_status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.plan, t.is_active, t.is_demo,
         COALESCE(t.subscription_status,'active')
  FROM public.tenants t
  WHERE t.deleted_at IS NULL AND t.is_demo = true AND t.is_active = true
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_tenant_by_domain(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_tenant_by_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_demo_tenant() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_domain(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_demo_tenant() TO anon, authenticated;

REVOKE SELECT (contact_name, contact_phone, contact_notes) ON public.properties FROM anon;

DROP POLICY IF EXISTS "Anyone can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can update documents" ON storage.objects;

CREATE POLICY "Tenant users can read their documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);
CREATE POLICY "Tenant users can upload their documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);
CREATE POLICY "Tenant users can update their documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);
CREATE POLICY "Tenant users can delete their documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);

REVOKE EXECUTE ON FUNCTION public.check_plan_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_tenant_created_seed_perms() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_default_role_permissions(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_activity(uuid, uuid, text, text, uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_client(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_property(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_agency_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role_in_tenant(uuid, uuid) FROM PUBLIC, anon;
