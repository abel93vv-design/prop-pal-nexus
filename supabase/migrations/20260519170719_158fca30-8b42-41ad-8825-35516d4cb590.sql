
-- Helper: agency_id del usuario actual a partir de team_members
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id
  FROM public.team_members
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
$$;

-- ============ PROPERTIES ============
DROP POLICY IF EXISTS "Tenant users can read active properties" ON public.properties;
CREATE POLICY "Tenant users can read active properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND deleted_at IS NULL
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.get_user_agency_id() IS NULL
    OR agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  )
);

DROP POLICY IF EXISTS "Tenant users can insert properties" ON public.properties;
CREATE POLICY "Tenant users can insert properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.get_user_agency_id() IS NULL
    OR agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  )
);

DROP POLICY IF EXISTS "Tenant users can update properties in tenant" ON public.properties;
CREATE POLICY "Tenant users can update properties in tenant"
ON public.properties
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.get_user_agency_id() IS NULL
    OR agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.get_user_agency_id() IS NULL
    OR agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  )
);

DROP POLICY IF EXISTS "Tenant users can delete properties" ON public.properties;
CREATE POLICY "Tenant users can delete properties"
ON public.properties
FOR DELETE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.get_user_agency_id() IS NULL
    OR agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  )
);

-- ============ MATCH SCORES ============
DROP POLICY IF EXISTS "Tenant users can read match scores" ON public.match_scores;
CREATE POLICY "Tenant users can read match scores"
ON public.match_scores
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.get_user_agency_id() IS NULL
    OR agency_id IS NULL
    OR agency_id = public.get_user_agency_id()
  )
);
