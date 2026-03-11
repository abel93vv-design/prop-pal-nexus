import { supabase } from "@/integrations/supabase/client";

export const saveSnapshot = async (
  tenantId: string | null,
  userId: string | undefined,
  entityType: string,
  entityId: string,
  action: string,
  snapshotData: Record<string, any>
) => {
  if (!tenantId || !userId) return;
  try {
    await (supabase as any).from('entity_snapshots').insert({
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      snapshot: snapshotData,
      changed_by: userId,
    });
  } catch (e) {
    console.error('Snapshot save error:', e);
  }
};

export interface Snapshot {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  snapshot: Record<string, any>;
  changed_by: string;
  created_at: string;
}

export const getSnapshots = async (entityType: string, entityId: string): Promise<Snapshot[]> => {
  const { data } = await (supabase as any)
    .from('entity_snapshots')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });
  return (data || []) as unknown as Snapshot[];
};

export const getAllDeletedSnapshots = async (entityType?: string): Promise<Snapshot[]> => {
  let query = (supabase as any)
    .from('entity_snapshots')
    .select('*')
    .eq('action', 'delete')
    .order('created_at', { ascending: false });
  if (entityType) query = query.eq('entity_type', entityType);
  const { data } = await query;
  return (data || []) as unknown as Snapshot[];
};
