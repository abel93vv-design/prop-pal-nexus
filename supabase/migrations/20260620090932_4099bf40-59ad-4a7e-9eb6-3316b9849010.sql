REVOKE SELECT (contact_name, contact_phone, contact_notes) ON public.properties FROM anon;
REVOKE SELECT (contact_name, contact_phone, contact_notes) ON public.properties FROM PUBLIC;