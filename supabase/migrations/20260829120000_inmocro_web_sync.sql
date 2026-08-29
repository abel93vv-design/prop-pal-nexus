-- Integración con las webs Inmocro (WordPress).
--   * Bucket público property-photos: las fotos de inmueble pasan de data URI (base64 en
--     properties.photos) a URLs. Necesario para los portales (Idealista/Fotocasa ya descartan
--     los data URI) y para que WordPress pueda descargarlas a su librería de medios.
--   * portal_connections.label: nombre visible de cada web conectada (portal_name = 'web:<slug>').
--   * properties.external_refs: reservado para que WordPress devuelva { "web:<slug>": {post_id,url} }
--     (solo se usará en la fase Web -> CRM; se añade ahora para no volver a migrar).

-- --- Bucket de fotos ---------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can read property photos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can update property photos" ON storage.objects;
DROP POLICY IF EXISTS "Tenant users can delete property photos" ON storage.objects;

CREATE POLICY "Public can read property photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-photos');

CREATE POLICY "Tenant users can upload property photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);

CREATE POLICY "Tenant users can update property photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text)
  WITH CHECK (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);

CREATE POLICY "Tenant users can delete property photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos' AND (storage.foldername(name))[1] = public.get_user_tenant_id()::text);

-- --- Metadatos de conexión --------------------------------------------------
ALTER TABLE public.portal_connections ADD COLUMN IF NOT EXISTS label text;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS external_refs jsonb NOT NULL DEFAULT '{}'::jsonb;
