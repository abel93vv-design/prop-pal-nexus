import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ClientFinancials {
  available_cash: number;
  monthly_income: number;
  debt_ratio: number;
  mortgage_needed: boolean;
  mortgage_preapproved: boolean;
}

interface ClientPreferences {
  min_price: number;
  max_price: number;
  min_surface: number;
  max_surface: number;
  min_bedrooms: number;
  min_bathrooms: number;
  preferred_types: string[];
  preferred_locations: string[];
}

interface Property {
  id: string;
  price: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  address: string;
  status: string;
  agency_id: string | null;
}

interface Client {
  id: string;
  agency_id: string | null;
}

function calculatePropertyScore(
  prefs: ClientPreferences | null,
  prop: Property
): number {
  if (!prefs) return 50; // Default score if no preferences set

  let priceScore = 0;
  let locationScore = 0;
  let featuresScore = 0;
  let extrasScore = 0;
  let emotionalScore = 50;

  // Price match (30%)
  if (prefs.max_price > 0) {
    if (prop.price >= prefs.min_price && prop.price <= prefs.max_price) {
      priceScore = 100;
    } else if (prop.price < prefs.min_price) {
      const diff = (prefs.min_price - prop.price) / prefs.min_price;
      priceScore = Math.max(0, 100 - diff * 200);
    } else {
      const diff = (prop.price - prefs.max_price) / prefs.max_price;
      priceScore = Math.max(0, 100 - diff * 200);
    }
  } else {
    priceScore = 50;
  }

  // Location match (25%)
  if (prefs.preferred_locations.length > 0) {
    const addrLower = (prop.address || "").toLowerCase();
    const match = prefs.preferred_locations.some((loc) =>
      addrLower.includes(loc.toLowerCase())
    );
    locationScore = match ? 100 : 20;
  } else {
    locationScore = 50;
  }

  // Features match (25%) - bedrooms, bathrooms, surface
  let featureHits = 0;
  let featureTotal = 0;

  if (prefs.min_bedrooms > 0) {
    featureTotal++;
    if (prop.bedrooms >= prefs.min_bedrooms) featureHits++;
    else featureHits += Math.max(0, prop.bedrooms / prefs.min_bedrooms);
  }
  if (prefs.min_bathrooms > 0) {
    featureTotal++;
    if (prop.bathrooms >= prefs.min_bathrooms) featureHits++;
    else featureHits += Math.max(0, prop.bathrooms / prefs.min_bathrooms);
  }
  if (prefs.min_surface > 0 || prefs.max_surface > 0) {
    featureTotal++;
    if (prefs.max_surface > 0) {
      if (
        prop.surface >= prefs.min_surface &&
        prop.surface <= prefs.max_surface
      )
        featureHits++;
      else {
        const mid = (prefs.min_surface + prefs.max_surface) / 2;
        const range = prefs.max_surface - prefs.min_surface;
        if (range > 0) {
          featureHits += Math.max(
            0,
            1 - Math.abs(prop.surface - mid) / range
          );
        }
      }
    } else if (prop.surface >= prefs.min_surface) {
      featureHits++;
    }
  }
  featuresScore = featureTotal > 0 ? (featureHits / featureTotal) * 100 : 50;

  // Extras match (10%) - type match
  if (prefs.preferred_types.length > 0) {
    extrasScore = prefs.preferred_types.includes(prop.type) ? 100 : 20;
  } else {
    extrasScore = 50;
  }

  // Final property score with weights
  const propertyScore =
    priceScore * 0.3 +
    locationScore * 0.25 +
    featuresScore * 0.25 +
    extrasScore * 0.1 +
    emotionalScore * 0.1;

  return Math.round(Math.min(100, Math.max(0, propertyScore)));
}

