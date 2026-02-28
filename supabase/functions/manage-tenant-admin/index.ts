import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is super-admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller || caller.email !== "avelascocorpo@gmail.com") {
      throw new Error("Solo el super-admin puede gestionar tenants");
    }

    const { action, tenant_id, user_id, new_password } = await req.json();

    if (action === "get_admin_users") {
      // Get all profiles linked to this tenant
      const { data: profiles, error: profErr } = await adminClient
        .from("profiles")
        .select("user_id, full_name, tenant_id")
        .eq("tenant_id", tenant_id);

      if (profErr) throw new Error(profErr.message);

      // Get auth user details for each profile
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
          });
        }
      }

      return new Response(JSON.stringify({ success: true, users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      if (!user_id || !new_password) throw new Error("user_id y new_password son obligatorios");

      const { error } = await adminClient.auth.admin.updateUser(user_id, {
        password: new_password,
      });
      if (error) throw new Error(`Error actualizando contraseña: ${error.message}`);

      // Set must_change_password flag
      await adminClient.from("profiles").update({ must_change_password: true }).eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true, message: "Contraseña actualizada" }), {
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
