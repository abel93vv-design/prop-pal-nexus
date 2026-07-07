import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoneSelector } from "@/components/ZoneSelector";
import { Agency } from "@/types/crm";

export type AdvFilters = {
  types: string[];
  operations: string[];
  leadStatuses: string[];
  sources: string[];
  agencyIds: string[];
  categories: string[];
  lastContactFrom: string;
  lastContactTo: string;
  minContacts: string;
  maxContacts: string;
  onlyUncontacted: boolean;
  financing: 'any' | 'contado' | 'necesita' | 'preaprobada';
  minCash: string; maxCash: string;
  minIncome: string; maxIncome: string;
  minPrice: string; maxPrice: string;
  minSurface: string; maxSurface: string;
  minBedrooms: string; minBathrooms: string;
  preferredTypes: string[];
  selectedZones: string[];
  requiredExtras: string[];
  registeredFrom: string; registeredTo: string;
};

export const emptyAdvFilters: AdvFilters = {
  types: [], operations: [], leadStatuses: [], sources: [], agencyIds: [], categories: [],
  lastContactFrom: '', lastContactTo: '', minContacts: '', maxContacts: '', onlyUncontacted: false,
  financing: 'any', minCash: '', maxCash: '', minIncome: '', maxIncome: '',
  minPrice: '', maxPrice: '', minSurface: '', maxSurface: '',
  minBedrooms: '', minBathrooms: '', preferredTypes: [], selectedZones: [], requiredExtras: [],
  registeredFrom: '', registeredTo: '',
};

export const countActiveFilters = (f: AdvFilters): number => {
  let n = 0;
  (['types','operations','leadStatuses','sources','agencyIds','categories','preferredTypes','selectedZones','requiredExtras'] as const)
    .forEach(k => { if ((f[k] as string[]).length) n++; });
  (['lastContactFrom','lastContactTo','minContacts','maxContacts','minCash','maxCash','minIncome','maxIncome','minPrice','maxPrice','minSurface','maxSurface','minBedrooms','minBathrooms','registeredFrom','registeredTo'] as const)
    .forEach(k => { if (f[k]) n++; });
  if (f.onlyUncontacted) n++;
  if (f.financing !== 'any') n++;
  return n;
};

const TYPE_LABELS: Record<string, string> = { comprador: 'Comprador', vendedor: 'Vendedor', arrendador: 'Arrendador', arrendatario: 'Arrendatario' };
const OP_LABELS: Record<string, string> = { compra: 'Compra', alquiler: 'Alquiler', venta: 'Venta', ambos: 'Ambos' };
const LEAD_LABELS: Record<string, string> = { nuevo: 'Nuevo', contactado: 'Contactado', en_negociacion: 'En negociación', cerrado: 'Cerrado', inactivo: 'Inactivo' };
const SOURCES = [
  'fotocasa','idealista','milanuncios','habitaclia','oficina','web','redes_sociales',
  'whatsapp','telegram','escaparate','wallapop','publicidad_zona','referido','otros'
];
const SOURCE_LABELS: Record<string, string> = {
  fotocasa: 'Fotocasa', idealista: 'Idealista', milanuncios: 'Milanuncios', habitaclia: 'Habitaclia',
  oficina: 'Oficina', web: 'Web', redes_sociales: 'Redes sociales', whatsapp: 'WhatsApp',
  telegram: 'Telegram', escaparate: 'Escaparate', wallapop: 'Wallapop',
  publicidad_zona: 'Publicidad zona', referido: 'Referido', otros: 'Otros',
};
const PROP_TYPES = ['piso','casa','local','terreno','parking'];
const EXTRAS = ['ascensor','terraza','piscina','garaje','aire_acondicionado','acepta_mascotas'];
const EXTRA_LABELS: Record<string,string> = {
  ascensor: 'Ascensor', terraza: 'Terraza', piscina: 'Piscina',
  garaje: 'Garaje', aire_acondicionado: 'Aire acondicionado', acepta_mascotas: 'Acepta mascotas',
};

function ChipGroup({ options, value, onChange, labels }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; labels?: Record<string,string>;
}) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}
          >
            {labels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  filters: AdvFilters;
  onChange: (f: AdvFilters) => void;
  onReset: () => void;
  agencies: Agency[];
  categories: string[];
}

