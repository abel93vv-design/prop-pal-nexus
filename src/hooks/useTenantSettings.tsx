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
  {
    key: "whatsapp",
    label: "WhatsApp",
    description:
      "Muestra los botones de \u201cContactar por WhatsApp\u201d en las fichas de cliente y en el matching, y la tarjeta de conexi\u00f3n de WhatsApp en Ajustes.",
  },
  {
    key: "portal_idealista",
    label: "Idealista",
    description: "Muestra la conexi\u00f3n con Idealista en Ajustes y permite marcar viviendas para publicarse en ese portal.",
  },
  {
    key: "portal_fotocasa",
    label: "Fotocasa",
    description: "Muestra la conexi\u00f3n con Fotocasa en Ajustes y permite marcar viviendas para publicarse en ese portal.",
  },
  {
    key: "hoja_zona",
    label: "Hoja de zona",
    description:
      "A\u00f1ade la ventana \u201cHoja de zona\u201d en el men\u00fa principal: cabecera del portal, hojas por fecha y tabla de vecinos con marcado de noticias.",
  },
];

const isTrue = (v?: string | null) =>
  ["true", "1", "si", "sí", "yes", "on"].includes((v ?? "").trim().toLowerCase());

export function useTenantSettings() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();

  const { data: settings = [], isLoading, isFetched } = useQuery({
    queryKey: ["tenant_settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      if (!tenantId) return [];
      const [legacyResult, activeConfigsResult] = await Promise.all([
        supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId).order("key"),
        supabase.rpc("get_tenant_active_configs", { _tenant_id: tenantId }),
      ]);
      if (legacyResult.error) throw legacyResult.error;
      if (activeConfigsResult.error) throw activeConfigsResult.error;

      const merged = new Map<string, TenantSetting>();
      (legacyResult.data || []).forEach((setting) => merged.set(setting.key, setting as TenantSetting));
      (activeConfigsResult.data || []).forEach((config) => {
        const rawValue = config.value;
        const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
        merged.set(config.feature_key, {
          id: `feature:${config.feature_key}`,
          tenant_id: tenantId,
          key: config.feature_key,
          label: null,
          value,
          created_at: "",
          updated_at: "",
        });
      });
      return Array.from(merged.values()).sort((a, b) => a.key.localeCompare(b.key));
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

  const loading = isLoading || !tenantId || !isFetched;

  return { settings, loading, getBool, upsertSetting, deleteSetting };
}
