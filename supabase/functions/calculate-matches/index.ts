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

interface CriteriaDetail {
  label: string;
  weight: number;
  score: number;
  met: boolean;
  detail: string;
}

interface ScoreDetails {
  property: {
    total: number;
    criteria: CriteriaDetail[];
  };
  financial: {
    total: number;
    criteria: CriteriaDetail[];
  };
}

function calculatePropertyScore(
  prefs: ClientPreferences | null,
  prop: Property
): { score: number; criteria: CriteriaDetail[] } {
  const criteria: CriteriaDetail[] = [];

  if (!prefs) {
    return {
      score: 50,
      criteria: [{ label: "Sin preferencias", weight: 100, score: 50, met: false, detail: "No hay preferencias configuradas para este cliente" }],
    };
  }

  // Price match (30%)
  let priceScore = 50;
  let priceMet = false;
  let priceDetail = "";
  if (prefs.max_price > 0) {
    if (prop.price >= prefs.min_price && prop.price <= prefs.max_price) {
      priceScore = 100;
      priceMet = true;
      priceDetail = `Precio ${prop.price.toLocaleString()}€ dentro del rango ${prefs.min_price.toLocaleString()}€ - ${prefs.max_price.toLocaleString()}€`;
    } else if (prop.price < prefs.min_price) {
      const diff = (prefs.min_price - prop.price) / prefs.min_price;
      priceScore = Math.max(0, 100 - diff * 200);
      priceDetail = `Precio ${prop.price.toLocaleString()}€ por debajo del mínimo ${prefs.min_price.toLocaleString()}€`;
    } else {
      const diff = (prop.price - prefs.max_price) / prefs.max_price;
      priceScore = Math.max(0, 100 - diff * 200);
      priceDetail = `Precio ${prop.price.toLocaleString()}€ supera el máximo ${prefs.max_price.toLocaleString()}€`;
    }
  } else {
    priceDetail = "Sin rango de precio configurado";
  }
  criteria.push({ label: "Precio", weight: 30, score: Math.round(priceScore), met: priceMet, detail: priceDetail });

  // Location match (25%)
  let locationScore = 50;
  let locationMet = false;
  let locationDetail = "";
  if (prefs.preferred_locations.length > 0) {
    const addrLower = (prop.address || "").toLowerCase();
    const matchedLoc = prefs.preferred_locations.find((loc) => addrLower.includes(loc.toLowerCase()));
    if (matchedLoc) {
      locationScore = 100;
      locationMet = true;
      locationDetail = `Ubicación "${matchedLoc}" encontrada en dirección`;
    } else {
      locationScore = 20;
      locationDetail = `Dirección no coincide con ubicaciones preferidas: ${prefs.preferred_locations.join(", ")}`;
    }
  } else {
    locationDetail = "Sin ubicaciones preferidas configuradas";
  }
  criteria.push({ label: "Ubicación", weight: 25, score: Math.round(locationScore), met: locationMet, detail: locationDetail });

  // Features match (25%)
  const featureCriteria: CriteriaDetail[] = [];
  let featureHits = 0;
  let featureTotal = 0;

  if (prefs.min_bedrooms > 0) {
    featureTotal++;
    const bedMet = prop.bedrooms >= prefs.min_bedrooms;
    if (bedMet) featureHits++;
    else featureHits += Math.max(0, prop.bedrooms / prefs.min_bedrooms);
    featureCriteria.push({
      label: "Habitaciones",
      weight: 0,
      score: bedMet ? 100 : Math.round(Math.max(0, (prop.bedrooms / prefs.min_bedrooms) * 100)),
      met: bedMet,
      detail: `${prop.bedrooms} habitaciones (mín. ${prefs.min_bedrooms})`,
    });
  }
  if (prefs.min_bathrooms > 0) {
    featureTotal++;
    const bathMet = prop.bathrooms >= prefs.min_bathrooms;
    if (bathMet) featureHits++;
    else featureHits += Math.max(0, prop.bathrooms / prefs.min_bathrooms);
    featureCriteria.push({
      label: "Baños",
      weight: 0,
      score: bathMet ? 100 : Math.round(Math.max(0, (prop.bathrooms / prefs.min_bathrooms) * 100)),
      met: bathMet,
      detail: `${prop.bathrooms} baños (mín. ${prefs.min_bathrooms})`,
    });
  }
  if (prefs.min_surface > 0 || prefs.max_surface > 0) {
    featureTotal++;
    let surfMet = false;
    let surfScore = 0;
    let surfDetail = "";
    if (prefs.max_surface > 0) {
      if (prop.surface >= prefs.min_surface && prop.surface <= prefs.max_surface) {
        surfMet = true;
        surfScore = 100;
        featureHits++;
        surfDetail = `${prop.surface}m² dentro del rango ${prefs.min_surface}-${prefs.max_surface}m²`;
      } else {
        const mid = (prefs.min_surface + prefs.max_surface) / 2;
        const range = prefs.max_surface - prefs.min_surface;
        if (range > 0) {
          const ratio = Math.max(0, 1 - Math.abs(prop.surface - mid) / range);
          featureHits += ratio;
          surfScore = Math.round(ratio * 100);
        }
        surfDetail = `${prop.surface}m² fuera del rango ${prefs.min_surface}-${prefs.max_surface}m²`;
      }
    } else if (prop.surface >= prefs.min_surface) {
      surfMet = true;
      surfScore = 100;
      featureHits++;
      surfDetail = `${prop.surface}m² cumple mínimo de ${prefs.min_surface}m²`;
    } else {
      surfDetail = `${prop.surface}m² no cumple mínimo de ${prefs.min_surface}m²`;
    }
    featureCriteria.push({ label: "Superficie", weight: 0, score: surfScore, met: surfMet, detail: surfDetail });
  }
  const featuresScore = featureTotal > 0 ? (featureHits / featureTotal) * 100 : 50;
  criteria.push({
    label: "Características",
    weight: 25,
    score: Math.round(featuresScore),
    met: featuresScore >= 75,
    detail: featureCriteria.length > 0 ? featureCriteria.map(f => f.detail).join("; ") : "Sin requisitos de características",
  });
  // Add sub-criteria
  featureCriteria.forEach(fc => criteria.push(fc));

  // Extras match (10%)
  let extrasScore = 50;
  let extrasMet = false;
  let extrasDetail = "";
  if (prefs.preferred_types.length > 0) {
    extrasMet = prefs.preferred_types.includes(prop.type);
    extrasScore = extrasMet ? 100 : 20;
    extrasDetail = extrasMet
      ? `Tipo "${prop.type}" coincide con preferencias`
      : `Tipo "${prop.type}" no coincide con: ${prefs.preferred_types.join(", ")}`;
  } else {
    extrasDetail = "Sin tipos preferidos configurados";
  }
  criteria.push({ label: "Tipo de vivienda", weight: 10, score: Math.round(extrasScore), met: extrasMet, detail: extrasDetail });

  // Emotional fit (10%) - placeholder
  criteria.push({ label: "Encaje emocional", weight: 10, score: 50, met: false, detail: "Puntuación base (sin datos adicionales)" });

  const propertyScore =
    priceScore * 0.3 +
    locationScore * 0.25 +
    featuresScore * 0.25 +
    extrasScore * 0.1 +
    50 * 0.1;

  return { score: Math.round(Math.min(100, Math.max(0, propertyScore))), criteria };
}

