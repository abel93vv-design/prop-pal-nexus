import type { ZoneSheet } from "@/hooks/useZoneSheets";

export const STATUS_LABELS: Record<string, string> = {
  ocupado: "Ocupado",
  vacio: "Vacío",
  alquilado: "Alquilado",
  en_venta: "En venta",
  vacacional: "Vacacional",
};

export interface ZoneAgg {
  sheets: number;
  doors: number;
  p: number;
  m: number;
  news: number;
}

export const emptyZoneAgg = (): ZoneAgg => ({ sheets: 0, doors: 0, p: 0, m: 0, news: 0 });

export const accumulateZone = (agg: ZoneAgg, sheet: ZoneSheet) => {
  agg.sheets += 1;
  for (const r of sheet.rows) {
    const empty = !r.floor && !r.name && !r.contact_mode && !r.phone && !r.comment && !r.is_news;
    if (!empty) agg.doors += 1;
    if (r.contact_mode === "P") agg.p += 1;
    if (r.contact_mode === "M") agg.m += 1;
    if (r.is_news || r.property_id) agg.news += 1;
  }
};

export const contactRate = (a: ZoneAgg) => (a.doors > 0 ? Math.round((a.m / a.doors) * 100) : 0);

export const sheetPlace = (s: ZoneSheet) =>
  [s.street, s.portal ? `portal ${s.portal}` : null].filter(Boolean).join(", ") || "Sin calle";
