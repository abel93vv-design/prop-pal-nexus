-- 1) Backfill: any profile-in-tenant without a user_roles row → make them tenant admin
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT p.user_id, 'admin'::public.app_role, p.tenant_id
FROM public.profiles p
WHERE p.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
  )
ON CONFLICT DO NOTHING;

-- 2) Remove legacy bypass in has_module_access
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text, _action text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
  _role public.app_role;
  _allowed boolean;
BEGIN
  -- super_admin always allowed
  IF public.is_super_admin(_user_id) THEN
    RETURN true;
  END IF;

  _tenant_id := public.get_user_tenant_id();
  IF _tenant_id IS NULL THEN
    RETURN false;
  END IF;

  _role := public.get_user_role_in_tenant(_user_id, _tenant_id);
  -- No legacy bypass: deny when no role is assigned
  IF _role IS NULL THEN
    RETURN false;
  END IF;

  -- Tenant admin: full access
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
$function$;