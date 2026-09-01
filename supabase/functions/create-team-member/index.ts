import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ROLES = ["admin", "socio", "coordinadora", "asesor"] as const;
type AppRole = typeof VALID_ROLES[number];

function generatePassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const pickRandom = (set: string) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return set[buf[0] % set.length];
  };

  // Guarantee at least 1 uppercase, 1 lowercase, 2 digits + uniqueness extras
  const required = [pickRandom(upper), pickRandom(lower), pickRandom(digits), pickRandom(digits)];
  // Add timestamp-derived chars to ensure uniqueness across calls
  const ts = Date.now().toString(36);
  const tsChars = ts.slice(-3).split("").map((c) => /[0-9a-z]/i.test(c) ? c : pickRandom(all));

  const remaining = length - required.length - tsChars.length;
  const rest: string[] = [];
  for (let i = 0; i < remaining; i++) rest.push(pickRandom(all));

  const all_chars = [...required, ...tsChars, ...rest];
  // Fisher-Yates shuffle with crypto randomness
  for (let i = all_chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [all_chars[i], all_chars[j]] = [all_chars[j], all_chars[i]];
  }
  return all_chars.join("");
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
    

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callerId = userData.user.id;

    const { data: callerProfile } = await adminClient.from("profiles").select("tenant_id").eq("user_id", callerId).single();
    const tenantId = callerProfile?.tenant_id;
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "No se pudo identificar tu inmobiliaria" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate caller is admin of tenant or super_admin
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role, tenant_id")
      .eq("user_id", callerId);
    const isAuthorized = (callerRoles || []).some(
      (r: any) => r.role === "super_admin" || (r.role === "admin" && r.tenant_id === tenantId),
    );
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Solo los administradores pueden crear miembros" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { name, email, phone, agency_id, app_role, password: providedPassword } = body;

    if (!name || !email || !app_role) {
      return new Response(JSON.stringify({ error: "Nombre, email y rol son obligatorios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!VALID_ROLES.includes(app_role)) {
      return new Response(JSON.stringify({ error: `Rol inválido. Debe ser uno de: ${VALID_ROLES.join(", ")}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const password = providedPassword || generatePassword();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError) {
      const msg = (authError.message || "").toLowerCase();
      const isEmailExists =
        (authError as any).code === "email_exists" ||
        msg.includes("already been registered") ||
        msg.includes("already registered") ||
        msg.includes("user already");
      if (isEmailExists) {
        return new Response(
          JSON.stringify({
            error: "Este email ya está registrado en el sistema. El usuario puede recuperar su contraseña para acceder.",
            code: "email_exists",
            email,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = authData.user.id;

    await adminClient.from("profiles").update({
      tenant_id: tenantId,
      must_change_password: true,
    }).eq("user_id", userId);

    // Insert team member with user_id link
    const { error: teamError } = await adminClient.from("team_members").insert({
      name,
      email,
      role: app_role, // legacy column, now stores app_role too
      phone: phone || "",
      agency_id: agency_id || null,
      access_type: "solo_inmobiliaria",
      permissions: [],
      tenant_id: tenantId,
      user_id: userId,
    });

    if (teamError) {
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: teamError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert user_role for RBAC
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: userId,
      tenant_id: tenantId,
      role: app_role as AppRole,
    });

    if (roleError) {
      // Rollback
      await adminClient.from("team_members").delete().eq("user_id", userId);
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: `Error al asignar rol: ${roleError.message}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const loginUrl = `${req.headers.get("origin") || supabaseUrl}/auth`;

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      email,
      password,
      login_url: loginUrl,
      message: `Usuario creado con rol ${app_role}. Comparta las credenciales con ${name}.`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
