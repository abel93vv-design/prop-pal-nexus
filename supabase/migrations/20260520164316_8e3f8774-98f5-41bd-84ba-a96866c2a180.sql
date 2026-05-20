
-- Limpiar matches legacy sin agency asignada
DELETE FROM public.match_scores WHERE agency_id IS NULL;

-- Reemplazar policies de match_scores con aislamiento estricto por agencia
DROP POLICY IF EXISTS "Tenant users can read match scores" ON public.match_scores;
DROP POLICY IF EXISTS "Tenant users can insert match scores" ON public.match_scores;
DROP POLICY IF EXISTS "Tenant users can update match scores" ON public.match_scores;
DROP POLICY IF EXISTS "Tenant users can delete match scores" ON public.match_scores;

CREATE POLICY "Agency users can read match scores"
ON public.match_scores
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR (agency_id IS NOT NULL AND agency_id = public.get_user_agency_id())
  )
);

CREATE POLICY "Agency users can insert match scores"
ON public.match_scores
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR (agency_id IS NOT NULL AND agency_id = public.get_user_agency_id())
  )
);

CREATE POLICY "Agency users can update match scores"
ON public.match_scores
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR (agency_id IS NOT NULL AND agency_id = public.get_user_agency_id())
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR (agency_id IS NOT NULL AND agency_id = public.get_user_agency_id())
  )
);

CREATE POLICY "Agency users can delete match scores"
ON public.match_scores
FOR DELETE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.is_tenant_admin(auth.uid(), tenant_id)
    OR (agency_id IS NOT NULL AND agency_id = public.get_user_agency_id())
  )
);
