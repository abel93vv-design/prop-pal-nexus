
-- Table to track login attempts per email
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Allow unauthenticated access for login tracking
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read login attempts" ON public.login_attempts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert login attempts" ON public.login_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update login attempts" ON public.login_attempts FOR UPDATE TO anon, authenticated USING (true);

-- Unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS login_attempts_email_idx ON public.login_attempts (email);
