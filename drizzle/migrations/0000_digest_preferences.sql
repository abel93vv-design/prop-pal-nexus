CREATE TABLE public.digest_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  email text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  send_hour integer NOT NULL DEFAULT 21,
  include_zone boolean NOT NULL DEFAULT true,
  include_leads boolean NOT NULL DEFAULT true,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  last_sent_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digest_preferences TO authenticated;
GRANT ALL ON public.digest_preferences TO service_role;
ALTER TABLE public.digest_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.digest_preferences FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "own insert" ON public.digest_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id());
CREATE POLICY "own update" ON public.digest_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND tenant_id = public.get_user_tenant_id());
CREATE POLICY "own delete" ON public.digest_preferences FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_digest_prefs_updated BEFORE UPDATE ON public.digest_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();