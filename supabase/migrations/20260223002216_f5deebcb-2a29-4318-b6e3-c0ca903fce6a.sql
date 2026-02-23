
ALTER TABLE public.match_scores ADD COLUMN IF NOT EXISTS score_details jsonb DEFAULT '{}'::jsonb;
