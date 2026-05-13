import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  is_demo: boolean;
  subscription_status: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  loading: boolean;
  notFound: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

/**
 * Extract subdomain from the current hostname.
 * Examples:
 *   "acme.mycrm.com"       → "acme"
 *   "acme.localhost"        → "acme"
 *   "localhost"             → null
 *   "mycrm.com"            → null
 *   "www.mycrm.com"        → null  (www is ignored)
 *   "id-preview--xxx.lovable.app" → null (lovable preview)
 */
const extractSubdomain = (): string | null => {
  const hostname = window.location.hostname;

  // Skip IP addresses
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;

  const parts = hostname.split(".");

  // localhost without subdomain
  if (parts.length === 1) return null;

  // subdomain.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    const sub = parts[0];
    return sub === "www" ? null : sub;
  }

  // Skip lovable preview/project domains
  if (hostname.includes("lovable.app") || hostname.includes("lovableproject.com") || hostname.includes("lovable.dev")) return null;

  // standard: sub.domain.tld  (3+ parts)
  if (parts.length >= 3) {
    const sub = parts[0];
    return sub === "www" ? null : sub;
  }

  return null;
};

const mapTenant = (r: any): Tenant => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  plan: r.plan,
  is_active: r.is_active,
  is_demo: r.is_demo,
  subscription_status: r.subscription_status || 'active',
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolveTenant = async () => {
      setLoading(true);
      setNotFound(false);

      const hostname = window.location.hostname;
      const isLovable =
        hostname.includes("lovable.app") ||
        hostname.includes("lovableproject.com") ||
        hostname.includes("lovable.dev") ||
        hostname === "localhost" ||
        hostname === "127.0.0.1";

      // --- Priority 0: Custom domain (verified) ---
      if (!isLovable) {
        const { data: byDomain } = await supabase.rpc("get_tenant_by_domain", { _host: hostname });
        if (byDomain && byDomain.length > 0 && byDomain[0].domain_verified && byDomain[0].is_active) {
          const { data: full } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", byDomain[0].id)
            .single();
          if (full) {
            // Cross-tenant session guard
            if (session?.user?.id) {
              const { data: isSuper } = await supabase.rpc("is_super_admin", { _user_id: session.user.id });
              if (!isSuper) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("tenant_id")
                  .eq("user_id", session.user.id)
                  .maybeSingle();
                if (!profile || profile.tenant_id !== full.id) {
                  await supabase.auth.signOut();
                }
              }
            }
            setTenant(mapTenant(full));
            setLoading(false);
            return;
          }
        }
      }

      const subdomain = extractSubdomain();

      // --- Priority 1: Subdomain-based resolution ---
      if (subdomain) {
        const { data: tenantBySlug } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", subdomain)
          .eq("is_active", true)
          .single();

        if (tenantBySlug) {
          // Cross-tenant session guard
          if (session?.user?.id) {
            const { data: isSuper } = await supabase.rpc("is_super_admin", { _user_id: session.user.id });
            if (!isSuper) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("tenant_id")
                .eq("user_id", session.user.id)
                .maybeSingle();
              if (!profile || profile.tenant_id !== tenantBySlug.id) {
                await supabase.auth.signOut();
              }
            }
          }
          setTenant(mapTenant(tenantBySlug));
          setLoading(false);
          return;
        }

        // Slug not found → try demo tenant fallback
        const { data: demoTenant } = await supabase
          .from("tenants")
          .select("*")
          .eq("is_demo", true)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (demoTenant) {
          setTenant(mapTenant(demoTenant));
        } else {
          setNotFound(true);
        }
        setLoading(false);
        return;
      }

      // --- Priority 2: Profile-based resolution (no subdomain) ---
      if (session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("user_id", session.user.id)
          .single();

        if (profile?.tenant_id) {
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", profile.tenant_id)
            .single();

          if (tenantData) {
            setTenant(mapTenant(tenantData));
            setLoading(false);
            return;
          }
        }
      }

      setTenant(null);
      setLoading(false);
    };

    resolveTenant();
  }, [session]);

  // Show 404 for unresolved subdomain
  if (!loading && notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground">Tenant no encontrado</p>
          <p className="text-sm text-muted-foreground">
            El subdominio <strong>{extractSubdomain()}</strong> no está registrado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, tenantId: tenant?.id ?? null, loading, notFound }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
};
