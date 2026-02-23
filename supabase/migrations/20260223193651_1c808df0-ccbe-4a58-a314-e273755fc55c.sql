
-- Table for portal connections (Fotocasa, Idealista per tenant)
CREATE TABLE public.portal_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  portal_name TEXT NOT NULL, -- 'fotocasa' | 'idealista'
  api_key TEXT DEFAULT '',
  feed_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  max_ads INTEGER NOT NULL DEFAULT 20,
  accepted_requirements BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, portal_name)
);

ALTER TABLE public.portal_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read portal connections"
  ON public.portal_connections FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert portal connections"
  ON public.portal_connections FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update portal connections"
  ON public.portal_connections FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete portal connections"
  ON public.portal_connections FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- Table for property publication status per portal
CREATE TABLE public.property_portal_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  portal_name TEXT NOT NULL, -- 'fotocasa' | 'idealista'
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, property_id, portal_name)
);

ALTER TABLE public.property_portal_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read property portal status"
  ON public.property_portal_status FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert property portal status"
  ON public.property_portal_status FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update property portal status"
  ON public.property_portal_status FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete property portal status"
  ON public.property_portal_status FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- Add missing fields to properties for portal compliance
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS postal_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS built_surface NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plot_surface NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_cert TEXT DEFAULT 'en_tramite';
