import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (const byte of arr) pwd += chars[byte % chars.length];
  return pwd;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerId = claimsData.claims.sub;

    // Admin client to get caller's profile
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get caller's tenant_id from profiles
    const { data: callerProfile } = await adminClient.from("profiles").select("tenant_id").eq("user_id", callerId).single();
    const tenantId = callerProfile?.tenant_id;

    const body = await req.json();
    const { name, email, role, phone, agency_id, access_type, permissions, password: providedPassword } = body;

    if (!name || !email || !role) {
      return new Response(JSON.stringify({ error: "Nombre, email y rol son obligatorios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const password = providedPassword || generatePassword();

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = authData.user.id;

    // Update profile with tenant_id and must_change_password
    await adminClient.from("profiles").update({
      tenant_id: tenantId,
      must_change_password: true,
    }).eq("user_id", userId);

    // Create team member row (no password column)
    const { error: teamError } = await adminClient.from("team_members").insert({
      name,
      email,
      role,
      phone: phone || "",
      agency_id: agency_id || null,
      access_type: access_type || "solo_inmobiliaria",
      permissions: permissions || [],
      tenant_id: tenantId,
    });

    if (teamError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: teamError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const loginUrl = `${req.headers.get("origin") || supabaseUrl}/auth`;

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      email,
      password,
      login_url: loginUrl,
      message: `Usuario creado. Comparta las credenciales con ${name}.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
