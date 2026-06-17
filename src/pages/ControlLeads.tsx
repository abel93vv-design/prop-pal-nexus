import { useMemo, useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, TrendingUp, TrendingDown, Minus, StickyNote, Users } from "lucide-react";
import {
  LEAD_SOURCES,
  LEAD_COLUMNS,
  GLOBAL_COLUMNS,
  type DailyLeadRow,
  type DailyGlobalRow,
  type LeadSource,
  type LeadColumnKey,
  type GlobalColumnKey,
  type ScopeUserId,
  useDailyLeads,
  useDailyGlobal,
  useUpsertDay,
  useRangeLeads,
  useRangeGlobals,
  useTenantUsers,
  emptyLeadRow,
  emptyGlobalRow,
} from "@/hooks/useControlLeads";
import {
  ZONE_COLUMNS,
  ZONE_ROW_COUNT,
  MARKETING_SOURCES,
  MARKETING_COLUMNS,
  CALLS_SOURCES,
  CALLS_COLUMNS,
  emptyAdvisorSheet,
  useAdvisorSheet,
  useUpsertAdvisorSheet,
  useAdvisorRange,
  aggregateMarketing,
  aggregateCalls,
  aggregateZoneTotals,

  type AdvisorSheet,
  type ZoneRow,
  type MarketingRow,
  type CallsRow,
} from "@/hooks/useAdvisorSheet";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";


const todayStr = () => new Date().toISOString().slice(0, 10);
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  return { from, to };
}
function yearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

