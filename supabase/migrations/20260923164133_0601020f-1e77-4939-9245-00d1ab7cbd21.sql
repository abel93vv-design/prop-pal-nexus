CREATE TABLE public.zone_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  sheet_date date NOT NULL DEFAULT CURRENT_DATE,
  sheet_time time NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::time,
  agent_name text,
  street text,
  portal text,
  administrator text,
  community text,
  president text,
  property_type text,
  has_use boolean NOT NULL DEFAULT false,
  has_garage boolean NOT NULL DEFAULT false,
  has_elevator boolean NOT NULL DEFAULT false,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_sheets TO authenticated;
GRANT ALL ON public.zone_sheets TO service_role;

ALTER TABLE public.zone_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own zone sheets"
ON public.zone_sheets FOR ALL TO authenticated
USING (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id())
WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant admins can view zone sheets"
ON public.zone_sheets FOR SELECT TO authenticated
USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE INDEX idx_zone_sheets_user_date ON public.zone_sheets (tenant_id, user_id, sheet_date DESC, sheet_time DESC);

CREATE TRIGGER zone_sheets_set_updated_at
BEFORE UPDATE ON public.zone_sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();