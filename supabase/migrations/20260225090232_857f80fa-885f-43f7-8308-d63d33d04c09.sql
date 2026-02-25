
-- Add property extras (boolean features)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_elevator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_terrace BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pool BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_garage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_air_conditioning BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS community_fees NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ibi_annual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS neighborhood TEXT DEFAULT '';

-- Add monthly_debts to client_financials for precise debt calculation
ALTER TABLE public.client_financials
ADD COLUMN IF NOT EXISTS monthly_debts NUMERIC DEFAULT 0;

-- Add required_extras to client_preferences for must-have features
ALTER TABLE public.client_preferences
ADD COLUMN IF NOT EXISTS required_extras TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS neighborhood TEXT DEFAULT '';
