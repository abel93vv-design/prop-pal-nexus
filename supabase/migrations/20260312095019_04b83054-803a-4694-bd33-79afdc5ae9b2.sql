
-- 1. Fix properties RLS: replace public read with tenant-scoped + public portal read
DROP POLICY IF EXISTS "Anyone can read properties" ON public.properties;

CREATE POLICY "Tenant users can read properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  (tenant_id = get_user_tenant_id() AND deleted_at IS NULL)
);

-- Separate policy for public portal (anon can read published properties only)
CREATE POLICY "Public can read published properties"
ON public.properties
FOR SELECT
TO anon
USING (
  status = 'disponible' AND deleted_at IS NULL AND published_at IS NOT NULL
);

-- 2. Remove password column from team_members
ALTER TABLE public.team_members DROP COLUMN IF EXISTS password;

-- 3. Make documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- 4. Add storage RLS policies for documents bucket
CREATE POLICY "Tenant users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Tenant users can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Tenant users can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');

-- 5. Create plan limit triggers (they were missing as db-triggers showed none)
CREATE OR REPLACE TRIGGER check_plan_limit_properties
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_team_members
  BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_agencies
  BEFORE INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_portal_connections
  BEFORE INSERT ON public.portal_connections
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_custom_field_definitions
  BEFORE INSERT ON public.custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_tenant_api_keys
  BEFORE INSERT ON public.tenant_api_keys
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_opportunities
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- 6. Add composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_tenant_deleted ON public.properties(tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_deleted ON public.clients(tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_deleted ON public.tasks(tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_team_members_tenant_deleted ON public.team_members(tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_agencies_tenant_deleted ON public.agencies(tenant_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_created ON public.activity_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON public.opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_tenant ON public.match_scores(tenant_id);
