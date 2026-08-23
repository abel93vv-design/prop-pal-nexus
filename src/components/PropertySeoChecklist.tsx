import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface SeoItem {
  key: string;
  label: string;
  ok: boolean;
}

function buildChecklist(property: any): SeoItem[] {
  const photos: string[] = property.photos || [];
  const extras = [
    property.has_elevator, property.has_terrace, property.has_pool,
    property.has_garage, property.has_air_conditioning,
  ].filter(Boolean).length;

  return [
    { key: "title", label: "Título descriptivo (mín. 20 caracteres)", ok: (property.title || "").trim().length >= 20 },
    { key: "description", label: "Descripción completa (mín. 100 caracteres)", ok: (property.description || "").trim().length >= 100 },
    { key: "photos", label: "Al menos 4 fotos", ok: photos.length >= 4 },
    { key: "price", label: "Precio definido", ok: (property.price || 0) > 0 || (property.monthly_rent || 0) > 0 },
    { key: "postal_code", label: "Código postal", ok: !!(property.postal_code || "").trim() },
    { key: "built_surface", label: "Superficie construida", ok: (property.built_surface || 0) > 0 },
    { key: "energy_cert", label: "Certificado energético real (no «en trámite»)", ok: !!property.energy_cert && property.energy_cert !== "en_tramite" },
    { key: "neighborhood", label: "Zona / barrio asignado", ok: !!(property.neighborhood || "").trim() },
    { key: "coords", label: "Coordenadas GPS", ok: property.latitude != null && property.longitude != null },
    { key: "extras", label: "Al menos 2 extras marcados", ok: extras >= 2 },
  ];
}

export function PropertySeoChecklist({ property }: { property: any }) {
  const items = buildChecklist(property);
  const done = items.filter(i => i.ok).length;
  const pct = Math.round((done / items.length) * 100);

  const barColor = pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive";
  const textColor = pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Calidad del anuncio (SEO)
        </p>
        <span className={`text-xs font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1">
        {items.map(item => (
          <li key={item.key} className="flex items-center gap-1.5 text-xs">
            {item.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>
      {pct < 80 && (
        <p className="text-[10px] text-muted-foreground pt-1">
          Los portales posicionan mejor los anuncios completos. Completa los puntos pendientes para mejorar la visibilidad.
        </p>
      )}
    </div>
  );
}
