
-- Security fix: 20260610161835 restored unrestricted column SELECT on
-- public.tenants for `authenticated` five minutes after 20260610161242 had
-- deliberately hidden stripe_customer_id, stripe_subscription_id and
-- domain_verification_token from that role. Net effect since then: any
-- authenticated user can read those columns for every tenant row visible to
-- them under RLS (their own tenant, or all tenants for super_admin) via a
-- direct REST call, even though the app itself never queries those columns
-- through the authenticated client (verified: only service_role edge
-- functions and the get_tenant_domain_info() SECURITY DEFINER RPC touch them).
REVOKE SELECT ON public.tenants FROM authenticated;
GRANT SELECT (
  id, name, slug, plan, is_active, is_demo, created_at, updated_at, deleted_at,
  subscription_status, custom_domain, domain_verified, allow_password_recovery,
  lovable_domain_added
) ON public.tenants TO authenticated;
