import { useState } from "react";
import { useCustomFieldDefinitions, CustomFieldDefinition, CustomFieldType, EntityType } from "@/hooks/useCustomFields";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, GripVertical, Settings2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Selección única' },
  { value: 'multiselect', label: 'Selección múltiple' },
  { value: 'range', label: 'Rango' },
];

const emptyField: Omit<CustomFieldDefinition, 'id' | 'tenant_id' | 'created_at'> = {
  entity_type: 'client',
  name: '',
  key: '',
  field_type: 'text',
  required: false,
  filterable: false,
  used_in_matching: false,
  weight_in_matching: 0,
  options: [],
  position: 0,
};

export function CustomFieldsAdmin() {
  const [entityTab, setEntityTab] = useState<EntityType>('client');
  const { definitions, addDefinition, updateDefinition, deleteDefinition } = useCustomFieldDefinitions(entityTab);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [form, setForm] = useState(emptyField);
  const [optionInput, setOptionInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CustomFieldDefinition | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyField, entity_type: entityTab, position: definitions.length });
    setDialogOpen(true);
  };

  const openEdit = (d: CustomFieldDefinition) => {
    setEditing(d);
    setForm({
      entity_type: d.entity_type,
      name: d.name,
      key: d.key,
      field_type: d.field_type,
      required: d.required,
      filterable: d.filterable,
      used_in_matching: d.used_in_matching,
      weight_in_matching: d.weight_in_matching,
      options: d.options || [],
      position: d.position,
    });
    setDialogOpen(true);
  };

  const generateKey = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    const key = form.key || generateKey(form.name);
    const payload = { ...form, key };

    if (editing) {
      await updateDefinition(editing.id, payload);
      toast({ title: "Campo actualizado" });
    } else {
      const result = await addDefinition(payload);
      if (result?.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Campo creado" });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteDefinition(deleteTarget.id);
      toast({ title: "Campo eliminado" });
      setDeleteTarget(null);
    }
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    setForm(f => ({ ...f, options: [...f.options, optionInput.trim()] }));
    setOptionInput('');
  };

  const removeOption = (idx: number) => {
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const showOptions = form.field_type === 'select' || form.field_type === 'multiselect';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="w-5 h-5 text-primary" /> Campos Personalizados
        </CardTitle>
        <CardDescription>Define campos adicionales para clientes y propiedades</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={entityTab} onValueChange={(v) => setEntityTab(v as EntityType)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="client" className="text-xs">Clientes</TabsTrigger>
              <TabsTrigger value="property" className="text-xs">Propiedades</TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Nuevo campo</Button>
          </div>

          <TabsContent value="client" className="mt-4">
            <FieldList definitions={definitions} onEdit={openEdit} onDelete={setDeleteTarget} />
          </TabsContent>
          <TabsContent value="property" className="mt-4">
            <FieldList definitions={definitions} onEdit={openEdit} onDelete={setDeleteTarget} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Campo" : "Nuevo Campo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input value={form.name} onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, key: editing ? f.key : generateKey(name) }));
              }} />
            </div>
            <div>
              <Label className="text-xs">Clave (auto-generada)</Label>
              <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} disabled={!!editing} className="font-mono text-xs bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Tipo de campo</Label>
              <Select value={form.field_type} onValueChange={v => setForm(f => ({ ...f, field_type: v as CustomFieldType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {showOptions && (
              <div className="space-y-2">
                <Label className="text-xs">Opciones</Label>
                <div className="flex flex-wrap gap-1">
                  {form.options.map((opt, i) => (
                    <Badge key={i} variant="secondary" className="text-xs gap-1">
                      {opt}
                      <button type="button" onClick={() => removeOption(i)}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={optionInput} onChange={e => setOptionInput(e.target.value)} placeholder="Nueva opción" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())} />
                  <Button type="button" size="sm" variant="outline" onClick={addOption}>Añadir</Button>
                </div>
              </div>
            )}

            <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Obligatorio</Label>
                <Switch checked={form.required} onCheckedChange={v => setForm(f => ({ ...f, required: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Filtrable</Label>
                <Switch checked={form.filterable} onCheckedChange={v => setForm(f => ({ ...f, filterable: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Usar en matching</Label>
                <Switch checked={form.used_in_matching} onCheckedChange={v => setForm(f => ({ ...f, used_in_matching: v }))} />
              </div>
              {form.used_in_matching && (
                <div>
                  <Label className="text-xs">Peso en matching (0-100)</Label>
                  <Input type="number" min={0} max={100} value={form.weight_in_matching} onChange={e => setForm(f => ({ ...f, weight_in_matching: Number(e.target.value) }))} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar campo?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong>{deleteTarget?.name}</strong> y todos sus valores. Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function FieldList({ definitions, onEdit, onDelete }: { definitions: CustomFieldDefinition[]; onEdit: (d: CustomFieldDefinition) => void; onDelete: (d: CustomFieldDefinition) => void }) {
  if (definitions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No hay campos personalizados. Crea uno para empezar.</p>;
  }

  const typeLabel = (t: CustomFieldType) => FIELD_TYPES.find(f => f.value === t)?.label || t;

  return (
    <div className="space-y-2">
      {definitions.map(d => (
        <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors group">
          <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
              <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{d.key}</code>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{typeLabel(d.field_type)}</Badge>
              {d.required && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Obligatorio</Badge>}
              {d.filterable && <Badge variant="outline" className="text-[10px]">Filtrable</Badge>}
              {d.used_in_matching && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Matching ({d.weight_in_matching})</Badge>}
              {d.options.length > 0 && <span className="text-[10px] text-muted-foreground">{d.options.length} opciones</span>}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(d)}><Pencil className="w-3 h-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(d)}><Trash2 className="w-3 h-3" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}
