import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import {
  DISTRITOS_MALAGA,
  MUNICIPIOS_PROVINCIA,
  getZoneName,
} from "@/data/malagaZones";

interface PropertyZoneSelectorProps {
  value: string; // single zone ID like "barrio:huelin" or "municipio:mun-marbella"
  onChange: (zoneId: string) => void;
}

export function PropertyZoneSelector({ value, onChange }: PropertyZoneSelectorProps) {
  const [openDistricts, setOpenDistricts] = useState<Set<string>>(new Set());

  const toggleDistrict = (districtId: string) => {
    setOpenDistricts(prev => {
      const next = new Set(prev);
      if (next.has(districtId)) next.delete(districtId);
      else next.add(districtId);
      return next;
    });
  };

  const displayName = value ? getZoneName(value) : "Sin seleccionar";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Barrio / Zona</span>
        {value && (
          <Badge variant="secondary" className="text-[9px]">{displayName}</Badge>
        )}
      </div>

      <div className="max-h-[200px] overflow-y-auto rounded-md border border-border p-2 space-y-1 bg-background">
        {/* Clear selection */}
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground pb-1 border-b border-border mb-1">
          <Checkbox
            checked={!value}
            onCheckedChange={() => onChange("")}
            className="h-3.5 w-3.5"
          />
          Sin seleccionar
        </label>

        {/* Distritos */}
        {DISTRITOS_MALAGA.map(distrito => {
          const isOpen = openDistricts.has(distrito.id);
          return (
            <div key={distrito.id}>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary w-full text-left"
                onClick={() => toggleDistrict(distrito.id)}
              >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {distrito.name}
              </button>
              {isOpen && (
                <div className="ml-5 mt-1 mb-1 space-y-0.5">
                  {distrito.barrios.map(barrio => {
                    const zoneId = `barrio:${barrio.id}`;
                    return (
                      <label key={barrio.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                        <Checkbox
                          checked={value === zoneId}
                          onCheckedChange={() => onChange(zoneId)}
                          className="h-3.5 w-3.5"
                        />
                        {barrio.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Municipios */}
        <div className="border-t border-border pt-1.5 mt-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Provincia</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {MUNICIPIOS_PROVINCIA.map(mun => {
              const zoneId = `municipio:${mun.id}`;
              return (
                <label key={mun.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                  <Checkbox
                    checked={value === zoneId}
                    onCheckedChange={() => onChange(zoneId)}
                    className="h-3.5 w-3.5"
                  />
                  {mun.name}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
