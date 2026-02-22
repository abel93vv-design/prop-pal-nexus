import { useState } from "react";
import { usePipeline, PipelineStage, StageType } from "@/hooks/usePipeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stageTypeLabels: Record<StageType, string> = {
  active: 'Activa', closed_won: 'Cerrada Ganada', closed_lost: 'Cerrada Perdida',
};
const stageTypeColors: Record<StageType, string> = {
  active: 'bg-primary/10 text-primary', closed_won: 'bg-success/10 text-success', closed_lost: 'bg-destructive/10 text-destructive',
};

const COLORS = ['#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#64748B'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PipelineStageConfig({ open, onOpenChange }: Props) {
  const { stages, addStage, updateStage, deleteStage, reorderStages } = usePipeline();
  const { toast } = useToast();
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [form, setForm] = useState({
    name: '', color: '#3B82F6', stage_type: 'active' as StageType,
    default_probability: 50, is_active: true, stale_days: 7,
  });

  const sorted = [...stages].sort((a, b) => a.position - b.position);

  const openEdit = (s: PipelineStage) => {
    setEditingStage(s);
    setForm({
      name: s.name, color: s.color, stage_type: s.stage_type,
      default_probability: s.default_probability, is_active: s.is_active, stale_days: s.stale_days,
    });
  };

  const openCreate = () => {
    setEditingStage({} as PipelineStage);
    setForm({
      name: '', color: COLORS[stages.length % COLORS.length],
      stage_type: 'active', default_probability: 50, is_active: true, stale_days: 7,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
      return;
    }
    if (editingStage?.id) {
      await updateStage(editingStage.id, form);
      toast({ title: "Etapa actualizada" });
    } else {
      await addStage({ ...form, position: stages.length });
      toast({ title: "Etapa creada" });
    }
    setEditingStage(null);
  };

  const handleDelete = async (s: PipelineStage) => {
    const result = await deleteStage(s.id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Etapa eliminada" });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = [...sorted];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    reorderStages(items.map((s, i) => ({ ...s, position: i })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Etapas del Pipeline</DialogTitle>
        </DialogHeader>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="stages-config">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                {sorted.map((s, i) => (
                  <Draggable key={s.id} draggableId={s.id} index={i}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors group"
                      >
                        <div {...provided.dragHandleProps}>
                          <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{s.name}</span>
                            <Badge variant="outline" className={`text-[9px] ${stageTypeColors[s.stage_type]}`}>
                              {stageTypeLabels[s.stage_type]}
                            </Badge>
                            {!s.is_active && <Badge variant="outline" className="text-[9px]">Inactiva</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">Prob: {s.default_probability}% · Alerta: {s.stale_days}d</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(s)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button variant="outline" onClick={openCreate} className="w-full">
          <Plus className="w-4 h-4 mr-1" /> Nueva etapa
        </Button>
      </DialogContent>

      {/* Edit/Create Stage Sub-dialog */}
      {editingStage && (
        <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{editingStage.id ? "Editar Etapa" : "Nueva Etapa"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex gap-1.5 mt-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={form.stage_type} onValueChange={v => setForm({ ...form, stage_type: v as StageType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(stageTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Prob. por defecto (%)</Label><Input type="number" min={0} max={100} value={form.default_probability} onChange={e => setForm({ ...form, default_probability: Number(e.target.value) })} /></div>
              </div>
              <div><Label className="text-xs">Días para alerta de inactividad</Label><Input type="number" min={1} value={form.stale_days} onChange={e => setForm({ ...form, stale_days: Number(e.target.value) })} /></div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Activa</Label>
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStage(null)}>Cancelar</Button>
              <Button onClick={handleSave}>{editingStage.id ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
