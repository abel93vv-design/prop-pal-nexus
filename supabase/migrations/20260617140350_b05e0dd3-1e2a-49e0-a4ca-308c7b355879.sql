
-- Add user_id ownership to lead tracking tables so each user owns their daily entries,
-- while admins can read everyone in the tenant.

ALTER TABLE public.daily_leads
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.daily_global_metrics
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Replace unique constraints to include user_id
ALTER TABLE public.daily_leads DROP CONSTRAINT IF EXISTS daily_leads_tenant_id_date_source_key;
ALTER TABLE public.daily_global_metrics DROP CONSTRAINT IF EXISTS daily_global_metrics_tenant_id_date_key;

ALTER TABLE public.daily_leads
  ADD CONSTRAINT daily_leads_tenant_user_date_source_key UNIQUE (tenant_id, user_id, date, source);
ALTER TABLE public.daily_global_metrics
  ADD CONSTRAINT daily_global_metrics_tenant_user_date_key UNIQUE (tenant_id, user_id, date);

CREATE INDEX IF NOT EXISTS daily_leads_user_idx ON public.daily_leads (tenant_id, user_id, date);
CREATE INDEX IF NOT EXISTS daily_global_metrics_user_idx ON public.daily_global_metrics (tenant_id, user_id, date);

-- Rewrite RLS: users see/edit only their rows; tenant admins and super admins see all rows in tenant.

DROP POLICY IF EXISTS "daily_leads view" ON public.daily_leads;
DROP POLICY IF EXISTS "daily_leads insert" ON public.daily_leads;
DROP POLICY IF EXISTS "daily_leads update" ON public.daily_leads;
DROP POLICY IF EXISTS "daily_leads delete" ON public.daily_leads;

CREATE POLICY "daily_leads view" ON public.daily_leads
FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND public.has_module_access(auth.uid(), 'control_leads', 'view')
  AND (
    user_id = auth.uid()
    OR public.is_tenant_admin(auth.uid(), tenant_id)
  )
);

CREATE POLICY "daily_leads insert" ON public.daily_leads
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'edit')
);

CREATE POLICY "daily_leads update" ON public.daily_leads
FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'edit')
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'edit')
);

CREATE POLICY "daily_leads delete" ON public.daily_leads
FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'delete')
);

DROP POLICY IF EXISTS "daily_global_metrics view" ON public.daily_global_metrics;
DROP POLICY IF EXISTS "daily_global_metrics insert" ON public.daily_global_metrics;
DROP POLICY IF EXISTS "daily_global_metrics update" ON public.daily_global_metrics;
DROP POLICY IF EXISTS "daily_global_metrics delete" ON public.daily_global_metrics;

CREATE POLICY "daily_global_metrics view" ON public.daily_global_metrics
FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND public.has_module_access(auth.uid(), 'control_leads', 'view')
  AND (
    user_id = auth.uid()
    OR public.is_tenant_admin(auth.uid(), tenant_id)
  )
);

CREATE POLICY "daily_global_metrics insert" ON public.daily_global_metrics
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'edit')
);

CREATE POLICY "daily_global_metrics update" ON public.daily_global_metrics
FOR UPDATE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'edit')
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'edit')
);

CREATE POLICY "daily_global_metrics delete" ON public.daily_global_metrics
FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id()
  AND user_id = auth.uid()
  AND public.has_module_access(auth.uid(), 'control_leads', 'delete')
);
