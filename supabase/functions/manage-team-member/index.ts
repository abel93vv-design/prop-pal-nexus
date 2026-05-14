import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ROLES = ["admin", "socio", "coordinadora", "asesor"] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) return json({ error: "No autorizado" }, 401);

    const callerId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerProfile } = await adminClient.from("profiles").select("tenant_id").eq("user_id", callerId).single();
    const tenantId = callerProfile?.tenant_id;
    if (!tenantId) return json({ error: "No se pudo identificar tu inmobiliaria" }, 400);

    const { data: callerRoles } = await adminClient.from("user_roles").select("role, tenant_id").eq("user_id", callerId);
    const isAuthorized = (callerRoles || []).some(
      (r: any) => r.role === "super_admin" || (r.role === "admin" && r.tenant_id === tenantId),
    );
    if (!isAuthorized) return json({ error: "Solo los administradores pueden gestionar miembros" }, 403);

    const body = await req.json();
    const { action, user_id, team_member_id, new_role } = body;

    if (!user_id) return json({ error: "user_id es obligatorio" }, 400);
    if (user_id === callerId) return json({ error: "No puedes modificar tu propio usuario" }, 400);

    // Verify target belongs to same tenant
    const { data: targetTm } = await adminClient
      .from("team_members")
      .select("id, tenant_id, user_id")
      .eq("user_id", user_id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!targetTm) return json({ error: "Miembro no encontrado en tu inmobiliaria" }, 404);

    if (action === "update_role") {
      if (!VALID_ROLES.includes(new_role)) return json({ error: "Rol inválido" }, 400);

      // Remove existing roles for this user in this tenant
      await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("tenant_id", tenantId);
      const { error: insErr } = await adminClient.from("user_roles").insert({ user_id, tenant_id: tenantId, role: new_role });
      if (insErr) return json({ error: insErr.message }, 400);

      await adminClient.from("team_members").update({ role: new_role }).eq("id", targetTm.id);
      return json({ success: true });
    }

    if (action === "delete") {
      // Soft delete team_member, remove role, then delete auth user
      await adminClient.from("team_members").update({ deleted_at: new Date().toISOString() }).eq("id", targetTm.id);
      await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("tenant_id", tenantId);
      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) return json({ error: `Miembro eliminado pero falló borrar auth: ${delErr.message}` }, 200);
      return json({ success: true });
    }

    return json({ error: "Acción no válida" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
