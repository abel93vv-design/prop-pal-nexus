
-- =============================================
-- 1. SOFT DELETE: Add deleted_at to all main tables
-- =============================================
ALTER TABLE public.tenants ADD COLUMN updated_at timestamptz DEFAULT now();
ALTER TABLE public.tenants ADD COLUMN deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.clients ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.properties ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.team_members ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.agencies ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.documents ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Update tenants updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. UPDATE RLS SELECT POLICIES to exclude soft-deleted rows
-- =============================================

-- clients
DROP POLICY IF EXISTS "Tenant users can read clients" ON public.clients;
CREATE POLICY "Tenant users can read clients" ON public.clients
  FOR SELECT USING (
    ((tenant_id = get_user_tenant_id()) OR (tenant_id IS NULL))
    AND deleted_at IS NULL
  );

-- properties (public read stays, but exclude deleted)
DROP POLICY IF EXISTS "Anyone can read properties" ON public.properties;
CREATE POLICY "Anyone can read properties" ON public.properties
  FOR SELECT USING (deleted_at IS NULL);

-- tasks
DROP POLICY IF EXISTS "Tenant users can read tasks" ON public.tasks;
CREATE POLICY "Tenant users can read tasks" ON public.tasks
  FOR SELECT USING (
    ((tenant_id = get_user_tenant_id()) OR (tenant_id IS NULL))
    AND deleted_at IS NULL
  );

-- team_members
DROP POLICY IF EXISTS "Tenant users can read team" ON public.team_members;
CREATE POLICY "Tenant users can read team" ON public.team_members
  FOR SELECT USING (
    ((tenant_id = get_user_tenant_id()) OR (tenant_id IS NULL))
    AND deleted_at IS NULL
  );

-- agencies
DROP POLICY IF EXISTS "Tenant users can read agencies" ON public.agencies;
CREATE POLICY "Tenant users can read agencies" ON public.agencies
  FOR SELECT USING (
    ((tenant_id = get_user_tenant_id()) OR (tenant_id IS NULL))
    AND deleted_at IS NULL
  );

-- documents
DROP POLICY IF EXISTS "Tenant users can read documents" ON public.documents;
CREATE POLICY "Tenant users can read documents" ON public.documents
  FOR SELECT USING (
    ((tenant_id = get_user_tenant_id()) OR (tenant_id IS NULL))
    AND deleted_at IS NULL
  );

-- tenants (readable by all authenticated, exclude deleted)
DROP POLICY IF EXISTS "Authenticated users can read their tenant" ON public.tenants;
CREATE POLICY "Authenticated users can read their tenant" ON public.tenants
  FOR SELECT USING (deleted_at IS NULL);

-- =============================================
-- 3. ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read activity logs"
  ON public.activity_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Index for fast queries
CREATE INDEX idx_activity_logs_tenant_created ON public.activity_logs (tenant_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);

-- Helper function
CREATE OR REPLACE FUNCTION public.log_activity(
  _tenant_id uuid,
  _user_id uuid,
  _action text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (_tenant_id, _user_id, _action, _entity_type, _entity_id, _metadata);
END;
$$;

-- =============================================
-- 4. TENANT API KEYS TABLE (foundation)
-- =============================================
CREATE TABLE public.tenant_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  key_hash text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can read their API keys"
  ON public.tenant_api_keys FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can insert API keys"
  ON public.tenant_api_keys FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can update API keys"
  ON public.tenant_api_keys FOR UPDATE
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant users can delete API keys"
  ON public.tenant_api_keys FOR DELETE
  USING (tenant_id = get_user_tenant_id());

CREATE INDEX idx_tenant_api_keys_tenant ON public.tenant_api_keys (tenant_id);