function calculateFinancialScore(
  financials: ClientFinancials | null,
  propPrice: number
): number {
  if (!financials) return 50; // Default if no financial data

  let score = 50; // Base score

  const entryRequired = propPrice * 0.2;
  const additionalCosts = propPrice * 0.1;
  const totalRequired = entryRequired + additionalCosts;

  // Cash coverage
  if (financials.available_cash >= totalRequired) {
    score += 20;
  } else if (financials.available_cash >= entryRequired) {
    score += 10;
  } else {
    score -= 15;
  }

  // Debt ratio penalty
  if (financials.debt_ratio > 40) {
    score -= 20;
  } else if (financials.debt_ratio > 30) {
    score -= 10;
  } else if (financials.debt_ratio < 20) {
    score += 5;
  }

  // Income check (mortgage simulation: 30% of income for mortgage)
  if (financials.mortgage_needed && financials.monthly_income > 0) {
    const mortgageAmount = propPrice - financials.available_cash;
    const monthlyMortgage = mortgageAmount / (25 * 12); // Simple 25-year calc
    const mortgageRatio = monthlyMortgage / financials.monthly_income;
    if (mortgageRatio <= 0.3) {
      score += 15;
    } else if (mortgageRatio <= 0.4) {
      score += 5;
    } else {
      score -= 15;
    }
  }

  // Mortgage pre-approved boost
  if (financials.mortgage_preapproved) {
    score += 10;
  }

  // High liquidity boost
  if (financials.available_cash > totalRequired * 1.5) {
    score += 5;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

function getCategory(score: number): string {
  if (score >= 75) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function getViability(financialScore: number): string {
  if (financialScore >= 65) return "Viable";
  if (financialScore >= 40) return "Risk";
  return "Not Viable";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { tenant_id, client_id, property_id } = body;

    if (!tenant_id) {
      return new Response(
        JSON.stringify({ error: "tenant_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch clients (optionally filtered)
    let clientsQuery = supabase
      .from("clients")
      .select("id, agency_id")
      .eq("tenant_id", tenant_id)
      .in("type", ["comprador", "arrendatario"]);
    if (client_id) clientsQuery = clientsQuery.eq("id", client_id);
    const { data: clients } = await clientsQuery;

    // Fetch available properties (optionally filtered)
    let propsQuery = supabase
      .from("properties")
      .select("id, price, surface, bedrooms, bathrooms, type, address, status, agency_id")
      .eq("tenant_id", tenant_id)
      .in("status", ["disponible", "reservado"]);
    if (property_id) propsQuery = propsQuery.eq("id", property_id);
    const { data: properties } = await propsQuery;

    if (!clients?.length || !properties?.length) {
      return new Response(
        JSON.stringify({ message: "No matching data found", matches: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all client financials for this tenant
    const clientIds = clients.map((c: Client) => c.id);
    const { data: allFinancials } = await supabase
      .from("client_financials")
      .select("*")
      .eq("tenant_id", tenant_id)
      .in("client_id", clientIds);

    const financialsMap = new Map<string, ClientFinancials>();
    (allFinancials || []).forEach((f: any) => {
      financialsMap.set(f.client_id, {
        available_cash: Number(f.available_cash),
        monthly_income: Number(f.monthly_income),
        debt_ratio: Number(f.debt_ratio),
        mortgage_needed: f.mortgage_needed,
        mortgage_preapproved: f.mortgage_preapproved,
      });
    });

    // Fetch all client preferences
    const { data: allPrefs } = await supabase
      .from("client_preferences")
      .select("*")
      .eq("tenant_id", tenant_id)
      .in("client_id", clientIds);

    const prefsMap = new Map<string, ClientPreferences>();
    (allPrefs || []).forEach((p: any) => {
      prefsMap.set(p.client_id, {
        min_price: Number(p.min_price),
        max_price: Number(p.max_price),
        min_surface: Number(p.min_surface),
        max_surface: Number(p.max_surface),
        min_bedrooms: p.min_bedrooms,
        min_bathrooms: p.min_bathrooms,
        preferred_types: p.preferred_types || [],
        preferred_locations: p.preferred_locations || [],
      });
    });

    // Calculate scores in batches
    const now = new Date().toISOString();
    const upserts: any[] = [];

    for (const client of clients as Client[]) {
      const financials = financialsMap.get(client.id) || null;
      const prefs = prefsMap.get(client.id) || null;

      for (const prop of properties as Property[]) {
        const propertyScore = calculatePropertyScore(prefs, prop);
        const financialScore = calculateFinancialScore(
          financials,
          Number(prop.price)
        );
        const totalScore = Math.round(
          propertyScore * 0.7 + financialScore * 0.3
        );
        const category = getCategory(totalScore);
        const viability = getViability(financialScore);

        upserts.push({
          tenant_id,
          agency_id: client.agency_id || prop.agency_id || null,
          client_id: client.id,
          property_id: prop.id,
          property_score: propertyScore,
          financial_score: financialScore,
          total_score: totalScore,
          category,
          viability_status: viability,
          last_calculated_at: now,
          updated_at: now,
        });
      }
    }

    // Batch upsert (chunks of 500)
    let totalUpserted = 0;
    const chunkSize = 500;
    for (let i = 0; i < upserts.length; i += chunkSize) {
      const chunk = upserts.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("match_scores")
        .upsert(chunk, { onConflict: "client_id,property_id" });
      if (error) {
        console.error("Upsert error:", error);
      } else {
        totalUpserted += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Matching completed",
        matches: totalUpserted,
        clients: clients.length,
        properties: (properties as Property[]).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
