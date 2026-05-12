import { supabase } from "@/integrations/supabase/client";

export interface DomainTenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string;
  domain_verified: boolean;
  is_active: boolean;
}

const LOVABLE_HOST_PATTERNS = [
  /\.lovable\.app$/i,
  /\.lovableproject\.com$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/,
];

export const isLovableHost = (host: string) =>
  LOVABLE_HOST_PATTERNS.some(p => p.test(host));

let cached: DomainTenant | null | undefined = undefined;

export async function resolveDomainTenant(): Promise<DomainTenant | null> {
  if (cached !== undefined) return cached;

  const host = window.location.hostname;
  if (isLovableHost(host)) {
    cached = null;
    return null;
  }

  const { data, error } = await supabase.rpc("get_tenant_by_domain", { _host: host });
  if (error || !data || data.length === 0) {
    cached = null;
    return null;
  }
  const t = data[0] as DomainTenant;
  cached = t.domain_verified && t.is_active ? t : null;
  return cached;
}
