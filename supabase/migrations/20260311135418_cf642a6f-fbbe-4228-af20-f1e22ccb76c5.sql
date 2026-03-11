
-- Add subscription-related columns to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active';

-- Create a function to check resource limits before insert
CREATE OR REPLACE FUNCTION public.check_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
  _plan text;
  _current_count bigint;
  _max_count int;
  _resource text;
BEGIN
  _tenant_id := NEW.tenant_id;
  IF _tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT plan INTO _plan FROM public.tenants WHERE id = _tenant_id;
  IF _plan IS NULL THEN _plan := 'free'; END IF;

  -- Determine which resource table we are inserting into
  _resource := TG_TABLE_NAME;

  -- Get current count (exclude soft-deleted)
  IF _resource = 'properties' THEN
    SELECT count(*) INTO _current_count FROM public.properties WHERE tenant_id = _tenant_id AND deleted_at IS NULL;
    _max_count := CASE _plan WHEN 'free' THEN 10 WHEN 'basic' THEN 50 WHEN 'pro' THEN 250 WHEN 'enterprise' THEN 999999 ELSE 10 END;
  ELSIF _resource = 'clients' THEN
    SELECT count(*) INTO _current_count FROM public.clients WHERE tenant_id = _tenant_id AND deleted_at IS NULL;
    _max_count := CASE _plan WHEN 'free' THEN 25 WHEN 'basic' THEN 100 WHEN 'pro' THEN 500 WHEN 'enterprise' THEN 999999 ELSE 25 END;
  ELSIF _resource = 'team_members' THEN
    SELECT count(*) INTO _current_count FROM public.team_members WHERE tenant_id = _tenant_id AND deleted_at IS NULL;
    _max_count := CASE _plan WHEN 'free' THEN 1 WHEN 'basic' THEN 3 WHEN 'pro' THEN 10 WHEN 'enterprise' THEN 999999 ELSE 1 END;
  ELSIF _resource = 'agencies' THEN
    SELECT count(*) INTO _current_count FROM public.agencies WHERE tenant_id = _tenant_id AND deleted_at IS NULL;
    _max_count := CASE _plan WHEN 'free' THEN 1 WHEN 'basic' THEN 1 WHEN 'pro' THEN 5 WHEN 'enterprise' THEN 999999 ELSE 1 END;
  ELSIF _resource = 'portal_connections' THEN
    SELECT count(*) INTO _current_count FROM public.portal_connections WHERE tenant_id = _tenant_id;
    _max_count := CASE _plan WHEN 'free' THEN 0 WHEN 'basic' THEN 2 WHEN 'pro' THEN 5 WHEN 'enterprise' THEN 999999 ELSE 0 END;
  ELSIF _resource = 'custom_field_definitions' THEN
    SELECT count(*) INTO _current_count FROM public.custom_field_definitions WHERE tenant_id = _tenant_id;
    _max_count := CASE _plan WHEN 'free' THEN 3 WHEN 'basic' THEN 10 WHEN 'pro' THEN 25 WHEN 'enterprise' THEN 999999 ELSE 3 END;
  ELSIF _resource = 'tenant_api_keys' THEN
    SELECT count(*) INTO _current_count FROM public.tenant_api_keys WHERE tenant_id = _tenant_id;
    _max_count := CASE _plan WHEN 'free' THEN 0 WHEN 'basic' THEN 1 WHEN 'pro' THEN 2 WHEN 'enterprise' THEN 999999 ELSE 0 END;
  ELSIF _resource = 'opportunities' THEN
    SELECT count(*) INTO _current_count FROM public.opportunities WHERE tenant_id = _tenant_id;
    _max_count := CASE _plan WHEN 'free' THEN 10 WHEN 'basic' THEN 50 WHEN 'pro' THEN 999999 WHEN 'enterprise' THEN 999999 ELSE 10 END;
  ELSE
    RETURN NEW;
  END IF;

  IF _current_count >= _max_count THEN
    RAISE EXCEPTION 'Límite del plan alcanzado para %. Actualiza tu plan para continuar. (% de % permitidos)', _resource, _current_count, _max_count;
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach triggers to all resource tables
CREATE OR REPLACE TRIGGER check_properties_limit BEFORE INSERT ON public.properties FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_clients_limit BEFORE INSERT ON public.clients FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_team_members_limit BEFORE INSERT ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_agencies_limit BEFORE INSERT ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_portal_connections_limit BEFORE INSERT ON public.portal_connections FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_custom_fields_limit BEFORE INSERT ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_api_keys_limit BEFORE INSERT ON public.tenant_api_keys FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
CREATE OR REPLACE TRIGGER check_opportunities_limit BEFORE INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.check_plan_limit();
