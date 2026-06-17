import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

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
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "Whatsapp" },
  { value: "telegram", label: "Telegram" },
  { value: "oficina", label: "Oficina" },
  { value: "escaparate", label: "Escaparate" },
  { value: "wallapop", label: "Wallapop" },
  { value: "publicidad", label: "Publicidad" },
  { value: "zona", label: "Zona" },
  { value: "referidos", label: "Referidos" },
  { value: "valoracasa", label: "Valoracasa" },
  { value: "base_de_datos", label: "CRM" },
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
  { key: "emails_respondidos", label: "Emails respondidos" },
  { key: "personas_escaparate", label: "Personas escaparate" },
  { key: "personas_atendidas", label: "Personas atendidas" },
  { key: "pedidos_alquiler", label: "Pedidos alquiler" },
  { key: "citas_alquiler", label: "Citas de alquiler" },
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
  emails_respondidos: number;
  personas_escaparate: number;
  personas_atendidas: number;
  pedidos_alquiler: number;
  citas_alquiler: number;
  notes: string;
}

export interface DailyLeadRowWithDate extends DailyLeadRow {
  date: string;
  user_id?: string;
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
  emails_respondidos: 0,
  personas_escaparate: 0,
  personas_atendidas: 0,
  pedidos_alquiler: 0,
  citas_alquiler: 0,
  notes: "",
});


const sb: any = supabase;

/**
 * userId: 
 *  - undefined => own data (default)
 *  - "all" => all users in tenant (admin only)
 *  - "<uuid>" => specific user (admin only)
 */
export type ScopeUserId = string | "all" | undefined;

function applyUserFilter(query: any, userId: ScopeUserId, ownId: string | null) {
  if (userId === "all") return query;
  if (userId && userId !== "all") return query.eq("user_id", userId);
  if (ownId) return query.eq("user_id", ownId);
  return query;
}

export function useDailyLeads(date: string, userId?: ScopeUserId) {
  const { user } = useAuth();
  const ownId = user?.id ?? null;
  return useQuery({
    queryKey: ["daily_leads", date, userId ?? ownId ?? "self"],
    queryFn: async (): Promise<DailyLeadRow[]> => {
      let q = sb.from("daily_leads").select("*").eq("date", date);
      q = applyUserFilter(q, userId, ownId);
      const { data, error } = await q;
      if (error) throw error;

      // Aggregate across users when "all"
      if (userId === "all") {
        const map = new Map<LeadSource, DailyLeadRow>();
        LEAD_SOURCES.forEach((s) => map.set(s.value, emptyLeadRow(s.value)));
        (data || []).forEach((r: any) => {
          const cur = map.get(r.source) ?? emptyLeadRow(r.source);
          LEAD_COLUMNS.forEach((c) => {
            (cur as any)[c.key] += Number((r as any)[c.key] ?? 0);
          });
          map.set(r.source, cur);
        });
        return LEAD_SOURCES.map((s) => map.get(s.value)!);
      }

      const map = new Map<LeadSource, DailyLeadRow>();
      (data || []).forEach((r: any) => map.set(r.source, r));
      return LEAD_SOURCES.map((s) => map.get(s.value) ?? emptyLeadRow(s.value));
    },
    enabled: !!ownId,
  });
}

export function useDailyGlobal(date: string, userId?: ScopeUserId) {
  const { user } = useAuth();
  const ownId = user?.id ?? null;
  return useQuery({
    queryKey: ["daily_global_metrics", date, userId ?? ownId ?? "self"],
    queryFn: async (): Promise<DailyGlobalRow> => {
      let q = sb.from("daily_global_metrics").select("*").eq("date", date);
      q = applyUserFilter(q, userId, ownId);

      if (userId === "all") {
        const { data, error } = await q;
        if (error) throw error;
        const agg = emptyGlobalRow();
        const notes: string[] = [];
        (data || []).forEach((r: any) => {
          GLOBAL_COLUMNS.forEach((c) => {
            (agg as any)[c.key] += Number((r as any)[c.key] ?? 0);
          });
          if (r.notes && String(r.notes).trim()) notes.push(String(r.notes));
        });
        agg.notes = notes.join("\n---\n");
        return agg;
      }

      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data ? { ...emptyGlobalRow(), ...data, notes: data.notes ?? "" } : emptyGlobalRow();
    },
    enabled: !!ownId,
  });
}

export function useUpsertDay() {
  const qc = useQueryClient();
  const { tenantId } = useUserRole();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      date: string;
      leads: DailyLeadRow[];
      global: DailyGlobalRow;
    }) => {
      if (!tenantId) throw new Error("No se pudo identificar la inmobiliaria activa");
      if (!user?.id) throw new Error("Debes iniciar sesión");
      const leadsRows = payload.leads.map((r) => ({
        ...r,
        date: payload.date,
        tenant_id: tenantId,
        user_id: user.id,
      }));
      const { error: e1 } = await sb
        .from("daily_leads")
        .upsert(leadsRows, { onConflict: "tenant_id,user_id,date,source" });
      if (e1) throw e1;
      const { error: e2 } = await sb
        .from("daily_global_metrics")
        .upsert(
          [{ ...payload.global, date: payload.date, tenant_id: tenantId, user_id: user.id }],
          { onConflict: "tenant_id,user_id,date" }
        );
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_leads"] });
      qc.invalidateQueries({ queryKey: ["daily_global_metrics"] });
      qc.invalidateQueries({ queryKey: ["daily_leads_range"] });
      qc.invalidateQueries({ queryKey: ["daily_global_range"] });
    },
  });
}

export function useRangeLeads(from: string, to: string, userId?: ScopeUserId) {
  const { user } = useAuth();
  const ownId = user?.id ?? null;
  return useQuery({
    queryKey: ["daily_leads_range", from, to, userId ?? ownId ?? "self"],
    queryFn: async (): Promise<DailyLeadRowWithDate[]> => {
      let q = sb.from("daily_leads").select("*").gte("date", from).lte("date", to);
      q = applyUserFilter(q, userId, ownId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DailyLeadRowWithDate[];
    },
    enabled: !!from && !!to && !!ownId,
  });
}

export function useRangeGlobals(from: string, to: string, userId?: ScopeUserId) {
  const { user } = useAuth();
  const ownId = user?.id ?? null;
  return useQuery({
    queryKey: ["daily_global_range", from, to, userId ?? ownId ?? "self"],
    queryFn: async () => {
      let q = sb.from("daily_global_metrics").select("*").gte("date", from).lte("date", to);
      q = applyUserFilter(q, userId, ownId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Array<DailyGlobalRow & { date: string; user_id?: string }>;
    },
    enabled: !!from && !!to && !!ownId,
  });
}

/** Lists tenant users that have entries OR are team members; admin only. */
export function useTenantUsers(enabled: boolean) {
  const { tenantId } = useUserRole();
  return useQuery({
    queryKey: ["control_leads_tenant_users", tenantId],
    queryFn: async (): Promise<Array<{ user_id: string; name: string }>> => {
      if (!tenantId) return [];
      const { data, error } = await sb
        .from("team_members")
        .select("user_id, name, email")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .not("user_id", "is", null);
      if (error) throw error;
      return (data || []).map((m: any) => ({
        user_id: m.user_id,
        name: m.name || m.email || "Usuario",
      }));
    },
    enabled: enabled && !!tenantId,
  });
}

export { emptyLeadRow, emptyGlobalRow };
