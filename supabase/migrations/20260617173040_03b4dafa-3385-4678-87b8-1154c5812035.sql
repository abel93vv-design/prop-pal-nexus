ALTER TABLE public.daily_global_metrics
  ADD COLUMN IF NOT EXISTS personas_que_entran integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entrantes_pedidos_compra integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entrantes_vendedores integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entrantes_otros integer NOT NULL DEFAULT 0;