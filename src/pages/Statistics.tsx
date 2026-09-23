import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ClipboardList, DoorOpen, Loader2, Newspaper, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAllZoneSheets, useTenantZoneUsers } from "@/hooks/useZoneSheets";
import { LEAD_COLUMNS, LEAD_SOURCES, GLOBAL_COLUMNS, useRangeGlobals, useRangeLeads } from "@/hooks/useControlLeads";
import { useAdvisorRange } from "@/hooks/useAdvisorSheet";
import { buildRange, PeriodType, toISO } from "@/lib/statsPeriod";
import StatsFilters from "@/components/stats/StatsFilters";
import StatsTrendChart, { TrendPoint } from "@/components/stats/StatsTrendChart";
import ZoneStatsSection from "@/components/stats/ZoneStatsSection";
import LeadsStatsSection from "@/components/stats/LeadsStatsSection";
import { STATUS_LABELS, ZoneAgg, accumulateZone, contactRate, emptyZoneAgg, sheetPlace } from "@/components/stats/zoneAgg";

const StatisticsPage = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [periodType, setPeriodType] = useState<PeriodType>("mes");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [employee, setEmployee] = useState("all");

  const range = useMemo(
    () => buildRange(periodType, anchor, year, customFrom, customTo),
    [periodType, anchor, year, customFrom, customTo]
  );

  const { data: users = [] } = useTenantZoneUsers(true);
  const { data: allSheets = [], isLoading: zoneLoading } = useAllZoneSheets(true);
  const scope = employee === "all" ? "all" : employee;
  const { data: leads = [], isLoading: leadsLoading } = useRangeLeads(range.from, range.to, scope);
  const { data: globals = [] } = useRangeGlobals(range.from, range.to, scope);
  const { data: advisorSheets = [] } = useAdvisorRange(range.from, range.to, scope);

  const userName = useMemo(() => {
    const map = new Map(users.map((u) => [u.user_id, u.full_name || "Sin nombre"]));
    return (id: string) => map.get(id) || "Sin nombre";
  }, [users]);

  const sheets = useMemo(
    () =>
      allSheets.filter(
        (s) =>
          s.sheet_date >= range.from &&
          s.sheet_date <= range.to &&
          (employee === "all" || s.user_id === employee)
      ),
    [allSheets, range.from, range.to, employee]
  );

  const zoneTotals = useMemo(() => {
    const t = emptyZoneAgg();
    sheets.forEach((s) => accumulateZone(t, s));
    return t;
  }, [sheets]);

  const leadTotals = useMemo(() => {
    const acc: Record<string, number> = Object.fromEntries(LEAD_COLUMNS.map((c) => [c.key, 0]));
    leads.forEach((r) => {
      LEAD_COLUMNS.forEach((c) => {
        acc[c.key] += Number((r as any)[c.key] ?? 0);
      });
    });
    return acc;
  }, [leads]);

  const trend: TrendPoint[] = useMemo(() => {
    const days = (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86400000;
    const byMonth = days > 62;
    const map = new Map<string, TrendPoint>();
    const keyOf = (date: string) => (byMonth ? date.slice(0, 7) : date);
    const labelOf = (date: string) =>
      byMonth
        ? format(new Date(date + "T00:00:00"), "MMM yy", { locale: es })
        : format(new Date(date + "T00:00:00"), "d MMM", { locale: es });
    const ensure = (date: string) => {
      const k = keyOf(date);
      if (!map.has(k)) map.set(k, { label: labelOf(date), puertas: 0, pedidos: 0 });
      return map.get(k)!;
    };
    sheets.forEach((s) => {
      const p = ensure(s.sheet_date);
      const agg = emptyZoneAgg();
      accumulateZone(agg, s);
      p.puertas += agg.doors;
    });
    leads.forEach((r) => {
      if (!r.date) return;
      ensure(r.date).pedidos += Number(r.total_pedidos ?? 0);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [sheets, leads, range.from, range.to]);

  const perEmployee = useMemo(() => {
    const zoneMap = new Map<string, ZoneAgg>();
    sheets.forEach((s) => {
      if (!zoneMap.has(s.user_id)) zoneMap.set(s.user_id, emptyZoneAgg());
      accumulateZone(zoneMap.get(s.user_id)!, s);
    });
    const leadMap = new Map<string, Record<string, number>>();
    leads.forEach((r) => {
      const uid = r.user_id || "sin-usuario";
      if (!leadMap.has(uid)) leadMap.set(uid, Object.fromEntries(LEAD_COLUMNS.map((c) => [c.key, 0])));
      const cur = leadMap.get(uid)!;
      LEAD_COLUMNS.forEach((c) => {
        cur[c.key] += Number((r as any)[c.key] ?? 0);
      });
    });
    const ids = Array.from(new Set([...zoneMap.keys(), ...leadMap.keys()]));
    return ids.map((uid) => {
      const z = zoneMap.get(uid) ?? emptyZoneAgg();
      const l = leadMap.get(uid) ?? Object.fromEntries(LEAD_COLUMNS.map((c) => [c.key, 0]));
      return {
        Empleado: userName(uid),
        Hojas: z.sheets,
        Puertas: z.doors,
        P: z.p,
        M: z.m,
        "Noticias zona": z.news,
        "% contacto": contactRate(z),
        ...Object.fromEntries(LEAD_COLUMNS.map((c) => [c.label, l[c.key]])),
      } as Record<string, string | number>;
    });
  }, [sheets, leads, userName]);

  const fileBase = `estadisticas_${range.from}_${range.to}`;

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (perEmployee.length === 0) {
      toast({ title: "Sin datos", description: "No hay datos en el periodo seleccionado.", variant: "destructive" });
      return;
    }
    const headers = Object.keys(perEmployee[0]);
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.join(";"), ...perEmployee.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n");
    download(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), `${fileBase}.csv`);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        perEmployee.length ? perEmployee : [{ Empleado: "Sin datos en el periodo" }]
      ),
      "Resumen"
    );

    const zoneRows = sheets.map((s) => {
      const agg = emptyZoneAgg();
      accumulateZone(agg, s);
      const statuses: Record<string, number> = {};
      s.rows.forEach((r) => {
        if (r.status) statuses[STATUS_LABELS[r.status]] = (statuses[STATUS_LABELS[r.status]] || 0) + 1;
      });
      return {
        Fecha: s.sheet_date,
        Entrada: (s.sheet_time || "").slice(0, 5),
        Salida: (s.exit_time || "").slice(0, 5),
        Empleado: userName(s.user_id),
        Calle: sheetPlace(s),
        Puertas: agg.doors,
        P: agg.p,
        M: agg.m,
        Noticias: agg.news,
        ...Object.fromEntries(Object.values(STATUS_LABELS).map((l) => [l, statuses[l] || 0])),
      };
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(zoneRows.length ? zoneRows : [{ Fecha: "Sin datos en el periodo" }]),
      "Hoja de zona"
    );

    const leadRows = leads.map((r) => ({
      Fecha: r.date,
      Empleado: userName(r.user_id || ""),
      Origen: LEAD_SOURCES.find((s) => s.value === r.source)?.label || r.source,
      ...Object.fromEntries(LEAD_COLUMNS.map((c) => [c.label, Number((r as any)[c.key] ?? 0)])),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(leadRows.length ? leadRows : [{ Fecha: "Sin datos en el periodo" }]),
      "Control de leads"
    );

    const sourceMap = new Map<string, Record<string, number>>();
    leads.forEach((r) => {
      if (!sourceMap.has(r.source)) sourceMap.set(r.source, Object.fromEntries(LEAD_COLUMNS.map((c) => [c.key, 0])));
      const cur = sourceMap.get(r.source)!;
      LEAD_COLUMNS.forEach((c) => {
        cur[c.key] += Number((r as any)[c.key] ?? 0);
      });
    });
    const sourceRows = Array.from(sourceMap.entries()).map(([source, v]) => ({
      Origen: LEAD_SOURCES.find((s) => s.value === source)?.label || source,
      ...Object.fromEntries(LEAD_COLUMNS.map((c) => [c.label, v[c.key]])),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(sourceRows.length ? sourceRows : [{ Origen: "Sin datos en el periodo" }]),
      "Por origen"
    );

    const globalTotals: Record<string, number> = Object.fromEntries(GLOBAL_COLUMNS.map((c) => [c.key, 0]));
    globals.forEach((g) => {
      GLOBAL_COLUMNS.forEach((c) => {
        globalTotals[c.key] += Number((g as any)[c.key] ?? 0);
      });
    });
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(GLOBAL_COLUMNS.map((c) => ({ Concepto: c.label, Total: globalTotals[c.key] }))),
      "Metricas generales"
    );

    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    download(new Blob([out], { type: "application/octet-stream" }), `${fileBase}.xlsx`);
  };

  if (!roleLoading && !isAdmin) return <Navigate to="/" replace />;

  const kpis = [
    { label: "Hojas de zona", value: zoneTotals.sheets, icon: ClipboardList },
    { label: "Puertas visitadas", value: zoneTotals.doors, icon: DoorOpen },
    { label: "Contactados (P+M)", value: zoneTotals.p + zoneTotals.m, icon: PhoneCall },
    { label: "Noticias", value: zoneTotals.news, icon: Newspaper },
    { label: "Pedidos", value: leadTotals.total_pedidos ?? 0, icon: BarChart3 },
    { label: "Pedidos llamados", value: leadTotals.pedidos_llamados ?? 0, icon: PhoneCall },
    { label: "Contactados leads", value: leadTotals.pedidos_llamados_contactados ?? 0, icon: PhoneCall },
    { label: "NE firmadas", value: leadTotals.ne ?? 0, icon: ClipboardList },
  ];

  const loading = roleLoading || zoneLoading || leadsLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Estadísticas
          </h1>
          <p className="text-sm text-muted-foreground">Hoja de zona y control de leads por empleado y periodo.</p>
        </div>

        <StatsFilters
          periodType={periodType}
          onPeriodType={setPeriodType}
          anchor={anchor}
          onAnchor={setAnchor}
          year={year}
          onYear={setYear}
          customFrom={customFrom || toISO(anchor)}
          onCustomFrom={setCustomFrom}
          customTo={customTo || toISO(anchor)}
          onCustomTo={setCustomTo}
          employee={employee}
          onEmployee={setEmployee}
          users={users}
          rangeLabel={range.label}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
        />

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((k) => (
                <Card key={k.label}>
                  <CardContent className="pt-5 flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <k.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{k.value}</p>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <StatsTrendChart data={trend} />

            <Tabs defaultValue="zona">
              <TabsList>
                <TabsTrigger value="zona">Hoja de zona</TabsTrigger>
                <TabsTrigger value="leads">Control de leads</TabsTrigger>
              </TabsList>
              <TabsContent value="zona" className="mt-6">
                <ZoneStatsSection sheets={sheets} userName={userName} />
              </TabsContent>
              <TabsContent value="leads" className="mt-6">
                <LeadsStatsSection
                  leads={leads}
                  globals={globals}
                  advisorSheets={advisorSheets}
                  userName={userName}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default StatisticsPage;
