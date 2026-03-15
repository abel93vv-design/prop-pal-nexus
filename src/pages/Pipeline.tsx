import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { usePipeline, Opportunity, OpportunityPriority } from "@/hooks/usePipeline";
import { useData } from "@/context/DataContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus, Search, Filter, User, Building2, Calendar, DollarSign,
  Clock, Trash2, Pencil, Settings2, BarChart3, AlertTriangle,
  ChevronDown, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PipelineStageConfig } from "@/components/PipelineStageConfig";
import { PipelineAnalytics } from "@/components/PipelineAnalytics";

const priorityLabels: Record<OpportunityPriority, string> = { baja: 'Baja', media: 'Media', alta: 'Alta' };
const priorityColors: Record<OpportunityPriority, string> = {
  baja: 'bg-muted text-muted-foreground',
  media: 'bg-warning/10 text-warning border-warning/20',
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Pipeline = () => {
  const { stages, opportunities, loading, seedDefaultStages, addOpportunity, updateOpportunity, moveOpportunity, deleteOpportunity } = usePipeline();
  const { clients, properties, users } = useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Auto-open create from query params
  useEffect(() => {
    const clientParam = searchParams.get('client');
    const propertyParam = searchParams.get('property');
    if ((clientParam || propertyParam) && stages.length > 0 && !loading) {
      const firstStage = stages.filter(s => s.is_active).sort((a, b) => a.position - b.position)[0];
      setForm(f => ({
        ...f,
        client_id: clientParam || '',
        property_id: propertyParam || '',
        stage_id: firstStage?.id || '',
        probability: firstStage?.default_probability ?? 50,
      }));
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, stages, loading]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  // Form
  const [form, setForm] = useState({
    title: '', client_id: '', property_id: '', agent_id: '', stage_id: '',
    deal_value: 0, probability: 50, priority: 'media' as OpportunityPriority,
    expected_close_date: '', notes: '', agency_id: '',
  });

  const activeStages = stages.filter(s => s.is_active).sort((a, b) => a.position - b.position);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(o => {
      if (searchQuery) {
        const client = clients.find(c => c.id === o.client_id);
        if (!client?.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !o.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      if (filterAgent !== 'all' && o.agent_id !== filterAgent) return false;
      if (filterPriority !== 'all' && o.priority !== filterPriority) return false;
      if (filterStage !== 'all' && o.stage_id !== filterStage) return false;
      return true;
    });
  }, [opportunities, searchQuery, filterAgent, filterPriority, filterStage, clients]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const oppId = result.draggableId;
    const newStageId = result.destination.droppableId;
    moveOpportunity(oppId, newStageId);
  };

  const openCreate = (stageId?: string) => {
    setEditing(null);
    setForm({
      title: '', client_id: '', property_id: '', agent_id: '',
      stage_id: stageId || activeStages[0]?.id || '',
      deal_value: 0, probability: stages.find(s => s.id === stageId)?.default_probability ?? 50,
      priority: 'media', expected_close_date: '', notes: '', agency_id: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (opp: Opportunity) => {
    setEditing(opp);
    setForm({
      title: opp.title, client_id: opp.client_id, property_id: opp.property_id || '',
      agent_id: opp.agent_id || '', stage_id: opp.stage_id, deal_value: opp.deal_value,
      probability: opp.probability, priority: opp.priority,
      expected_close_date: opp.expected_close_date || '', notes: opp.notes,
      agency_id: opp.agency_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.client_id) {
      toast({ title: "Error", description: "Título y cliente son obligatorios", variant: "destructive" });
      return;
    }
    if (editing) {
      await updateOpportunity(editing.id, form);
      toast({ title: "Oportunidad actualizada" });
    } else {
      const result = await addOpportunity(form);
      if (result?.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Oportunidad creada" });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteOpportunity(deleteTarget.id);
      toast({ title: "Oportunidad eliminada" });
      setDeleteTarget(null);
    }
  };

  // Seed if no stages
  if (!loading && stages.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <BarChart3 className="w-16 h-16 text-primary/30" />
          <h2 className="text-xl font-bold text-foreground">Pipeline de Ventas</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Aún no tienes etapas configuradas. Crea las etapas predeterminadas para comenzar.
          </p>
          <Button onClick={() => seedDefaultStages()}>
            <Plus className="w-4 h-4 mr-1" /> Crear etapas predeterminadas
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 animate-fade-in h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pipeline de Ventas</h1>
            <p className="text-sm text-muted-foreground">{opportunities.length} oportunidades · {activeStages.length} etapas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px] sm:flex-none sm:w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8 h-8 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="h-8">
              <Filter className="w-3.5 h-3.5 mr-1" />Filtros
              {(filterAgent !== 'all' || filterPriority !== 'all' || filterStage !== 'all') && (
                <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">!</Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAnalyticsOpen(true)} className="h-8">
              <BarChart3 className="w-3.5 h-3.5 mr-1" />Métricas
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)} className="h-8">
              <Settings2 className="w-3.5 h-3.5 mr-1" />Etapas
            </Button>
            <Button size="sm" onClick={() => openCreate()} className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />Nueva
            </Button>
          </div>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="flex flex-wrap gap-3 p-3 rounded-lg border border-border bg-muted/30 animate-fade-in">
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Agente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los agentes</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Prioridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Etapa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {activeStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterAgent !== 'all' || filterPriority !== 'all' || filterStage !== 'all') && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterAgent('all'); setFilterPriority('all'); setFilterStage('all'); }}>
                <X className="w-3 h-3 mr-1" />Limpiar
              </Button>
            )}
          </div>
        )}

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-4 min-h-[calc(100vh-220px)]">
              {activeStages.map(stage => {
                const stageOpps = filteredOpps.filter(o => o.stage_id === stage.id);
                const totalValue = stageOpps.reduce((s, o) => s + o.deal_value, 0);
                const forecast = stageOpps.reduce((s, o) => s + o.deal_value * o.probability / 100, 0);

                return (
                  <div key={stage.id} className="flex-shrink-0 w-[280px] flex flex-col">
                    {/* Column header */}
                    <div className="p-3 rounded-t-lg border border-border border-b-0 bg-card">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                        <h3 className="text-xs font-semibold text-foreground truncate flex-1">{stage.name}</h3>
                        <Badge variant="outline" className="text-[10px] h-5">{stageOpps.length}</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        <span>{totalValue.toLocaleString('es-ES')} €</span>
                      </div>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-1.5 space-y-1.5 rounded-b-lg border border-border overflow-y-auto min-h-[100px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30' : 'bg-muted/20'
                          }`}
                        >
                          {stageOpps.map((opp, index) => (
                            <OpportunityCard
                              key={opp.id}
                              opp={opp}
                              index={index}
                              clients={clients}
                              properties={properties}
                              users={users}
                              stage={stage}
                              onEdit={() => openEdit(opp)}
                              onDelete={() => setDeleteTarget(opp)}
                            />
                          ))}
                          {provided.placeholder}
                          <button
                            onClick={() => openCreate(stage.id)}
                            className="w-full p-2 rounded-md border border-dashed border-border text-[10px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Añadir
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropContext>
      </div>

      {/* Create / Edit Opportunity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Oportunidad" : "Nueva Oportunidad"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Cliente *</Label>
              <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Propiedad</Label>
                <Select value={form.property_id || 'none'} onValueChange={v => setForm({ ...form, property_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Agente</Label>
                <Select value={form.agent_id || 'none'} onValueChange={v => setForm({ ...form, agent_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Etapa</Label>
                <Select value={form.stage_id} onValueChange={v => {
                  const st = stages.find(s => s.id === v);
                  setForm({ ...form, stage_id: v, probability: st?.default_probability ?? form.probability });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{activeStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prioridad</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as OpportunityPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Valor (€)</Label><Input type="number" value={form.deal_value || ''} onChange={e => setForm({ ...form, deal_value: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Probabilidad %</Label><Input type="number" min={0} max={100} value={form.probability} onChange={e => setForm({ ...form, probability: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Cierre esperado</Label><Input type="date" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar oportunidad?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong>{deleteTarget?.title}</strong> y todo su historial.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Config */}
      <PipelineStageConfig open={configOpen} onOpenChange={setConfigOpen} />

      {/* Analytics */}
      <PipelineAnalytics open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
    </Layout>
  );
};

// Opportunity Card Component
function OpportunityCard({ opp, index, clients, properties, users, stage, onEdit, onDelete }: {
  opp: Opportunity; index: number; clients: any[]; properties: any[]; users: any[];
  stage: any; onEdit: () => void; onDelete: () => void;
}) {
  const client = clients.find(c => c.id === opp.client_id);
  const property = properties.find(p => p.id === opp.property_id);
  const agent = users.find(u => u.id === opp.agent_id);
  const daysInStage = Math.floor((Date.now() - new Date(opp.stage_entered_at).getTime()) / 86400000);
  const isStale = daysInStage > (stage.stale_days || 7);

  return (
    <Draggable draggableId={opp.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-2.5 cursor-grab active:cursor-grabbing transition-shadow group ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-sm'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{opp.title}</p>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={onEdit} className="p-0.5 hover:text-primary"><Pencil className="w-3 h-3" /></button>
                <button onClick={onDelete} className="p-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>

            {client && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{client.name}</span>
              </div>
            )}

            {property && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{property.title}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{opp.deal_value.toLocaleString('es-ES')} €</span>
              <Badge variant="outline" className={`text-[9px] ${priorityColors[opp.priority]}`}>
                {priorityLabels[opp.priority]}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />{opp.probability}%
              </span>
              <span className={`flex items-center gap-0.5 ${isStale ? 'text-destructive font-medium' : ''}`}>
                {isStale && <AlertTriangle className="w-3 h-3" />}
                <Clock className="w-3 h-3" />{daysInStage}d
              </span>
            </div>

            {agent && (
              <div className="flex items-center gap-1 pt-1 border-t border-border">
                <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary">{agent.name.charAt(0)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{agent.name}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </Draggable>
  );
}

export default Pipeline;
