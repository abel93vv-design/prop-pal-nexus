ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);