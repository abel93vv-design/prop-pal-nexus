
-- 1. Tabla para versionado completo (snapshots)
CREATE TABLE public.entity_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'property', 'client', 'agency', etc.
  entity_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'update', -- 'update', 'delete', 'create'
  snapshot jsonb NOT NULL DEFAULT '{}',
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_entity_snapshots_entity ON public.entity_snapshots(entity_type, entity_id);
CREATE INDEX idx_entity_snapshots_tenant ON public.entity_snapshots(tenant_id);

ALTER TABLE public.entity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read snapshots"
  ON public.entity_snapshots FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert snapshots"
  ON public.entity_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id());

-- 2. Bucket de storage para archivos
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can read documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update their documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete their documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');
