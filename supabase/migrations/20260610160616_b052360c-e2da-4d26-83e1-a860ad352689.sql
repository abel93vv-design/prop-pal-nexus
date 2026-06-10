CREATE OR REPLACE FUNCTION public.soft_delete_document(_id uuid)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tenant_id uuid;
  _user_id uuid;
  _row public.documents;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar documentos';
  END IF;

  _tenant_id := public.get_user_tenant_id();
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo identificar la inmobiliaria activa';
  END IF;

  SELECT * INTO _row
  FROM public.documents
  WHERE id = _id
    AND tenant_id = _tenant_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo mover el documento a la papelera';
  END IF;

  INSERT INTO public.entity_snapshots (tenant_id, entity_type, entity_id, action, snapshot, changed_by)
  VALUES (_tenant_id, 'document', _id, 'delete', to_jsonb(_row), _user_id);

  UPDATE public.documents
  SET deleted_at = now()
  WHERE id = _id
    AND tenant_id = _tenant_id
  RETURNING * INTO _row;

  PERFORM public.log_activity(_tenant_id, _user_id, 'delete', 'document', _id, jsonb_build_object('name', _row.name));

  RETURN _row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_document(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_document(uuid) TO authenticated, service_role;