-- Close RLS gap: remove "OR tenant_id IS NULL" from SELECT policies
-- on tasks, team_members, agencies and documents, matching the pattern
-- previously applied to clients and properties.

DROP POLICY IF EXISTS "Tenant users can read tasks" ON public.tasks;
CREATE POLICY "Tenant users can read tasks"
  ON public.tasks
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Tenant users can read team" ON public.team_members;
CREATE POLICY "Tenant users can read team"
  ON public.team_members
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Tenant users can read agencies" ON public.agencies;
CREATE POLICY "Tenant users can read agencies"
  ON public.agencies
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Tenant users can read documents" ON public.documents;
CREATE POLICY "Tenant users can read documents"
  ON public.documents
  FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() AND deleted_at IS NULL);
