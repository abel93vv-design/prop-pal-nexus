
-- Many-to-many relationship between clients and properties with interest type
CREATE TABLE public.client_property_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('compra', 'alquiler', 'inversion')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, property_id)
);

CREATE INDEX idx_cpi_client ON public.client_property_interests (client_id);
CREATE INDEX idx_cpi_property ON public.client_property_interests (property_id);
CREATE INDEX idx_cpi_tenant ON public.client_property_interests (tenant_id);

ALTER TABLE public.client_property_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read interests"
  ON public.client_property_interests FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert interests"
  ON public.client_property_interests FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update interests"
  ON public.client_property_interests FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete interests"
  ON public.client_property_interests FOR DELETE
  USING (tenant_id = get_user_tenant_id());
