
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'viewer');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'agent',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Agencies
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read agencies" ON public.agencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert agencies" ON public.agencies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update agencies" ON public.agencies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete agencies" ON public.agencies FOR DELETE TO authenticated USING (true);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'comprador',
  lead_status TEXT NOT NULL DEFAULT 'nuevo',
  property_ids TEXT[] DEFAULT '{}',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT DEFAULT '',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  category TEXT DEFAULT '',
  last_contacted_at TIMESTAMPTZ,
  contact_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  address TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'piso',
  status TEXT NOT NULL DEFAULT 'disponible',
  price NUMERIC DEFAULT 0,
  surface NUMERIC DEFAULT 0,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  photos TEXT[] DEFAULT '{}',
  agent_id UUID,
  interested_client_ids TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT now(),
  description TEXT DEFAULT '',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update properties" ON public.properties FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete properties" ON public.properties FOR DELETE TO authenticated USING (true);

-- Team members / CRM users
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'agente',
  phone TEXT DEFAULT '',
  property_ids TEXT[] DEFAULT '{}',
  client_ids TEXT[] DEFAULT '{}',
  avatar TEXT DEFAULT '',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL DEFAULT 'solo_inmobiliaria',
  permissions TEXT[] DEFAULT '{}',
  password TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read team" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team" ON public.team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team" ON public.team_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete team" ON public.team_members FOR DELETE TO authenticated USING (true);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'llamada',
  status TEXT NOT NULL DEFAULT 'pendiente',
  priority TEXT NOT NULL DEFAULT 'media',
  due_date TIMESTAMPTZ,
  agent_id UUID,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'otros',
  file TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete documents" ON public.documents FOR DELETE TO authenticated USING (true);
