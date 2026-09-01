import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { useAuth } from "@/hooks/useAuth";

export type StageType = 'active' | 'closed_won' | 'closed_lost';
export type OpportunityPriority = 'baja' | 'media' | 'alta';

export interface PipelineStage {
  id: string;
  tenant_id: string;
  agency_id: string | null;
  name: string;
  color: string;
  stage_type: StageType;
  default_probability: number;
  position: number;
  is_active: boolean;
  stale_days: number;
}

export interface Opportunity {
  id: string;
  tenant_id: string;
  client_id: string;
  property_id: string | null;
  agent_id: string | null;
  stage_id: string;
  agency_id: string | null;
  title: string;
  deal_value: number;
  probability: number;
  priority: OpportunityPriority;
  expected_close_date: string | null;
  notes: string;
  stage_entered_at: string;
  created_at: string;
  updated_at: string;
}

export interface StageHistoryEntry {
  id: string;
  opportunity_id: string;
  from_stage_id: string | null;
  to_stage_id: string;
  changed_by: string;
  days_in_previous_stage: number;
  created_at: string;
}

const DEFAULT_STAGES = [
  { name: 'Nuevo Lead', color: '#6366F1', stage_type: 'active' as StageType, default_probability: 10, position: 0 },
  { name: 'Contactado', color: '#3B82F6', stage_type: 'active' as StageType, default_probability: 20, position: 1 },
  { name: 'Visita Agendada', color: '#06B6D4', stage_type: 'active' as StageType, default_probability: 35, position: 2 },
  { name: 'Visitó', color: '#8B5CF6', stage_type: 'active' as StageType, default_probability: 50, position: 3 },
  { name: 'Oferta', color: '#F59E0B', stage_type: 'active' as StageType, default_probability: 65, position: 4 },
  { name: 'Negociación', color: '#EF4444', stage_type: 'active' as StageType, default_probability: 80, position: 5 },
  { name: 'Reservado', color: '#10B981', stage_type: 'active' as StageType, default_probability: 90, position: 6 },
  { name: 'Cerrado', color: '#22C55E', stage_type: 'closed_won' as StageType, default_probability: 100, position: 7 },
];

