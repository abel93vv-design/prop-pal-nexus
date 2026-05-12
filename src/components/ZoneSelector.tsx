import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MapPin, Globe } from "lucide-react";
import {
  DISTRITOS_MALAGA,
  MUNICIPIOS_PROVINCIA,
  getAllMalagaZones,
  getDistrictZones,
  getZoneName,
} from "@/data/malagaZones";

interface ZoneSelectorProps {
  selectedZones: string[];
  onChange: (zones: string[]) => void;
}

export function ZoneSelector({ selectedZones, onChange }: ZoneSelectorProps) {
  const [openDistricts, setOpenDistricts] = useState<Set<string>>(new Set());

  const toggleDistrict = (districtId: string) => {
    setOpenDistricts(prev => {
      const next = new Set(prev);
      if (next.has(districtId)) next.delete(districtId);
      else next.add(districtId);
      return next;
    });
  };

  const isAllMalaga = () => {
    const all = getAllMalagaZones();
    return all.every(z => selectedZones.includes(z));
  };

  const toggleAllMalaga = () => {
    if (isAllMalaga()) {
      onChange([]);
    } else {
      onChange(getAllMalagaZones());
    }
  };

  const isDistrictFullySelected = (districtId: string) => {
    const zones = getDistrictZones(districtId);
    return zones.every(z => selectedZones.includes(z));
  };

  const isDistrictPartiallySelected = (districtId: string) => {
    const zones = getDistrictZones(districtId);
    return zones.some(z => selectedZones.includes(z)) && !isDistrictFullySelected(districtId);
  };

  const toggleFullDistrict = (districtId: string) => {
    const zones = getDistrictZones(districtId);
    if (isDistrictFullySelected(districtId)) {
      onChange(selectedZones.filter(z => !zones.includes(z)));
    } else {
      const newZones = new Set([...selectedZones, ...zones]);
      onChange(Array.from(newZones));
    }
  };

  const toggleZone = (zoneId: string) => {
    if (selectedZones.includes(zoneId)) {
      onChange(selectedZones.filter(z => z !== zoneId));
    } else {
      onChange([...selectedZones, zoneId]);
    }
  };

  const selectedCount = selectedZones.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Zonas de interés</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-[9px]">{selectedCount} seleccionadas</Badge>
          )}
        </div>
        <Button
          variant={isAllMalaga() ? "default" : "outline"}
          size="sm"
          className="h-6 text-[10px] gap-1"
          onClick={toggleAllMalaga}
        >
          <Globe className="w-3 h-3" />
          Toda Málaga
        </Button>
      </div>

      <div className="max-h-[240px] overflow-y-auto rounded-md border border-border p-2 space-y-1 bg-background">
        {/* Distritos */}
        {DISTRITOS_MALAGA.map(distrito => {
          const isOpen = openDistricts.has(distrito.id);
          const full = isDistrictFullySelected(distrito.id);
          const partial = isDistrictPartiallySelected(distrito.id);

          return (
            <div key={distrito.id}>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  checked={full}
                  className={partial ? "data-[state=unchecked]:bg-primary/30" : ""}
                  onCheckedChange={() => toggleFullDistrict(distrito.id)}
                />
                <button
                  className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-primary flex-1 text-left"
                  onClick={() => toggleDistrict(distrito.id)}
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {distrito.name}
                  {full && <Badge variant="outline" className="text-[8px] ml-1 text-success border-success/30">Todo</Badge>}
                </button>
              </div>
              {isOpen && (
                <div className="ml-6 mt-1 mb-1 space-y-0.5">
                  {distrito.barrios.map(barrio => (
                    <label key={barrio.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                      <Checkbox
                        checked={selectedZones.includes(`barrio:${barrio.id}`)}
                        onCheckedChange={() => toggleZone(`barrio:${barrio.id}`)}
                        className="h-3.5 w-3.5"
                      />
                      {barrio.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Municipios separador agrupado */}
        <div className="border-t border-border pt-1.5 mt-1.5 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Provincia de Málaga</p>
          {Array.from(new Set(MUNICIPIOS_PROVINCIA.map(m => m.group || "Otros"))).map(group => (
            <div key={group}>
              <p className="text-[10px] font-medium text-foreground mb-0.5">{group}</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 ml-1">
                {MUNICIPIOS_PROVINCIA.filter(m => (m.group || "Otros") === group).map(mun => (
                  <label key={mun.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
                    <Checkbox
                      checked={selectedZones.includes(`municipio:${mun.id}`)}
                      onCheckedChange={() => toggleZone(`municipio:${mun.id}`)}
                      className="h-3.5 w-3.5"
                    />
                    {mun.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
