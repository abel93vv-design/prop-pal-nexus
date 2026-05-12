import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is super_admin
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { tenant_id } = await req.json();
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .select("custom_domain, domain_verification_token")
      .eq("id", tenant_id)
      .maybeSingle();

    if (tErr || !tenant?.custom_domain || !tenant.domain_verification_token) {
      return new Response(JSON.stringify({ error: "Tenant sin dominio configurado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const recordName = `_kagesan-verify.${tenant.custom_domain}`;
    let txtRecords: string[][] = [];
    try {
      txtRecords = await Deno.resolveDns(recordName, "TXT");
    } catch (e) {
      return new Response(JSON.stringify({
        error: `No se encontró el registro TXT en ${recordName}. Asegúrate de haberlo añadido y espera la propagación DNS.`,
        details: String(e),
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const flat = txtRecords.flat().map(s => s.trim());
    const found = flat.some(v => v.includes(tenant.domain_verification_token!));

    if (!found) {
      return new Response(JSON.stringify({
        error: "El token TXT no coincide. Verifica que el valor en tu DNS sea el indicado.",
        expected: tenant.domain_verification_token,
        found: flat,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("tenants").update({ domain_verified: true }).eq("id", tenant_id);

    return new Response(JSON.stringify({ success: true, message: "Dominio verificado correctamente" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