export function usePipeline() {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [stagesRes, oppsRes] = await Promise.all([
      supabase.from('pipeline_stages').select('*').eq('tenant_id', tenantId).order('position').limit(100),
      supabase.from('opportunities').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1000),
    ]);
    if (stagesRes.error) console.error('pipeline stages error:', stagesRes.error);
    if (oppsRes.error) console.error('opportunities error:', oppsRes.error);
    if (stagesRes.data) setStages(stagesRes.data.map(mapStage));
    if (oppsRes.data) setOpportunities(oppsRes.data.map(mapOpp));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`pipeline-${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_stages', filter: `tenant_id=eq.${tenantId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities', filter: `tenant_id=eq.${tenantId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, fetchData]);

  // Seed default stages if none exist
  const seedDefaultStages = async (agencyId?: string) => {
    if (!tenantId) return;
    const inserts = DEFAULT_STAGES.map(s => ({
      ...s,
      tenant_id: tenantId,
      agency_id: agencyId || null,
    }));
    const { data } = await supabase.from('pipeline_stages').insert(inserts).select();
    if (data) setStages(prev => [...prev, ...data.map(mapStage)]);
  };

  // Stage CRUD
  const addStage = async (stage: Partial<PipelineStage>) => {
    if (!tenantId) return;
    const { data } = await supabase.from('pipeline_stages').insert({
      tenant_id: tenantId,
      name: stage.name || 'Nueva etapa',
      color: stage.color || '#3B82F6',
      stage_type: stage.stage_type || 'active',
      default_probability: stage.default_probability ?? 50,
      position: stage.position ?? stages.length,
      is_active: stage.is_active ?? true,
      stale_days: stage.stale_days ?? 7,
      agency_id: stage.agency_id || null,
    }).select().single();
    if (data) setStages(prev => [...prev, mapStage(data)]);
    return data;
  };

  const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
    const payload: any = { ...updates };
    delete payload.id; delete payload.tenant_id; delete payload.created_at;
    await supabase.from('pipeline_stages').update(payload).eq('id', id);
    setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStage = async (id: string) => {
    const count = opportunities.filter(o => o.stage_id === id).length;
    if (count > 0) return { error: 'No se puede eliminar una etapa con oportunidades activas' };
    await supabase.from('pipeline_stages').delete().eq('id', id);
    setStages(prev => prev.filter(s => s.id !== id));
    return { error: null };
  };

  const reorderStages = async (reordered: PipelineStage[]) => {
    setStages(reordered);
    await Promise.all(reordered.map((s, i) =>
      supabase.from('pipeline_stages').update({ position: i }).eq('id', s.id)
    ));
  };

  // Opportunity CRUD
  const addOpportunity = async (opp: Partial<Opportunity>) => {
    if (!tenantId) return;
    const { data, error } = await supabase.from('opportunities').insert({
      tenant_id: tenantId,
      client_id: opp.client_id!,
      property_id: opp.property_id || null,
      agent_id: opp.agent_id || null,
      stage_id: opp.stage_id!,
      agency_id: opp.agency_id || null,
      title: opp.title || '',
      deal_value: opp.deal_value || 0,
      probability: opp.probability ?? 50,
      priority: opp.priority || 'media',
      expected_close_date: opp.expected_close_date || null,
      notes: opp.notes || '',
    }).select().single();
    if (data) {
      setOpportunities(prev => [mapOpp(data), ...prev]);
      // Log initial stage entry
      await supabase.from('stage_history').insert({
        tenant_id: tenantId,
        opportunity_id: data.id,
        from_stage_id: null,
        to_stage_id: opp.stage_id!,
        changed_by: user?.email || '',
      });
    }
    return { data, error };
  };

  const updateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    delete payload.id; delete payload.tenant_id; delete payload.created_at;
    await supabase.from('opportunities').update(payload).eq('id', id);
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o));
  };

  const moveOpportunity = async (oppId: string, newStageId: string) => {
    if (!tenantId) return;
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp || opp.stage_id === newStageId) return;

    const newStage = stages.find(s => s.id === newStageId);
    const daysInPrev = Math.floor((Date.now() - new Date(opp.stage_entered_at).getTime()) / 86400000);
    const now = new Date().toISOString();

    // Update opportunity
    await supabase.from('opportunities').update({
      stage_id: newStageId,
      probability: newStage?.default_probability ?? opp.probability,
      stage_entered_at: now,
      updated_at: now,
    }).eq('id', oppId);

    // Log history
    await supabase.from('stage_history').insert({
      tenant_id: tenantId,
      opportunity_id: oppId,
      from_stage_id: opp.stage_id,
      to_stage_id: newStageId,
      changed_by: user?.email || '',
      days_in_previous_stage: daysInPrev,
    });

    setOpportunities(prev => prev.map(o =>
      o.id === oppId ? { ...o, stage_id: newStageId, probability: newStage?.default_probability ?? o.probability, stage_entered_at: now, updated_at: now } : o
    ));
  };

  const deleteOpportunity = async (id: string) => {
    await supabase.from('stage_history').delete().eq('opportunity_id', id);
    await supabase.from('opportunities').delete().eq('id', id);
    setOpportunities(prev => prev.filter(o => o.id !== id));
  };

  return {
    stages, opportunities, loading,
    seedDefaultStages, addStage, updateStage, deleteStage, reorderStages,
    addOpportunity, updateOpportunity, moveOpportunity, deleteOpportunity,
    refetch: fetchData,
  };
}

const mapStage = (r: any): PipelineStage => ({
  id: r.id, tenant_id: r.tenant_id, agency_id: r.agency_id,
  name: r.name, color: r.color, stage_type: r.stage_type,
  default_probability: r.default_probability, position: r.position,
  is_active: r.is_active, stale_days: r.stale_days,
});

const mapOpp = (r: any): Opportunity => ({
  id: r.id, tenant_id: r.tenant_id, client_id: r.client_id,
  property_id: r.property_id, agent_id: r.agent_id, stage_id: r.stage_id,
  agency_id: r.agency_id, title: r.title, deal_value: Number(r.deal_value),
  probability: r.probability, priority: r.priority,
  expected_close_date: r.expected_close_date, notes: r.notes || '',
  stage_entered_at: r.stage_entered_at, created_at: r.created_at,
  updated_at: r.updated_at,
});
