import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Phone, Mail, MapPin, Clock, CheckCircle2, Circle, Loader2, Plus, Pencil, Trash2, Search, AlertCircle, ArrowUp, Minus } from "lucide-react";
import { Task, TaskStatus, TaskType, TaskPriority } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<TaskType, string> = { llamada: 'Llamada', email: 'Email', visita: 'Visita', recordatorio: 'Recordatorio' };
const statusLabels: Record<TaskStatus, string> = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada' };
const priorityLabels: Record<TaskPriority, string> = { baja: 'Baja', media: 'Media', alta: 'Alta' };
const typeIcons: Record<TaskType, React.ElementType> = { llamada: Phone, email: Mail, visita: MapPin, recordatorio: Clock };
const statusIcons: Record<TaskStatus, React.ElementType> = { pendiente: Circle, en_progreso: Loader2, completada: CheckCircle2 };
const statusColors: Record<TaskStatus, string> = { pendiente: 'text-warning', en_progreso: 'text-info', completada: 'text-success' };
const priorityColors: Record<TaskPriority, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/10 text-warning border-warning/20',
  baja: 'bg-muted text-muted-foreground border-border',
};
const PriorityIcons: Record<TaskPriority, React.ElementType> = { alta: ArrowUp, media: Minus, baja: Minus };

const TASK_CATEGORIES = ['seguimiento', 'documentacion', 'visita', 'contratos', 'marketing', 'otro'];

const emptyTask: Omit<Task, "id"> = {
  title: "", type: "llamada", status: "pendiente", priority: "media",
  dueDate: new Date().toISOString().slice(0, 16), agentId: "", clientId: "",
  propertyId: "", notes: "", agencyId: "", category: "seguimiento",
};

const Tasks = () => {
  const { tasks, users, clients, properties, agencies, addTask, updateTask, deleteTask } = useData();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<Omit<Task, "id">>(emptyTask);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchStatus && matchPriority && matchCat;
  });

  const openCreate = () => { setEditing(null); setForm(emptyTask); setDialogOpen(true); };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({ title: t.title, type: t.type, status: t.status, priority: t.priority, dueDate: t.dueDate, agentId: t.agentId, clientId: t.clientId, propertyId: t.propertyId, notes: t.notes, agencyId: t.agencyId, category: t.category });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" }); return; }
    if (editing) { updateTask({ ...editing, ...form }); toast({ title: "Tarea actualizada" }); }
    else { addTask(form); toast({ title: "Tarea creada" }); }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteTask(deleteTarget.id); toast({ title: "Tarea eliminada" }); setDeleteTarget(null); }
  };

  const quickStatusChange = (t: Task, status: TaskStatus) => {
    updateTask({ ...t, status });
    toast({ title: `Tarea marcada como ${statusLabels[status]}` });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tareas</h1>
            <p className="text-sm text-muted-foreground mt-1">{tasks.length} tareas en total</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva Tarea</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar tareas..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TASK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map(t => {
            const agent = users.find(u => u.id === t.agentId);
            const client = clients.find(c => c.id === t.clientId);
            const property = properties.find(p => p.id === t.propertyId);
            const TypeIcon = typeIcons[t.type];
            const StatusIcon = statusIcons[t.status];
            const PriorityIcon = PriorityIcons[t.priority];

            return (
              <div key={t.id} className="rounded-xl border border-border bg-card hover:shadow-sm transition-shadow p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-sm text-foreground truncate">{t.title}</h3>
                    <Badge variant="outline" className="text-[10px] shrink-0">{typeLabels[t.type]}</Badge>
                    <Badge variant="outline" className={`text-[10px] shrink-0 flex items-center gap-0.5 ${priorityColors[t.priority]}`}>
                      <PriorityIcon className="w-2.5 h-2.5" />{priorityLabels[t.priority]}
                    </Badge>
                    {t.category && <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{t.category}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {agent && <span>{agent.name}</span>}
                    {client && <span>· {client.name}</span>}
                    {property && <span>· {property.title}</span>}
                  </div>
                  {t.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{t.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={`flex items-center gap-1 text-xs font-medium ${statusColors[t.status]}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusLabels[t.status]}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex gap-1">
                    {t.status !== 'completada' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-success hover:text-success" title="Marcar completada" onClick={() => quickStatusChange(t, 'completada')}>
                        <CheckCircle2 className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron tareas con los filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TaskType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridad</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Fecha límite</Label><Input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Agente responsable</Label>
                <Select value={form.agentId || "none"} onValueChange={(v) => setForm({ ...form, agentId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Inmobiliaria</Label>
                <Select value={form.agencyId || "none"} onValueChange={(v) => setForm({ ...form, agencyId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cliente relacionado</Label>
                <Select value={form.clientId || "none"} onValueChange={(v) => setForm({ ...form, clientId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cliente</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Propiedad relacionada</Label>
                <Select value={form.propertyId || "none"} onValueChange={(v) => setForm({ ...form, propertyId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin propiedad</SelectItem>
                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
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
          <DialogHeader><DialogTitle>¿Eliminar tarea?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong>{deleteTarget?.title}</strong>. Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Tasks;
