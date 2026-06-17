import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export const LEAD_SOURCES = [
  { value: "fotocasa", label: "Fotocasa" },
  { value: "habitaclia", label: "Habitaclia" },
  { value: "idealista", label: "Idealista" },
  { value: "facebook", label: "Facebook" },
  { value: "facebook_personal", label: "Facebook Personal" },
  { value: "grupos_facebook", label: "Grupos Facebook" },
  { value: "marketplace", label: "Marketplace" },
  { value: "instagram", label: "Instagram" },
  { value: "instagram_personal", label: "Instagram Personal" },
  { value: "whatsapp", label: "Whatsapp" },
  { value: "telegram", label: "Telegram" },
  { value: "oficina", label: "Oficina" },
  { value: "escaparate", label: "Escaparate" },
  { value: "wallapop", label: "Wallapop" },
  { value: "publicidad", label: "Publicidad" },
  { value: "zona", label: "Zona" },
  { value: "referidos", label: "Referidos" },
  { value: "valoracasa", label: "Valoracasa" },
  { value: "base_de_datos", label: "Base de datos" },
  { value: "otros", label: "Otros" },
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number]["value"];

export const LEAD_COLUMNS = [
  { key: "total_pedidos", label: "Total pedidos" },
  { key: "pedidos_insertados", label: "Insertados" },
  { key: "pedidos_actualizados", label: "Actualizados" },
  { key: "pedidos_llamados", label: "Llamados" },
  { key: "pedidos_llamados_contactados", label: "Contactados" },
  { key: "pedidos_sin_contactar", label: "Sin contactar" },
  { key: "cv", label: "CV" },
  { key: "av", label: "AV" },
  { key: "asesoramientos", label: "Asesoramientos" },
] as const;

export type LeadColumnKey = (typeof LEAD_COLUMNS)[number]["key"];

export const GLOBAL_COLUMNS = [
  { key: "emails_enviados", label: "Emails enviados" },
  { key: "personas_escaparates", label: "Personas escaparates" },
  { key: "personas_atendidas", label: "Personas atendidas" },
  { key: "personas_que_entran", label: "Personas que entran" },
  { key: "respuestas_alquiler", label: "Respuestas alquiler" },
  { key: "pedidos_alquiler", label: "Pedidos alquiler" },
  { key: "cv_alquiler", label: "CV alquiler" },
] as const;

export type GlobalColumnKey = (typeof GLOBAL_COLUMNS)[number]["key"];

export interface DailyLeadRow {
  source: LeadSource;
  total_pedidos: number;
  pedidos_insertados: number;
  pedidos_actualizados: number;
  pedidos_llamados: number;
  pedidos_llamados_contactados: number;
  pedidos_sin_contactar: number;
  cv: number;
  av: number;
  asesoramientos: number;
}

export interface DailyGlobalRow {
  emails_enviados: number;
  personas_escaparates: number;
  personas_atendidas: number;
  personas_que_entran: number;
  respuestas_alquiler: number;
  pedidos_alquiler: number;
  cv_alquiler: number;
  notes: string;
}

export interface DailyLeadRowWithDate extends DailyLeadRow {
  date: string;
}

const emptyLeadRow = (source: LeadSource): DailyLeadRow => ({
  source,
  total_pedidos: 0,
  pedidos_insertados: 0,
  pedidos_actualizados: 0,
  pedidos_llamados: 0,
  pedidos_llamados_contactados: 0,
  pedidos_sin_contactar: 0,
  cv: 0,
  av: 0,
  asesoramientos: 0,
});

const emptyGlobalRow = (): DailyGlobalRow => ({
  emails_enviados: 0,
  personas_escaparates: 0,
  personas_atendidas: 0,
  personas_que_entran: 0,
  respuestas_alquiler: 0,
  pedidos_alquiler: 0,
  cv_alquiler: 0,
  notes: "",
});

const sb: any = supabase;

export function useDailyLeads(date: string) {
  return useQuery({
    queryKey: ["daily_leads", date],
    queryFn: async (): Promise<DailyLeadRow[]> => {
      const { data, error } = await sb
        .from("daily_leads")
        .select("*")
        .eq("date", date);
      if (error) throw error;
      const map = new Map<LeadSource, DailyLeadRow>();
      (data || []).forEach((r: any) => map.set(r.source, r));
      return LEAD_SOURCES.map((s) => map.get(s.value) ?? emptyLeadRow(s.value));
    },
  });
}

export function useDailyGlobal(date: string) {
  return useQuery({
    queryKey: ["daily_global_metrics", date],
    queryFn: async (): Promise<DailyGlobalRow> => {
      const { data, error } = await sb
        .from("daily_global_metrics")
        .select("*")
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data ? { ...emptyGlobalRow(), ...data, notes: data.notes ?? "" } : emptyGlobalRow();
    },
  });
}

export function useUpsertDay() {
  const qc = useQueryClient();
  const { tenantId } = useUserRole();

  return useMutation({
    mutationFn: async (payload: {
      date: string;
      leads: DailyLeadRow[];
      global: DailyGlobalRow;
    }) => {
      if (!tenantId) throw new Error("No se pudo identificar la inmobiliaria activa");
      const leadsRows = payload.leads.map((r) => ({ ...r, date: payload.date, tenant_id: tenantId }));
      const { error: e1 } = await sb
        .from("daily_leads")
        .upsert(leadsRows, { onConflict: "tenant_id,date,source" });
      if (e1) throw e1;
      const { error: e2 } = await sb
        .from("daily_global_metrics")
        .upsert(
          [{ ...payload.global, date: payload.date, tenant_id: tenantId }],
          { onConflict: "tenant_id,date" }
        );
      if (e2) throw e2;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_leads", vars.date] });
      qc.invalidateQueries({ queryKey: ["daily_global_metrics", vars.date] });
      qc.invalidateQueries({ queryKey: ["daily_leads_range"] });
      qc.invalidateQueries({ queryKey: ["daily_global_range"] });
    },
  });
}

export function useRangeLeads(from: string, to: string) {
  return useQuery({
    queryKey: ["daily_leads_range", from, to],
    queryFn: async (): Promise<DailyLeadRowWithDate[]> => {
      const { data, error } = await sb
        .from("daily_leads")
        .select("*")
        .gte("date", from)
        .lte("date", to);
      if (error) throw error;
      return (data || []) as DailyLeadRowWithDate[];
    },
    enabled: !!from && !!to,
  });
}

export function useRangeGlobals(from: string, to: string) {
  return useQuery({
    queryKey: ["daily_global_range", from, to],
    queryFn: async () => {
      const { data, error } = await sb
        .from("daily_global_metrics")
        .select("*")
        .gte("date", from)
        .lte("date", to);
      if (error) throw error;
      return (data || []) as Array<DailyGlobalRow & { date: string }>;
    },
    enabled: !!from && !!to,
  });
}

export { emptyLeadRow, emptyGlobalRow };
