DELETE FROM public.match_scores ms
WHERE EXISTS (SELECT 1 FROM public.properties p WHERE p.id = ms.property_id AND p.deleted_at IS NOT NULL)
   OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = ms.client_id AND c.deleted_at IS NOT NULL)
   OR NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id = ms.property_id)
   OR NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = ms.client_id);