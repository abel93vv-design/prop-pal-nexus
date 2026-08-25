import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Envío automático de WhatsApp vía Twilio (connector gateway).
// Requiere conectar la integración de Twilio (TWILIO_API_KEY) y configurar
// el secreto TWILIO_WHATSAPP_FROM con el número de empresa (ej: +34600000000).
//
// Acciones:
//  - { action: "status" }  -> indica si el envío automático está configurado
//  - { action: "send", to, message, client_id? } -> envía el mensaje
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Autenticación: solo usuarios autenticados del CRM
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    const userId = claimsData?.claims?.sub as string | undefined;
    if (claimsError || !userId) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
    const configured = Boolean(LOVABLE_API_KEY && TWILIO_API_KEY && TWILIO_WHATSAPP_FROM);

    // 2. Validación de entrada
    let body: { action?: unknown; to?: unknown; message?: unknown; client_id?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const action = typeof body.action === "string" ? body.action : "send";

    if (action === "status") {
      return jsonResponse({
        configured,
        missing: {
          twilio_connection: !TWILIO_API_KEY,
          sender_number: !TWILIO_WHATSAPP_FROM,
        },
      });
    }

    if (action !== "send") {
      return jsonResponse({ error: "Acción no soportada" }, 400);
    }

    const to = typeof body.to === "string" ? body.to.replace(/\D/g, "") : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const clientId = typeof body.client_id === "string" ? body.client_id : null;
    if (!/^\d{8,15}$/.test(to)) {
      return jsonResponse({ error: "Número de destino inválido (formato internacional sin '+')" }, 400);
    }
    if (!message || message.length > 4000) {
      return jsonResponse({ error: "El mensaje es obligatorio (máx. 4000 caracteres)" }, 400);
    }

    if (!configured) {
      return jsonResponse(
        {
          error: "Envío automático de WhatsApp no configurado",
          details:
            "Conecta la integración de Twilio y configura el número remitente (TWILIO_WHATSAPP_FROM).",
        },
        503,
      );
    }

    // 3. Aislamiento por tenant: el perfil del usuario define el tenant.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();
    const tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) {
      return jsonResponse({ error: "El usuario no pertenece a ninguna inmobiliaria" }, 403);
    }

    // Si el mensaje va dirigido a un cliente concreto, debe ser del mismo tenant.
    if (clientId) {
      const { data: client } = await admin
        .from("clients")
        .select("id, tenant_id, deleted_at")
        .eq("id", clientId)
        .maybeSingle();
      if (!client || client.tenant_id !== tenantId || client.deleted_at) {
        return jsonResponse({ error: "Cliente no encontrado en tu inmobiliaria" }, 403);
      }
    }

    // 4. Envío a través del gateway de Twilio
    const response = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:+${to}`,
        From: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Twilio gateway failed [${response.status}]: ${errorBody}`);
      return jsonResponse(
        { error: "Error del proveedor de WhatsApp", status: response.status, details: errorBody },
        response.status,
      );
    }

    const data = await response.json();

    // 5. Auditoría del envío
    await admin.from("activity_logs").insert({
      tenant_id: tenantId,
      user_id: userId,
      entity_type: "whatsapp_message",
      entity_id: clientId,
      action: "send",
      metadata: {
        to: `+${to}`,
        provider: "twilio",
        sid: data.sid ?? null,
        message_preview: message.slice(0, 160),
      },
    });

    return jsonResponse({ ok: true, sid: data.sid });
  } catch (e) {
    console.error("send-whatsapp error:", e);
    return jsonResponse({ error: "Error interno", details: String(e) }, 500);
  }
});
