
-- Add operation_type to properties (venta, alquiler, ambos)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS operation_type TEXT NOT NULL DEFAULT 'venta';

-- Add operation_type to clients (compra, alquiler, ambos)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS operation_type TEXT NOT NULL DEFAULT 'compra';

-- Add selected_zones to client_preferences for structured zone selection
-- Format: array of zone identifiers like ["distrito:centro", "barrio:huelin", "municipio:cartama"]
ALTER TABLE public.client_preferences
ADD COLUMN IF NOT EXISTS selected_zones TEXT[] DEFAULT '{}';

-- Add monthly_rent to properties for rental pricing
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC DEFAULT 0;
