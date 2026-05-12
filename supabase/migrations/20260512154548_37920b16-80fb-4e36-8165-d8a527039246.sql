
-- 2. Añadir tenant_id a user_roles (nullable: super_admin va sin tenant)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Eliminar PK antigua si existe e impedir duplicados (user_id, tenant_id, role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_tenant_role_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_tenant_role_key UNIQUE (user_id, tenant_id, role);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON public.user_roles(tenant_id);

-- 3. Tabla role_permissions: por tenant + rol + módulo
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  role public.app_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role, module)
);

CREATE INDEX IF NOT EXISTS idx_role_perms_tenant_role ON public.role_permissions(tenant_id, role);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Funciones helper
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(_user_id uuid, _tenant_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND (tenant_id = _tenant_id OR role = 'super_admin')
  ORDER BY (role = 'super_admin') DESC,
           (role = 'admin') DESC,
           (role = 'socio') DESC,
           (role = 'coordinadora') DESC,
           (role = 'asesor') DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND ((tenant_id = _tenant_id AND role = 'admin') OR role = 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _role public.app_role;
  _allowed boolean;
BEGIN
  -- super_admin siempre permite
  IF public.is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  _tenant_id := public.get_user_tenant_id();
  IF _tenant_id IS NULL THEN
    RETURN false;
  END IF;

  _role := public.get_user_role_in_tenant(_user_id, _tenant_id);
  IF _role IS NULL THEN
    -- Compatibilidad: si no hay rol asignado, permite todo dentro de su tenant (legacy)
    RETURN true;
  END IF;

  -- admin del tenant: acceso total
  IF _role = 'admin' THEN
    RETURN true;
  END IF;

  SELECT CASE _action
    WHEN 'view' THEN can_view
    WHEN 'edit' THEN can_edit
    WHEN 'delete' THEN can_delete
    ELSE false
  END
  INTO _allowed
  FROM public.role_permissions
  WHERE tenant_id = _tenant_id AND role = _role AND module = _module;

  RETURN COALESCE(_allowed, false);
END;
$$;

-- 5. RLS para role_permissions
DROP POLICY IF EXISTS "Tenant users can read role permissions" ON public.role_permissions;
CREATE POLICY "Tenant users can read role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Tenant admins can insert role permissions" ON public.role_permissions;
CREATE POLICY "Tenant admins can insert role permissions"
ON public.role_permissions FOR INSERT
TO authenticated
WITH CHECK (
  (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id))
  OR public.is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Tenant admins can update role permissions" ON public.role_permissions;
CREATE POLICY "Tenant admins can update role permissions"
ON public.role_permissions FOR UPDATE
TO authenticated
USING (
  (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id))
  OR public.is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Tenant admins can delete role permissions" ON public.role_permissions;
CREATE POLICY "Tenant admins can delete role permissions"
ON public.role_permissions FOR DELETE
TO authenticated
USING (
  (tenant_id = public.get_user_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id))
  OR public.is_super_admin(auth.uid())
);

-- 6. RLS para user_roles: gestionable por admin del tenant
DROP POLICY IF EXISTS "Tenant admins can read tenant roles" ON public.user_roles;
CREATE POLICY "Tenant admins can read tenant roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_super_admin(auth.uid())
  OR (tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id))
);

DROP POLICY IF EXISTS "Tenant admins can insert tenant roles" ON public.user_roles;
CREATE POLICY "Tenant admins can insert tenant roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    tenant_id IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
    AND role <> 'super_admin'
  )
);

DROP POLICY IF EXISTS "Tenant admins can update tenant roles" ON public.user_roles;
CREATE POLICY "Tenant admins can update tenant roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id) AND role <> 'super_admin')
);

DROP POLICY IF EXISTS "Tenant admins can delete tenant roles" ON public.user_roles;
CREATE POLICY "Tenant admins can delete tenant roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id) AND role <> 'super_admin')
);

-- 7. Trigger updated_at
DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON public.role_permissions;
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Función para sembrar permisos por defecto en un tenant
CREATE OR REPLACE FUNCTION public.seed_default_role_permissions(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _modules text[] := ARRAY['pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos','equipo','ajustes','facturas'];
  _m text;
BEGIN
  -- admin: todo (no se inserta, se resuelve en has_module_access)
  -- socio, coordinadora, asesor: ver+editar pedidos/ne/noticias/clientes/tareas/match
  FOREACH _m IN ARRAY _modules LOOP
    -- socio
    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (
      _tenant_id, 'socio', _m,
      _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos'),
      _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos'),
      false
    )
    ON CONFLICT (tenant_id, role, module) DO NOTHING;

    -- coordinadora
    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (
      _tenant_id, 'coordinadora', _m,
      _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos'),
      _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos'),
      false
    )
    ON CONFLICT (tenant_id, role, module) DO NOTHING;

    -- asesor
    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (
      _tenant_id, 'asesor', _m,
      _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos'),
      _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos'),
      false
    )
    ON CONFLICT (tenant_id, role, module) DO NOTHING;
  END LOOP;
END;
$$;

-- 9. Sembrar permisos para todos los tenants existentes
DO $$
DECLARE
  _t record;
BEGIN
  FOR _t IN SELECT id FROM public.tenants WHERE deleted_at IS NULL LOOP
    PERFORM public.seed_default_role_permissions(_t.id);
  END LOOP;
END$$;

-- 10. Asignar admin a huelin@valoracasa.es en su tenant
DO $$
DECLARE
  _user_id uuid;
  _tenant_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'huelin@valoracasa.es' LIMIT 1;
  IF _user_id IS NOT NULL THEN
    SELECT tenant_id INTO _tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
    IF _tenant_id IS NOT NULL THEN
      INSERT INTO public.user_roles(user_id, tenant_id, role)
      VALUES (_user_id, _tenant_id, 'admin')
      ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
    END IF;
  END IF;
END$$;

-- 11. Trigger: al crear un tenant, sembrar permisos por defecto
CREATE OR REPLACE FUNCTION public.on_tenant_created_seed_perms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_role_permissions(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_role_permissions ON public.tenants;
CREATE TRIGGER trg_seed_role_permissions
AFTER INSERT ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.on_tenant_created_seed_perms();
