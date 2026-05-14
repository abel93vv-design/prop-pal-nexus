import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, { properties: number; clients: number; team_members: number }> = {
  free: { properties: 10, clients: 25, team_members: 1 },
  basic: { properties: 50, clients: 100, team_members: 3 },
  pro: { properties: 250, clients: 500, team_members: 10 },
  enterprise: { properties: 999999, clients: 999999, team_members: 999999 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No autorizado");

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await caller.auth.getClaims(token);
    if (cErr || !claims?.claims) throw new Error("No autorizado");

    const callerId = claims.claims.sub;
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Solo el super admin puede acceder a este panel");

    const { action, tenant_id } = await req.json();

    if (action === "overview") {
      // tenants
      const { data: tenants } = await admin
        .from("tenants")
        .select("id, name, slug, plan, subscription_status, custom_domain, domain_verified, is_active, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const tenantIds = (tenants || []).map((t: any) => t.id);

      // Aggregate counts in parallel
      const [propsRes, clientsRes, teamRes, profilesRes, invoicesRes] = await Promise.all([
        admin.from("properties").select("tenant_id", { count: "exact", head: false }).is("deleted_at", null).in("tenant_id", tenantIds),
        admin.from("clients").select("tenant_id", { count: "exact", head: false }).is("deleted_at", null).in("tenant_id", tenantIds),
        admin.from("team_members").select("tenant_id").is("deleted_at", null).in("tenant_id", tenantIds),
        admin.from("profiles").select("tenant_id").in("tenant_id", tenantIds),
        admin.from("invoices").select("tenant_id, amount, status, created_at").in("tenant_id", tenantIds),
      ]);

      const countBy = (rows: any[] | null, key = "tenant_id") => {
        const m: Record<string, number> = {};
        (rows || []).forEach((r) => { m[r[key]] = (m[r[key]] || 0) + 1; });
        return m;
      };

      const propsByT = countBy(propsRes.data as any[]);
      const clientsByT = countBy(clientsRes.data as any[]);
      const teamByT = countBy(teamRes.data as any[]);
      const usersByT = countBy(profilesRes.data as any[]);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      let mrrMonth = 0;
      let totalRevenue = 0;
      const invoicesByT: Record<string, number> = {};
      (invoicesRes.data || []).forEach((inv: any) => {
        const amt = Number(inv.amount) || 0;
        if (inv.status === "paid") {
          totalRevenue += amt;
          if (new Date(inv.created_at) >= monthStart) mrrMonth += amt;
        }
        invoicesByT[inv.tenant_id] = (invoicesByT[inv.tenant_id] || 0) + 1;
      });

      const enriched = (tenants || []).map((t: any) => {
        const limits = PLAN_LIMITS[t.plan] || PLAN_LIMITS.free;
        const props = propsByT[t.id] || 0;
        const clis = clientsByT[t.id] || 0;
        const team = teamByT[t.id] || 0;
        const usrs = usersByT[t.id] || 0;
        const pctProps = limits.properties >= 999999 ? 0 : Math.round((props / Math.max(1, limits.properties)) * 100);
        const pctClients = limits.clients >= 999999 ? 0 : Math.round((clis / Math.max(1, limits.clients)) * 100);
        const pctTeam = limits.team_members >= 999999 ? 0 : Math.round((team / Math.max(1, limits.team_members)) * 100);
        const maxPct = Math.max(pctProps, pctClients, pctTeam);
        return {
          ...t,
          counts: { properties: props, clients: clis, team_members: team, users: usrs, invoices: invoicesByT[t.id] || 0 },
          limits,
          usage: { properties: pctProps, clients: pctClients, team_members: pctTeam, max: maxPct },
          at_risk: maxPct >= 80,
        };
      });

      const totals = {
        tenants: enriched.length,
        active_tenants: enriched.filter((t: any) => t.is_active).length,
        users: Object.values(usersByT).reduce((a: number, b: number) => a + b, 0),
        clients: Object.values(clientsByT).reduce((a: number, b: number) => a + b, 0),
        properties: Object.values(propsByT).reduce((a: number, b: number) => a + b, 0),
        revenue_month: mrrMonth,
        revenue_total: totalRevenue,
        at_risk: enriched.filter((t: any) => t.at_risk).length,
      };

      return new Response(JSON.stringify({ success: true, totals, tenants: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "global_activity") {
      const { data: logs } = await admin
        .from("activity_logs")
        .select("id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      const { data: tenants } = await admin.from("tenants").select("id, name");
      const tenantMap: Record<string, string> = {};
      (tenants || []).forEach((t: any) => { tenantMap[t.id] = t.name; });
      const enriched = (logs || []).map((l: any) => ({ ...l, tenant_name: tenantMap[l.tenant_id] || "—" }));
      return new Response(JSON.stringify({ success: true, logs: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "all_invoices") {
      const { data: invoices } = await admin
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: tenants } = await admin.from("tenants").select("id, name");
      const tenantMap: Record<string, string> = {};
      (tenants || []).forEach((t: any) => { tenantMap[t.id] = t.name; });
      const enriched = (invoices || []).map((i: any) => ({ ...i, tenant_name: tenantMap[i.tenant_id] || "—" }));
      return new Response(JSON.stringify({ success: true, invoices: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "tenant_detail") {
      if (!tenant_id) throw new Error("tenant_id requerido");
      const [tRes, profilesRes, rolesRes, clientsRes, propsRes, invoicesRes, logsRes] = await Promise.all([
        admin.from("tenants").select("*").eq("id", tenant_id).maybeSingle(),
        admin.from("profiles").select("user_id, full_name, created_at").eq("tenant_id", tenant_id),
        admin.from("user_roles").select("user_id, role").eq("tenant_id", tenant_id),
        admin.from("clients").select("id, name, email, created_at").eq("tenant_id", tenant_id).is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
        admin.from("properties").select("id, title, price, status, created_at").eq("tenant_id", tenant_id).is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
        admin.from("invoices").select("*").eq("tenant_id", tenant_id).order("created_at", { ascending: false }),
        admin.from("activity_logs").select("*").eq("tenant_id", tenant_id).order("created_at", { ascending: false }).limit(50),
      ]);

      const rolesByUser: Record<string, string[]> = {};
      (rolesRes.data || []).forEach((r: any) => {
        rolesByUser[r.user_id] = rolesByUser[r.user_id] || [];
        rolesByUser[r.user_id].push(r.role);
      });

      const users = [];
      for (const p of profilesRes.data || []) {
        try {
          const { data: { user } } = await admin.auth.admin.getUserById(p.user_id);
          if (user) {
            users.push({
              id: user.id,
              email: user.email,
              full_name: p.full_name,
              roles: rolesByUser[p.user_id] || [],
              last_sign_in_at: user.last_sign_in_at,
              created_at: user.created_at,
            });
          }
        } catch (_) { /* skip */ }
      }

      return new Response(JSON.stringify({
        success: true,
        tenant: tRes.data,
        users,
        clients: clientsRes.data || [],
        properties: propsRes.data || [],
        invoices: invoicesRes.data || [],
        activity: logsRes.data || [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Acción no reconocida");
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
