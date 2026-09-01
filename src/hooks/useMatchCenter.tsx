import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

export interface CriteriaDetail {
  label: string;
  weight: number;
  score: number;
  met: boolean;
  detail: string;
}

export interface ScoreDetails {
  property: { total: number; criteria: CriteriaDetail[] };
  financial: { total: number; criteria: CriteriaDetail[] };
}

export interface MatchScore {
  id: string;
  tenant_id: string;
  agency_id: string | null;
  client_id: string;
  property_id: string;
  property_score: number;
  financial_score: number;
  total_score: number;
  category: string;
  viability_status: string;
  score_details: ScoreDetails | null;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFinancials {
  id?: string;
  tenant_id: string;
  client_id: string;
  available_cash: number;
  monthly_income: number;
  debt_ratio: number;
  mortgage_needed: boolean;
  mortgage_preapproved: boolean;
}

export interface ClientPreferences {
  id?: string;
  tenant_id: string;
  client_id: string;
  min_price: number;
  max_price: number;
  min_surface: number;
  max_surface: number;
  min_bedrooms: number;
  min_bathrooms: number;
  preferred_types: string[];
  preferred_locations: string[];
  selected_zones: string[];
  required_extras: string[];
  neighborhood: string;
}

export function useMatchCenter() {
  const { tenantId } = useTenant();
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("match_scores")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("total_score", { ascending: false })
      .limit(2000);
    if (fetchError) {
      console.error("fetchMatches error:", fetchError);
      setError(fetchError.message);
      setMatches([]);
    } else {
      setMatches((data || []).map(mapMatch));
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const runMatching = async (clientId?: string, propertyId?: string) => {
    if (!tenantId) return;
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-matches", {
        body: {
          tenant_id: tenantId,
          client_id: clientId || undefined,
          property_id: propertyId || undefined,
        },
      });
      if (error) {
        console.error("runMatching error:", error);
        return { error: error.message, matches: 0 };
      }
      await fetchMatches();
      return data;
    } finally {
      setCalculating(false);
    }
  };

  const getTopMatchesForClient = (clientId: string, limit = 5) => {
    return matches
      .filter((m) => m.client_id === clientId)
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, limit);
  };

  const getTopMatchesForProperty = (propertyId: string, limit = 10) => {
    return matches
      .filter((m) => m.property_id === propertyId)
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, limit);
  };

  return {
    matches,
    loading,
    calculating,
    runMatching,
    getTopMatchesForClient,
    getTopMatchesForProperty,
    refetch: fetchMatches,
  };
}

export function useClientFinancials(clientId: string | null) {
  const { tenantId } = useTenant();
  const [financials, setFinancials] = useState<ClientFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId || !tenantId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("client_financials")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (data) {
        setFinancials({
          id: data.id,
          tenant_id: data.tenant_id,
          client_id: data.client_id,
          available_cash: Number(data.available_cash),
          monthly_income: Number(data.monthly_income),
          debt_ratio: Number(data.debt_ratio),
          mortgage_needed: data.mortgage_needed,
          mortgage_preapproved: data.mortgage_preapproved,
        });
      }
      setLoading(false);
    };
    load();
  }, [clientId, tenantId]);

  const save = async (data: Partial<ClientFinancials>) => {
    if (!clientId || !tenantId) return;
    const payload = { ...data, tenant_id: tenantId, client_id: clientId };
    delete (payload as any).id;

    if (financials?.id) {
      await supabase.from("client_financials").update(payload).eq("id", financials.id);
      setFinancials((prev) => prev ? { ...prev, ...payload } : null);
    } else {
      const { data: inserted } = await supabase
        .from("client_financials")
        .insert(payload)
        .select()
        .single();
      if (inserted) setFinancials({ ...payload, id: inserted.id } as ClientFinancials);
    }
  };

  return { financials, loading, save };
}

export function useClientPreferences(clientId: string | null) {
  const { tenantId } = useTenant();
  const [preferences, setPreferences] = useState<ClientPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId || !tenantId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("client_preferences")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (data) {
        setPreferences({
          id: data.id,
          tenant_id: data.tenant_id,
          client_id: data.client_id,
          min_price: Number(data.min_price),
          max_price: Number(data.max_price),
          min_surface: Number(data.min_surface),
          max_surface: Number(data.max_surface),
          min_bedrooms: data.min_bedrooms ?? 0,
          min_bathrooms: data.min_bathrooms ?? 0,
          preferred_types: data.preferred_types || [],
          preferred_locations: data.preferred_locations || [],
          selected_zones: (data as any).selected_zones || [],
          required_extras: (data as any).required_extras || [],
          neighborhood: (data as any).neighborhood || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [clientId, tenantId]);

  const save = async (data: Partial<ClientPreferences>) => {
    if (!clientId || !tenantId) return;
    const payload = { ...data, tenant_id: tenantId, client_id: clientId };
    delete (payload as any).id;

    if (preferences?.id) {
      await supabase.from("client_preferences").update(payload).eq("id", preferences.id);
      setPreferences((prev) => prev ? { ...prev, ...payload } : null);
    } else {
      const { data: inserted } = await supabase
        .from("client_preferences")
        .insert(payload)
        .select()
        .single();
      if (inserted) setPreferences({ ...payload, id: inserted.id } as ClientPreferences);
    }
  };

  return { preferences, loading, save };
}

const mapMatch = (r: any): MatchScore => ({
  id: r.id,
  tenant_id: r.tenant_id,
  agency_id: r.agency_id,
  client_id: r.client_id,
  property_id: r.property_id,
  property_score: Number(r.property_score),
  financial_score: Number(r.financial_score),
  total_score: Number(r.total_score),
  category: r.category,
  viability_status: r.viability_status,
  score_details: r.score_details || null,
  last_calculated_at: r.last_calculated_at,
  created_at: r.created_at,
  updated_at: r.updated_at,
});
