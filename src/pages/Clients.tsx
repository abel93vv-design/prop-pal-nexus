import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, Mail, Phone, Plus, Pencil, Trash2, PhoneCall, ArrowUpDown, Kanban, Download, Upload } from "lucide-react";
import { Client, ClientType, LeadStatus, OperationType } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { useCustomFieldDefinitions, useCustomFieldValues } from "@/hooks/useCustomFields";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useInterests } from "@/hooks/useInterests";
import { InterestedProperties } from "@/components/InterestManager";
import { ZoneSelector } from "@/components/ZoneSelector";
import { useMatchCenter, useClientFinancials, useClientPreferences } from "@/hooks/useMatchCenter";
import { TopPropertyMatches } from "@/components/MatchScoreWidgets";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CsvImportDialog } from "@/components/CsvImportDialog";

const EXTRAS_OPTIONS = ['ascensor', 'terraza', 'piscina', 'garaje', 'aire_acondicionado'] as const;

const operationLabels: Record<string, string> = { compra: 'Compra', alquiler: 'Alquiler', ambos: 'Ambos', venta: 'Venta' };
const operationColors: Record<string, string> = {
  compra: 'bg-primary/10 text-primary border-primary/20',
  alquiler: 'bg-info/10 text-info border-info/20',
  ambos: 'bg-warning/10 text-warning border-warning/20',
  venta: 'bg-success/10 text-success border-success/20',
};

function ClientFinancialsForm({ clientId }: { clientId: string }) {
  const { financials, loading, save } = useClientFinancials(clientId);
  const [form, setForm] = useState({
    available_cash: 0, monthly_income: 0, debt_ratio: 0,
    monthly_debts: 0, mortgage_needed: false, mortgage_preapproved: false,
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (financials) {
      setForm({
        available_cash: financials.available_cash,
        monthly_income: financials.monthly_income,
        debt_ratio: financials.debt_ratio,
        monthly_debts: (financials as any).monthly_debts || 0,
        mortgage_needed: financials.mortgage_needed,
        mortgage_preapproved: financials.mortgage_preapproved,
      });
    }
  }, [financials]);

  const handleSave = () => { save(form); setDirty(false); };

  if (loading) return null;

  return (
    <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Perfil Financiero</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Ahorros disponibles (€)</Label><Input type="number" value={form.available_cash || ""} onChange={e => { setForm(f => ({ ...f, available_cash: Number(e.target.value) })); setDirty(true); }} /></div>
        <div><Label className="text-xs">Ingresos netos/mes (€)</Label><Input type="number" value={form.monthly_income || ""} onChange={e => { setForm(f => ({ ...f, monthly_income: Number(e.target.value) })); setDirty(true); }} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Deudas mensuales (€)</Label><Input type="number" value={form.monthly_debts || ""} onChange={e => { setForm(f => ({ ...f, monthly_debts: Number(e.target.value) })); setDirty(true); }} /></div>
        <div><Label className="text-xs">Ratio endeudamiento (%)</Label><Input type="number" value={form.debt_ratio || ""} onChange={e => { setForm(f => ({ ...f, debt_ratio: Number(e.target.value) })); setDirty(true); }} /></div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs"><Switch checked={form.mortgage_needed} onCheckedChange={v => { setForm(f => ({ ...f, mortgage_needed: !!v })); setDirty(true); }} />Necesita hipoteca</label>
        <label className="flex items-center gap-2 text-xs"><Switch checked={form.mortgage_preapproved} onCheckedChange={v => { setForm(f => ({ ...f, mortgage_preapproved: !!v })); setDirty(true); }} />Pre-aprobada</label>
      </div>
      {dirty && <Button size="sm" onClick={handleSave} className="w-full">Guardar financiero</Button>}
    </div>
  );
}

