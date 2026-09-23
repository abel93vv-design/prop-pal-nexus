import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList, DoorOpen, PhoneCall, Newspaper } from "lucide-react";
import { useAllZoneSheets, useTenantZoneUsers, ZoneSheet } from "@/hooks/useZoneSheets";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const STATUS_LABELS: Record<string, string> = {
  ocupado: "Ocupado",
  vacio: "Vacío",
  alquilado: "Alquilado",
  en_venta: "En venta",
  vacacional: "Vacacional",
};

interface Agg {
  sheets: number;
  doors: number;
  p: number;
  m: number;
  news: number;
}

const emptyAgg = (): Agg => ({ sheets: 0, doors: 0, p: 0, m: 0, news: 0 });

const accumulate = (agg: Agg, sheet: ZoneSheet) => {
  agg.sheets += 1;
  for (const r of sheet.rows) {
    const empty = !r.floor && !r.name && !r.contact_mode && !r.phone && !r.comment && !r.is_news;
    if (!empty) agg.doors += 1;
    if (r.contact_mode === "P") agg.p += 1;
    if (r.contact_mode === "M") agg.m += 1;
    if (r.is_news || r.property_id) agg.news += 1;
  }
};

const ZoneSheetStats = () => {
  const { data: sheets = [], isLoading } = useAllZoneSheets(true);
  const { data: users = [] } = useTenantZoneUsers(true);
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const userName = useMemo(() => {
    const map = new Map(users.map((u) => [u.user_id, u.full_name || "Sin nombre"]));
    return (id: string) => map.get(id) || "Sin nombre";
  }, [users]);

  const years = useMemo(
    () => Array.from(new Set(sheets.map((s) => s.sheet_date.slice(0, 4)))).sort((a, b) => b.localeCompare(a)),
    [sheets]
  );

  const filtered = useMemo(
    () =>
      sheets.filter(
        (s) =>
          (filterYear === "all" || s.sheet_date.slice(0, 4) === filterYear) &&
          (filterMonth === "all" || s.sheet_date.slice(5, 7) === filterMonth) &&
          (filterUser === "all" || s.user_id === filterUser)
      ),
    [sheets, filterYear, filterMonth, filterUser]
  );

  const totals = useMemo(() => {
    const t = emptyAgg();
    filtered.forEach((s) => accumulate(t, s));
    return t;
  }, [filtered]);

  const byUser = useMemo(() => {
    const map = new Map<string, Agg>();
    filtered.forEach((s) => {
      if (!map.has(s.user_id)) map.set(s.user_id, emptyAgg());
      accumulate(map.get(s.user_id)!, s);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].sheets - a[1].sheets);
  }, [filtered]);

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((s) =>
      s.rows.forEach((r) => {
        if (r.status) counts[r.status] = (counts[r.status] || 0) + 1;
      })
    );
    return Object.entries(STATUS_LABELS).map(([key, label]) => ({ label, count: counts[key] || 0 }));
  }, [filtered]);

  const byStreet = useMemo(() => {
    const map = new Map<string, Agg>();
    filtered.forEach((s) => {
      const key = [s.street, s.portal ? `portal ${s.portal}` : null].filter(Boolean).join(", ") || "Sin calle";
      if (!map.has(key)) map.set(key, emptyAgg());
      accumulate(map.get(key)!, s);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].sheets - a[1].sheets);
  }, [filtered]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const contacted = totals.p + totals.m;
  const contactRate = totals.doors > 0 ? Math.round((contacted / totals.doors) * 100) : 0;

  const kpis = [
    { label: "Hojas realizadas", value: totals.sheets, icon: ClipboardList },
    { label: "Puertas visitadas", value: totals.doors, icon: DoorOpen },
    { label: "Contactados (P+M)", value: contacted, icon: PhoneCall },
    { label: "Noticias", value: totals.news, icon: Newspaper },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setFilterMonth("all"); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Año" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los años</SelectItem>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los meses</SelectItem>
            {MONTH_NAMES.map((m, i) => {
              const val = String(i + 1).padStart(2, "0");
              return <SelectItem key={val} value={val}>{m}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Asesor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los asesores</SelectItem>
            {users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || "Sin nombre"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Por asesor</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asesor</TableHead>
                  <TableHead className="text-right">Hojas</TableHead>
                  <TableHead className="text-right">Puertas</TableHead>
                  <TableHead className="text-right">P</TableHead>
                  <TableHead className="text-right">M</TableHead>
                  <TableHead className="text-right">Noticias</TableHead>
                  <TableHead className="text-right">% contacto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byUser.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Sin datos en el periodo seleccionado.</TableCell></TableRow>
                )}
                {byUser.map(([uid, a]) => (
                  <TableRow key={uid}>
                    <TableCell className="font-medium">{userName(uid)}</TableCell>
                    <TableCell className="text-right">{a.sheets}</TableCell>
                    <TableCell className="text-right">{a.doors}</TableCell>
                    <TableCell className="text-right">{a.p}</TableCell>
                    <TableCell className="text-right">{a.m}</TableCell>
                    <TableCell className="text-right">{a.news}</TableCell>
                    <TableCell className="text-right">{a.doors > 0 ? Math.round(((a.p + a.m) / a.doors) * 100) : 0}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Estado de las viviendas</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Viviendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byStatus.map((s) => (
                  <TableRow key={s.label}>
                    <TableCell>{s.label}</TableCell>
                    <TableCell className="text-right font-medium">{s.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground pt-3">Contacto global del periodo: {contactRate}% de las puertas visitadas.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Por calle</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Calle</TableHead>
                <TableHead className="text-right">Hojas</TableHead>
                <TableHead className="text-right">Puertas</TableHead>
                <TableHead className="text-right">P</TableHead>
                <TableHead className="text-right">M</TableHead>
                <TableHead className="text-right">Noticias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byStreet.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Sin datos en el periodo seleccionado.</TableCell></TableRow>
              )}
              {byStreet.map(([street, a]) => (
                <TableRow key={street}>
                  <TableCell className="font-medium">{street}</TableCell>
                  <TableCell className="text-right">{a.sheets}</TableCell>
                  <TableCell className="text-right">{a.doors}</TableCell>
                  <TableCell className="text-right">{a.p}</TableCell>
                  <TableCell className="text-right">{a.m}</TableCell>
                  <TableCell className="text-right">{a.news}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZoneSheetStats;
