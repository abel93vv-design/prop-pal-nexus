CREATE OR REPLACE FUNCTION public.soft_delete_client(_id uuid)
RETURNS public.clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _user_id uuid;
  _row public.clients;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar clientes';
  END IF;

  _tenant_id := public.get_user_tenant_id();
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo identificar la inmobiliaria activa';
  END IF;

  SELECT * INTO _row
  FROM public.clients
  WHERE id = _id
    AND tenant_id = _tenant_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo mover el cliente a la papelera';
  END IF;

  INSERT INTO public.entity_snapshots (tenant_id, entity_type, entity_id, action, snapshot, changed_by)
  VALUES (_tenant_id, 'client', _id, 'delete', to_jsonb(_row), _user_id);

  UPDATE public.clients
  SET deleted_at = now()
  WHERE id = _id
    AND tenant_id = _tenant_id
  RETURNING * INTO _row;

  PERFORM public.log_activity(_tenant_id, _user_id, 'delete', 'client', _id, jsonb_build_object('name', _row.name));

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_property(_id uuid)
RETURNS public.properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _user_id uuid;
  _row public.properties;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar propiedades';
  END IF;

  _tenant_id := public.get_user_tenant_id();
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo identificar la inmobiliaria activa';
  END IF;

  SELECT * INTO _row
  FROM public.properties
  WHERE id = _id
    AND tenant_id = _tenant_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo mover la propiedad a la papelera';
  END IF;

  INSERT INTO public.entity_snapshots (tenant_id, entity_type, entity_id, action, snapshot, changed_by)
  VALUES (_tenant_id, 'property', _id, 'delete', to_jsonb(_row), _user_id);

  UPDATE public.properties
  SET deleted_at = now()
  WHERE id = _id
    AND tenant_id = _tenant_id
  RETURNING * INTO _row;

  PERFORM public.log_activity(_tenant_id, _user_id, 'delete', 'property', _id, jsonb_build_object('title', _row.title));

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_client(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.soft_delete_property(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_property(uuid) TO authenticated;