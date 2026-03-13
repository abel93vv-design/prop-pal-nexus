
-- Re-create plan limit triggers (ensuring they exist)
CREATE OR REPLACE TRIGGER check_plan_limit_properties
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_team_members
  BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_agencies
  BEFORE INSERT ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_portal_connections
  BEFORE INSERT ON public.portal_connections
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_custom_field_definitions
  BEFORE INSERT ON public.custom_field_definitions
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_tenant_api_keys
  BEFORE INSERT ON public.tenant_api_keys
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

CREATE OR REPLACE TRIGGER check_plan_limit_opportunities
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION check_plan_limit();

-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
