
-- 1) Catálogo de configuraciones reutilizables (solo super_admin)
CREATE TABLE IF NOT EXISTS public.feature_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  default_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_configs TO authenticated;
GRANT ALL ON public.feature_configs TO service_role;
ALTER TABLE public.feature_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read feature catalog" ON public.feature_configs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage feature catalog" ON public.feature_configs
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 2) Activación de configuraciones por tenant
CREATE TABLE IF NOT EXISTS public.tenant_feature_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.feature_configs(key) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature_key)
);
GRANT SELECT ON public.tenant_feature_configs TO authenticated;
GRANT ALL ON public.tenant_feature_configs TO service_role;
ALTER TABLE public.tenant_feature_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant members can read own feature configs" ON public.tenant_feature_configs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage tenant feature configs" ON public.tenant_feature_configs
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER update_tenant_feature_configs_updated_at
  BEFORE UPDATE ON public.tenant_feature_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) RPC: configuraciones activas del tenant (valor propio o valor por defecto)
CREATE OR REPLACE FUNCTION public.get_tenant_active_configs(_tenant_id uuid)
RETURNS TABLE(feature_key text, value jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tfc.feature_key,
         COALESCE(tfc.value, fc.default_value) AS value
  FROM public.tenant_feature_configs tfc
  JOIN public.feature_configs fc ON fc.key = tfc.feature_key
  WHERE tfc.tenant_id = _tenant_id
    AND tfc.enabled = true
    AND (_tenant_id = public.get_user_tenant_id() OR public.is_super_admin(auth.uid()))
$$;

-- 4) Marca de dominio añadido en Lovable
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS lovable_domain_added boolean NOT NULL DEFAULT false;

-- 5) Token de seguridad para el feed XML de portales
ALTER TABLE public.portal_connections
  ADD COLUMN IF NOT EXISTS feed_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex');

-- 6) Despublicación automática al vender/desactivar/eliminar una vivienda
CREATE OR REPLACE FUNCTION public.unpublish_property_on_unavailable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IN ('vendido_alquilado','no_disponible') AND OLD.status IS DISTINCT FROM NEW.status)
     OR (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    UPDATE public.property_portal_status
    SET is_published = false,
        updated_at = now()
    WHERE property_id = NEW.id
      AND is_published = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unpublish_property_on_unavailable ON public.properties;
CREATE TRIGGER trg_unpublish_property_on_unavailable
  AFTER UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.unpublish_property_on_unavailable();