export function ClientsAdvancedFilters({ open, onOpenChange, filters, onChange, onReset, agencies, categories }: Props) {
  const set = (patch: Partial<AdvFilters>) => onChange({ ...filters, ...patch });
  const activeCount = countActiveFilters(filters);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros avanzados{activeCount > 0 ? ` (${activeCount})` : ''}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5 pb-24">
          <Section title="Datos básicos">
            <div>
              <Label className="text-xs mb-1.5 block">Tipo de cliente</Label>
              <ChipGroup options={Object.keys(TYPE_LABELS)} value={filters.types} onChange={v => set({ types: v })} labels={TYPE_LABELS} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Operación</Label>
              <ChipGroup options={Object.keys(OP_LABELS)} value={filters.operations} onChange={v => set({ operations: v })} labels={OP_LABELS} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Estado del lead</Label>
              <ChipGroup options={Object.keys(LEAD_LABELS)} value={filters.leadStatuses} onChange={v => set({ leadStatuses: v })} labels={LEAD_LABELS} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Origen</Label>
              <ChipGroup options={SOURCES} value={filters.sources} onChange={v => set({ sources: v })} labels={SOURCE_LABELS} />
            </div>
            {agencies.length > 1 && (
              <div>
                <Label className="text-xs mb-1.5 block">Inmobiliaria</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {agencies.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={filters.agencyIds.includes(a.id)}
                        onCheckedChange={() => set({ agencyIds: filters.agencyIds.includes(a.id) ? filters.agencyIds.filter(x => x !== a.id) : [...filters.agencyIds, a.id] })}
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {categories.length > 0 && (
              <div>
                <Label className="text-xs mb-1.5 block">Categoría</Label>
                <ChipGroup options={categories} value={filters.categories} onChange={v => set({ categories: v })} />
              </div>
            )}
          </Section>

          <Section title="Contacto">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Últ. contacto desde</Label>
                <Input type="date" value={filters.lastContactFrom} onChange={e => set({ lastContactFrom: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">hasta</Label>
                <Input type="date" value={filters.lastContactTo} onChange={e => set({ lastContactTo: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nº contactos mín.</Label>
                <Input type="number" value={filters.minContacts} onChange={e => set({ minContacts: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">máx.</Label>
                <Input type="number" value={filters.maxContacts} onChange={e => set({ maxContacts: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={filters.onlyUncontacted} onCheckedChange={v => set({ onlyUncontacted: !!v })} />
              Sólo sin contactar aún
            </label>
          </Section>

          <Section title="Financiación">
            <div>
              <Label className="text-xs">Tipo de financiación</Label>
              <Select value={filters.financing} onValueChange={(v: any) => set({ financing: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Cualquiera</SelectItem>
                  <SelectItem value="contado">Al contado</SelectItem>
                  <SelectItem value="necesita">Necesita hipoteca</SelectItem>
                  <SelectItem value="preaprobada">Hipoteca pre-aprobada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Ahorros mín. (€)</Label><Input type="number" value={filters.minCash} onChange={e => set({ minCash: e.target.value })} /></div>
              <div><Label className="text-xs">Ahorros máx. (€)</Label><Input type="number" value={filters.maxCash} onChange={e => set({ maxCash: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Ingresos mín./mes (€)</Label><Input type="number" value={filters.minIncome} onChange={e => set({ minIncome: e.target.value })} /></div>
              <div><Label className="text-xs">Ingresos máx./mes (€)</Label><Input type="number" value={filters.maxIncome} onChange={e => set({ maxIncome: e.target.value })} /></div>
            </div>
          </Section>

          <Section title="Preferencias de búsqueda">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Precio mín. (€)</Label><Input type="number" value={filters.minPrice} onChange={e => set({ minPrice: e.target.value })} /></div>
              <div><Label className="text-xs">Precio máx. (€)</Label><Input type="number" value={filters.maxPrice} onChange={e => set({ maxPrice: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Sup. mín. (m²)</Label><Input type="number" value={filters.minSurface} onChange={e => set({ minSurface: e.target.value })} /></div>
              <div><Label className="text-xs">Sup. máx. (m²)</Label><Input type="number" value={filters.maxSurface} onChange={e => set({ maxSurface: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Habitaciones mín.</Label><Input type="number" value={filters.minBedrooms} onChange={e => set({ minBedrooms: e.target.value })} /></div>
              <div><Label className="text-xs">Baños mín.</Label><Input type="number" value={filters.minBathrooms} onChange={e => set({ minBathrooms: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Tipología deseada</Label>
              <ChipGroup options={PROP_TYPES} value={filters.preferredTypes} onChange={v => set({ preferredTypes: v })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Zonas preferidas</Label>
              <ZoneSelector selectedZones={filters.selectedZones} onChange={z => set({ selectedZones: z })} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Extras indispensables</Label>
              <ChipGroup options={EXTRAS} value={filters.requiredExtras} onChange={v => set({ requiredExtras: v })} labels={EXTRA_LABELS} />
            </div>
          </Section>

          <Section title="Registro">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Registrado desde</Label>
                <Input type="date" value={filters.registeredFrom} onChange={e => set({ registeredFrom: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">hasta</Label>
                <Input type="date" value={filters.registeredTo} onChange={e => set({ registeredTo: e.target.value })} />
              </div>
            </div>
          </Section>
        </div>

        <SheetFooter className="sticky bottom-0 bg-background border-t border-border pt-3 -mx-6 px-6">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onReset}>Limpiar filtros</Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>Aplicar</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
