import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { useAuth } from "@/hooks/useAuth";

export type ContactMode = "P" | "M" | null;
export type DwellingStatus = "ocupado" | "vacio" | "alquilado" | "en_venta" | "vacacional" | null;

export interface ZoneSheetRow {
  id: string;
  is_news: boolean;
  floor: string;
  name: string;
  contact_mode: ContactMode;
  status: DwellingStatus;
  comment: string;
  phone: string;
  property_id: string | null;
}

export interface ZoneSheet {
  id: string;
  tenant_id: string;
  user_id: string;
  sheet_date: string;
  sheet_time: string;
  exit_time: string | null;
  agent_name: string | null;
  street: string | null;
  portal: string | null;
  administrator: string | null;
  community: string | null;
  president: string | null;
  property_type: string | null;
  is_vpo: boolean;
  has_garage: boolean;
  has_elevator: boolean;
  has_accessible_access: boolean;
  building_year: number | null;
  rows: ZoneSheetRow[];
  created_at: string;
  updated_at: string;
}

export const emptyZoneRow = (): ZoneSheetRow => ({
  id: crypto.randomUUID(),
  is_news: false,
  floor: "",
  name: "",
  contact_mode: null,
  status: null,
  comment: "",
  phone: "",
  property_id: null,
});

export function useZoneSheets(viewUserId?: string) {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const targetUserId = viewUserId || user?.id;
  const queryKey = ["zone_sheets", tenantId, targetUserId];

  const { data: sheets = [], isLoading } = useQuery({
    queryKey,
    enabled: !!tenantId && !!targetUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_sheets")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("user_id", targetUserId!)
        .order("sheet_date", { ascending: false })
        .order("sheet_time", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data || []).map((s: any) => ({ ...s, rows: (s.rows || []) as ZoneSheetRow[] })) as ZoneSheet[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const createSheet = useMutation({
    mutationFn: async (input: Partial<ZoneSheet>) => {
      const now = new Date();
      const { data, error } = await supabase
        .from("zone_sheets")
        .insert({
          tenant_id: tenantId!,
          user_id: user!.id,
          sheet_date: input.sheet_date || now.toISOString().slice(0, 10),
          sheet_time: input.sheet_time || now.toTimeString().slice(0, 8),
          agent_name: input.agent_name ?? null,
          street: input.street ?? null,
          portal: input.portal ?? null,
          administrator: input.administrator ?? null,
          community: input.community ?? null,
          president: input.president ?? null,
          property_type: input.property_type ?? null,
          is_vpo: input.is_vpo ?? false,
          has_garage: input.has_garage ?? false,
          has_elevator: input.has_elevator ?? false,
          has_accessible_access: input.has_accessible_access ?? false,
          building_year: input.building_year ?? null,
          rows: (input.rows ?? Array.from({ length: 8 }, emptyZoneRow)) as any,
        })
        .select()
        .single();
      if (error) throw error;
      return { ...(data as any), rows: ((data as any).rows || []) as ZoneSheetRow[] } as ZoneSheet;
    },
    onSuccess: invalidate,
  });

  const updateSheet = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ZoneSheet> & { id: string }) => {
      const { error } = await supabase
        .from("zone_sheets")
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteSheet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("zone_sheets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { sheets, loading: isLoading, createSheet, updateSheet, deleteSheet };
}
