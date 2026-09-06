import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

export interface TenantSetting {
  id: string;
  tenant_id: string;
  key: string;
  label: string | null;
  value: string;
  created_at: string;
  updated_at: string;
}

export const TENANT_SETTING_PRESETS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "portal_idealista", label: "Idealista" },
  { key: "portal_fotocasa", label: "Fotocasa" },
];

const isTrue = (v?: string | null) =>
  ["true", "1", "si", "sí", "yes", "on"].includes((v ?? "").trim().toLowerCase());

export function useTenantSettings() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["tenant_settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_settings")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("key");
      if (error) throw error;
      return (data || []) as TenantSetting[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tenant_settings", tenantId] });

  const upsertSetting = useMutation({
    mutationFn: async (input: { id?: string; key: string; label?: string | null; value: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("tenant_settings")
          .update({ label: input.label ?? null, value: input.value })
          .eq("id", input.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("tenant_settings").upsert(
        {
          tenant_id: tenantId!,
          key: input.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          label: input.label ?? null,
          value: input.value,
        },
        { onConflict: "tenant_id,key" }
      );
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteSetting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_settings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const getBool = (key: string) => isTrue(settings.find((s) => s.key === key)?.value);

  return { settings, loading: isLoading, getBool, upsertSetting, deleteSetting };
}
