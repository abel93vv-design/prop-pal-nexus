import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import type { ScopeUserId } from "@/hooks/useControlLeads";

const sb: any = supabase;

// ---------- Constants ----------
export const ZONE_COLUMNS = [
  { key: "direccion", label: "Dirección", type: "text" as const },
  { key: "hora", label: "Hora", type: "text" as const },
  { key: "puertas", label: "Puertas", type: "number" as const },
  { key: "contactos", label: "Contactos", type: "number" as const },
  { key: "noticias", label: "Noticias", type: "number" as const },
  { key: "av", label: "AV", type: "number" as const },
] as const;
export const ZONE_ROW_COUNT = 6;

export const MARKETING_SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "Whatsapp" },
  { value: "publi", label: "Publi" },
  { value: "farola", label: "Farola" },
  { value: "otro", label: "Otro" },
] as const;
export const MARKETING_COLUMNS = [
  { key: "publicaciones", label: "Publicaciones" },
  { key: "contactos", label: "Contactos" },
  { key: "pedidos", label: "Pedidos" },
  { key: "noticias", label: "Noticias" },
  { key: "av", label: "AV" },
] as const;

export const CALLS_SOURCES = [
  { value: "statefox", label: "Statefox" },
  { value: "noticias", label: "Noticias" },
  { value: "otras", label: "Otras" },
] as const;
export const CALLS_COLUMNS = [
  { key: "llamadas", label: "Llamadas" },
  { key: "contactadas", label: "Contactadas" },
  { key: "av", label: "AV" },
] as const;

// ---------- Types ----------
export interface ZoneRow {
  direccion: string;
  hora: string;
  puertas: number;
  contactos: number;
  noticias: number;
  av: number;
}
export interface MarketingRow {
  source: string;
  publicaciones: number;
  contactos: number;
  pedidos: number;
  noticias: number;
  av: number;
}
export interface CallsRow {
  source: string;
  llamadas: number;
  contactadas: number;
  av: number;
}
export interface AdvisorSheet {
  zone_rows: ZoneRow[];
  marketing_rows: MarketingRow[];
  calls_rows: CallsRow[];
}

export const emptyZoneRow = (): ZoneRow => ({
  direccion: "", hora: "", puertas: 0, contactos: 0, noticias: 0, av: 0,
});
export const emptyMarketingRows = (): MarketingRow[] =>
  MARKETING_SOURCES.map((s) => ({
    source: s.value, publicaciones: 0, contactos: 0, pedidos: 0, noticias: 0, av: 0,
  }));
export const emptyCallsRows = (): CallsRow[] =>
  CALLS_SOURCES.map((s) => ({ source: s.value, llamadas: 0, contactadas: 0, av: 0 }));

export const emptyAdvisorSheet = (): AdvisorSheet => ({
  zone_rows: Array.from({ length: ZONE_ROW_COUNT }, emptyZoneRow),
  marketing_rows: emptyMarketingRows(),
  calls_rows: emptyCallsRows(),
});

function normalizeSheet(data: any): AdvisorSheet {
  const base = emptyAdvisorSheet();
  if (!data) return base;
  const zone = Array.isArray(data.zone_rows) ? data.zone_rows : [];
  const zone_rows = Array.from({ length: ZONE_ROW_COUNT }, (_, i) => ({
    ...emptyZoneRow(),
    ...(zone[i] ?? {}),
  }));
  const mktMap = new Map<string, MarketingRow>();
  (Array.isArray(data.marketing_rows) ? data.marketing_rows : []).forEach((r: any) => {
    if (r?.source) mktMap.set(r.source, { ...emptyMarketingRows()[0], ...r });
  });
  const marketing_rows = MARKETING_SOURCES.map(
    (s) => mktMap.get(s.value) ?? { source: s.value, publicaciones: 0, contactos: 0, pedidos: 0, noticias: 0, av: 0 }
  );
  const callsMap = new Map<string, CallsRow>();
  (Array.isArray(data.calls_rows) ? data.calls_rows : []).forEach((r: any) => {
    if (r?.source) callsMap.set(r.source, { ...emptyCallsRows()[0], ...r });
  });
  const calls_rows = CALLS_SOURCES.map(
    (s) => callsMap.get(s.value) ?? { source: s.value, llamadas: 0, contactadas: 0, av: 0 }
  );
  return { zone_rows, marketing_rows, calls_rows };
}

// ---------- Hooks ----------
export function useAdvisorSheet(date: string, userId?: ScopeUserId) {
  const { user } = useAuth();
  const ownId = user?.id ?? null;
  const targetId = userId && userId !== "all" ? userId : ownId;
  return useQuery({
    queryKey: ["advisor_daily_sheet", date, targetId ?? "self"],
    queryFn: async (): Promise<AdvisorSheet> => {
      if (!targetId) return emptyAdvisorSheet();
      const { data, error } = await sb
        .from("advisor_daily_sheets")
        .select("zone_rows, marketing_rows, calls_rows")
        .eq("date", date)
        .eq("user_id", targetId)
        .maybeSingle();
      if (error) throw error;
      return normalizeSheet(data);
    },
    enabled: !!ownId,
  });
}

export function useUpsertAdvisorSheet() {
  const qc = useQueryClient();
  const { tenantId } = useUserRole();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { date: string; sheet: AdvisorSheet }) => {
      if (!tenantId) throw new Error("No se pudo identificar la inmobiliaria activa");
      if (!user?.id) throw new Error("Debes iniciar sesión");
      const { error } = await sb.from("advisor_daily_sheets").upsert(
        [{
          tenant_id: tenantId,
          user_id: user.id,
          date: payload.date,
          zone_rows: payload.sheet.zone_rows,
          marketing_rows: payload.sheet.marketing_rows,
          calls_rows: payload.sheet.calls_rows,
        }],
        { onConflict: "tenant_id,user_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["advisor_daily_sheet"] });
    },
  });
}
