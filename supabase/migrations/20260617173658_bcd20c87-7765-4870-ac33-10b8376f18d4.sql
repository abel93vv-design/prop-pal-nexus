CREATE TABLE public.advisor_daily_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  date date NOT NULL,
  zone_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  marketing_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  calls_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.advisor_daily_sheets TO authenticated;
GRANT ALL ON public.advisor_daily_sheets TO service_role;

ALTER TABLE public.advisor_daily_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own advisor sheets or tenant admins all"
ON public.advisor_daily_sheets
FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    user_id = auth.uid()
    OR public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.is_super_admin(auth.uid())
  )
);

CREATE POLICY "Users insert own advisor sheets"
ON public.advisor_daily_sheets
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
);

CREATE POLICY "Users update own advisor sheets"
ON public.advisor_daily_sheets
FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
);

CREATE POLICY "Users delete own advisor sheets or tenant admins"
ON public.advisor_daily_sheets
FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND (
    user_id = auth.uid()
    OR public.is_tenant_admin(auth.uid(), tenant_id)
    OR public.is_super_admin(auth.uid())
  )
);

CREATE TRIGGER advisor_daily_sheets_set_updated_at
BEFORE UPDATE ON public.advisor_daily_sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();