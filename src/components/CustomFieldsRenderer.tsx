import { CustomFieldDefinition } from "@/hooks/useCustomFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface Props {
  definitions: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (defId: string, value: any) => void;
}

export const CustomFieldsRenderer = ({ definitions, values, onChange }: Props) => {
  if (definitions.length === 0) return null;

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campos personalizados</p>
      <div className="space-y-3">
        {definitions.map(def => (
          <FieldInput key={def.id} def={def} value={values[def.id]} onChange={(v) => onChange(def.id, v)} />
        ))}
      </div>
    </div>
  );
};

function FieldInput({ def, value, onChange }: { def: CustomFieldDefinition; value: any; onChange: (v: any) => void }) {
  switch (def.field_type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{def.name}{def.required && ' *'}</Label>
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    case 'text':
      return (
        <div>
          <Label className="text-xs">{def.name}{def.required && ' *'}</Label>
          <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={def.name} />
        </div>
      );
    case 'number':
      return (
        <div>
          <Label className="text-xs">{def.name}{def.required && ' *'}</Label>
          <Input type="number" value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} />
        </div>
      );
    case 'range':
      return (
        <div>
          <Label className="text-xs">{def.name}{def.required && ' *'} (min - max)</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="Min" value={value?.min ?? ''} onChange={e => onChange({ ...(value || {}), min: e.target.value ? Number(e.target.value) : null })} />
            <Input type="number" placeholder="Max" value={value?.max ?? ''} onChange={e => onChange({ ...(value || {}), max: e.target.value ? Number(e.target.value) : null })} />
          </div>
        </div>
      );
    case 'date':
      return (
        <div>
          <Label className="text-xs">{def.name}{def.required && ' *'}</Label>
          <Input type="date" value={value || ''} onChange={e => onChange(e.target.value)} />
        </div>
      );
    case 'select':
      return (
        <div>
          <Label className="text-xs">{def.name}{def.required && ' *'}</Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {(def.options || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    case 'multiselect': {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div>
          <Label className="text-xs">{def.name}{def.required && ' *'}</Label>
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            {selected.map(s => (
              <Badge key={s} variant="secondary" className="text-xs gap-1">
                {s}
                <button type="button" onClick={() => onChange(selected.filter(x => x !== s))}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {(def.options || []).map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={(c) => onChange(c ? [...selected, opt] : selected.filter(x => x !== opt))}
                />
                <span className="text-xs">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
