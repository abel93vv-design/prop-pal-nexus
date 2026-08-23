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
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    // 2. Validación de entrada
    let body: { to?: unknown; message?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Cuerpo de petición inválido" }, 400);
    }
    const to = typeof body.to === "string" ? body.to.replace(/\D/g, "") : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!/^\d{8,15}$/.test(to)) {
      return jsonResponse({ error: "Número de destino inválido (formato internacional sin '+')" }, 400);
    }
    if (!message || message.length > 4000) {
      return jsonResponse({ error: "El mensaje es obligatorio (máx. 4000 caracteres)" }, 400);
    }

    // 3. Configuración del conector
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM");
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_WHATSAPP_FROM) {
      return jsonResponse(
        {
          error: "Envío automático de WhatsApp no configurado",
          details:
            "Conecta la integración de Twilio y configura TWILIO_WHATSAPP_FROM con el número de empresa verificado.",
        },
        503,
      );
    }

    // 4. Envío a través del gateway de Twilio
    const response = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
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
    return jsonResponse({ ok: true, sid: data.sid });
  } catch (e) {
    console.error("send-whatsapp error:", e);
    return jsonResponse({ error: "Error interno", details: String(e) }, 500);
  }
});
