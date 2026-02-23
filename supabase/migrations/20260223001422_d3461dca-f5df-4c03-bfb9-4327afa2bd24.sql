
-- Remove overly permissive policy
DROP POLICY "Service role full access to match scores" ON public.match_scores;
