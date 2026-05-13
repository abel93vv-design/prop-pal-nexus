CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.tenants_handle_domain()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.custom_domain IS NOT NULL THEN
    NEW.custom_domain := lower(trim(NEW.custom_domain));
    IF NEW.custom_domain = '' THEN
      NEW.custom_domain := NULL;
      NEW.domain_verification_token := NULL;
      NEW.domain_verified := false;
    ELSE
      IF TG_OP = 'INSERT' OR OLD.custom_domain IS DISTINCT FROM NEW.custom_domain THEN
        NEW.domain_verification_token := encode(extensions.gen_random_bytes(16), 'hex');
        NEW.domain_verified := false;
      END IF;
    END IF;
  ELSE
    NEW.domain_verification_token := NULL;
    NEW.domain_verified := false;
  END IF;
  RETURN NEW;
END;
$function$;