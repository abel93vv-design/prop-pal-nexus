CREATE POLICY "Coordinators can view tenant zone sheets"
ON public.zone_sheets FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('socio'::app_role, 'coordinadora'::app_role)
  )
);