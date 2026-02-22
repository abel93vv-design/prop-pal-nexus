
-- Tighten tenants table policies: only super admins or authenticated users for their own tenant
DROP POLICY IF EXISTS "Only admins can insert tenants" ON public.tenants;
DROP POLICY IF EXISTS "Only admins can update tenants" ON public.tenants;

CREATE POLICY "Admins can insert tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tenants"
  ON public.tenants FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
