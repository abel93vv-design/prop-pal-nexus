-- invoices: restrict admin management to the caller's own tenant
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Tenant admins manage own invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR is_tenant_admin(auth.uid(), tenant_id)
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR is_tenant_admin(auth.uid(), tenant_id)
);

-- tenants: only super admins can insert or delete tenant rows
DROP POLICY IF EXISTS "Super admins can insert tenants" ON public.tenants;
CREATE POLICY "Super admins can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete tenants" ON public.tenants;
CREATE POLICY "Super admins can delete tenants"
ON public.tenants
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- tenants: update allowed to super admins, or tenant admins ONLY for their own tenant row
DROP POLICY IF EXISTS "Super admins can update tenants" ON public.tenants;
CREATE POLICY "Admins can update own tenant"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR is_tenant_admin(auth.uid(), id)
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR is_tenant_admin(auth.uid(), id)
);