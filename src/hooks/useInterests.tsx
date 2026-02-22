import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

export type InterestType = 'compra' | 'alquiler' | 'inversion';

export interface ClientPropertyInterest {
  id: string;
  tenant_id: string;
  client_id: string;
  property_id: string;
  interest_type: InterestType;
  created_at: string;
}

const mapInterest = (r: any): ClientPropertyInterest => ({
  id: r.id,
  tenant_id: r.tenant_id,
  client_id: r.client_id,
  property_id: r.property_id,
  interest_type: r.interest_type,
  created_at: r.created_at,
});

export function useInterests() {
  const { tenantId } = useTenant();
  const [interests, setInterests] = useState<ClientPropertyInterest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from('client_property_interests')
      .select('*')
      .eq('tenant_id', tenantId);
    if (data) setInterests(data.map(mapInterest));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addInterest = async (clientId: string, propertyId: string, interestType: InterestType) => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from('client_property_interests')
      .insert({ tenant_id: tenantId, client_id: clientId, property_id: propertyId, interest_type: interestType })
      .select()
      .single();
    if (error) return { error };
    if (data) setInterests(prev => [...prev, mapInterest(data)]);
    return { data };
  };

  const removeInterest = async (id: string) => {
    await supabase.from('client_property_interests').delete().eq('id', id);
    setInterests(prev => prev.filter(i => i.id !== id));
  };

  const updateInterestType = async (id: string, interestType: InterestType) => {
    await supabase.from('client_property_interests').update({ interest_type: interestType }).eq('id', id);
    setInterests(prev => prev.map(i => i.id === id ? { ...i, interest_type: interestType } : i));
  };

  const getForClient = (clientId: string) => interests.filter(i => i.client_id === clientId);
  const getForProperty = (propertyId: string) => interests.filter(i => i.property_id === propertyId);

  return { interests, loading, addInterest, removeInterest, updateInterestType, getForClient, getForProperty, refetch: fetchAll };
}
