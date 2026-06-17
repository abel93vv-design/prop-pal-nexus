-- Enum for lead sources
CREATE TYPE public.lead_source AS ENUM (
  'fotocasa','habitaclia','idealista','facebook','facebook_personal','grupos_facebook','marketplace',
  'instagram','instagram_personal','whatsapp','telegram','oficina','escaparate','wallapop',
  'publicidad','zona','referidos','valoracasa','base_de_datos','otros'
);

-- daily_leads: one row per (tenant, date, source)
CREATE TABLE public.daily_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  date date NOT NULL,
  source public.lead_source NOT NULL,
  total_pedidos int NOT NULL DEFAULT 0,
  pedidos_insertados int NOT NULL DEFAULT 0,
  pedidos_actualizados int NOT NULL DEFAULT 0,
  pedidos_llamados int NOT NULL DEFAULT 0,
  pedidos_llamados_contactados int NOT NULL DEFAULT 0,
  pedidos_sin_contactar int NOT NULL DEFAULT 0,
  cv int NOT NULL DEFAULT 0,
  av int NOT NULL DEFAULT 0,
  asesoramientos int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, date, source)
);

CREATE INDEX idx_daily_leads_tenant_date ON public.daily_leads(tenant_id, date);
CREATE INDEX idx_daily_leads_tenant_source_date ON public.daily_leads(tenant_id, source, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_leads TO authenticated;
GRANT ALL ON public.daily_leads TO service_role;

ALTER TABLE public.daily_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_leads view" ON public.daily_leads FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','view'));
CREATE POLICY "daily_leads insert" ON public.daily_leads FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','edit'));
CREATE POLICY "daily_leads update" ON public.daily_leads FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','edit'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','edit'));
CREATE POLICY "daily_leads delete" ON public.daily_leads FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','delete'));

CREATE TRIGGER trg_daily_leads_updated_at BEFORE UPDATE ON public.daily_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- daily_global_metrics: one row per (tenant, date)
CREATE TABLE public.daily_global_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  date date NOT NULL,
  emails_enviados int NOT NULL DEFAULT 0,
  personas_escaparates int NOT NULL DEFAULT 0,
  personas_atendidas int NOT NULL DEFAULT 0,
  personas_que_entran int NOT NULL DEFAULT 0,
  respuestas_alquiler int NOT NULL DEFAULT 0,
  pedidos_alquiler int NOT NULL DEFAULT 0,
  cv_alquiler int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, date)
);

CREATE INDEX idx_daily_global_metrics_tenant_date ON public.daily_global_metrics(tenant_id, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_global_metrics TO authenticated;
GRANT ALL ON public.daily_global_metrics TO service_role;

ALTER TABLE public.daily_global_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_global_metrics view" ON public.daily_global_metrics FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','view'));
CREATE POLICY "daily_global_metrics insert" ON public.daily_global_metrics FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','edit'));
CREATE POLICY "daily_global_metrics update" ON public.daily_global_metrics FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','edit'))
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','edit'));
CREATE POLICY "daily_global_metrics delete" ON public.daily_global_metrics FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND public.has_module_access(auth.uid(),'control_leads','delete'));

CREATE TRIGGER trg_daily_global_metrics_updated_at BEFORE UPDATE ON public.daily_global_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update seed function to include control_leads module
CREATE OR REPLACE FUNCTION public.seed_default_role_permissions(_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _modules text[] := ARRAY['pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos','equipo','ajustes','facturas','control_leads'];
  _m text;
  _editable boolean;
BEGIN
  FOREACH _m IN ARRAY _modules LOOP
    _editable := _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos','control_leads');

    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (_tenant_id, 'socio', _m, _editable, _editable, false)
    ON CONFLICT (tenant_id, role, module) DO NOTHING;

    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (_tenant_id, 'coordinadora', _m, _editable, _editable, false)
    ON CONFLICT (tenant_id, role, module) DO NOTHING;

    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (_tenant_id, 'asesor', _m, _editable, _editable, false)
    ON CONFLICT (tenant_id, role, module) DO NOTHING;
  END LOOP;
END;
$function$;

-- Backfill control_leads permissions for existing tenants
DO $$
DECLARE _t uuid;
BEGIN
  FOR _t IN SELECT id FROM public.tenants WHERE deleted_at IS NULL LOOP
    PERFORM public.seed_default_role_permissions(_t);
  END LOOP;
END$$;