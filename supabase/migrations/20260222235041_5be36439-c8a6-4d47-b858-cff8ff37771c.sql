
-- Pipeline stages per agency (customizable)
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  stage_type TEXT NOT NULL DEFAULT 'active' CHECK (stage_type IN ('active', 'closed_won', 'closed_lost')),
  default_probability INTEGER NOT NULL DEFAULT 50 CHECK (default_probability >= 0 AND default_probability <= 100),
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stale_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ps_tenant ON public.pipeline_stages (tenant_id);
CREATE INDEX idx_ps_agency ON public.pipeline_stages (agency_id);

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read pipeline stages"
  ON public.pipeline_stages FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can insert pipeline stages"
  ON public.pipeline_stages FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can update pipeline stages"
  ON public.pipeline_stages FOR UPDATE
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can delete pipeline stages"
  ON public.pipeline_stages FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deal_value NUMERIC NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta')),
  expected_close_date DATE,
  notes TEXT DEFAULT '',
  stage_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_opp_tenant ON public.opportunities (tenant_id);
CREATE INDEX idx_opp_stage ON public.opportunities (stage_id);
CREATE INDEX idx_opp_client ON public.opportunities (client_id);
CREATE INDEX idx_opp_agent ON public.opportunities (agent_id);
CREATE INDEX idx_opp_agency ON public.opportunities (agency_id);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read opportunities"
  ON public.opportunities FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can insert opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can update opportunities"
  ON public.opportunities FOR UPDATE
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can delete opportunities"
  ON public.opportunities FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- Stage change history
CREATE TABLE public.stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  to_stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  changed_by TEXT NOT NULL DEFAULT '',
  days_in_previous_stage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_sh_opportunity ON public.stage_history (opportunity_id);
CREATE INDEX idx_sh_tenant ON public.stage_history (tenant_id);

ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read stage history"
  ON public.stage_history FOR SELECT
  USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant users can insert stage history"
  ON public.stage_history FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());
