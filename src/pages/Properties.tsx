import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, MapPin, Bed, Bath, Ruler, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Property, PropertyType, PropertyStatus } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<PropertyType, string> = { piso: 'Piso', casa: 'Casa', local: 'Local', terreno: 'Terreno' };
const statusLabels: Record<PropertyStatus, string> = { disponible: 'Disponible', reservado: 'Reservado', vendido_alquilado: 'Vendido/Alquilado' };
const statusColors: Record<PropertyStatus, string> = {
  disponible: 'bg-success/10 text-success border-success/20',
  reservado: 'bg-warning/10 text-warning border-warning/20',
  vendido_alquilado: 'bg-muted text-muted-foreground border-border',
};

const emptyProperty: Omit<Property, "id"> = {
  title: "", address: "", type: "piso", status: "disponible", price: 0, surface: 0, bedrooms: 0, bathrooms: 0, photos: [], agentId: "", interestedClientIds: [], publishedAt: new Date().toISOString().split("T")[0], description: "",
};

const Properties = () => {
  const { properties, users, addProperty, updateProperty, deleteProperty } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<Omit<Property, "id">>(emptyProperty);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const openCreate = () => { setEditing(null); setForm(emptyProperty); setDialogOpen(true); };
  const openEdit = (p: Property) => {
    setEditing(p);
    setForm({ title: p.title, address: p.address, type: p.type, status: p.status, price: p.price, surface: p.surface, bedrooms: p.bedrooms, bathrooms: p.bathrooms, photos: p.photos, agentId: p.agentId, interestedClientIds: p.interestedClientIds, publishedAt: p.publishedAt, description: p.description });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.address.trim()) { toast({ title: "Error", description: "Título y dirección son obligatorios", variant: "destructive" }); return; }
    if (editing) { updateProperty({ ...editing, ...form }); toast({ title: "Propiedad actualizada" }); }
    else { addProperty(form); toast({ title: "Propiedad creada" }); }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteProperty(deleteTarget.id); toast({ title: "Propiedad eliminada" }); setDeleteTarget(null); }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Propiedades</h1>
            <p className="text-sm text-muted-foreground mt-1">{properties.length} propiedades en el sistema</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva Propiedad</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por título o dirección..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const agent = users.find(u => u.id === p.agentId);
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-primary/30" />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{p.title}</h3>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[p.status]}`}>{statusLabels[p.status]}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{p.address}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                    {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.surface}m²</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-lg font-bold text-foreground">{p.price.toLocaleString('es-ES')} €</span>
                    <span className="text-xs text-muted-foreground">{agent?.name}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Propiedad" : "Nueva Propiedad"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label className="text-xs">Dirección *</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PropertyType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PropertyStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Precio (€)</Label><Input type="number" value={form.price || ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Superficie (m²)</Label><Input type="number" value={form.surface || ""} onChange={e => setForm({ ...form, surface: Number(e.target.value) })} /></div>
              <div>
                <Label className="text-xs">Agente</Label>
                <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Habitaciones</Label><Input type="number" value={form.bedrooms || ""} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Baños</Label><Input type="number" value={form.bathrooms || ""} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} /></div>
            </div>
            <div><Label className="text-xs">Descripción</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar propiedad?</DialogTitle></DialogHeader>
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

export default Properties;
