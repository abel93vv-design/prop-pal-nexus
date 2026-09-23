import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ZoneSheet } from "@/hooks/useZoneSheets";
import { STATUS_LABELS, ZoneAgg, accumulateZone, contactRate, emptyZoneAgg, sheetPlace } from "./zoneAgg";

interface Props {
  sheets: ZoneSheet[];
  userName: (id: string) => string;
}

const ZoneStatsSection = ({ sheets, userName }: Props) => {
  const byUser = useMemo(() => {
    const map = new Map<string, ZoneAgg>();
    sheets.forEach((s) => {
      if (!map.has(s.user_id)) map.set(s.user_id, emptyZoneAgg());
      accumulateZone(map.get(s.user_id)!, s);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].sheets - a[1].sheets);
  }, [sheets]);

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    sheets.forEach((s) =>
      s.rows.forEach((r) => {
        if (r.status) counts[r.status] = (counts[r.status] || 0) + 1;
      })
    );
    return Object.entries(STATUS_LABELS).map(([key, label]) => ({ label, count: counts[key] || 0 }));
  }, [sheets]);

  const byStreet = useMemo(() => {
    const map = new Map<string, ZoneAgg>();
    sheets.forEach((s) => {
      const key = sheetPlace(s);
      if (!map.has(key)) map.set(key, emptyZoneAgg());
      accumulateZone(map.get(key)!, s);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].sheets - a[1].sheets);
  }, [sheets]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Hoja de zona por empleado</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
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
                    <TableCell className="text-right">{contactRate(a)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Estado de las viviendas</CardTitle></CardHeader>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Por calle</CardTitle></CardHeader>
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

export default ZoneStatsSection;
