
-- Custom field definitions per tenant and entity type
CREATE TABLE public.custom_field_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'property')),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('boolean', 'text', 'number', 'range', 'select', 'multiselect', 'date')),
  required BOOLEAN NOT NULL DEFAULT false,
  filterable BOOLEAN NOT NULL DEFAULT false,
  used_in_matching BOOLEAN NOT NULL DEFAULT false,
  weight_in_matching INTEGER NOT NULL DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique key per tenant+entity
CREATE UNIQUE INDEX idx_cfd_tenant_entity_key ON public.custom_field_definitions (tenant_id, entity_type, key);
CREATE INDEX idx_cfd_tenant_entity ON public.custom_field_definitions (tenant_id, entity_type);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read custom field defs"
  ON public.custom_field_definitions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert custom field defs"
  ON public.custom_field_definitions FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update custom field defs"
  ON public.custom_field_definitions FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete custom field defs"
  ON public.custom_field_definitions FOR DELETE
  USING (tenant_id = get_user_tenant_id());

-- Custom field values (entity_id references client or property UUID)
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One value per definition+entity
CREATE UNIQUE INDEX idx_cfv_def_entity ON public.custom_field_values (definition_id, entity_id);
CREATE INDEX idx_cfv_entity ON public.custom_field_values (entity_id);
CREATE INDEX idx_cfv_tenant ON public.custom_field_values (tenant_id);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read custom field values"
  ON public.custom_field_values FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert custom field values"
  ON public.custom_field_values FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update custom field values"
  ON public.custom_field_values FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete custom field values"
  ON public.custom_field_values FOR DELETE
  USING (tenant_id = get_user_tenant_id());
