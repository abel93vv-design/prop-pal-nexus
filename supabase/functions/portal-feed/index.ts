import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PORTALS = ["fotocasa", "idealista"];
const EXCLUDED_STATUSES = ["vendido_alquilado", "no_disponible"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id");
    const portal = url.searchParams.get("portal"); // 'fotocasa' | 'idealista'
    const token = url.searchParams.get("token");

    if (!tenantId || !portal || !token) {
      return new Response("Missing tenant_id, portal or token parameter", { status: 400, headers: corsHeaders });
    }
    if (!VALID_PORTALS.includes(portal)) {
      return new Response("Invalid portal", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate the feed token against the tenant's active portal connection.
    // The token acts as a secret in the URL so only the portal (and the tenant) can read the feed.
    const { data: connection, error: connError } = await supabase
      .from("portal_connections")
      .select("id, feed_token, is_active")
      .eq("tenant_id", tenantId)
      .eq("portal_name", portal)
      .maybeSingle();

    if (connError) throw connError;
    if (!connection || !connection.is_active || connection.feed_token !== token) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

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
        headers: xmlHeaders(),
      });
    }

    const propertyIds = publishedStatuses.map((s: any) => s.property_id);

    // Exclude soft-deleted and unavailable properties (sold/rented, not available)
    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("*")
      .in("id", propertyIds)
      .is("deleted_at", null)
      .not("status", "in", `(${EXCLUDED_STATUSES.join(",")})`);

    if (propError) throw propError;

    const { data: agency } = await supabase
      .from("agencies")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    const xml = portal === "fotocasa"
      ? generateFotocasaXml(properties || [], agency)
      : generateIdealistaXml(properties || [], agency);

    return new Response(xml, { headers: xmlHeaders() });
  } catch (error) {
    console.error("Portal feed error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function xmlHeaders() {
  return {
    ...corsHeaders,
    "Content-Type": "application/xml; charset=utf-8",
    // Portals poll the feed periodically; allow short caching to reduce load
    "Cache-Control": "public, max-age=300",
  };
}

function generateEmptyXml(portal: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed portal="${portal}" count="0" />`;
}

function mapPropertyType(type: string): string {
  const map: Record<string, string> = { piso: "flat", casa: "chalet", local: "premises", terreno: "land", parking: "garage" };
  return map[type] || "flat";
}

function mapStatus(status: string): string {
  const map: Record<string, string> = { disponible: "available", reservado: "reserved", vendido_alquilado: "sold", no_disponible: "unavailable" };
  return map[status] || "available";
}

function mapOperation(p: any): string {
  if (p.operation_type === "alquiler") return "rent";
  if (p.operation_type === "ambos") return "sale_rent";
  if (p.operation_type === "alquiler_opcion_compra") return "rent_to_own";
  return "sale";
}

function feedPrice(p: any): number {
  const op = mapOperation(p);
  if (op === "rent" || op === "rent_to_own") return p.monthly_rent || p.price || 0;
  return p.price || 0;
}

function escapeXml(str: string): string {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// Portals require absolute image URLs; inline data URIs are not accepted
function feedPhotos(p: any): string[] {
  return (p.photos || []).filter((photo: string) => /^https?:\/\//.test(photo || ""));
}

function generateFotocasaXml(properties: any[], agency: any): string {
  const items = properties.map((p) => `
    <property>
      <id>${escapeXml(p.id)}</id>
      <operation>${mapOperation(p)}</operation>
      <type>${mapPropertyType(p.type)}</type>
      <status>${mapStatus(p.status)}</status>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description || "")}</description>
      <address>${escapeXml(p.address || "")}</address>
      <postalCode>${escapeXml(p.postal_code || "")}</postalCode>
      ${p.neighborhood ? `<zone>${escapeXml(p.neighborhood)}</zone>` : ""}
      ${p.latitude ? `<latitude>${p.latitude}</latitude>` : ""}
      ${p.longitude ? `<longitude>${p.longitude}</longitude>` : ""}
      <price>${feedPrice(p)}</price>
      <surface>${p.surface || 0}</surface>
      <builtSurface>${p.built_surface || p.surface || 0}</builtSurface>
      ${p.plot_surface ? `<plotSurface>${p.plot_surface}</plotSurface>` : ""}
      <bedrooms>${p.bedrooms || 0}</bedrooms>
      <bathrooms>${p.bathrooms || 0}</bathrooms>
      ${p.floor !== null && p.floor !== undefined ? `<floor>${p.floor}</floor>` : ""}
      <features>
        ${p.has_elevator ? "<feature>elevator</feature>" : ""}
        ${p.has_terrace ? "<feature>terrace</feature>" : ""}
        ${p.has_pool ? "<feature>pool</feature>" : ""}
        ${p.has_garage ? "<feature>garage</feature>" : ""}
        ${p.has_air_conditioning ? "<feature>air_conditioning</feature>" : ""}
      </features>
      <energyCertification>${escapeXml(p.energy_cert || "en_tramite")}</energyCertification>
      <images>
        ${feedPhotos(p).map((photo: string, i: number) => `<image id="${i + 1}">${escapeXml(photo)}</image>`).join("\n        ")}
      </images>
      <updatedAt>${escapeXml(p.created_at || "")}</updatedAt>
    </property>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<fotocasa>
  <generatedAt>${new Date().toISOString()}</generatedAt>
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
      <operation>${mapOperation(p)}</operation>
      <propertyType>${mapPropertyType(p.type)}</propertyType>
      <propertyStatus>${mapStatus(p.status)}</propertyStatus>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description || "")}</description>
      <address>${escapeXml(p.address || "")}</address>
      <zipCode>${escapeXml(p.postal_code || "")}</zipCode>
      ${p.neighborhood ? `<zone>${escapeXml(p.neighborhood)}</zone>` : ""}
      ${p.latitude ? `<latitude>${p.latitude}</latitude>` : ""}
      ${p.longitude ? `<longitude>${p.longitude}</longitude>` : ""}
      <price>${feedPrice(p)}</price>
      <usefulArea>${p.surface || 0}</usefulArea>
      <builtArea>${p.built_surface || p.surface || 0}</builtArea>
      ${p.plot_surface ? `<plotArea>${p.plot_surface}</plotArea>` : ""}
      <rooms>${p.bedrooms || 0}</rooms>
      <baths>${p.bathrooms || 0}</baths>
      ${p.floor !== null && p.floor !== undefined ? `<floor>${p.floor}</floor>` : ""}
      <features>
        ${p.has_elevator ? "<feature>elevator</feature>" : ""}
        ${p.has_terrace ? "<feature>terrace</feature>" : ""}
        ${p.has_pool ? "<feature>pool</feature>" : ""}
        ${p.has_garage ? "<feature>garage</feature>" : ""}
        ${p.has_air_conditioning ? "<feature>air_conditioning</feature>" : ""}
      </features>
      <energyCertification>${escapeXml(p.energy_cert || "en_tramite")}</energyCertification>
      <images>
        ${feedPhotos(p).map((photo: string) => `<image>${escapeXml(photo)}</image>`).join("\n        ")}
      </images>
    </property>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<idealista>
  <generatedAt>${new Date().toISOString()}</generatedAt>
  <customer>
    <name>${escapeXml(agency?.name || "")}</name>
    <contactEmail>${escapeXml(agency?.email || "")}</contactEmail>
    <contactTelephone>${escapeXml(agency?.phone || "")}</contactTelephone>
  </customer>
  <properties>${items}
  </properties>
</idealista>`;
}
