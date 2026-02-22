import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, MapPin, Bed, Bath, Ruler, Search, Plus, Pencil, Trash2, FileText, Upload, X, Kanban } from "lucide-react";
import { Property, PropertyType, PropertyStatus, Document, DocumentType } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { useCustomFieldDefinitions, useCustomFieldValues } from "@/hooks/useCustomFields";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useInterests } from "@/hooks/useInterests";
import { InterestedClients } from "@/components/InterestManager";

const typeLabels: Record<PropertyType, string> = { piso: 'Piso', casa: 'Casa', local: 'Local', terreno: 'Terreno' };
const statusLabels: Record<PropertyStatus, string> = { disponible: 'Disponible', reservado: 'Reservado', vendido_alquilado: 'Vendido/Alquilado', no_disponible: 'No Disponible' };
const docTypeLabels: Record<DocumentType, string> = { nota_simple: 'Nota Simple', contrato: 'Contrato', fotos: 'Fotos', otros: 'Otros' };
const statusColors: Record<PropertyStatus, string> = {
  disponible: 'bg-success/10 text-success border-success/20',
  reservado: 'bg-warning/10 text-warning border-warning/20',
  vendido_alquilado: 'bg-muted text-muted-foreground border-border',
  no_disponible: 'bg-destructive/10 text-destructive border-destructive/20',
};

const PROP_CATEGORIES = ['residencial', 'comercial', 'lujo', 'suelo', 'industrial', 'otro'];

const emptyProperty: Omit<Property, "id"> = {
  title: "", address: "", type: "piso", status: "disponible", price: 0, surface: 0,
  bedrooms: 0, bathrooms: 0, photos: [], agentId: "", interestedClientIds: [],
  publishedAt: new Date().toISOString().split("T")[0], description: "",
  agencyId: "", category: "residencial",
};

const emptyDoc: Omit<Document, "id"> = {
  name: "", type: "nota_simple", file: "", uploadedAt: new Date().toISOString().split("T")[0], propertyId: "",
};

const Properties = () => {
  const { properties, users, agencies, clients, documents, addProperty, updateProperty, deleteProperty, addDocument, deleteDocument } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { definitions: customFields } = useCustomFieldDefinitions('property');
  const { interests, addInterest, removeInterest, updateInterestType } = useInterests();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<Omit<Property, "id">>(emptyProperty);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [docsProperty, setDocsProperty] = useState<Property | null>(null);
  const [docForm, setDocForm] = useState<Omit<Document, "id">>(emptyDoc);
  const [cfValues, setCfValues] = useState<Record<string, any>>({});
  const { values: loadedCfValues, saveValues: saveCfValues } = useCustomFieldValues(editing?.id ?? null);

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchType && matchStatus && matchCat;
  });

  const openCreate = () => { setEditing(null); setForm(emptyProperty); setCfValues({}); setDialogOpen(true); };
  const openEdit = (p: Property) => {
    setEditing(p);
    setForm({ title: p.title, address: p.address, type: p.type, status: p.status, price: p.price, surface: p.surface, bedrooms: p.bedrooms, bathrooms: p.bathrooms, photos: p.photos, agentId: p.agentId, interestedClientIds: p.interestedClientIds, publishedAt: p.publishedAt, description: p.description, agencyId: p.agencyId, category: p.category });
    setCfValues(loadedCfValues);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.address.trim()) { toast({ title: "Error", description: "Título y dirección son obligatorios", variant: "destructive" }); return; }
    if (editing) {
      await updateProperty({ ...editing, ...form });
      await saveCfValues(editing.id, cfValues);
      toast({ title: "Propiedad actualizada" });
    } else {
      await addProperty(form);
      toast({ title: "Propiedad creada" });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteProperty(deleteTarget.id); toast({ title: "Propiedad eliminada" }); setDeleteTarget(null); }
  };

  const openDocs = (p: Property) => {
    setDocsProperty(p);
    setDocForm({ ...emptyDoc, propertyId: p.id });
  };

  const handleAddDoc = () => {
    if (!docForm.name.trim()) { toast({ title: "Error", description: "El nombre del documento es obligatorio", variant: "destructive" }); return; }
    addDocument(docForm);
    toast({ title: "Documento añadido" });
    setDocForm({ ...emptyDoc, propertyId: docsProperty?.id ?? "" });
  };

  const propertyDocs = docsProperty ? documents.filter(d => d.propertyId === docsProperty.id) : [];

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

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por título o dirección..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PROP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const agent = users.find(u => u.id === p.agentId);
            const docCount = documents.filter(d => d.propertyId === p.id).length;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="secondary" size="icon" className="h-7 w-7" title="Crear oportunidad" onClick={() => navigate(`/pipeline?property=${p.id}`)}><Kanban className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" title="Documentos" onClick={() => openDocs(p)}><FileText className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                  {p.photos.length > 0 ? (
                    <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-12 h-12 text-primary/30" />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{p.title}</h3>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${statusColors[p.status]}`}>{statusLabels[p.status]}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{p.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{p.address}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                    {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.surface}m²</span>
                    {docCount > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{docCount} doc.</span>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-lg font-bold text-foreground">{p.price.toLocaleString('es-ES')} €</span>
                    <span className="text-xs text-muted-foreground">{agent?.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Dialog */}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
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
            {/* Image upload */}
            <div>
              <Label className="text-xs">Fotos</Label>
              <div className="mt-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {form.photos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-border group/photo">
                      <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                        onClick={() => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-primary hover:underline">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Añadir imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          setForm(prev => ({ ...prev, photos: [...prev.photos, result] }));
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            {customFields.length > 0 && (
              <CustomFieldsRenderer
                definitions={customFields}
                values={cfValues}
                onChange={(defId, value) => setCfValues(prev => ({ ...prev, [defId]: value }))}
              />
            )}
            {editing && (
              <InterestedClients
                propertyId={editing.id}
                interests={interests}
                clients={clients}
                onAdd={(clientId, type) => addInterest(clientId, editing.id, type)}
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

      {/* Delete Confirm */}
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

      {/* Documents Manager */}
      <Dialog open={!!docsProperty} onOpenChange={() => setDocsProperty(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Documentos — {docsProperty?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Add doc form */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Añadir documento</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nombre *</Label><Input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} placeholder="Nombre del documento" /></div>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={docForm.type} onValueChange={(v) => setDocForm({ ...docForm, type: v as DocumentType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleAddDoc} className="w-full"><Upload className="w-3.5 h-3.5 mr-1" />Añadir documento</Button>
            </div>
            {/* Doc list */}
            {propertyDocs.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No hay documentos para esta propiedad.</p>
              : <div className="space-y-2">
                  {propertyDocs.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{docTypeLabels[d.type]} · {new Date(d.uploadedAt).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { deleteDocument(d.id); toast({ title: "Documento eliminado" }); }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
            }
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocsProperty(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Properties;
