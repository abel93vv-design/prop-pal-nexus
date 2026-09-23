import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

export type PeriodType = "semana" | "quincena" | "mes" | "anio" | "personalizado";

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: "semana", label: "Semana" },
  { value: "quincena", label: "Quincena" },
  { value: "mes", label: "Mes" },
  { value: "anio", label: "Año" },
  { value: "personalizado", label: "Periodo personalizado" },
];

export const toISO = (d: Date) => format(d, "yyyy-MM-dd");

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

const pretty = (iso: string) => format(new Date(iso + "T00:00:00"), "d MMM yyyy", { locale: es });

export function buildRange(
  type: PeriodType,
  anchor: Date,
  year: number,
  customFrom: string,
  customTo: string
): DateRange {
  let from: string;
  let to: string;

  switch (type) {
    case "semana":
      from = toISO(startOfWeek(anchor, { weekStartsOn: 1 }));
      to = toISO(endOfWeek(anchor, { weekStartsOn: 1 }));
      break;
    case "quincena": {
      const day = anchor.getDate();
      const first = startOfMonth(anchor);
      const last = endOfMonth(anchor);
      if (day <= 15) {
        from = toISO(first);
        to = toISO(new Date(anchor.getFullYear(), anchor.getMonth(), 15));
      } else {
        from = toISO(new Date(anchor.getFullYear(), anchor.getMonth(), 16));
        to = toISO(last);
      }
      break;
    }
    case "mes":
      from = toISO(startOfMonth(anchor));
      to = toISO(endOfMonth(anchor));
      break;
    case "anio": {
      const base = new Date(year, 0, 1);
      from = toISO(startOfYear(base));
      to = toISO(endOfYear(base));
      break;
    }
    default: {
      const a = customFrom || toISO(startOfMonth(anchor));
      const b = customTo || toISO(endOfMonth(anchor));
      from = a <= b ? a : b;
      to = a <= b ? b : a;
    }
  }

  return { from, to, label: `${pretty(from)} – ${pretty(to)}` };
}
