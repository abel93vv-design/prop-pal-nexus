import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_HOURS = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { action, email } = await req.json();

  if (action === "check") {
    const { data } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!data) {
      return new Response(JSON.stringify({ locked: false, attempts: 0, remaining: MAX_ATTEMPTS }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if lockout has expired
    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60000);
      return new Response(JSON.stringify({ locked: true, attempts: data.attempts, remaining: 0, minutes_left: minutesLeft }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If lockout expired, reset
    if (data.locked_until && new Date(data.locked_until) <= new Date()) {
      await supabase.from("login_attempts").update({ attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("email", email.toLowerCase());
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
      .eq("email", email.toLowerCase())
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
      }).eq("email", email.toLowerCase());
    } else {
      await supabase.from("login_attempts").insert({
        email: email.toLowerCase(),
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
    await supabase.from("login_attempts").update({
      attempts: 0, locked_until: null, updated_at: new Date().toISOString(),
    }).eq("email", email.toLowerCase());

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
