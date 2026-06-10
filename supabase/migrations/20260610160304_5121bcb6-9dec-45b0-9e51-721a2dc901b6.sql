GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;

ALTER POLICY "Tenant users can update documents"
  ON public.documents
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());