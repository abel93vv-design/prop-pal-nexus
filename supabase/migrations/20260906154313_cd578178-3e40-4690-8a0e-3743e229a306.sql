CREATE TABLE public.tenant_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_settings TO authenticated;
GRANT ALL ON public.tenant_settings TO service_role;

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_select" ON public.tenant_settings
FOR SELECT TO authenticated
USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "tenant_settings_insert" ON public.tenant_settings
FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));

CREATE POLICY "tenant_settings_update" ON public.tenant_settings
FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));

CREATE POLICY "tenant_settings_delete" ON public.tenant_settings
FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));

CREATE TRIGGER update_tenant_settings_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();