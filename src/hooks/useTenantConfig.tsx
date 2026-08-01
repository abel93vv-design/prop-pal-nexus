import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

export const useTenantConfig = () => {
  const { tenantId } = useTenant();
  const [configs, setConfigs] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tenantId) { setConfigs({}); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.rpc("get_tenant_active_configs", { _tenant_id: tenantId });
    const map: Record<string, unknown> = {};
    (data || []).forEach((row: any) => { map[row.feature_key] = row.value; });
    setConfigs(map);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { configs, loading, refresh };
};
