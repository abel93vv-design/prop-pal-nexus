
-- Restore full SELECT on tenants for authenticated; row-level RLS still limits to own tenant
GRANT SELECT ON public.tenants TO authenticated;
