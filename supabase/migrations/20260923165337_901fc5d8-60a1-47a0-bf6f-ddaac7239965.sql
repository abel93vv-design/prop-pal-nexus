INSERT INTO public.tenant_settings (tenant_id, key, label, value)
VALUES ('cb69b090-326a-4573-868a-baafe915e535', 'hoja_zona', 'Hoja de zona', 'true')
ON CONFLICT (tenant_id, key) DO UPDATE SET value = 'true', label = 'Hoja de zona', updated_at = now();