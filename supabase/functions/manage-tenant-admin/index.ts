import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is authenticated and has admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No autorizado");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) throw new Error("No autorizado");

    const callerId = userData.user.id;

    // Check admin role server-side (super_admin OR admin)
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["admin", "super_admin"]);

    if (!roleData || roleData.length === 0) throw new Error("Solo los administradores pueden gestionar tenants");

    const isSuperAdmin = roleData.some((r: any) => r.role === "super_admin");

    // Get caller's own tenant_id (for scoping non-super_admin operations)
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", callerId)
      .maybeSingle();
    const callerTenantId = callerProfile?.tenant_id ?? null;

    const { action, tenant_id, user_id, new_password } = await req.json();

    // Helper: for tenant-scoped actions, non-super_admin must match own tenant
    const denyCrossTenant = (targetTenantId: string | null | undefined) => {
      if (isSuperAdmin) return null;
      if (!callerTenantId || !targetTenantId || targetTenantId !== callerTenantId) {
        return new Response(
          JSON.stringify({ success: false, error: "No autorizado para este tenant" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return null;
    };


    if (action === "get_admin_users") {
      const { data: profiles, error: profErr } = await adminClient
        .from("profiles")
        .select("user_id, full_name, tenant_id")
        .eq("tenant_id", tenant_id);

      if (profErr) throw new Error(profErr.message);

      const userIds = (profiles || []).map(p => p.user_id);
      const { data: rolesRows } = await adminClient
        .from("user_roles")
        .select("user_id, role, tenant_id")
        .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

      const rolesByUser = new Map<string, string[]>();
      for (const r of rolesRows || []) {
        // Include role if global (super_admin) or matches this tenant
        if (!r.tenant_id || r.tenant_id === tenant_id) {
          const arr = rolesByUser.get(r.user_id) || [];
          arr.push(r.role);
          rolesByUser.set(r.user_id, arr);
        }
      }

      const users = [];
      for (const p of profiles || []) {
        const { data: { user }, error } = await adminClient.auth.admin.getUserById(p.user_id);
        if (!error && user) {
          users.push({
            id: user.id,
            email: user.email,
            full_name: p.full_name,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            roles: rolesByUser.get(user.id) || [],
          });
        }
      }

      return new Response(JSON.stringify({ success: true, users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      if (!user_id || !new_password) throw new Error("user_id y new_password son obligatorios");

      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (error) throw new Error(`Error actualizando contraseña: ${error.message}`);

      await adminClient.from("profiles").update({ must_change_password: true }).eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true, message: "Contraseña actualizada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "signout_all_users") {
      if (!tenant_id) throw new Error("tenant_id es obligatorio");
      const { data: profiles, error: profErr } = await adminClient
        .from("profiles")
        .select("user_id")
        .eq("tenant_id", tenant_id);
      if (profErr) throw new Error(profErr.message);

      let signedOut = 0;
      const errors: string[] = [];
      for (const p of profiles || []) {
        const { error } = await adminClient.auth.admin.signOut(p.user_id, "global");
        if (error) errors.push(`${p.user_id}: ${error.message}`);
        else signedOut++;
      }

      return new Response(JSON.stringify({ success: true, signed_out: signedOut, total: profiles?.length || 0, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_activity_logs") {
      if (!tenant_id) throw new Error("tenant_id es obligatorio");
      const { data: logs, error: logErr } = await adminClient
        .from("activity_logs")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (logErr) throw new Error(logErr.message);
      return new Response(JSON.stringify({ success: true, logs: logs || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Acción no reconocida: ${action}`);
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