// ---------- DAILY ----------
function DailyView({ scopeUserId }: { scopeUserId: ScopeUserId }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState<string>(todayStr());
  const isViewingOther =
    scopeUserId === "all" || (!!scopeUserId && scopeUserId !== user?.id);
  const { data: leadsData, isLoading: loadingLeads } = useDailyLeads(date, scopeUserId);
  const { data: globalData, isLoading: loadingGlobal } = useDailyGlobal(date, scopeUserId);
  const upsert = useUpsertDay();

  const [leads, setLeads] = useState<DailyLeadRow[]>([]);
  const [globals, setGlobals] = useState<DailyGlobalRow>(emptyGlobalRow());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (leadsData) {
      setLeads(leadsData);
      setDirty(false);
    }
  }, [leadsData]);
  useEffect(() => {
    if (globalData) {
      setGlobals(globalData);
      setDirty(false);
    }
  }, [globalData]);

  const updateCell = (source: LeadSource, key: LeadColumnKey, val: number) => {
    setLeads((prev) =>
      prev.map((r) => (r.source === source ? { ...r, [key]: val } : r))
    );
    setDirty(true);
  };
  const updateGlobal = (key: GlobalColumnKey | "notes", val: number | string) => {
    setGlobals((g) => ({ ...g, [key]: val } as DailyGlobalRow));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({ date, leads, global: globals });
      toast({ title: "Día guardado", description: `Datos del ${date} actualizados.` });
      setDirty(false);
    } catch (err: any) {
      toast({
        title: "Error al guardar",
        description: err?.message ?? "No se pudo guardar el día.",
        variant: "destructive",
      });
    }
  };

  const loading = loadingLeads || loadingGlobal;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Vista diaria</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Edita las celdas y guarda el día. Cambia la fecha para revisar/editar otro día.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="cl-date" className="text-sm">Fecha</Label>
            <Input
              id="cl-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            <Button onClick={handleSave} disabled={upsert.isPending || !dirty || isViewingOther} title={isViewingOther ? "Viendo datos de otro usuario (solo lectura)" : ""}>
              {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar día
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : (
            <div className="overflow-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left font-medium px-3 py-2 sticky left-0 bg-muted/40 z-10 min-w-[160px]">
                      Fuente
                    </th>
                    {LEAD_COLUMNS.map((c) => (
                      <th key={c.key} className="text-left font-medium px-2 py-2 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((row) => (
                    <tr key={row.source} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-1.5 font-medium sticky left-0 bg-card z-10">
                        {LEAD_SOURCES.find((s) => s.value === row.source)?.label}
                      </td>
                      {LEAD_COLUMNS.map((c) => (
                        <td key={c.key} className="px-1 py-1">
                          <Input
                            type="number"
                            min={0}
                            value={row[c.key] ?? 0}
                            disabled={isViewingOther}
                            onChange={(e) =>
                              updateCell(row.source, c.key, Number(e.target.value) || 0)
                            }
                            className="h-8 w-20 text-right"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Otras métricas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                {(["emails_enviados","emails_respondidos","personas_escaparate","personas_atendidas","pedidos_alquiler","citas_alquiler"] as const).map((key) => {
                  const c = GLOBAL_COLUMNS.find((x) => x.key === key)!;
                  return (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`g-${key}`} className="text-xs text-muted-foreground">
                        {c.label}
                      </Label>
                      <Input
                        id={`g-${key}`}
                        type="number"
                        min={0}
                        disabled={isViewingOther}
                        value={globals[key] ?? 0}
                        onChange={(e) => updateGlobal(key, Number(e.target.value) || 0)}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4 items-start">
                <div className="space-y-1">
                  <Label htmlFor="g-personas_que_entran" className="text-xs text-muted-foreground">
                    Personas que entran
                  </Label>
                  <Input
                    id="g-personas_que_entran"
                    type="number"
                    min={0}
                    disabled={isViewingOther}
                    value={globals.personas_que_entran ?? 0}
                    onChange={(e) => updateGlobal("personas_que_entran", Number(e.target.value) || 0)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["entrantes_pedidos_compra","entrantes_vendedores","entrantes_otros"] as const).map((key) => {
                    const c = GLOBAL_COLUMNS.find((x) => x.key === key)!;
                    return (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={`g-${key}`} className="text-xs text-muted-foreground">
                          {c.label}
                        </Label>
                        <Input
                          id={`g-${key}`}
                          type="number"
                          min={0}
                          disabled={isViewingOther}
                          value={globals[key] ?? 0}
                          onChange={(e) => updateGlobal(key, Number(e.target.value) || 0)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" /> Notas del día
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : (
            <Textarea
              placeholder="Escribe aquí cualquier nota, observación o incidencia del día…"
              value={globals.notes ?? ""}
              disabled={isViewingOther}
              onChange={(e) => updateGlobal("notes", e.target.value)}
              rows={5}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- helpers for aggregation ----------
function aggregateBySource(rows: Array<DailyLeadRow & { date: string }>) {
  const map = new Map<LeadSource, DailyLeadRow>();
  LEAD_SOURCES.forEach((s) => map.set(s.value, emptyLeadRow(s.value)));
  rows.forEach((r) => {
    const cur = map.get(r.source) ?? emptyLeadRow(r.source);
    LEAD_COLUMNS.forEach((c) => {
      (cur as any)[c.key] += Number((r as any)[c.key] ?? 0);
    });
    map.set(r.source, cur);
  });
  return Array.from(map.values());
}

function totalsOf(rows: DailyLeadRow[]) {
  const t: Record<LeadColumnKey, number> = {
    total_pedidos: 0, pedidos_insertados: 0, pedidos_actualizados: 0,
    pedidos_llamados: 0, pedidos_llamados_contactados: 0, pedidos_sin_contactar: 0,
    cv: 0, av: 0, asesoramientos: 0,
  };
  rows.forEach((r) => LEAD_COLUMNS.forEach((c) => { t[c.key] += Number((r as any)[c.key] ?? 0); }));
  return t;
}

// ---------- MONTHLY ----------
function MonthlyView({ scopeUserId }: { scopeUserId: ScopeUserId }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { from, to } = useMemo(() => monthRange(year, month), [year, month]);
  const { data: rows = [], isLoading } = useRangeLeads(from, to, scopeUserId);
  const { data: globalsRange = [] } = useRangeGlobals(from, to, scopeUserId);
  const notes = useMemo(
    () =>
      (globalsRange as any[])
        .filter((g) => g.notes && String(g.notes).trim().length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [globalsRange]
  );

  const bySource = useMemo(() => aggregateBySource(rows), [rows]);
  const totals = useMemo(() => totalsOf(bySource), [bySource]);
  const contactRate = totals.pedidos_insertados > 0
    ? (totals.pedidos_llamados_contactados / totals.pedidos_insertados) * 100
    : 0;

  const barData = bySource
    .map((r) => ({
      fuente: LEAD_SOURCES.find((s) => s.value === r.source)?.label ?? r.source,
      leads: r.pedidos_insertados,
    }))
    .filter((d) => d.leads > 0)
    .sort((a, b) => b.leads - a.leads);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyMap = new Map<string, number>();
  rows.forEach((r) => {
    dailyMap.set(r.date, (dailyMap.get(r.date) ?? 0) + Number(r.pedidos_insertados ?? 0));
  });
  const lineData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${d}`;
    return { dia: d, insertados: dailyMap.get(key) ?? 0 };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Vista mensual</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS_ES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
              className="w-24"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Total leads (insertados)" value={totals.pedidos_insertados} />
            <KpiCard label="Tasa de contacto" value={`${contactRate.toFixed(1)}%`} />
            <KpiCard label="Total CV" value={totals.cv} />
            <KpiCard label="Total AV" value={totals.av} />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : (
            <SourceTable rows={bySource} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Leads insertados por fuente</CardTitle></CardHeader>
          <CardContent style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="fuente" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Evolución diaria — pedidos insertados</CardTitle></CardHeader>
          <CardContent style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="insertados" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" /> Notas del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No hay notas registradas para este mes.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notes.map((n: any) => (
                <li key={n.date} className="py-3 flex gap-4">
                  <div className="text-xs font-medium text-muted-foreground tabular-nums w-24 shrink-0">
                    {new Date(n.date + "T00:00:00").toLocaleDateString("es-ES", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </div>
                  <div className="text-sm whitespace-pre-wrap flex-1">{n.notes}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function SourceTable({ rows }: { rows: DailyLeadRow[] }) {
  return (
    <div className="overflow-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-2 sticky left-0 bg-muted/40 z-10">Fuente</th>
            {LEAD_COLUMNS.map((c) => (
              <th key={c.key} className="text-right px-2 py-2 whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-t border-border hover:bg-muted/20">
              <td className="px-3 py-1.5 font-medium sticky left-0 bg-card z-10">
                {LEAD_SOURCES.find((s) => s.value === r.source)?.label}
              </td>
              {LEAD_COLUMNS.map((c) => (
                <td key={c.key} className="px-2 py-1.5 text-right tabular-nums">
                  {(r as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- YEARLY ----------
function YearlyView({ scopeUserId }: { scopeUserId: ScopeUserId }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const { from, to } = useMemo(() => yearRange(year), [year]);
  const { data: rows = [], isLoading } = useRangeLeads(from, to, scopeUserId);

  // rows by month
  const monthly = useMemo(() => {
    const acc: DailyLeadRow[][] = Array.from({ length: 12 }, () => []);
    rows.forEach((r) => {
      const m = Number(r.date.slice(5, 7)) - 1;
      acc[m].push(r);
    });
    return acc.map((m) => totalsOf(m));
  }, [rows]);

  const yearTotals = useMemo(() => {
    const t: Record<LeadColumnKey, number> = {
      total_pedidos: 0, pedidos_insertados: 0, pedidos_actualizados: 0,
      pedidos_llamados: 0, pedidos_llamados_contactados: 0, pedidos_sin_contactar: 0,
      cv: 0, av: 0, asesoramientos: 0,
    };
    monthly.forEach((m) => LEAD_COLUMNS.forEach((c) => { t[c.key] += m[c.key]; }));
    return t;
  }, [monthly]);

  const bestMonthIdx = monthly.reduce(
    (best, m, i) => (m.pedidos_insertados > monthly[best].pedidos_insertados ? i : best),
    0
  );

  const bySource = useMemo(() => aggregateBySource(rows), [rows]);
  const bestSource = [...bySource].sort((a, b) => b.pedidos_insertados - a.pedidos_insertados)[0];

  // Stacked bar: top 5 sources + Otras, by month
  const topSources = [...bySource]
    .sort((a, b) => b.pedidos_insertados - a.pedidos_insertados)
    .slice(0, 5)
    .map((s) => s.source);
  const stackedData = Array.from({ length: 12 }, (_, m) => {
    const obj: any = { mes: MONTHS_ES[m].slice(0, 3) };
    topSources.forEach((s) => (obj[s] = 0));
    obj.otras = 0;
    rows.forEach((r) => {
      if (Number(r.date.slice(5, 7)) - 1 !== m) return;
      const key = topSources.includes(r.source) ? r.source : "otras";
      obj[key] += Number(r.pedidos_insertados ?? 0);
    });
    return obj;
  });
  const stackColors = ["--primary", "--info", "--success", "--warning", "--accent", "--muted-foreground"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Vista anual</CardTitle>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
            className="w-28"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <KpiCard label="Total leads" value={yearTotals.pedidos_insertados} />
            <KpiCard label="Total CV" value={yearTotals.cv} />
            <KpiCard label="Total AV" value={yearTotals.av} />
            <KpiCard label="Mejor mes" value={MONTHS_ES[bestMonthIdx]} />
            <KpiCard
              label="Mejor fuente"
              value={bestSource ? LEAD_SOURCES.find((s) => s.value === bestSource.source)?.label ?? "—" : "—"}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : (
            <div className="overflow-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 sticky left-0 bg-muted/40 z-10">Mes</th>
                    {LEAD_COLUMNS.map((c) => (
                      <th key={c.key} className="text-right px-2 py-2 whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-1.5 font-medium sticky left-0 bg-card z-10">{MONTHS_ES[i]}</td>
                      {LEAD_COLUMNS.map((c) => (
                        <td key={c.key} className="px-2 py-1.5 text-right tabular-nums">{m[c.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pedidos insertados por mes y fuente principal</CardTitle></CardHeader>
        <CardContent style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              {topSources.map((s, i) => (
                <Bar
                  key={s}
                  dataKey={s}
                  stackId="a"
                  name={LEAD_SOURCES.find((x) => x.value === s)?.label ?? s}
                  fill={`hsl(var(${stackColors[i]}))`}
                />
              ))}
              <Bar dataKey="otras" stackId="a" name="Otras" fill={`hsl(var(${stackColors[5]}))`} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- COMPARE ----------
type PeriodKind = "month" | "year";
function ComparativeView({ scopeUserId }: { scopeUserId: ScopeUserId }) {
  const now = new Date();
  const [kind, setKind] = useState<PeriodKind>("month");
  const [aYear, setAYear] = useState(now.getFullYear());
  const [aMonth, setAMonth] = useState(now.getMonth());
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [bYear, setBYear] = useState(prev.getFullYear());
  const [bMonth, setBMonth] = useState(prev.getMonth());

  const rangeA = kind === "month" ? monthRange(aYear, aMonth) : yearRange(aYear);
  const rangeB = kind === "month" ? monthRange(bYear, bMonth) : yearRange(bYear);

  const { data: rowsA = [] } = useRangeLeads(rangeA.from, rangeA.to, scopeUserId);
  const { data: rowsB = [] } = useRangeLeads(rangeB.from, rangeB.to, scopeUserId);

  const aBySource = useMemo(() => aggregateBySource(rowsA), [rowsA]);
  const bBySource = useMemo(() => aggregateBySource(rowsB), [rowsB]);

  const labelA = kind === "month" ? `${MONTHS_ES[aMonth]} ${aYear}` : `${aYear}`;
  const labelB = kind === "month" ? `${MONTHS_ES[bMonth]} ${bYear}` : `${bYear}`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Vista comparativa</CardTitle>
          <Select value={kind} onValueChange={(v) => setKind(v as PeriodKind)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Por mes</SelectItem>
              <SelectItem value="year">Por año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Periodo A (actual)</Label>
            <div className="flex gap-2">
              {kind === "month" && (
                <Select value={String(aMonth)} onValueChange={(v) => setAMonth(Number(v))}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS_ES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Input type="number" value={aYear} onChange={(e) => setAYear(Number(e.target.value) || now.getFullYear())} className="w-28" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Periodo B (anterior)</Label>
            <div className="flex gap-2">
              {kind === "month" && (
                <Select value={String(bMonth)} onValueChange={(v) => setBMonth(Number(v))}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS_ES.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Input type="number" value={bYear} onChange={(e) => setBYear(Number(e.target.value) || now.getFullYear())} className="w-28" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2 sticky left-0 bg-muted/40 z-10">Fuente</th>
                <th className="text-right px-3 py-2">A · {labelA}</th>
                <th className="text-right px-3 py-2">B · {labelB}</th>
                <th className="text-right px-3 py-2">Δ Absoluta</th>
                <th className="text-right px-3 py-2">Δ %</th>
              </tr>
            </thead>
            <tbody>
              {LEAD_SOURCES.map((s) => {
                const a = aBySource.find((r) => r.source === s.value)?.pedidos_insertados ?? 0;
                const b = bBySource.find((r) => r.source === s.value)?.pedidos_insertados ?? 0;
                const diff = a - b;
                const pct = b === 0 ? (a === 0 ? 0 : 100) : (diff / b) * 100;
                const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
                const colorCls = diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground";
                return (
                  <tr key={s.value} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-1.5 font-medium sticky left-0 bg-card z-10">{s.label}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{a}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{b}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${colorCls}`}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Icon className="w-3.5 h-3.5" />
                        {diff > 0 ? "+" : ""}{diff}
                      </span>
                    </td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${colorCls}`}>
                      {b === 0 && a === 0 ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- ASESORES (advisor daily sheet) ----------
function AsesoresDaily({ scopeUserId }: { scopeUserId: ScopeUserId }) {

  const { toast } = useToast();
  const { user } = useAuth();
  const { data: tenantUsers = [] } = useTenantUsers(true);
  const [date, setDate] = useState<string>(todayStr());
  const isViewingOther =
    scopeUserId === "all" || (!!scopeUserId && scopeUserId !== user?.id);
  const { data: sheetData, isLoading } = useAdvisorSheet(date, scopeUserId);
  const upsert = useUpsertAdvisorSheet();

  const [sheet, setSheet] = useState<AdvisorSheet>(emptyAdvisorSheet());
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (sheetData) {
      setSheet(sheetData);
      setDirty(false);
    }
  }, [sheetData]);

  const advisorName = useMemo(() => {
    if (scopeUserId === "all") return "Todos los asesores";
    const targetId = scopeUserId && scopeUserId !== "all" ? scopeUserId : user?.id;
    const match = tenantUsers.find((u) => u.user_id === targetId);
    if (match) return match.name;
    return (user?.user_metadata as any)?.full_name || user?.email || "Asesor";
  }, [scopeUserId, tenantUsers, user]);

  const updateZone = (idx: number, key: keyof ZoneRow, val: string | number) => {
    setSheet((s) => ({
      ...s,
      zone_rows: s.zone_rows.map((r, i) => (i === idx ? { ...r, [key]: val } : r)),
    }));
    setDirty(true);
  };
  const updateMarketing = (source: string, key: keyof Omit<MarketingRow, "source">, val: number) => {
    setSheet((s) => ({
      ...s,
      marketing_rows: s.marketing_rows.map((r) =>
        r.source === source ? { ...r, [key]: val } : r
      ),
    }));
    setDirty(true);
  };
  const updateCalls = (source: string, key: keyof Omit<CallsRow, "source">, val: number) => {
    setSheet((s) => ({
      ...s,
      calls_rows: s.calls_rows.map((r) =>
        r.source === source ? { ...r, [key]: val } : r
      ),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({ date, sheet });
      toast({ title: "Ficha guardada", description: `Datos del ${date} actualizados.` });
      setDirty(false);
    } catch (err: any) {
      toast({
        title: "Error al guardar",
        description: err?.message ?? "No se pudo guardar la ficha.",
        variant: "destructive",
      });
    }
  };

  const todayHuman = new Date(date + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <CardTitle>Ficha de control diario</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{advisorName}</span>
              <span className="mx-2">·</span>
              <span className="capitalize">{todayHuman}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="as-date" className="text-sm">Fecha</Label>
            <Input
              id="as-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
            <Button onClick={handleSave} disabled={upsert.isPending || !dirty || isViewingOther} title={isViewingOther ? "Viendo datos de otro usuario (solo lectura)" : ""}>
              {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar ficha
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
        </div>
      ) : (
        <>
          {/* Tabla 1: Zona */}
          <Card>
            <CardHeader><CardTitle>Zona</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {ZONE_COLUMNS.map((c) => (
                        <th key={c.key} className="text-left font-medium px-2 py-2 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: ZONE_ROW_COUNT }, (_, i) => (
                      <tr key={i} className="border-t border-border hover:bg-muted/20">
                        {ZONE_COLUMNS.map((c) => (
                          <td key={c.key} className="px-1 py-1">
                            <Input
                              type={c.type}
                              min={c.type === "number" ? 0 : undefined}
                              disabled={isViewingOther}
                              value={(sheet.zone_rows[i]?.[c.key] ?? (c.type === "number" ? 0 : "")) as any}
                              onChange={(e) =>
                                updateZone(
                                  i,
                                  c.key as keyof ZoneRow,
                                  c.type === "number" ? Number(e.target.value) || 0 : e.target.value
                                )
                              }
                              className={c.type === "number" ? "h-8 w-24 text-right" : "h-8 min-w-[140px]"}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tabla 2: Marketing */}
          <Card>
            <CardHeader><CardTitle>Marketing</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left font-medium px-3 py-2 sticky left-0 bg-muted/40 z-10 min-w-[140px]">
                        Fuente
                      </th>
                      {MARKETING_COLUMNS.map((c) => (
                        <th key={c.key} className="text-left font-medium px-2 py-2 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.marketing_rows.map((row) => (
                      <tr key={row.source} className="border-t border-border hover:bg-muted/20">
                        <td className="px-3 py-1.5 font-medium sticky left-0 bg-card z-10">
                          {MARKETING_SOURCES.find((s) => s.value === row.source)?.label}
                        </td>
                        {MARKETING_COLUMNS.map((c) => (
                          <td key={c.key} className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              disabled={isViewingOther}
                              value={(row as any)[c.key] ?? 0}
                              onChange={(e) =>
                                updateMarketing(
                                  row.source,
                                  c.key as keyof Omit<MarketingRow, "source">,
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8 w-20 text-right"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tabla 3: Llamadas */}
          <Card>
            <CardHeader><CardTitle>Llamadas</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left font-medium px-3 py-2 sticky left-0 bg-muted/40 z-10 min-w-[140px]">
                        Fuente
                      </th>
                      {CALLS_COLUMNS.map((c) => (
                        <th key={c.key} className="text-left font-medium px-2 py-2 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.calls_rows.map((row) => (
                      <tr key={row.source} className="border-t border-border hover:bg-muted/20">
                        <td className="px-3 py-1.5 font-medium sticky left-0 bg-card z-10">
                          {CALLS_SOURCES.find((s) => s.value === row.source)?.label}
                        </td>
                        {CALLS_COLUMNS.map((c) => (
                          <td key={c.key} className="px-1 py-1">
                            <Input
                              type="number"
                              min={0}
                              disabled={isViewingOther}
                              value={(row as any)[c.key] ?? 0}
                              onChange={(e) =>
                                updateCalls(
                                  row.source,
                                  c.key as keyof Omit<CallsRow, "source">,
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8 w-20 text-right"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------- PAGE ----------
export default function ControlLeads() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useUserRole();
  const canSeeAll = isAdmin || isSuperAdmin;
  const [scopeUserId, setScopeUserId] = useState<ScopeUserId>(undefined);
  const { data: tenantUsers = [] } = useTenantUsers(canSeeAll);
  const { subSection } = useParams<{ subSection?: string }>();
  const isAsesores = subSection === "asesores";

  // Resolve effective scope: admin keeps the dropdown choice; non-admin always sees own.
  const effectiveScope: ScopeUserId = canSeeAll ? scopeUserId : undefined;
  const selectValue = scopeUserId ?? "self";

  // Redirect bare /control-leads to coordinadoras subsection
  if (!subSection) {
    return <Navigate to="/control-leads/coordinadoras" replace />;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Control de leads · {isAsesores ? "Asesores" : "Coordinadoras"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAsesores
                ? "Ficha de control diario del asesor con zona, marketing y llamadas."
                : "Tracker diario de leads por fuente de origen con vistas agregadas y comparativas."}
            </p>
          </div>
          {canSeeAll && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="cl-user-scope" className="text-sm whitespace-nowrap">
                Ver datos de
              </Label>
              <Select
                value={selectValue}
                onValueChange={(v) => setScopeUserId(v === "self" ? undefined : (v as ScopeUserId))}
              >
                <SelectTrigger id="cl-user-scope" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Mis datos</SelectItem>
                  <SelectItem value="all">Total del equipo</SelectItem>
                  {tenantUsers
                    .filter((u) => u.user_id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isAsesores ? (
          <AsesoresView scopeUserId={effectiveScope} />
        ) : (
          <Tabs defaultValue="daily" className="w-full">
            <TabsList>
              <TabsTrigger value="daily">Diario</TabsTrigger>
              <TabsTrigger value="monthly">Mensual</TabsTrigger>
              <TabsTrigger value="yearly">Anual</TabsTrigger>
              <TabsTrigger value="compare">Comparativa</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="mt-6"><DailyView scopeUserId={effectiveScope} /></TabsContent>
            <TabsContent value="monthly" className="mt-6"><MonthlyView scopeUserId={effectiveScope} /></TabsContent>
            <TabsContent value="yearly" className="mt-6"><YearlyView scopeUserId={effectiveScope} /></TabsContent>
            <TabsContent value="compare" className="mt-6"><ComparativeView scopeUserId={effectiveScope} /></TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}


