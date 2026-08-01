
-- Reusable tenant configuration system.
-- feature_configs: a catalog super_admin builds once ("plantilla" of things
-- that CAN be customized). tenant_feature_configs: which of those are turned
-- on for a given tenant, with an optional per-tenant value override. Gated to
-- pro/enterprise so Free and Basic tenants always run the stock behavior.

CREATE TABLE public.feature_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  default_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.tenant_feature_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.feature_configs(key) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature_key)
);

CREATE INDEX idx_tenant_feature_configs_tenant ON public.tenant_feature_configs(tenant_id);

-- Reuse the project's existing updated_at helper (see 20260228182933).
CREATE TRIGGER trg_feature_configs_updated_at
BEFORE UPDATE ON public.feature_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_tenant_feature_configs_updated_at
BEFORE UPDATE ON public.tenant_feature_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Only pro/enterprise tenants may have activations, enforced at the DB layer
-- (not just in the UI) so this can't be bypassed by a direct API call.
CREATE OR REPLACE FUNCTION public.enforce_feature_config_plan_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan text;
BEGIN
  SELECT plan INTO _plan FROM public.tenants WHERE id = NEW.tenant_id;
  IF _plan NOT IN ('pro', 'enterprise') THEN
    RAISE EXCEPTION 'Las configuraciones personalizadas solo están disponibles en los planes Pro y Enterprise (tenant en plan %)', _plan;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_feature_config_plan_gate
BEFORE INSERT OR UPDATE ON public.tenant_feature_configs
FOR EACH ROW EXECUTE FUNCTION public.enforce_feature_config_plan_gate();

-- RLS: the catalog and its per-tenant activations are managed exclusively by
-- super_admin through the app's admin screens.
ALTER TABLE public.feature_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage feature_configs" ON public.feature_configs
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins manage tenant_feature_configs" ON public.tenant_feature_configs
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Tenant admins can see (read-only) which configs are active for their own
-- tenant, without needing super_admin.
CREATE POLICY "Tenant admins read own tenant_feature_configs" ON public.tenant_feature_configs
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id));

-- Frontend entry point: any signed-in member of a tenant can read the
-- resolved (enabled + value-merged) configs for their own tenant, so UI code
-- can gate on them without needing admin rights.
CREATE OR REPLACE FUNCTION public.get_tenant_active_configs(_tenant_id uuid)
RETURNS TABLE(feature_key text, value jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tfc.feature_key, COALESCE(tfc.value, fc.default_value) AS value
  FROM public.tenant_feature_configs tfc
  JOIN public.feature_configs fc ON fc.key = tfc.feature_key
  WHERE tfc.tenant_id = _tenant_id
    AND tfc.enabled = true
    AND (_tenant_id = public.get_user_tenant_id() OR public.is_super_admin(auth.uid()))
$$;

REVOKE EXECUTE ON FUNCTION public.get_tenant_active_configs(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_active_configs(uuid) TO authenticated;
