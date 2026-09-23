import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PERIOD_OPTIONS, PeriodType } from "@/lib/statsPeriod";

interface Props {
  periodType: PeriodType;
  onPeriodType: (v: PeriodType) => void;
  anchor: Date;
  onAnchor: (d: Date) => void;
  year: number;
  onYear: (y: number) => void;
  customFrom: string;
  onCustomFrom: (v: string) => void;
  customTo: string;
  onCustomTo: (v: string) => void;
  employee: string;
  onEmployee: (v: string) => void;
  users: { user_id: string; full_name: string | null }[];
  rangeLabel: string;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

const anchorLabelMap: Record<string, string> = {
  semana: "Semana del",
  quincena: "Quincena de",
  mes: "Mes de",
};

const StatsFilters = ({
  periodType,
  onPeriodType,
  anchor,
  onAnchor,
  year,
  onYear,
  customFrom,
  onCustomFrom,
  customTo,
  onCustomTo,
  employee,
  onEmployee,
  users,
  rangeLabel,
  onExportCsv,
  onExportExcel,
  onExportPdf,
}: Props) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Periodo</Label>
            <Select value={periodType} onValueChange={(v) => onPeriodType(v as PeriodType)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(periodType === "semana" || periodType === "quincena" || periodType === "mes") && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{anchorLabelMap[periodType]}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(anchor, "d 'de' MMMM yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={anchor}
                    onSelect={(d) => d && onAnchor(d)}
                    initialFocus
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {periodType === "anio" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Año</Label>
              <Select value={String(year)} onValueChange={(v) => onYear(Number(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {periodType === "personalizado" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input type="date" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} className="w-[170px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input type="date" value={customTo} onChange={(e) => onCustomTo(e.target.value)} className="w-[170px]" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Empleado</Label>
            <Select value={employee} onValueChange={onEmployee}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || "Sin nombre"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onExportPdf}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button size="sm" onClick={onExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Datos del periodo: <span className="font-medium text-foreground">{rangeLabel}</span></p>
      </CardContent>
    </Card>
  );
};

export default StatsFilters;