function ClientPreferencesForm({ clientId }: { clientId: string }) {
  const { preferences, loading, save } = useClientPreferences(clientId);
  const [form, setForm] = useState({
    min_price: 0, max_price: 0, min_surface: 0, max_surface: 0,
    min_bedrooms: 0, min_bathrooms: 0, preferred_types: [] as string[],
    preferred_locations: [] as string[], required_extras: [] as string[],
    neighborhood: '', selected_zones: [] as string[],
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (preferences) {
      setForm({
        min_price: preferences.min_price, max_price: preferences.max_price,
        min_surface: preferences.min_surface, max_surface: preferences.max_surface,
        min_bedrooms: preferences.min_bedrooms, min_bathrooms: preferences.min_bathrooms,
        preferred_types: preferences.preferred_types, preferred_locations: preferences.preferred_locations,
        required_extras: (preferences as any).required_extras || [],
        neighborhood: (preferences as any).neighborhood || '',
        selected_zones: (preferences as any).selected_zones || [],
      });
    }
  }, [preferences]);

  const handleSave = () => { save(form); setDirty(false); };
  const toggleExtra = (extra: string) => {
    setForm(f => ({
      ...f,
      required_extras: f.required_extras.includes(extra)
        ? f.required_extras.filter(e => e !== extra)
        : [...f.required_extras, extra],
    }));
    setDirty(true);
  };

  if (loading) return null;

  return (
    <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferencias de Búsqueda</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Presup. mínimo (€)</Label><Input type="number" value={form.min_price || ""} onChange={e => { setForm(f => ({ ...f, min_price: Number(e.target.value) })); setDirty(true); }} /></div>
        <div><Label className="text-xs">Presup. máximo (€)</Label><Input type="number" value={form.max_price || ""} onChange={e => { setForm(f => ({ ...f, max_price: Number(e.target.value) })); setDirty(true); }} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Sup. mínima (m²)</Label><Input type="number" value={form.min_surface || ""} onChange={e => { setForm(f => ({ ...f, min_surface: Number(e.target.value) })); setDirty(true); }} /></div>
        <div><Label className="text-xs">Sup. máxima (m²)</Label><Input type="number" value={form.max_surface || ""} onChange={e => { setForm(f => ({ ...f, max_surface: Number(e.target.value) })); setDirty(true); }} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Hab. mínimas</Label><Input type="number" value={form.min_bedrooms || ""} onChange={e => { setForm(f => ({ ...f, min_bedrooms: Number(e.target.value) })); setDirty(true); }} /></div>
        <div><Label className="text-xs">Baños mínimos</Label><Input type="number" value={form.min_bathrooms || ""} onChange={e => { setForm(f => ({ ...f, min_bathrooms: Number(e.target.value) })); setDirty(true); }} /></div>
      </div>
      <ZoneSelector
        selectedZones={form.selected_zones || []}
        onChange={(zones) => { setForm(f => ({ ...f, selected_zones: zones })); setDirty(true); }}
      />
      <div>
        <Label className="text-xs">Tipología deseada</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {['piso', 'casa', 'local', 'terreno'].map(t => (
            <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox
                checked={form.preferred_types.includes(t)}
                onCheckedChange={() => {
                  setForm(f => ({
                    ...f,
                    preferred_types: f.preferred_types.includes(t)
                      ? f.preferred_types.filter(x => x !== t)
                      : [...f.preferred_types, t],
                  }));
                  setDirty(true);
                }}
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs">Extras indispensables</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {EXTRAS_OPTIONS.map(extra => (
            <label key={extra} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox checked={form.required_extras.includes(extra)} onCheckedChange={() => toggleExtra(extra)} />
              {extra.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
            </label>
          ))}
        </div>
      </div>
      {dirty && <Button size="sm" onClick={handleSave} className="w-full">Guardar preferencias</Button>}
    </div>
  );
}

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
  operationType: "compra",
};