function calculateFinancialScore(
  financials: ClientFinancials | null,
  propPrice: number
): { score: number; criteria: CriteriaDetail[] } {
  const criteria: CriteriaDetail[] = [];

  if (!financials) {
    return {
      score: 50,
      criteria: [{ label: "Sin datos financieros", weight: 100, score: 50, met: false, detail: "No hay datos financieros configurados para este cliente" }],
    };
  }

  let score = 50;
  const entryRequired = propPrice * 0.2;
  const additionalCosts = propPrice * 0.1;
  const totalRequired = entryRequired + additionalCosts;

  // Cash coverage
  let cashScore = 0;
  let cashMet = false;
  let cashDetail = "";
  if (financials.available_cash >= totalRequired) {
    cashScore = 20;
    cashMet = true;
    cashDetail = `${financials.available_cash.toLocaleString()}€ cubre entrada (${entryRequired.toLocaleString()}€) + gastos (${additionalCosts.toLocaleString()}€)`;
  } else if (financials.available_cash >= entryRequired) {
    cashScore = 10;
    cashDetail = `${financials.available_cash.toLocaleString()}€ cubre entrada pero no todos los gastos adicionales`;
  } else {
    cashScore = -15;
    cashDetail = `${financials.available_cash.toLocaleString()}€ insuficiente para entrada de ${entryRequired.toLocaleString()}€`;
  }
  criteria.push({ label: "Cobertura de efectivo", weight: 25, score: Math.max(0, 50 + cashScore), met: cashMet, detail: cashDetail });

  score += cashScore;

  // Debt ratio
  let debtScore = 0;
  let debtMet = false;
  let debtDetail = "";
  if (financials.debt_ratio > 40) {
    debtScore = -20;
    debtDetail = `Ratio de endeudamiento ${financials.debt_ratio}% supera el 40% (alto riesgo)`;
  } else if (financials.debt_ratio > 30) {
    debtScore = -10;
    debtDetail = `Ratio de endeudamiento ${financials.debt_ratio}% entre 30-40% (riesgo moderado)`;
  } else if (financials.debt_ratio < 20) {
    debtScore = 5;
    debtMet = true;
    debtDetail = `Ratio de endeudamiento ${financials.debt_ratio}% menor al 20% (excelente)`;
  } else {
    debtMet = true;
    debtDetail = `Ratio de endeudamiento ${financials.debt_ratio}% aceptable (20-30%)`;
  }
  criteria.push({ label: "Ratio de endeudamiento", weight: 20, score: Math.max(0, 50 + debtScore), met: debtMet, detail: debtDetail });

  score += debtScore;

  // Mortgage / Income
  let mortgageScore = 0;
  let mortgageMet = false;
  let mortgageDetail = "";
  if (financials.mortgage_needed && financials.monthly_income > 0) {
    const mortgageAmount = propPrice - financials.available_cash;
    const monthlyMortgage = mortgageAmount / (25 * 12);
    const mortgageRatio = monthlyMortgage / financials.monthly_income;
    if (mortgageRatio <= 0.3) {
      mortgageScore = 15;
      mortgageMet = true;
      mortgageDetail = `Cuota estimada ${Math.round(monthlyMortgage).toLocaleString()}€/mes = ${Math.round(mortgageRatio * 100)}% de ingresos (≤30%)`;
    } else if (mortgageRatio <= 0.4) {
      mortgageScore = 5;
      mortgageDetail = `Cuota estimada ${Math.round(monthlyMortgage).toLocaleString()}€/mes = ${Math.round(mortgageRatio * 100)}% de ingresos (30-40%)`;
    } else {
      mortgageScore = -15;
      mortgageDetail = `Cuota estimada ${Math.round(monthlyMortgage).toLocaleString()}€/mes = ${Math.round(mortgageRatio * 100)}% de ingresos (>40%, alto riesgo)`;
    }
  } else if (!financials.mortgage_needed) {
    mortgageMet = true;
    mortgageDetail = "No necesita hipoteca";
  } else {
    mortgageDetail = "Sin datos de ingresos mensuales";
  }
  criteria.push({ label: "Capacidad hipotecaria", weight: 25, score: Math.max(0, 50 + mortgageScore), met: mortgageMet, detail: mortgageDetail });

  score += mortgageScore;

  // Pre-approved
  const preapprovedMet = financials.mortgage_preapproved;
  criteria.push({
    label: "Hipoteca pre-aprobada",
    weight: 15,
    score: preapprovedMet ? 70 : 40,
    met: preapprovedMet,
    detail: preapprovedMet ? "Hipoteca pre-aprobada ✓" : "Sin pre-aprobación hipotecaria",
  });
  if (preapprovedMet) score += 10;

  // High liquidity
  const highLiquidity = financials.available_cash > totalRequired * 1.5;
  criteria.push({
    label: "Liquidez alta",
    weight: 15,
    score: highLiquidity ? 65 : 45,
    met: highLiquidity,
    detail: highLiquidity
      ? `Efectivo disponible supera 1.5x el requerido (${Math.round(totalRequired * 1.5).toLocaleString()}€)`
      : `Efectivo disponible no supera 1.5x el requerido`,
  });
  if (highLiquidity) score += 5;

  return { score: Math.round(Math.min(100, Math.max(0, score))), criteria };
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

    let clientsQuery = supabase
      .from("clients")
      .select("id, agency_id")
      .eq("tenant_id", tenant_id)
      .in("type", ["comprador", "arrendatario"]);
    if (client_id) clientsQuery = clientsQuery.eq("id", client_id);
    const { data: clients } = await clientsQuery;

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

    const now = new Date().toISOString();
    const upserts: any[] = [];

    for (const client of clients as Client[]) {
      const financials = financialsMap.get(client.id) || null;
      const prefs = prefsMap.get(client.id) || null;

      for (const prop of properties as Property[]) {
        const propResult = calculatePropertyScore(prefs, prop);
        const finResult = calculateFinancialScore(financials, Number(prop.price));
        const totalScore = Math.round(propResult.score * 0.7 + finResult.score * 0.3);
        const category = getCategory(totalScore);
        const viability = getViability(finResult.score);

        const scoreDetails: ScoreDetails = {
          property: { total: propResult.score, criteria: propResult.criteria },
          financial: { total: finResult.score, criteria: finResult.criteria },
        };

        upserts.push({
          tenant_id,
          agency_id: client.agency_id || prop.agency_id || null,
          client_id: client.id,
          property_id: prop.id,
          property_score: propResult.score,
          financial_score: finResult.score,
          total_score: totalScore,
          category,
          viability_status: viability,
          score_details: scoreDetails,
          last_calculated_at: now,
          updated_at: now,
        });
      }
    }

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
