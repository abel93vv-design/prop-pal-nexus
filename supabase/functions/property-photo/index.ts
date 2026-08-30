// Public, cacheable proxy for property photos stored in the private `property-photos` bucket.
// Photo URLs must be openable without login (WordPress imports them), so the CRM stores
// URLs pointing at this function instead of base64 data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "property-photos";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // /functions/v1/property-photo/<tenant_id>/<file>
    const marker = "/property-photo/";
    const idx = url.pathname.indexOf(marker);
    let path = idx >= 0 ? url.pathname.slice(idx + marker.length) : "";
    if (!path) path = url.searchParams.get("path") || "";
    path = decodeURIComponent(path).replace(/^\/+/, "");

    if (!path || path.includes("..")) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    return new Response(data.stream(), {
      headers: {
        ...corsHeaders,
        "Content-Type": data.type || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("property-photo error:", error);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
