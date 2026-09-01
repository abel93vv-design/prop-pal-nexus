-- CLIENTS: require module permission for writes
DROP POLICY IF EXISTS "Tenant users can insert clients" ON public.clients;
CREATE POLICY "Tenant users can insert clients" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(), 'clientes', 'edit'));

DROP POLICY IF EXISTS "Tenant users can update clients in tenant" ON public.clients;
CREATE POLICY "Tenant users can update clients in tenant" ON public.clients
FOR UPDATE TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(), 'clientes', 'edit'))
WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(), 'clientes', 'edit'));

DROP POLICY IF EXISTS "Tenant users can delete clients" ON public.clients;
CREATE POLICY "Tenant users can delete clients" ON public.clients
FOR DELETE TO authenticated
USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(), 'clientes', 'delete'));

-- PROPERTIES: writes require permission on the matching module (ne / noticias)
DROP POLICY IF EXISTS "Tenant users can insert properties" ON public.properties;
CREATE POLICY "Tenant users can insert properties" ON public.properties
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (is_tenant_admin(auth.uid(), tenant_id) OR get_user_agency_id() IS NULL OR agency_id IS NULL OR agency_id = get_user_agency_id())
  AND public.has_module_access(auth.uid(), CASE WHEN COALESCE(listing_type,'noticia') = 'ne' THEN 'ne' ELSE 'noticias' END, 'edit')
);

DROP POLICY IF EXISTS "Tenant users can update properties in tenant" ON public.properties;
CREATE POLICY "Tenant users can update properties in tenant" ON public.properties
FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (is_tenant_admin(auth.uid(), tenant_id) OR get_user_agency_id() IS NULL OR agency_id IS NULL OR agency_id = get_user_agency_id())
  AND public.has_module_access(auth.uid(), CASE WHEN COALESCE(listing_type,'noticia') = 'ne' THEN 'ne' ELSE 'noticias' END, 'edit')
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (is_tenant_admin(auth.uid(), tenant_id) OR get_user_agency_id() IS NULL OR agency_id IS NULL OR agency_id = get_user_agency_id())
  AND public.has_module_access(auth.uid(), CASE WHEN COALESCE(listing_type,'noticia') = 'ne' THEN 'ne' ELSE 'noticias' END, 'edit')
);

DROP POLICY IF EXISTS "Tenant users can delete properties" ON public.properties;
CREATE POLICY "Tenant users can delete properties" ON public.properties
FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (is_tenant_admin(auth.uid(), tenant_id) OR get_user_agency_id() IS NULL OR agency_id IS NULL OR agency_id = get_user_agency_id())
  AND public.has_module_access(auth.uid(), CASE WHEN COALESCE(listing_type,'noticia') = 'ne' THEN 'ne' ELSE 'noticias' END, 'delete')
);