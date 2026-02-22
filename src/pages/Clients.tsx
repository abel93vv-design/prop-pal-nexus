import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Mail, Phone, Plus, Pencil, Trash2, PhoneCall, ArrowUpDown } from "lucide-react";
import { Client, ClientType, LeadStatus } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { useCustomFieldDefinitions, useCustomFieldValues } from "@/hooks/useCustomFields";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useInterests } from "@/hooks/useInterests";
import { InterestedProperties } from "@/components/InterestManager";

const typeLabels: Record<ClientType, string> = { comprador: 'Comprador', vendedor: 'Vendedor', arrendador: 'Arrendador', arrendatario: 'Arrendatario' };
const statusLabels: Record<LeadStatus, string> = { nuevo: 'Nuevo', contactado: 'Contactado', en_negociacion: 'En negociación', cerrado: 'Cerrado' };
const statusColors: Record<LeadStatus, string> = {
  nuevo: 'bg-info/10 text-info border-info/20',
  contactado: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  en_negociacion: 'bg-warning/10 text-warning border-warning/20',
  cerrado: 'bg-success/10 text-success border-success/20',
};

const CATEGORIES = ['premium', 'estandar', 'comercial', 'inversor', 'otro'];

const emptyClient: Omit<Client, "id"> = {
  name: "", email: "", phone: "", address: "", type: "comprador", leadStatus: "nuevo",
  propertyIds: [], registeredAt: new Date().toISOString().split("T")[0], notes: "",
  agencyId: "", category: "estandar", lastContactedAt: "", contactCount: 0,
};

const Clients = () => {
  const { clients, agencies, properties, addClient, updateClient, deleteClient } = useData();
  const { toast } = useToast();
  const { definitions: customFields } = useCustomFieldDefinitions('client');
  const { interests, addInterest, removeInterest, updateInterestType } = useInterests();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [contactSort, setContactSort] = useState<string>("none");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>(emptyClient);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [cfValues, setCfValues] = useState<Record<string, any>>({});
  const { values: loadedCfValues, saveValues: saveCfValues } = useCustomFieldValues(editing?.id ?? null);

  const filtered = clients
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || c.type === typeFilter;
      const matchCat = categoryFilter === "all" || c.category === categoryFilter;
      return matchSearch && matchType && matchCat;
    })
    .sort((a, b) => {
      if (contactSort === "none") return 0;
      const dateA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
      const dateB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
      return contactSort === "desc" ? dateB - dateA : dateA - dateB;
    });

  const openCreate = () => { setEditing(null); setForm(emptyClient); setCfValues({}); setDialogOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type, leadStatus: c.leadStatus, propertyIds: c.propertyIds, registeredAt: c.registeredAt, notes: c.notes, agencyId: c.agencyId, category: c.category, lastContactedAt: c.lastContactedAt, contactCount: c.contactCount });
    setCfValues(loadedCfValues);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: "Error", description: "Nombre y email son obligatorios", variant: "destructive" }); return; }
    if (editing) {
      await updateClient({ ...editing, ...form });
      await saveCfValues(editing.id, cfValues);
      toast({ title: "Cliente actualizado" });
    } else {
      await addClient(form);
      // For new clients, we'd need the ID to save custom fields — handled after creation
      toast({ title: "Cliente creado" });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteClient(deleteTarget.id); toast({ title: "Cliente eliminado" }); setDeleteTarget(null); }
  };

  const markContacted = (c: Client) => {
    const now = new Date().toISOString().split("T")[0];
    updateClient({ ...c, lastContactedAt: now, contactCount: (c.contactCount || 0) + 1, leadStatus: c.leadStatus === 'nuevo' ? 'contactado' : c.leadStatus });
    toast({ title: "Contacto registrado", description: `${c.name} marcado como contactado hoy.` });
  };

  const cycleContactSort = () => {
    setContactSort(prev => prev === "none" ? "desc" : prev === "desc" ? "asc" : "none");
  };

  const sortLabel = contactSort === "desc" ? "↓ Reciente" : contactSort === "asc" ? "↑ Antiguo" : "";

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">{clients.length} clientes registrados</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo Cliente</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={contactSort !== "none" ? "secondary" : "outline"} size="sm" onClick={cycleContactSort} className="gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Últ. contacto {sortLabel}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold text-xs">Nombre</TableHead>
                <TableHead className="font-semibold text-xs">Contacto</TableHead>
                <TableHead className="font-semibold text-xs">Tipo</TableHead>
                <TableHead className="font-semibold text-xs">Categoría</TableHead>
                <TableHead className="font-semibold text-xs">Estado</TableHead>
                <TableHead className="font-semibold text-xs">Últ. contacto</TableHead>
                <TableHead className="font-semibold text-xs text-center">Nº contactos</TableHead>
                <TableHead className="font-semibold text-xs text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-muted/20">
                  <TableCell>
                    <p className="font-medium text-sm text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{c.email}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[c.type]}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[c.leadStatus]}`}>{statusLabels[c.leadStatus]}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.lastContactedAt
                      ? <span className="text-xs text-muted-foreground">{new Date(c.lastContactedAt).toLocaleDateString('es-ES')}</span>
                      : <span className="text-xs text-muted-foreground italic">Sin contactar</span>
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px]">{c.contactCount || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Marcar contactado" onClick={() => markContacted(c)}><PhoneCall className="w-3.5 h-3.5 text-success" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ClientType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estado lead</Label>
                <Select value={form.leadStatus} onValueChange={(v) => setForm({ ...form, leadStatus: v as LeadStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
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
            <div><Label className="text-xs">Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            {customFields.length > 0 && (
              <CustomFieldsRenderer
                definitions={customFields}
                values={cfValues}
                onChange={(defId, value) => setCfValues(prev => ({ ...prev, [defId]: value }))}
              />
            )}
            {editing && (
              <InterestedProperties
                clientId={editing.id}
                interests={interests}
                properties={properties}
                onAdd={(propertyId, type) => addInterest(editing.id, propertyId, type)}
                onRemove={removeInterest}
                onUpdateType={updateInterestType}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar cliente?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará a <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Clients;
