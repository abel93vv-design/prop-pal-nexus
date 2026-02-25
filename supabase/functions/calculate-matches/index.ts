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
  monthly_debts: number;
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
  required_extras: string[];
  neighborhood: string;
  selected_zones: string[];
}

interface Property {
  id: string;
  price: number;
  surface: number;
  built_surface: number;
  plot_surface: number;
  bedrooms: number;
  bathrooms: number;
  floor: number | null;
  type: string;
  address: string;
  neighborhood: string;
  postal_code: string;
  status: string;
  agency_id: string | null;
  community_fees: number;
  ibi_annual: number;
  has_elevator: boolean;
  has_terrace: boolean;
  has_pool: boolean;
  has_garage: boolean;
  has_air_conditioning: boolean;
  operation_type: string;
  monthly_rent: number;
}

interface Client {
  id: string;
  agency_id: string | null;
  operation_type: string;
}

interface CriteriaDetail {
  label: string;
  weight: number;
  score: number;
  met: boolean;
  detail: string;
}

interface ScoreDetails {
  property: { total: number; criteria: CriteriaDetail[] };
  financial: { total: number; criteria: CriteriaDetail[] };
}

// ======== WEIGHTS: Financial 40%, Location 30%, Price 20%, Features 10% ========

function calculatePropertyScore(
  prefs: ClientPreferences | null,
  prop: Property
): { score: number; criteria: CriteriaDetail[] } {
  const criteria: CriteriaDetail[] = [];

  if (!prefs) {
    return {
      score: 50,
      criteria: [{ label: "Sin preferencias", weight: 100, score: 50, met: false, detail: "No hay preferencias configuradas" }],
    };
  }

  // === PRICE MATCH (20%) ===
  let priceScore = 50;
  let priceMet = false;
  let priceDetail = "";
  if (prefs.max_price > 0) {
    if (prop.price >= prefs.min_price && prop.price <= prefs.max_price) {
      priceScore = 100; priceMet = true;
      priceDetail = `Precio ${prop.price.toLocaleString()}€ dentro del rango`;
    } else if (prop.price > prefs.max_price) {
      // Hard filter: if exceeds budget, score = 0
      priceScore = 0;
      priceDetail = `Precio ${prop.price.toLocaleString()}€ supera presupuesto máximo ${prefs.max_price.toLocaleString()}€`;
    } else {
      const diff = (prefs.min_price - prop.price) / prefs.min_price;
      priceScore = Math.max(0, 100 - diff * 200);
      priceDetail = `Precio ${prop.price.toLocaleString()}€ por debajo del mínimo`;
    }
  } else {
    priceDetail = "Sin rango de precio configurado";
  }
  criteria.push({ label: "Precio", weight: 20, score: Math.round(priceScore), met: priceMet, detail: priceDetail });

  // === LOCATION MATCH (30%) ===
  let locationScore = 50;
  let locationMet = false;
  let locationDetail = "";

  const propZoneId = (prop.neighborhood || "").trim();

  // Primary: check if property's zone ID is in client's selected_zones
  if (prefs.selected_zones && prefs.selected_zones.length > 0 && propZoneId) {
    // Direct match: property zone ID is in selected zones
    if (prefs.selected_zones.includes(propZoneId)) {
      locationScore = 100; locationMet = true;
      locationDetail = `Zona "${propZoneId}" coincide con zona de interés`;
    } else {
      // Check if property is in a selected district
      // e.g. property is "barrio:huelin", check if "distrito:cruz-humilladero" is selected
      const [propType, propId] = propZoneId.split(":");
      if (propType === "barrio") {
        const districtMatch = prefs.selected_zones.find(z => {
          if (!z.startsWith("distrito:")) return false;
          // We need to check if this barrio belongs to that distrito
          // Since we don't have the full hierarchy in the edge function, 
          // we store distrito: IDs in selected_zones when a full district is selected
          return false; // District-level matching handled by client storing all barrio IDs
        });
      }
      locationScore = 10;
      locationDetail = `Zona "${propZoneId}" no está en las ${prefs.selected_zones.length} zonas seleccionadas`;
    }
  } else if (prefs.selected_zones && prefs.selected_zones.length > 0 && !propZoneId) {
    locationScore = 0;
    locationDetail = "Propiedad sin zona asignada, cliente tiene zonas definidas";
  } else if (!prefs.selected_zones || prefs.selected_zones.length === 0) {
    // Fallback: old neighborhood text match
    if (prefs.neighborhood && prop.neighborhood) {
      if (prop.neighborhood.toLowerCase() === prefs.neighborhood.toLowerCase()) {
        locationScore = 100; locationMet = true;
        locationDetail = `Barrio "${prop.neighborhood}" coincide exactamente`;
      } else {
        locationScore = 20;
        locationDetail = `Barrio "${prop.neighborhood}" no coincide con "${prefs.neighborhood}"`;
      }
    } else if (prefs.preferred_locations.length > 0) {
      const addrLower = (prop.address || "").toLowerCase() + " " + (prop.neighborhood || "").toLowerCase();
      const matchedLoc = prefs.preferred_locations.find((loc) => addrLower.includes(loc.toLowerCase()));
      if (matchedLoc) {
        locationScore = 100; locationMet = true;
        locationDetail = `Ubicación "${matchedLoc}" encontrada`;
      } else {
        locationScore = 20;
        locationDetail = `No coincide con zonas: ${prefs.preferred_locations.join(", ")}`;
      }
    } else {
      locationDetail = "Sin ubicaciones preferidas";
    }
  }
  criteria.push({ label: "Ubicación", weight: 30, score: Math.round(locationScore), met: locationMet, detail: locationDetail });

  // === FEATURES MATCH (10%) ===
  let featureHits = 0;
  let featureTotal = 0;
  const featureDetails: string[] = [];

  if (prefs.min_bedrooms > 0) {
    featureTotal++;
    if (prop.bedrooms >= prefs.min_bedrooms) { featureHits++; featureDetails.push(`${prop.bedrooms} hab ✓`); }
    else featureDetails.push(`${prop.bedrooms}/${prefs.min_bedrooms} hab ✗`);
  }
  if (prefs.min_bathrooms > 0) {
    featureTotal++;
    if (prop.bathrooms >= prefs.min_bathrooms) { featureHits++; featureDetails.push(`${prop.bathrooms} baños ✓`); }
    else featureDetails.push(`${prop.bathrooms}/${prefs.min_bathrooms} baños ✗`);
  }
  if (prefs.min_surface > 0) {
    featureTotal++;
    if (prop.surface >= prefs.min_surface) { featureHits++; featureDetails.push(`${prop.surface}m² ✓`); }
    else featureDetails.push(`${prop.surface}/${prefs.min_surface}m² ✗`);
  }
  if (prefs.preferred_types.length > 0) {
    featureTotal++;
    if (prefs.preferred_types.includes(prop.type)) { featureHits++; featureDetails.push(`Tipo ${prop.type} ✓`); }
    else featureDetails.push(`Tipo ${prop.type} ✗`);
  }

  // Required extras check
  if (prefs.required_extras && prefs.required_extras.length > 0) {
    const extrasMap: Record<string, boolean> = {
      ascensor: prop.has_elevator, terraza: prop.has_terrace, piscina: prop.has_pool,
      garaje: prop.has_garage, aire_acondicionado: prop.has_air_conditioning,
    };
    for (const extra of prefs.required_extras) {
      featureTotal++;
      if (extrasMap[extra]) { featureHits++; featureDetails.push(`${extra} ✓`); }
      else featureDetails.push(`${extra} ✗ (indispensable)`);
    }
  }

  const featuresScore = featureTotal > 0 ? (featureHits / featureTotal) * 100 : 50;
  criteria.push({
    label: "Características", weight: 10, score: Math.round(featuresScore),
    met: featuresScore >= 75, detail: featureDetails.join("; ") || "Sin requisitos",
  });

  // Weighted total for property part: Price 20% + Location 30% + Features 10% = 60% of total
  // But we normalize within property score
  const propertyScore = priceScore * (20/60) + locationScore * (30/60) + featuresScore * (10/60);

  return { score: Math.round(Math.min(100, Math.max(0, propertyScore))), criteria };
}

