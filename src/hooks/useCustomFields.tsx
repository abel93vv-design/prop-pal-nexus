import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

export type CustomFieldType = 'boolean' | 'text' | 'number' | 'range' | 'select' | 'multiselect' | 'date';
export type EntityType = 'client' | 'property';

export interface CustomFieldDefinition {
  id: string;
  tenant_id: string;
  entity_type: EntityType;
  name: string;
  key: string;
  field_type: CustomFieldType;
  required: boolean;
  filterable: boolean;
  used_in_matching: boolean;
  weight_in_matching: number;
  options: string[];
  position: number;
  created_at: string;
}

export interface CustomFieldValue {
  id: string;
  definition_id: string;
  entity_id: string;
  value: any;
}

const mapDef = (r: any): CustomFieldDefinition => ({
  id: r.id,
  tenant_id: r.tenant_id,
  entity_type: r.entity_type,
  name: r.name,
  key: r.key,
  field_type: r.field_type,
  required: r.required,
  filterable: r.filterable,
  used_in_matching: r.used_in_matching,
  weight_in_matching: r.weight_in_matching,
  options: r.options || [],
  position: r.position,
  created_at: r.created_at,
});

export function useCustomFieldDefinitions(entityType?: EntityType) {
  const { tenantId } = useTenant();
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    let q = supabase.from('custom_field_definitions').select('*').eq('tenant_id', tenantId).order('position');
    if (entityType) q = q.eq('entity_type', entityType);
    const { data } = await q;
    if (data) setDefinitions(data.map(mapDef));
    setLoading(false);
  }, [tenantId, entityType]);

  useEffect(() => { fetch(); }, [fetch]);

  const addDefinition = async (def: Omit<CustomFieldDefinition, 'id' | 'tenant_id' | 'created_at'>) => {
    if (!tenantId) return;
    const { data, error } = await supabase.from('custom_field_definitions').insert({
      ...def, tenant_id: tenantId, options: def.options as any,
    }).select().single();
    if (data) setDefinitions(prev => [...prev, mapDef(data)]);
    return { data, error };
  };

  const updateDefinition = async (id: string, updates: Partial<CustomFieldDefinition>) => {
    const payload: any = { ...updates };
    if (payload.options) payload.options = payload.options as any;
    delete payload.id; delete payload.tenant_id; delete payload.created_at;
    await supabase.from('custom_field_definitions').update(payload).eq('id', id);
    setDefinitions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDefinition = async (id: string) => {
    await supabase.from('custom_field_definitions').delete().eq('id', id);
    setDefinitions(prev => prev.filter(d => d.id !== id));
  };

  return { definitions, loading, addDefinition, updateDefinition, deleteDefinition, refetch: fetch };
}

export function useCustomFieldValues(entityId: string | null) {
  const { tenantId } = useTenant();
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId || !tenantId) { setValues({}); return; }
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('custom_field_values')
        .select('definition_id, value')
        .eq('entity_id', entityId);
      const map: Record<string, any> = {};
      data?.forEach(r => { map[r.definition_id] = r.value; });
      setValues(map);
      setLoading(false);
    };
    load();
  }, [entityId, tenantId]);

  const saveValues = async (entityId: string, fieldValues: Record<string, any>) => {
    if (!tenantId) return;
    const promises = Object.entries(fieldValues).map(([defId, value]) =>
      supabase.from('custom_field_values').upsert({
        tenant_id: tenantId,
        definition_id: defId,
        entity_id: entityId,
        value,
      }, { onConflict: 'definition_id,entity_id' })
    );
    await Promise.all(promises);
  };

  return { values, loading, saveValues, setValues };
}
