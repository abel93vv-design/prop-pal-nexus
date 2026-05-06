DROP POLICY IF EXISTS "Tenant users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Tenant users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Tenant users can read properties" ON public.properties;
DROP POLICY IF EXISTS "Tenant users can update properties" ON public.properties;

CREATE POLICY "Tenant users can read active clients"
ON public.clients
FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant users can update clients in tenant"
ON public.clients
FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can read active properties"
ON public.properties
FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant users can update properties in tenant"
ON public.properties
FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id())
WITH CHECK (tenant_id = public.get_user_tenant_id());