function calculateFinancialScore(
  financials: ClientFinancials | null,
  prop: Property
): { score: number; criteria: CriteriaDetail[] } {
  const criteria: CriteriaDetail[] = [];
  const propPrice = Number(prop.price);

  if (!financials) {
    return {
      score: 50,
      criteria: [{ label: "Sin datos financieros", weight: 100, score: 50, met: false, detail: "No hay datos financieros configurados" }],
    };
  }

  // Real costs calculation
  const entryRequired = propPrice * 0.2; // 20% down
  const taxesAndFees = propPrice * 0.10; // ~10% taxes/fees
  const totalCashNeeded = entryRequired + taxesAndFees;
  const annualMaintenance = (Number(prop.community_fees) * 12) + Number(prop.ibi_annual);

  let totalScore = 0;
  const maxScore = 100;

  // 1. Cash coverage (30 points max)
  let cashScore = 0;
  let cashMet = false;
  let cashDetail = "";
  if (financials.available_cash >= totalCashNeeded) {
    cashScore = 30; cashMet = true;
    cashDetail = `${financials.available_cash.toLocaleString()}€ cubre entrada + gastos (${totalCashNeeded.toLocaleString()}€)`;
  } else if (financials.available_cash >= entryRequired) {
    cashScore = 15;
    cashDetail = `Cubre entrada pero no todos los gastos adicionales`;
  } else {
    cashScore = 0;
    cashDetail = `${financials.available_cash.toLocaleString()}€ insuficiente para ${totalCashNeeded.toLocaleString()}€`;
  }
  totalScore += cashScore;
  criteria.push({ label: "Cobertura efectivo", weight: 30, score: Math.round((cashScore/30)*100), met: cashMet, detail: cashDetail });

  // 2. Debt ratio / affordability (30 points max)
  let debtScore = 0;
  let debtMet = false;
  let debtDetail = "";
  if (financials.monthly_income > 0) {
    const mortgageAmount = Math.max(0, propPrice - financials.available_cash);
    const estimatedMonthly = mortgageAmount / (25 * 12); // 25yr mortgage
    const totalMonthlyDebt = estimatedMonthly + (financials.monthly_debts || 0);
    const debtRatio = (totalMonthlyDebt / financials.monthly_income) * 100;

    if (debtRatio <= 30) {
      debtScore = 30; debtMet = true;
      debtDetail = `Endeudamiento ${Math.round(debtRatio)}% ≤ 30% (excelente)`;
    } else if (debtRatio <= 35) {
      debtScore = 20;
      debtDetail = `Endeudamiento ${Math.round(debtRatio)}% (30-35%, aceptable)`;
    } else if (debtRatio <= 40) {
      debtScore = 10;
      debtDetail = `Endeudamiento ${Math.round(debtRatio)}% (35-40%, riesgo moderado)`;
    } else {
      debtScore = 0;
      debtDetail = `Endeudamiento ${Math.round(debtRatio)}% > 40% (alto riesgo)`;
    }
  } else {
    debtDetail = "Sin datos de ingresos";
  }
  totalScore += debtScore;
  criteria.push({ label: "Capacidad endeudamiento", weight: 30, score: Math.round((debtScore/30)*100), met: debtMet, detail: debtDetail });

  // 3. Mortgage capacity (25 points max)
  let mortgageScore = 0;
  let mortgageMet = false;
  let mortgageDetail = "";
  if (!financials.mortgage_needed) {
    mortgageScore = 25; mortgageMet = true;
    mortgageDetail = "Compra sin hipoteca";
  } else if (financials.mortgage_preapproved) {
    mortgageScore = 25; mortgageMet = true;
    mortgageDetail = "Hipoteca pre-aprobada ✓ (+15% confianza)";
  } else if (financials.monthly_income > 0) {
    const needed = Math.max(0, propPrice - financials.available_cash);
    // Banks typically lend max 80% of property value
    if (needed <= propPrice * 0.8) {
      mortgageScore = 15;
      mortgageDetail = `Necesita ${needed.toLocaleString()}€ (≤80% del valor)`;
    } else {
      mortgageScore = 5;
      mortgageDetail = `Necesita ${needed.toLocaleString()}€ (>80% del valor, difícil)`;
    }
  } else {
    mortgageDetail = "Necesita hipoteca sin datos de ingresos";
  }
  totalScore += mortgageScore;
  criteria.push({ label: "Viabilidad hipotecaria", weight: 25, score: Math.round((mortgageScore/25)*100), met: mortgageMet, detail: mortgageDetail });

  // 4. Maintenance sustainability (15 points max)
  let maintScore = 0;
  let maintMet = false;
  let maintDetail = "";
  if (annualMaintenance > 0 && financials.monthly_income > 0) {
    const monthlyMaint = annualMaintenance / 12;
    const ratio = monthlyMaint / financials.monthly_income;
    if (ratio <= 0.05) { maintScore = 15; maintMet = true; maintDetail = `Gastos mantenimiento ${Math.round(monthlyMaint)}€/mes (${Math.round(ratio*100)}% ingresos)`; }
    else if (ratio <= 0.10) { maintScore = 10; maintDetail = `Gastos mantenimiento ${Math.round(monthlyMaint)}€/mes (${Math.round(ratio*100)}% ingresos)`; }
    else { maintScore = 5; maintDetail = `Gastos mantenimiento altos: ${Math.round(monthlyMaint)}€/mes`; }
  } else {
    maintScore = 10; maintDetail = "Sin datos de gastos de mantenimiento";
  }
  totalScore += maintScore;
  criteria.push({ label: "Sostenibilidad gastos", weight: 15, score: Math.round((maintScore/15)*100), met: maintMet, detail: maintDetail });

  return { score: Math.round(Math.min(100, Math.max(0, totalScore))), criteria };
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
      .select("id, agency_id, operation_type")
      .eq("tenant_id", tenant_id)
      .in("type", ["comprador", "arrendatario"]);
    if (client_id) clientsQuery = clientsQuery.eq("id", client_id);
    const { data: clients } = await clientsQuery;

    let propsQuery = supabase
      .from("properties")
      .select("id, price, surface, built_surface, plot_surface, bedrooms, bathrooms, floor, type, address, neighborhood, postal_code, status, agency_id, community_fees, ibi_annual, has_elevator, has_terrace, has_pool, has_garage, has_air_conditioning, operation_type, monthly_rent")
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
        monthly_debts: Number(f.monthly_debts || 0),
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
        required_extras: p.required_extras || [],
        neighborhood: p.neighborhood || '',
        selected_zones: p.selected_zones || [],
      });
    });

    const now = new Date().toISOString();
    const upserts: any[] = [];

    for (const client of clients as Client[]) {
      const financials = financialsMap.get(client.id) || null;
      const prefs = prefsMap.get(client.id) || null;

      for (const prop of properties as Property[]) {
        // HARD FILTER: Operation type mismatch
        const clientOp = client.operation_type || 'compra';
        const propOp = prop.operation_type || 'venta';
        const opMatch = clientOp === 'ambos' || propOp === 'ambos' ||
          (clientOp === 'compra' && propOp === 'venta') ||
          (clientOp === 'alquiler' && propOp === 'alquiler');

        if (!opMatch) {
          // Operation mismatch → score 0
          upserts.push({
            tenant_id, agency_id: client.agency_id || prop.agency_id || null,
            client_id: client.id, property_id: prop.id,
            property_score: 0, financial_score: 0, total_score: 0,
            category: "low", viability_status: "Not Viable",
            score_details: { property: { total: 0, criteria: [{ label: "Tipo operación", weight: 100, score: 0, met: false, detail: `Cliente busca ${clientOp}, propiedad es ${propOp}` }] }, financial: { total: 0, criteria: [] } },
            last_calculated_at: now, updated_at: now,
          });
          continue;
        }

        // Determine if rental match
        const isRental = (clientOp === 'alquiler') || (propOp === 'alquiler' && clientOp !== 'compra');

        const propResult = calculatePropertyScore(prefs, prop);
        let finResult;

        if (isRental && financials && financials.monthly_income > 0) {
          // Rental: financial score based on rent ≤ 35% of income
          const rent = Number(prop.monthly_rent) || 0;
          const ratio = rent > 0 ? (rent / financials.monthly_income) * 100 : 0;
          let rentScore = 0;
          let rentMet = false;
          let rentDetail = "";
          if (rent <= 0) { rentScore = 50; rentDetail = "Sin renta mensual configurada"; }
          else if (ratio <= 25) { rentScore = 100; rentMet = true; rentDetail = `Renta ${rent}€ = ${Math.round(ratio)}% ingresos (≤25%, excelente)`; }
          else if (ratio <= 35) { rentScore = 70; rentMet = true; rentDetail = `Renta ${rent}€ = ${Math.round(ratio)}% ingresos (≤35%, aceptable)`; }
          else if (ratio <= 45) { rentScore = 30; rentDetail = `Renta ${rent}€ = ${Math.round(ratio)}% ingresos (35-45%, riesgo)`; }
          else { rentScore = 0; rentDetail = `Renta ${rent}€ = ${Math.round(ratio)}% ingresos (>45%, no viable)`; }
          finResult = { score: rentScore, criteria: [{ label: "Solvencia alquiler", weight: 100, score: rentScore, met: rentMet, detail: rentDetail }] };
        } else {
          finResult = calculateFinancialScore(financials, prop);
        }

        // HARD FILTER: if price exceeds budget, total = 0
        const priceExceeds = prefs && prefs.max_price > 0 && Number(prop.price) > prefs.max_price;

        let totalScore: number;
        if (priceExceeds) {
          totalScore = 0;
        } else {
          totalScore = Math.round(finResult.score * 0.4 + propResult.score * 0.6);
        }

        const category = getCategory(totalScore);
        const viability = getViability(finResult.score);

        upserts.push({
          tenant_id, agency_id: client.agency_id || prop.agency_id || null,
          client_id: client.id, property_id: prop.id,
          property_score: propResult.score, financial_score: finResult.score,
          total_score: totalScore, category, viability_status: viability,
          score_details: { property: { total: propResult.score, criteria: propResult.criteria }, financial: { total: finResult.score, criteria: finResult.criteria } },
          last_calculated_at: now, updated_at: now,
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
