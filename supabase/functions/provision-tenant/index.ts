import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PIPELINE_STAGES = [
  { name: "Contacto inicial", position: 0, color: "#3B82F6", stage_type: "active", default_probability: 10, stale_days: 5 },
  { name: "Visita programada", position: 1, color: "#8B5CF6", stage_type: "active", default_probability: 30, stale_days: 5 },
  { name: "Visita realizada", position: 2, color: "#F59E0B", stage_type: "active", default_probability: 50, stale_days: 7 },
  { name: "Negociación", position: 3, color: "#F97316", stage_type: "active", default_probability: 70, stale_days: 10 },
  { name: "Oferta presentada", position: 4, color: "#EC4899", stage_type: "active", default_probability: 85, stale_days: 7 },
  { name: "Cerrado ganado", position: 5, color: "#10B981", stage_type: "won", default_probability: 100, stale_days: 30 },
  { name: "Cerrado perdido", position: 6, color: "#EF4444", stage_type: "lost", default_probability: 0, stale_days: 30 },
];

const DEFAULT_CUSTOM_FIELDS = [
  // Client fields
  { entity_type: "client", field_type: "select", name: "Urgencia", key: "urgencia", position: 0, required: false, filterable: true, used_in_matching: false, weight_in_matching: 0, options: ["baja", "media", "alta", "inmediata"] },
  { entity_type: "client", field_type: "text", name: "Observaciones internas", key: "observaciones_internas", position: 1, required: false, filterable: false, used_in_matching: false, weight_in_matching: 0, options: [] },
  // Property fields
  { entity_type: "property", field_type: "select", name: "Estado de reforma", key: "estado_reforma", position: 0, required: false, filterable: true, used_in_matching: true, weight_in_matching: 10, options: ["a_reformar", "semi_reformado", "reformado", "obra_nueva"] },
  { entity_type: "property", field_type: "boolean", name: "Amueblado", key: "amueblado", position: 1, required: false, filterable: true, used_in_matching: true, weight_in_matching: 5, options: [] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No autorizado");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller || caller.email !== "avelascocorpo@gmail.com") {
      throw new Error("Solo el super-admin puede provisionar tenants");
    }

    const { name, slug, plan, is_active, is_demo, admin_email, admin_password, admin_name } = await req.json();

    if (!name || !slug || !admin_email || !admin_password) {
      throw new Error("Faltan campos obligatorios: name, slug, admin_email, admin_password");
    }

    // 1. Create tenant
    const { data: tenant, error: tenantErr } = await adminClient
      .from("tenants")
      .insert({ name, slug, plan: plan || "free", is_active: is_active ?? true, is_demo: is_demo ?? false })
      .select()
      .single();
    if (tenantErr) throw new Error(`Error creando tenant: ${tenantErr.message}`);

    const tenantId = tenant.id;

    // 2. Create or find auth user
    let userId: string;
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name || name },
    });
    if (authErr) {
      if (authErr.message.includes("already been registered")) {
        // User exists — find them and reuse
        const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
        if (listErr) {
          await adminClient.from("tenants").delete().eq("id", tenantId);
          throw new Error(`Error buscando usuario existente: ${listErr.message}`);
        }
        const existing = users.find((u: any) => u.email === admin_email);
        if (!existing) {
          await adminClient.from("tenants").delete().eq("id", tenantId);
          throw new Error("El usuario existe pero no se pudo localizar");
        }
        userId = existing.id;
      } else {
        await adminClient.from("tenants").delete().eq("id", tenantId);
        throw new Error(`Error creando usuario: ${authErr.message}`);
      }
    } else {
      userId = authData.user.id;
    }

    // 3. Update profile with tenant_id and must_change_password
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({ tenant_id: tenantId, must_change_password: true })
      .eq("user_id", userId);
    if (profileErr) {
      console.error("Profile update error:", profileErr.message);
    }

    // 4. Assign admin role
    await adminClient.from("user_roles").insert({ user_id: userId, role: "admin" });

    // 5. Create default pipeline stages
    const stageInserts = DEFAULT_PIPELINE_STAGES.map(s => ({ ...s, tenant_id: tenantId }));
    await adminClient.from("pipeline_stages").insert(stageInserts);

    // 6. Create default custom field definitions
    const fieldInserts = DEFAULT_CUSTOM_FIELDS.map(f => ({ ...f, tenant_id: tenantId }));
    await adminClient.from("custom_field_definitions").insert(fieldInserts);

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenantId,
        user_id: userId,
        message: `Tenant "${name}" provisionado correctamente. El usuario ${admin_email} puede iniciar sesión.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});