CREATE OR REPLACE FUNCTION public.seed_default_role_permissions(_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _modules text[] := ARRAY['pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos','equipo','ajustes','facturas','control_leads'];
  _m text;
  _editable boolean;
  _asesor_edit boolean;
BEGIN
  FOREACH _m IN ARRAY _modules LOOP
    _editable := _m IN ('pedidos','ne','noticias','clientes','tareas','match_center','pipeline','documentos','control_leads');
    -- Asesor: solo puede crear/editar noticias; clientes y NE solo lectura
    _asesor_edit := _editable AND _m NOT IN ('clientes','ne');

    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (_tenant_id, 'socio', _m, _editable, _editable, false)
    ON CONFLICT (tenant_id, role, module) DO NOTHING;

    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (_tenant_id, 'coordinadora', _m, _editable, _editable, false)
    ON CONFLICT (tenant_id, role, module) DO NOTHING;

    INSERT INTO public.role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)
    VALUES (_tenant_id, 'asesor', _m, _editable, _asesor_edit, false)
    ON CONFLICT (tenant_id, role, module) DO NOTHING;
  END LOOP;
END;
$function$;

UPDATE public.role_permissions
SET can_edit = false, can_delete = false, updated_at = now()
WHERE role = 'asesor' AND module IN ('clientes','ne');

UPDATE public.role_permissions
SET can_view = true, can_edit = true, can_delete = false, updated_at = now()
WHERE role = 'asesor' AND module = 'noticias';