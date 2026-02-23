import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id");
    const portal = url.searchParams.get("portal"); // 'fotocasa' | 'idealista'

    if (!tenantId || !portal) {
      return new Response("Missing tenant_id or portal parameter", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get published property IDs for this portal
    const { data: publishedStatuses, error: statusError } = await supabase
      .from("property_portal_status")
      .select("property_id")
      .eq("tenant_id", tenantId)
      .eq("portal_name", portal)
      .eq("is_published", true);

    if (statusError) throw statusError;
    if (!publishedStatuses || publishedStatuses.length === 0) {
      return new Response(generateEmptyXml(portal), {
        headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    const propertyIds = publishedStatuses.map((s: any) => s.property_id);

    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("*")
      .in("id", propertyIds);

    if (propError) throw propError;

    const { data: agency } = await supabase
      .from("agencies")
      .select("*")
      .eq("tenant_id", tenantId)
      .limit(1)
      .single();

    const xml = portal === "fotocasa"
      ? generateFotocasaXml(properties || [], agency)
      : generateIdealistaXml(properties || [], agency);

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Portal feed error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateEmptyXml(portal: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed portal="${portal}" count="0" />`;
}

function mapPropertyType(type: string): string {
  const map: Record<string, string> = { piso: "flat", casa: "chalet", local: "premises", terreno: "land" };
  return map[type] || "flat";
}

function mapStatus(status: string): string {
  const map: Record<string, string> = { disponible: "available", reservado: "reserved", vendido_alquilado: "sold", no_disponible: "unavailable" };
  return map[status] || "available";
}

function escapeXml(str: string): string {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function generateFotocasaXml(properties: any[], agency: any): string {
  const items = properties.map((p) => `
    <property>
      <id>${escapeXml(p.id)}</id>
      <operation>sale</operation>
      <type>${mapPropertyType(p.type)}</type>
      <status>${mapStatus(p.status)}</status>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description || "")}</description>
      <address>${escapeXml(p.address || "")}</address>
      <postalCode>${escapeXml(p.postal_code || "")}</postalCode>
      ${p.latitude ? `<latitude>${p.latitude}</latitude>` : ""}
      ${p.longitude ? `<longitude>${p.longitude}</longitude>` : ""}
      <price>${p.price || 0}</price>
      <surface>${p.surface || 0}</surface>
      <builtSurface>${p.built_surface || p.surface || 0}</builtSurface>
      ${p.plot_surface ? `<plotSurface>${p.plot_surface}</plotSurface>` : ""}
      <bedrooms>${p.bedrooms || 0}</bedrooms>
      <bathrooms>${p.bathrooms || 0}</bathrooms>
      <energyCertification>${escapeXml(p.energy_cert || "en_tramite")}</energyCertification>
      <images>
        ${(p.photos || []).map((photo: string, i: number) => `<image id="${i + 1}">${escapeXml(photo)}</image>`).join("\n        ")}
      </images>
    </property>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<fotocasa>
  <agency>
    <name>${escapeXml(agency?.name || "")}</name>
    <email>${escapeXml(agency?.email || "")}</email>
    <phone>${escapeXml(agency?.phone || "")}</phone>
  </agency>
  <properties>${items}
  </properties>
</fotocasa>`;
}

function generateIdealistaXml(properties: any[], agency: any): string {
  const items = properties.map((p) => `
    <property>
      <propertyCode>${escapeXml(p.id)}</propertyCode>
      <propertyType>${mapPropertyType(p.type)}</propertyType>
      <propertyStatus>${mapStatus(p.status)}</propertyStatus>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description || "")}</description>
      <address>${escapeXml(p.address || "")}</address>
      <zipCode>${escapeXml(p.postal_code || "")}</zipCode>
      ${p.latitude ? `<latitude>${p.latitude}</latitude>` : ""}
      ${p.longitude ? `<longitude>${p.longitude}</longitude>` : ""}
      <price>${p.price || 0}</price>
      <usefulArea>${p.surface || 0}</usefulArea>
      <builtArea>${p.built_surface || p.surface || 0}</builtArea>
      ${p.plot_surface ? `<plotArea>${p.plot_surface}</plotArea>` : ""}
      <rooms>${p.bedrooms || 0}</rooms>
      <baths>${p.bathrooms || 0}</baths>
      <energyCertification>${escapeXml(p.energy_cert || "en_tramite")}</energyCertification>
      <images>
        ${(p.photos || []).map((photo: string, i: number) => `<image>${escapeXml(photo)}</image>`).join("\n        ")}
      </images>
    </property>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<idealista>
  <customer>
    <name>${escapeXml(agency?.name || "")}</name>
    <contactEmail>${escapeXml(agency?.email || "")}</contactEmail>
    <contactTelephone>${escapeXml(agency?.phone || "")}</contactTelephone>
  </customer>
  <properties>${items}
  </properties>
</idealista>`;
}