const Clients = () => {
  const { clients, agencies, properties, addClient, updateClient, deleteClient } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { definitions: customFields } = useCustomFieldDefinitions('client');
  const { interests, addInterest, removeInterest, updateInterestType } = useInterests();
  const { getTopMatchesForClient } = useMatchCenter();
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
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const CSV_FIELD_MAP = [
    { key: "name", label: "Nombre", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone", label: "Teléfono" },
    { key: "address", label: "Dirección" },
    { key: "type", label: "Tipo (comprador/vendedor/inquilino/propietario)" },
    { key: "operationType", label: "Operación (compra/alquiler/venta)" },
    { key: "category", label: "Categoría" },
    { key: "leadStatus", label: "Estado Lead" },
    { key: "notes", label: "Notas" },
  ];

  const handleCsvImport = async (rows: Record<string, string>[]) => {
    for (const row of rows) {
      await addClient({
        name: row.name || "Sin nombre",
        email: row.email || "",
        phone: row.phone || "",
        address: row.address || "",
        type: (["comprador", "vendedor", "inquilino", "propietario"].includes(row.type?.toLowerCase()) ? row.type.toLowerCase() : "comprador") as ClientType,
        operationType: (["compra", "alquiler", "venta", "ambos"].includes(row.operationType?.toLowerCase()) ? row.operationType.toLowerCase() : "compra") as OperationType,
        leadStatus: (["nuevo", "contactado", "en_negociacion", "cerrado"].includes(row.leadStatus?.toLowerCase()) ? row.leadStatus.toLowerCase() : "nuevo") as LeadStatus,
        category: row.category || "estandar",
        notes: row.notes || "",
        propertyIds: [],
        registeredAt: new Date().toISOString().split("T")[0],
        agencyId: "",
        lastContactedAt: "",
        contactCount: 0,
      });
    }
  };

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
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type, leadStatus: c.leadStatus, propertyIds: c.propertyIds, registeredAt: c.registeredAt, notes: c.notes, agencyId: c.agencyId, category: c.category, lastContactedAt: c.lastContactedAt, contactCount: c.contactCount, operationType: c.operationType || 'compra' });
    setCfValues(loadedCfValues);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    if (editing) {
      await updateClient({ ...editing, ...form });
      await saveCfValues(editing.id, cfValues);
      toast({ title: "Cliente actualizado" });
      setDialogOpen(false);
    } else {
      await addClient(form);
      toast({ title: "Cliente creado", description: "Ahora puedes completar su perfil financiero y preferencias editándolo." });
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClient(deleteTarget.id);
      toast({ title: "Cliente movido a la papelera" });
      setDeleteTarget(null);
    } catch {
      // El hook muestra el error concreto.
    }
  };

  const markContacted = (c: Client) => {
    const now = new Date().toISOString().split("T")[0];
    updateClient({ ...c, lastContactedAt: now, contactCount: (c.contactCount || 0) + 1, leadStatus: c.leadStatus === 'nuevo' ? 'contactado' : c.leadStatus });
    toast({ title: "Contacto registrado", description: `${c.name} marcado como contactado hoy.` });
  };

  const cycleContactSort = () => {
    setContactSort(prev => prev === "none" ? "desc" : prev === "desc" ? "asc" : "none");
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Dirección', 'Tipo', 'Operación', 'Categoría', 'Estado Lead', 'Últ. Contacto', 'Nº Contactos', 'Notas'];
    const rows = filtered.map(c => [
      c.name, c.email, c.phone, c.address,
      typeLabels[c.type] || c.type,
      operationLabels[c.operationType] || c.operationType,
      c.category || '',
      statusLabels[c.leadStatus] || c.leadStatus,
      c.lastContactedAt || '',
      String(c.contactCount || 0),
      (c.notes || '').replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado", description: `${filtered.length} clientes exportados.` });
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
          <div className="flex gap-2 flex-wrap">
            <Button onClick={exportCSV} variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>
            <Button onClick={() => setCsvDialogOpen(true)} variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" />Importar CSV</Button>
            <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo Cliente</Button>
          </div>
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
                <TableHead className="font-semibold text-xs">Operación</TableHead>
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
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${operationColors[c.operationType] || ''}`}>
                      {operationLabels[c.operationType] || c.operationType}
                    </Badge>
                  </TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Crear oportunidad" onClick={() => navigate(`/pipeline?client=${c.id}`)}><Kanban className="w-3.5 h-3.5 text-primary" /></Button>
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
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
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
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Operación</Label>
                <Select value={form.operationType} onValueChange={(v) => setForm({ ...form, operationType: v as OperationType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="alquiler">Alquiler</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            {editing ? (
              <>
                <ClientFinancialsForm clientId={editing.id} />
                <ClientPreferencesForm clientId={editing.id} />
                <InterestedProperties
                  clientId={editing.id}
                  interests={interests}
                  properties={properties}
                  onAdd={(propertyId, type) => addInterest(editing.id, propertyId, type)}
                  onRemove={removeInterest}
                  onUpdateType={updateInterestType}
                />
                <TopPropertyMatches
                  matches={getTopMatchesForClient(editing.id)}
                  properties={properties}
                />
              </>
            ) : (
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Guarda el cliente para acceder al <strong>perfil financiero</strong>, <strong>preferencias de búsqueda</strong>, <strong>zonas de interés</strong> y <strong>matching</strong>.
                </p>
              </div>
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
          <p className="text-sm text-muted-foreground">Se moverá a <strong>{deleteTarget?.name}</strong> a la papelera de reciclaje y podrás restaurarlo desde Ajustes.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CsvImportDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        onImport={handleCsvImport}
        fieldMap={CSV_FIELD_MAP}
        entityName="clientes"
      />
    </Layout>
  );
};

export default Clients;
