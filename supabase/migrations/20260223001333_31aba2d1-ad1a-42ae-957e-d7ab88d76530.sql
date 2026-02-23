
-- Client financial data (extends client without modifying clients table)
CREATE TABLE public.client_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  available_cash NUMERIC NOT NULL DEFAULT 0,
  monthly_income NUMERIC NOT NULL DEFAULT 0,
  debt_ratio NUMERIC NOT NULL DEFAULT 0,
  mortgage_needed BOOLEAN NOT NULL DEFAULT false,
  mortgage_preapproved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Client search preferences (what the client is looking for)
CREATE TABLE public.client_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  min_price NUMERIC DEFAULT 0,
  max_price NUMERIC DEFAULT 0,
  min_surface NUMERIC DEFAULT 0,
  max_surface NUMERIC DEFAULT 0,
  min_bedrooms INTEGER DEFAULT 0,
  min_bathrooms INTEGER DEFAULT 0,
  preferred_types TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Match scores table
CREATE TABLE public.match_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  agency_id UUID REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_score NUMERIC NOT NULL DEFAULT 0,
  financial_score NUMERIC NOT NULL DEFAULT 0,
  total_score NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'low',
  viability_status TEXT NOT NULL DEFAULT 'Not Viable',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, property_id)
);

-- Performance indexes
CREATE INDEX idx_match_scores_client ON match_scores(client_id);
CREATE INDEX idx_match_scores_property ON match_scores(property_id);
CREATE INDEX idx_match_scores_agency ON match_scores(agency_id);
CREATE INDEX idx_match_scores_total ON match_scores(total_score DESC);
CREATE INDEX idx_match_scores_tenant ON match_scores(tenant_id);
CREATE INDEX idx_match_scores_category ON match_scores(category);
CREATE INDEX idx_client_financials_client ON client_financials(client_id);
CREATE INDEX idx_client_preferences_client ON client_preferences(client_id);

-- RLS for client_financials
ALTER TABLE public.client_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read client financials"
ON public.client_financials FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert client financials"
ON public.client_financials FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update client financials"
ON public.client_financials FOR UPDATE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete client financials"
ON public.client_financials FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- RLS for client_preferences
ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read client preferences"
ON public.client_preferences FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert client preferences"
ON public.client_preferences FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update client preferences"
ON public.client_preferences FOR UPDATE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete client preferences"
ON public.client_preferences FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- RLS for match_scores
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read match scores"
ON public.match_scores FOR SELECT
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert match scores"
ON public.match_scores FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update match scores"
ON public.match_scores FOR UPDATE
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete match scores"
ON public.match_scores FOR DELETE
USING (tenant_id = get_user_tenant_id());

-- Service role policy for edge function to manage match_scores
CREATE POLICY "Service role full access to match scores"
ON public.match_scores FOR ALL
USING (true)
WITH CHECK (true);
