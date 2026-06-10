
-- 1) Properties: hide owner-contact columns from anon
REVOKE SELECT ON public.properties FROM anon;
GRANT SELECT (
  id, title, address, type, status, price, surface, bedrooms, bathrooms, photos,
  agent_id, interested_client_ids, published_at, description, agency_id, category,
  created_at, tenant_id, postal_code, latitude, longitude, built_surface, plot_surface,
  energy_cert, floor, has_elevator, has_terrace, has_pool, has_garage, has_air_conditioning,
  community_fees, ibi_annual, neighborhood, operation_type, monthly_rent, deleted_at,
  condition, unavailable_reason, listing_type, accepts_pets, ne_start_date, ne_end_date
) ON public.properties TO anon;

-- 2) Tenants: hide stripe + domain token from authenticated
REVOKE SELECT ON public.tenants FROM authenticated;
GRANT SELECT (
  id, name, slug, plan, is_active, is_demo, created_at, updated_at, deleted_at,
  subscription_status, custom_domain, domain_verified, allow_password_recovery
) ON public.tenants TO authenticated;

-- Admin/super-admin helper to retrieve domain verification details
CREATE OR REPLACE FUNCTION public.get_tenant_domain_info(_tenant_id uuid)
RETURNS TABLE(custom_domain text, domain_verified boolean, domain_verification_token text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.custom_domain, t.domain_verified, t.domain_verification_token
  FROM public.tenants t
  WHERE t.id = _tenant_id
    AND (public.is_super_admin(auth.uid()) OR public.is_tenant_admin(auth.uid(), _tenant_id))
$$;
REVOKE EXECUTE ON FUNCTION public.get_tenant_domain_info(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_domain_info(uuid) TO authenticated;

-- 3) Portal connections: restrict to tenant admins
DROP POLICY IF EXISTS "Tenant users can read portal connections" ON public.portal_connections;
DROP POLICY IF EXISTS "Tenant users can insert portal connections" ON public.portal_connections;
DROP POLICY IF EXISTS "Tenant users can update portal connections" ON public.portal_connections;
DROP POLICY IF EXISTS "Tenant users can delete portal connections" ON public.portal_connections;

CREATE POLICY "Tenant admins read portal connections" ON public.portal_connections
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins insert portal connections" ON public.portal_connections
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins update portal connections" ON public.portal_connections
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins delete portal connections" ON public.portal_connections
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));

-- 4) Tenant API keys: restrict to tenant admins
DROP POLICY IF EXISTS "Tenant users can read their API keys" ON public.tenant_api_keys;
DROP POLICY IF EXISTS "Tenant users can insert API keys" ON public.tenant_api_keys;
DROP POLICY IF EXISTS "Tenant users can update API keys" ON public.tenant_api_keys;
DROP POLICY IF EXISTS "Tenant users can delete API keys" ON public.tenant_api_keys;

CREATE POLICY "Tenant admins read API keys" ON public.tenant_api_keys
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins insert API keys" ON public.tenant_api_keys
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins update API keys" ON public.tenant_api_keys
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins delete API keys" ON public.tenant_api_keys
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));

-- 5) Profiles: allow tenant admins to read profiles in their tenant
CREATE POLICY "Tenant admins read tenant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (tenant_id IS NOT NULL
         AND tenant_id = public.get_user_tenant_id()
         AND public.is_tenant_admin(auth.uid(), tenant_id));

-- 6) Login attempts: deny-all policy so only service_role (which bypasses RLS) can access
CREATE POLICY "Deny all client access" ON public.login_attempts
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
