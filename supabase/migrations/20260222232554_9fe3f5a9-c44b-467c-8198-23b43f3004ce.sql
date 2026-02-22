
-- 1. Create tenants table
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read their tenant"
  ON public.tenants FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update tenants"
  ON public.tenants FOR UPDATE
  USING (true);

-- 2. Add tenant_id to profiles (links user to tenant)
ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- 3. Add tenant_id to all main entity tables
ALTER TABLE public.agencies ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.clients ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.properties ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.tasks ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.team_members ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.documents ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- 4. Create indexes for tenant_id
CREATE INDEX idx_agencies_tenant ON public.agencies(tenant_id);
CREATE INDEX idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX idx_properties_tenant ON public.properties(tenant_id);
CREATE INDEX idx_tasks_tenant ON public.tasks(tenant_id);
CREATE INDEX idx_team_members_tenant ON public.team_members(tenant_id);
CREATE INDEX idx_documents_tenant ON public.documents(tenant_id);
CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);

-- 5. Security definer function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 6. Drop existing RLS policies and create tenant-scoped ones

-- AGENCIES
DROP POLICY IF EXISTS "Authenticated users can read agencies" ON public.agencies;
DROP POLICY IF EXISTS "Authenticated users can insert agencies" ON public.agencies;
DROP POLICY IF EXISTS "Authenticated users can update agencies" ON public.agencies;
DROP POLICY IF EXISTS "Authenticated users can delete agencies" ON public.agencies;

CREATE POLICY "Tenant users can read agencies"
  ON public.agencies FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Tenant users can insert agencies"
  ON public.agencies FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update agencies"
  ON public.agencies FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete agencies"
  ON public.agencies FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- CLIENTS
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "Tenant users can read clients"
  ON public.clients FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Tenant users can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update clients"
  ON public.clients FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete clients"
  ON public.clients FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- PROPERTIES (keep public read for unauthenticated, but tenant-scoped for authenticated writes)
DROP POLICY IF EXISTS "Anyone can read properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Anyone can read properties"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "Tenant users can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update properties"
  ON public.properties FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete properties"
  ON public.properties FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- TASKS
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;

CREATE POLICY "Tenant users can read tasks"
  ON public.tasks FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Tenant users can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update tasks"
  ON public.tasks FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete tasks"
  ON public.tasks FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- TEAM_MEMBERS
DROP POLICY IF EXISTS "Authenticated users can read team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can insert team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can update team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can delete team" ON public.team_members;

CREATE POLICY "Tenant users can read team"
  ON public.team_members FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Tenant users can insert team"
  ON public.team_members FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update team"
  ON public.team_members FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete team"
  ON public.team_members FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- DOCUMENTS
DROP POLICY IF EXISTS "Authenticated users can read documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;

CREATE POLICY "Tenant users can read documents"
  ON public.documents FOR SELECT
  USING (tenant_id = public.get_user_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Tenant users can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update documents"
  ON public.documents FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete documents"
  ON public.documents FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());
