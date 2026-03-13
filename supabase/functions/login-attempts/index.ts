import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_HOURS = 2;

// In-memory rate limiter (per isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max 10 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) return true;
  return false;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Rate limit by IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
  
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action, email } = body;

  if (!email || typeof email !== "string") {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (action === "check") {
    const { data } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!data) {
      return new Response(JSON.stringify({ locked: false, attempts: 0, remaining: MAX_ATTEMPTS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60000);
      return new Response(JSON.stringify({ locked: true, attempts: data.attempts, remaining: 0, minutes_left: minutesLeft }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.locked_until && new Date(data.locked_until) <= new Date()) {
      await supabase.from("login_attempts").update({ attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("email", normalizedEmail);
      return new Response(JSON.stringify({ locked: false, attempts: 0, remaining: MAX_ATTEMPTS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ locked: false, attempts: data.attempts, remaining: MAX_ATTEMPTS - data.attempts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "record_failure") {
    const { data: existing } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const newAttempts = (existing?.attempts || 0) + 1;
    const locked_until = newAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_HOURS * 60 * 60 * 1000).toISOString()
      : null;

    if (existing) {
      await supabase.from("login_attempts").update({
        attempts: newAttempts,
        locked_until,
        updated_at: new Date().toISOString(),
      }).eq("email", normalizedEmail);
    } else {
      await supabase.from("login_attempts").insert({
        email: normalizedEmail,
        attempts: newAttempts,
        locked_until,
      });
    }

    return new Response(JSON.stringify({
      locked: newAttempts >= MAX_ATTEMPTS,
      attempts: newAttempts,
      remaining: Math.max(0, MAX_ATTEMPTS - newAttempts),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "reset") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("login_attempts").update({
      attempts: 0, locked_until: null, updated_at: new Date().toISOString(),
    }).eq("email", normalizedEmail);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
