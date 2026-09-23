import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  GLOBAL_COLUMNS,
  LEAD_COLUMNS,
  LEAD_SOURCES,
  type DailyLeadRowWithDate,
  type DailyGlobalRow,
} from "@/hooks/useControlLeads";
import {
  CALLS_COLUMNS,
  CALLS_SOURCES,
  MARKETING_COLUMNS,
  MARKETING_SOURCES,
  aggregateCalls,
  aggregateMarketing,
  type AdvisorSheetWithDate,
} from "@/hooks/useAdvisorSheet";

interface Props {
  leads: DailyLeadRowWithDate[];
  globals: Array<DailyGlobalRow & { date: string; user_id?: string }>;
  advisorSheets: AdvisorSheetWithDate[];
  userName: (id: string) => string;
}

const sourceLabel = (value: string) =>
  LEAD_SOURCES.find((s) => s.value === value)?.label || value;

const LeadsStatsSection = ({ leads, globals, advisorSheets, userName }: Props) => {
  const byUser = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    leads.forEach((r) => {
      const uid = r.user_id || "sin-usuario";
      if (!map.has(uid)) map.set(uid, Object.fromEntries(LEAD_COLUMNS.map((c) => [c.key, 0])));
      const cur = map.get(uid)!;
      LEAD_COLUMNS.forEach((c) => {
        cur[c.key] += Number((r as any)[c.key] ?? 0);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total_pedidos - a[1].total_pedidos);
  }, [leads]);

  const bySource = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    leads.forEach((r) => {
      if (!map.has(r.source)) map.set(r.source, Object.fromEntries(LEAD_COLUMNS.map((c) => [c.key, 0])));
      const cur = map.get(r.source)!;
      LEAD_COLUMNS.forEach((c) => {
        cur[c.key] += Number((r as any)[c.key] ?? 0);
      });
    });
    return Array.from(map.entries())
      .filter(([, v]) => LEAD_COLUMNS.some((c) => v[c.key] > 0))
      .sort((a, b) => b[1].total_pedidos - a[1].total_pedidos);
  }, [leads]);

  const globalTotals = useMemo(() => {
    const acc: Record<string, number> = Object.fromEntries(GLOBAL_COLUMNS.map((c) => [c.key, 0]));
    globals.forEach((g) => {
      GLOBAL_COLUMNS.forEach((c) => {
        acc[c.key] += Number((g as any)[c.key] ?? 0);
      });
    });
    return acc;
  }, [globals]);

  const marketing = useMemo(() => aggregateMarketing(advisorSheets), [advisorSheets]);
  const calls = useMemo(() => aggregateCalls(advisorSheets), [advisorSheets]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Leads por empleado</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                {LEAD_COLUMNS.map((c) => <TableHead key={c.key} className="text-right whitespace-nowrap">{c.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {byUser.length === 0 && (
                <TableRow><TableCell colSpan={LEAD_COLUMNS.length + 1} className="text-center text-sm text-muted-foreground py-8">Sin datos en el periodo seleccionado.</TableCell></TableRow>
              )}
              {byUser.map(([uid, v]) => (
                <TableRow key={uid}>
                  <TableCell className="font-medium whitespace-nowrap">{userName(uid)}</TableCell>
                  {LEAD_COLUMNS.map((c) => <TableCell key={c.key} className="text-right">{v[c.key]}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Leads por origen</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origen</TableHead>
                {LEAD_COLUMNS.map((c) => <TableHead key={c.key} className="text-right whitespace-nowrap">{c.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySource.length === 0 && (
                <TableRow><TableCell colSpan={LEAD_COLUMNS.length + 1} className="text-center text-sm text-muted-foreground py-8">Sin datos en el periodo seleccionado.</TableCell></TableRow>
              )}
              {bySource.map(([source, v]) => (
                <TableRow key={source}>
                  <TableCell className="font-medium whitespace-nowrap">{sourceLabel(source)}</TableCell>
                  {LEAD_COLUMNS.map((c) => <TableCell key={c.key} className="text-right">{v[c.key]}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Métricas generales</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {GLOBAL_COLUMNS.map((c) => (
                  <TableRow key={c.key}>
                    <TableCell>{c.label}</TableCell>
                    <TableCell className="text-right font-medium">{globalTotals[c.key]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Marketing</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    {MARKETING_COLUMNS.map((c) => <TableHead key={c.key} className="text-right">{c.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketing.map((r) => (
                    <TableRow key={r.source}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {MARKETING_SOURCES.find((s) => s.value === r.source)?.label || r.source}
                      </TableCell>
                      {MARKETING_COLUMNS.map((c) => <TableCell key={c.key} className="text-right">{(r as any)[c.key] ?? 0}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Llamadas</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origen</TableHead>
                    {CALLS_COLUMNS.map((c) => <TableHead key={c.key} className="text-right">{c.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((r) => (
                    <TableRow key={r.source}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {CALLS_SOURCES.find((s) => s.value === r.source)?.label || r.source}
                      </TableCell>
                      {CALLS_COLUMNS.map((c) => <TableCell key={c.key} className="text-right">{(r as any)[c.key] ?? 0}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadsStatsSection;
