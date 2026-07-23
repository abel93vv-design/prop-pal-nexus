import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Search, Mail, Phone, Plus, Pencil, Trash2, PhoneCall, ArrowUpDown, Kanban, Download, Upload, FileText, X, SlidersHorizontal } from "lucide-react";
import { ClientsAdvancedFilters, AdvFilters, emptyAdvFilters, countActiveFilters } from "@/components/ClientsAdvancedFilters";
import { Client, ClientType, LeadStatus, OperationType, DocumentType } from "@/types/crm";
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
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { useUserRole } from "@/hooks/useUserRole";

const EXTRAS_OPTIONS = ['ascensor', 'terraza', 'piscina', 'garaje', 'aire_acondicionado', 'acepta_mascotas'] as const;
const EXTRA_LABELS: Record<string, string> = {
  ascensor: 'Ascensor', terraza: 'Terraza', piscina: 'Piscina',
  garaje: 'Garaje', aire_acondicionado: 'Aire acondicionado', acepta_mascotas: 'Acepta mascotas',
};

const operationLabels: Record<string, string> = { compra: 'Compra', alquiler: 'Alquiler', ambos: 'Ambos', venta: 'Venta' };
const operationColors: Record<string, string> = {
  compra: 'bg-primary/10 text-primary border-primary/20',
  alquiler: 'bg-info/10 text-info border-info/20',
  ambos: 'bg-warning/10 text-warning border-warning/20',
  venta: 'bg-success/10 text-success border-success/20',
};

type FinancingValue = 'none' | 'contado' | 'necesita' | 'preaprobada';
type FinancialsState = {
  available_cash: number; monthly_income: number; debt_ratio: number;
  monthly_debts: number; financing: FinancingValue;
};
type PreferencesState = {
  min_price: number; max_price: number; min_surface: number; max_surface: number;
  min_bedrooms: number; min_bathrooms: number; preferred_types: string[];
  preferred_locations: string[]; required_extras: string[]; neighborhood: string; selected_zones: string[];
};

const emptyFinancials: FinancialsState = {
  available_cash: 0, monthly_income: 0, debt_ratio: 0,
  monthly_debts: 0, financing: 'none',
};
const emptyPreferences: PreferencesState = {
  min_price: 0, max_price: 0, min_surface: 0, max_surface: 0,
  min_bedrooms: 0, min_bathrooms: 0, preferred_types: [],
  preferred_locations: [], required_extras: [], neighborhood: '', selected_zones: [],
};

function FinancialsFields({ value, onChange }: { value: FinancialsState; onChange: (v: FinancialsState) => void }) {
  const set = (patch: Partial<FinancialsState>) => onChange({ ...value, ...patch });
  return (
    <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Perfil Financiero</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Ahorros disponibles (€)</Label><Input type="number" value={value.available_cash || ""} onChange={e => set({ available_cash: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Ingresos netos/mes (€)</Label><Input type="number" value={value.monthly_income || ""} onChange={e => set({ monthly_income: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Deudas mensuales (€)</Label><Input type="number" value={value.monthly_debts || ""} onChange={e => set({ monthly_debts: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Ratio endeudamiento (%)</Label><Input type="number" value={value.debt_ratio || ""} onChange={e => set({ debt_ratio: Number(e.target.value) })} /></div>
      </div>
      <div>
        <Label className="text-xs">Financiación</Label>
        <Select
          value={value.mortgage_preapproved ? 'preaprobada' : value.mortgage_needed ? 'necesita' : 'contado'}
          onValueChange={(v) => set({
            mortgage_needed: v !== 'contado',
            mortgage_preapproved: v === 'preaprobada',
          })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="contado">Al contado</SelectItem>
            <SelectItem value="necesita">Necesita hipoteca</SelectItem>
            <SelectItem value="preaprobada">Hipoteca pre-aprobada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function PreferencesFields({ value, onChange }: { value: PreferencesState; onChange: (v: PreferencesState) => void }) {
  const set = (patch: Partial<PreferencesState>) => onChange({ ...value, ...patch });
  const toggleExtra = (extra: string) => {
    set({
      required_extras: value.required_extras.includes(extra)
        ? value.required_extras.filter(e => e !== extra)
        : [...value.required_extras, extra],
    });
  };
  return (
    <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferencias de Búsqueda</p>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Presup. mínimo (€)</Label><Input type="number" value={value.min_price || ""} onChange={e => set({ min_price: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Presup. máximo (€)</Label><Input type="number" value={value.max_price || ""} onChange={e => set({ max_price: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Sup. mínima (m²)</Label><Input type="number" value={value.min_surface || ""} onChange={e => set({ min_surface: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Sup. máxima (m²)</Label><Input type="number" value={value.max_surface || ""} onChange={e => set({ max_surface: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Hab. mínimas</Label><Input type="number" value={value.min_bedrooms || ""} onChange={e => set({ min_bedrooms: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Baños mínimos</Label><Input type="number" value={value.min_bathrooms || ""} onChange={e => set({ min_bathrooms: Number(e.target.value) })} /></div>
      </div>
      <ZoneSelector
        selectedZones={value.selected_zones || []}
        onChange={(zones) => set({ selected_zones: zones })}
      />
      <div>
        <Label className="text-xs">Tipología deseada</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {['piso', 'casa', 'local', 'terreno', 'parking'].map(t => (
            <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox
                checked={value.preferred_types.includes(t)}
                onCheckedChange={() => set({
                  preferred_types: value.preferred_types.includes(t)
                    ? value.preferred_types.filter(x => x !== t)
                    : [...value.preferred_types, t],
                })}
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
              <Checkbox checked={value.required_extras.includes(extra)} onCheckedChange={() => toggleExtra(extra)} />
              {EXTRA_LABELS[extra] || extra}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditFinancialsForm({ clientId }: { clientId: string }) {
  const { financials, loading, save } = useClientFinancials(clientId);
  const [form, setForm] = useState<FinancialsState>(emptyFinancials);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (financials) setForm({
      available_cash: financials.available_cash, monthly_income: financials.monthly_income,
      debt_ratio: financials.debt_ratio, monthly_debts: (financials as any).monthly_debts || 0,
      mortgage_needed: financials.mortgage_needed, mortgage_preapproved: financials.mortgage_preapproved,
    });
  }, [financials]);

  if (loading) return null;
  const handleSave = () => { save(form); setDirty(false); };

  return (
    <>
      <FinancialsFields value={form} onChange={(v) => { setForm(v); setDirty(true); }} />
      {dirty && <Button size="sm" onClick={handleSave} className="w-full">Guardar financiero</Button>}
    </>
  );
}

function EditPreferencesForm({ clientId }: { clientId: string }) {
  const { preferences, loading, save } = useClientPreferences(clientId);
  const [form, setForm] = useState<PreferencesState>(emptyPreferences);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (preferences) setForm({
      min_price: preferences.min_price, max_price: preferences.max_price,
      min_surface: preferences.min_surface, max_surface: preferences.max_surface,
      min_bedrooms: preferences.min_bedrooms, min_bathrooms: preferences.min_bathrooms,
      preferred_types: preferences.preferred_types, preferred_locations: preferences.preferred_locations,
      required_extras: (preferences as any).required_extras || [],
      neighborhood: (preferences as any).neighborhood || '',
      selected_zones: (preferences as any).selected_zones || [],
    });
  }, [preferences]);

  if (loading) return null;
  const handleSave = () => { save(form); setDirty(false); };

  return (
    <>
      <PreferencesFields value={form} onChange={(v) => { setForm(v); setDirty(true); }} />
      {dirty && <Button size="sm" onClick={handleSave} className="w-full">Guardar preferencias</Button>}
    </>
  );
}

const typeLabels: Record<ClientType, string> = { comprador: 'Comprador', vendedor: 'Vendedor', arrendador: 'Arrendador', arrendatario: 'Arrendatario' };
const statusLabels: Record<LeadStatus, string> = { nuevo: 'Nuevo', contactado: 'Contactado', en_negociacion: 'En negociación', cerrado: 'Cerrado', inactivo: 'Inactivo' };
const statusColors: Record<LeadStatus, string> = {
  nuevo: 'bg-info/10 text-info border-info/20',
  contactado: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  en_negociacion: 'bg-warning/10 text-warning border-warning/20',
  cerrado: 'bg-success/10 text-success border-success/20',
  inactivo: 'bg-muted text-muted-foreground border-border',
};

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'fotocasa', label: 'Fotocasa' },
  { value: 'idealista', label: 'Idealista' },
  { value: 'milanuncios', label: 'Milanuncios' },
  { value: 'habitaclia', label: 'Habitaclia' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'web', label: 'Web' },
  { value: 'redes_sociales', label: 'Redes sociales' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'escaparate', label: 'Escaparate' },
  { value: 'wallapop', label: 'Wallapop' },
  { value: 'publicidad_zona', label: 'Publicidad zona' },
  { value: 'referido', label: 'Referido' },
  { value: 'otros', label: 'Otros' },
];

const emptyClient: Omit<Client, "id"> = {
  name: "", email: "", phone: "", address: "", type: "comprador", leadStatus: "nuevo",
  propertyIds: [], registeredAt: new Date().toISOString().split("T")[0], notes: "",
  agencyId: "", category: "", lastContactedAt: "", contactCount: 0,
  operationType: "compra", source: "",
};


const CLIENT_DOC_TYPE_LABELS: Record<DocumentType, string> = {
  proteccion_datos: 'Protección de Datos',
  contrato: 'Contrato',
  nota_simple: 'Nota Simple',
  fotos: 'Fotos',
  otros: 'Otros',
};

const AVAILABLE_CLIENT_DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'proteccion_datos', label: 'Protección de Datos' },
  { value: 'otros', label: 'Otros' },
];

const ClientDocumentsSection = ({ clientId, documents, onAdd, onDelete }: {
  clientId: string;
  documents: { id: string; name: string; type: DocumentType; uploadedAt: string; file?: string }[];
  onAdd: (name: string, type: DocumentType, filePath: string) => Promise<void>;
  onDelete: (id: string, filePath?: string) => Promise<void>;
}) => {
  const { tenantId } = useUserRole();
  const { toast } = useToast();
  const [customName, setCustomName] = useState("");
  const [type, setType] = useState<DocumentType>('proteccion_datos');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!tenantId) { toast({ title: 'Sin tenant activo', variant: 'destructive' }); return; }
    if (type === 'otros' && !customName.trim()) {
      toast({ title: 'Indica un nombre', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${tenantId}/clients/${clientId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const finalName = type === 'proteccion_datos'
        ? CLIENT_DOC_TYPE_LABELS.proteccion_datos
        : (customName.trim() || file.name);
      await onAdd(finalName, type, path);
      setCustomName("");
      setType('proteccion_datos');
    } catch (e: any) {
      toast({ title: 'Error subiendo documento', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e: any) {
      toast({ title: 'No se pudo abrir el documento', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, filePath?: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id, filePath);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Documentos del cliente</p>
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {AVAILABLE_CLIENT_DOC_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {type === 'otros' && (
          <Input
            placeholder="Nombre del documento"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            className="flex-1 min-w-[150px]"
          />
        )}
        <label className="inline-flex">
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <Button asChild size="sm" disabled={uploading}>
            <span><Upload className="w-3.5 h-3.5 mr-1" />{uploading ? 'Subiendo…' : 'Subir archivo'}</span>
          </Button>
        </label>
      </div>
      {documents.length === 0
        ? <p className="text-xs text-muted-foreground text-center py-2">Sin documentos.</p>
        : <div className="space-y-1.5">
            {documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded border border-border bg-card">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{CLIENT_DOC_TYPE_LABELS[d.type] || d.type} · {new Date(d.uploadedAt).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {d.file && (
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => handleView(d.file!)}>
                      Ver
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={deletingId === d.id} onClick={() => handleDelete(d.id, d.file)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>}
    </div>
  );
};

const Clients = () => {
  const { clients, agencies, properties, addClient, updateClient, deleteClient, documents, addDocument, deleteDocument } = useData();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { definitions: customFields } = useCustomFieldDefinitions('client');
  const { interests, addInterest, removeInterest, updateInterestType } = useInterests();
  const { getTopMatchesForClient } = useMatchCenter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [contactSort, setContactSort] = useState<string>("none");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>(emptyClient);
  const [createFinancials, setCreateFinancials] = useState<FinancialsState>(emptyFinancials);
  const [createPreferences, setCreatePreferences] = useState<PreferencesState>(emptyPreferences);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [cfValues, setCfValues] = useState<Record<string, any>>({});
  const { values: loadedCfValues, saveValues: saveCfValues } = useCustomFieldValues(editing?.id ?? null);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [financialsMap, setFinancialsMap] = useState<Record<string, { mortgage_needed: boolean; mortgage_preapproved: boolean; available_cash: number; monthly_income: number }>>({});
  const [preferencesMap, setPreferencesMap] = useState<Record<string, { min_price: number; max_price: number; min_surface: number; max_surface: number; min_bedrooms: number; min_bathrooms: number; preferred_types: string[]; selected_zones: string[]; required_extras: string[] }>>({});
  const [advOpen, setAdvOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvFilters>(emptyAdvFilters);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('client_financials')
      .select('client_id, mortgage_needed, mortgage_preapproved, available_cash, monthly_income')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        if (!data) return;
        const map: any = {};
        data.forEach((r: any) => {
          map[r.client_id] = {
            mortgage_needed: !!r.mortgage_needed,
            mortgage_preapproved: !!r.mortgage_preapproved,
            available_cash: Number(r.available_cash) || 0,
            monthly_income: Number(r.monthly_income) || 0,
          };
        });
        setFinancialsMap(map);
      });
    supabase
      .from('client_preferences')
      .select('client_id, min_price, max_price, min_surface, max_surface, min_bedrooms, min_bathrooms, preferred_types, selected_zones, required_extras')
      .eq('tenant_id', tenantId)
      .then(({ data }) => {
        if (!data) return;
        const map: any = {};
        data.forEach((r: any) => {
          map[r.client_id] = {
            min_price: Number(r.min_price) || 0,
            max_price: Number(r.max_price) || 0,
            min_surface: Number(r.min_surface) || 0,
            max_surface: Number(r.max_surface) || 0,
            min_bedrooms: Number(r.min_bedrooms) || 0,
            min_bathrooms: Number(r.min_bathrooms) || 0,
            preferred_types: r.preferred_types || [],
            selected_zones: r.selected_zones || [],
            required_extras: r.required_extras || [],
          };
        });
        setPreferencesMap(map);
      });
  }, [tenantId, clients.length, dialogOpen]);

  const cleanupBodyLocks = () => {
    const reset = () => {
      const stillOpen = document.querySelector('[data-state="open"][role="dialog"], [data-radix-popper-content-wrapper]');
      if (stillOpen) return;
      if (document.body.style.pointerEvents === "none") document.body.style.pointerEvents = "";
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      document.body.removeAttribute("data-scroll-locked");
    };
    [0, 50, 150, 300, 600].forEach(t => setTimeout(reset, t));
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      cleanupBodyLocks();
      if (returnTo) {
        const target = returnTo;
        setReturnTo(null);
        setTimeout(() => navigate(target), 0);
      }
    }
  };

  const CSV_FIELD_MAP = [
    { key: "name", label: "Nombre", required: true },
    { key: "email", label: "Email" },
    { key: "phone", label: "Teléfono", required: true },
    { key: "type", label: "Tipo (comprador/vendedor/inquilino/propietario)" },
    { key: "operationType", label: "Operación (compra/alquiler/venta)" },
    { key: "leadStatus", label: "Estado Lead" },
    { key: "notes", label: "Notas" },
  ];

  const handleCsvImport = async (rows: Record<string, string>[]) => {
    for (const row of rows) {
      await addClient({
        name: row.name || "Sin nombre",
        email: row.email || "",
        phone: row.phone || "",
        address: "",
        type: (["comprador", "vendedor", "inquilino", "propietario"].includes(row.type?.toLowerCase()) ? row.type.toLowerCase() : "comprador") as ClientType,
        operationType: (["compra", "alquiler", "venta", "ambos"].includes(row.operationType?.toLowerCase()) ? row.operationType.toLowerCase() : "compra") as OperationType,
        leadStatus: (["nuevo", "contactado", "en_negociacion", "cerrado", "inactivo"].includes(row.leadStatus?.toLowerCase()) ? row.leadStatus.toLowerCase() : "nuevo") as LeadStatus,
        category: "",
        notes: row.notes || "",
        propertyIds: [],
        registeredAt: new Date().toISOString().split("T")[0],
        agencyId: "",
        lastContactedAt: "",
        contactCount: 0,
      });
    }
  };

  const normalizePhone = (p: string) => (p || "").replace(/\D/g, "");

  const categoryOptions = Array.from(new Set(clients.map(c => c.category).filter(Boolean))) as string[];

  const inRange = (n: number, min: string, max: string) => {
    if (min && n < Number(min)) return false;
    if (max && n > Number(max)) return false;
    return true;
  };
  const overlaps = (a: string[], b: string[]) => a.some(x => b.includes(x));

  const filtered = clients
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q);
      const matchType = typeFilter === "all" || c.type === typeFilter;
      const matchAgency = agencyFilter === "all" || c.agencyId === agencyFilter;
      if (!(matchSearch && matchType && matchAgency)) return false;

      // Advanced filters
      const f = advFilters;
      if (f.types.length && !f.types.includes(c.type)) return false;
      if (f.operations.length && !f.operations.includes(c.operationType)) return false;
      if (f.leadStatuses.length && !f.leadStatuses.includes(c.leadStatus)) return false;
      if (f.sources.length && !f.sources.includes(c.source || '')) return false;
      if (f.agencyIds.length && !f.agencyIds.includes(c.agencyId)) return false;
      if (f.categories.length && !f.categories.includes(c.category)) return false;

      const lastMs = c.lastContactedAt ? new Date(c.lastContactedAt).getTime() : 0;
      if (f.lastContactFrom && lastMs < new Date(f.lastContactFrom).getTime()) return false;
      if (f.lastContactTo && (!lastMs || lastMs > new Date(f.lastContactTo).getTime() + 86399999)) return false;
      if (!inRange(c.contactCount || 0, f.minContacts, f.maxContacts)) return false;
      if (f.onlyUncontacted && (c.contactCount || 0) > 0) return false;

      const regMs = c.registeredAt ? new Date(c.registeredAt).getTime() : 0;
      if (f.registeredFrom && regMs < new Date(f.registeredFrom).getTime()) return false;
      if (f.registeredTo && regMs > new Date(f.registeredTo).getTime() + 86399999) return false;

      const fin = financialsMap[c.id];
      if (f.financing !== 'any') {
        if (!fin) return false;
        if (f.financing === 'contado' && fin.mortgage_needed) return false;
        if (f.financing === 'necesita' && (!fin.mortgage_needed || fin.mortgage_preapproved)) return false;
        if (f.financing === 'preaprobada' && !fin.mortgage_preapproved) return false;
      }
      if (f.minCash || f.maxCash) {
        if (!fin) return false;
        if (!inRange(fin.available_cash, f.minCash, f.maxCash)) return false;
      }
      if (f.minIncome || f.maxIncome) {
        if (!fin) return false;
        if (!inRange(fin.monthly_income, f.minIncome, f.maxIncome)) return false;
      }

      const pref = preferencesMap[c.id];
      const needsPref = f.minPrice || f.maxPrice || f.minSurface || f.maxSurface || f.minBedrooms || f.minBathrooms || f.preferredTypes.length || f.selectedZones.length || f.requiredExtras.length;
      if (needsPref) {
        if (!pref) return false;
        if (f.minPrice && pref.max_price && pref.max_price < Number(f.minPrice)) return false;
        if (f.maxPrice && pref.min_price && pref.min_price > Number(f.maxPrice)) return false;
        if (f.minSurface && pref.max_surface && pref.max_surface < Number(f.minSurface)) return false;
        if (f.maxSurface && pref.min_surface && pref.min_surface > Number(f.maxSurface)) return false;
        if (f.minBedrooms && pref.min_bedrooms < Number(f.minBedrooms)) return false;
        if (f.minBathrooms && pref.min_bathrooms < Number(f.minBathrooms)) return false;
        if (f.preferredTypes.length && !overlaps(f.preferredTypes, pref.preferred_types)) return false;
        if (f.selectedZones.length && !overlaps(f.selectedZones, pref.selected_zones)) return false;
        if (f.requiredExtras.length && !f.requiredExtras.every(x => pref.required_extras.includes(x))) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (contactSort === "none") return 0;
      const dateA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
      const dateB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
      return contactSort === "desc" ? dateB - dateA : dateA - dateB;
    });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyClient);
    setCfValues({});
    setCreateFinancials(emptyFinancials);
    setCreatePreferences(emptyPreferences);
    setDialogOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type, leadStatus: c.leadStatus, propertyIds: c.propertyIds, registeredAt: c.registeredAt, notes: c.notes, agencyId: c.agencyId, category: c.category, lastContactedAt: c.lastContactedAt, contactCount: c.contactCount, operationType: c.operationType || 'compra', source: c.source || '' });
    setCfValues(loadedCfValues);
    setDialogOpen(true);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    const from = searchParams.get('from');
    if (editId && clients.length > 0) {
      const c = clients.find(x => x.id === editId);
      if (c) {
        if (from && from.startsWith('propiedad:')) {
          setReturnTo(`/propiedades?edit=${from.slice('propiedad:'.length)}`);
        }
        cleanupBodyLocks();
        setTimeout(() => openEdit(c), 0);
        searchParams.delete('edit');
        searchParams.delete('from');
        setSearchParams(searchParams, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, searchParams]);
  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }

    // Validación: teléfono único
    const phoneNorm = normalizePhone(form.phone);
    if (phoneNorm) {
      const duplicate = clients.find(c => normalizePhone(c.phone) === phoneNorm && c.id !== editing?.id);
      if (duplicate) {
        toast({ title: "Teléfono duplicado", description: `Ya existe un cliente con ese número: ${duplicate.name}`, variant: "destructive" });
        return;
      }
    }

    if (editing) {
      await updateClient({ ...editing, ...form });
      await saveCfValues(editing.id, cfValues);
      toast({ title: "Cliente actualizado" });
      handleDialogOpenChange(false);
    } else {
      const created = await addClient(form);
      const newId = created?.id;
      if (newId && tenantId) {
        // Persist financials & preferences only if user filled something
        const hasFin = Object.values(createFinancials).some(v => typeof v === 'number' ? v > 0 : v === true);
        if (hasFin) {
          await supabase.from('client_financials').insert({ ...createFinancials, tenant_id: tenantId, client_id: newId });
        }
        const hasPref =
          createPreferences.max_price > 0 || createPreferences.min_price > 0 ||
          createPreferences.min_surface > 0 || createPreferences.max_surface > 0 ||
          createPreferences.min_bedrooms > 0 || createPreferences.min_bathrooms > 0 ||
          createPreferences.preferred_types.length > 0 ||
          createPreferences.required_extras.length > 0 ||
          createPreferences.selected_zones.length > 0;
        if (hasPref) {
          await supabase.from('client_preferences').insert({ ...createPreferences, tenant_id: tenantId, client_id: newId });
        }
      }
      toast({ title: "Cliente creado" });
      handleDialogOpenChange(false);
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
    const headers = ['Nombre', 'Email', 'Teléfono', 'Tipo', 'Operación', 'Estado Lead', 'Últ. Contacto', 'Nº Contactos', 'Notas'];
    const rows = filtered.map(c => [
      c.name, c.email, c.phone,
      typeLabels[c.type] || c.type,
      operationLabels[c.operationType] || c.operationType,
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
            <p className="text-sm text-muted-foreground mt-1">
              {countActiveFilters(advFilters) > 0 || search || typeFilter !== 'all' || agencyFilter !== 'all'
                ? `Mostrando ${filtered.length} de ${clients.length} clientes`
                : `${clients.length} clientes registrados`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && <Button onClick={exportCSV} variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Exportar CSV</Button>}
            <Button onClick={() => setCsvDialogOpen(true)} variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" />Importar CSV</Button>
            <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo Cliente</Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o teléfono..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Inmobiliaria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={contactSort !== "none" ? "secondary" : "outline"} size="sm" onClick={cycleContactSort} className="gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Últ. contacto {sortLabel}
          </Button>
          <Button variant={countActiveFilters(advFilters) > 0 ? "secondary" : "outline"} size="sm" onClick={() => setAdvOpen(true)} className="gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros avanzados{countActiveFilters(advFilters) > 0 ? ` (${countActiveFilters(advFilters)})` : ''}
          </Button>
        </div>

        {countActiveFilters(advFilters) > 0 && (
          <ActiveFilterChips filters={advFilters} onChange={setAdvFilters} />
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold text-xs">Nombre</TableHead>
                <TableHead className="font-semibold text-xs">Contacto</TableHead>
                <TableHead className="font-semibold text-xs">Financiación</TableHead>
                <TableHead className="font-semibold text-xs">Operación</TableHead>
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
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {c.email && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{c.email}</p>}
                      {c.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const f = financialsMap[c.id];
                      if (!f) return <span className="text-xs text-muted-foreground italic">—</span>;
                      if (f.mortgage_preapproved) return <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Hipoteca pre-aprobada</Badge>;
                      if (f.mortgage_needed) return <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">Necesita hipoteca</Badge>;
                      return <Badge variant="outline" className="text-[10px] bg-info/10 text-info border-info/20">Al contado</Badge>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${operationColors[c.operationType] || ''}`}>
                      {operationLabels[c.operationType] || c.operationType}
                    </Badge>
                  </TableCell>
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

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Origen del cliente</Label>
              <Select value={form.source || "none"} onValueChange={(v) => setForm({ ...form, source: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
                <EditFinancialsForm clientId={editing.id} />
                <EditPreferencesForm clientId={editing.id} />
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
                  fromClientId={editing.id}
                />
                <ClientDocumentsSection
                  clientId={editing.id}
                  documents={documents.filter(d => d.clientId === editing.id)}
                  onAdd={async (name, type, filePath) => { await addDocument({ name, type, file: filePath, propertyId: '', clientId: editing.id, uploadedAt: new Date().toISOString() }); toast({ title: 'Documento añadido' }); }}
                  onDelete={async (id, filePath) => {
                    try {
                      await deleteDocument(id);
                      if (filePath) {
                        try { await supabase.storage.from('documents').remove([filePath]); } catch (e) { console.warn('No se pudo borrar el archivo del storage:', e); }
                      }
                      toast({ title: 'Documento eliminado' });
                    } catch (e: any) {
                      toast({ title: 'Error al eliminar', description: e?.message || 'Inténtalo de nuevo', variant: 'destructive' });
                    }
                  }}
                />

              </>
            ) : (
              <>
                <FinancialsFields value={createFinancials} onChange={setCreateFinancials} />
                <PreferencesFields value={createPreferences} onChange={setCreatePreferences} />
                <p className="text-xs text-muted-foreground italic">Guarda primero el cliente para poder adjuntar documentos (Protección de datos, contratos, etc.).</p>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {editing && (
              <Button
                variant="outline"
                onClick={() => markContacted(editing)}
                className="mr-auto"
                title="Registrar contacto con este cliente"
              >
                <PhoneCall className="w-4 h-4 mr-1 text-success" />
                Marcar contactado{typeof editing.contactCount === 'number' ? ` (${editing.contactCount})` : ''}
              </Button>
            )}
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>Cancelar</Button>
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

      <ClientsAdvancedFilters
        open={advOpen}
        onOpenChange={setAdvOpen}
        filters={advFilters}
        onChange={setAdvFilters}
        onReset={() => setAdvFilters(emptyAdvFilters)}
        agencies={agencies}
        categories={categoryOptions}
      />
    </Layout>
  );
};

const CHIP_LABELS: Record<string, string> = {
  comprador: 'Comprador', vendedor: 'Vendedor', arrendador: 'Arrendador', arrendatario: 'Arrendatario',
  compra: 'Compra', alquiler: 'Alquiler', venta: 'Venta', ambos: 'Ambos',
  nuevo: 'Nuevo', contactado: 'Contactado', en_negociacion: 'En negociación', cerrado: 'Cerrado', inactivo: 'Inactivo',
  contado: 'Al contado', necesita: 'Necesita hipoteca', preaprobada: 'Hipoteca pre-aprobada',
};
const chipLabel = (v: string) => CHIP_LABELS[v] || v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ');

function ActiveFilterChips({ filters, onChange }: { filters: AdvFilters; onChange: (f: AdvFilters) => void }) {
  const chips: { label: string; clear: () => void }[] = [];
  const arrayKeys: { key: keyof AdvFilters; prefix: string }[] = [
    { key: 'types', prefix: 'Tipo' },
    { key: 'operations', prefix: 'Operación' },
    { key: 'leadStatuses', prefix: 'Estado' },
    { key: 'sources', prefix: 'Origen' },
    { key: 'agencyIds', prefix: 'Inmob.' },
    { key: 'categories', prefix: 'Cat.' },
    { key: 'preferredTypes', prefix: 'Tipología' },
    { key: 'selectedZones', prefix: 'Zona' },
    { key: 'requiredExtras', prefix: 'Extra' },
  ];
  arrayKeys.forEach(({ key, prefix }) => {
    (filters[key] as string[]).forEach(v => {
      chips.push({
        label: `${prefix}: ${chipLabel(v)}`,
        clear: () => onChange({ ...filters, [key]: (filters[key] as string[]).filter(x => x !== v) } as AdvFilters),
      });
    });
  });
  if (filters.financing !== 'any') {
    chips.push({ label: `Financiación: ${chipLabel(filters.financing)}`, clear: () => onChange({ ...filters, financing: 'any' }) });
  }
  if (filters.onlyUncontacted) {
    chips.push({ label: 'Sin contactar', clear: () => onChange({ ...filters, onlyUncontacted: false }) });
  }
  const rangeKeys: { min: keyof AdvFilters; max: keyof AdvFilters; label: string }[] = [
    { min: 'lastContactFrom', max: 'lastContactTo', label: 'Últ. contacto' },
    { min: 'minContacts', max: 'maxContacts', label: 'Nº contactos' },
    { min: 'minCash', max: 'maxCash', label: 'Ahorros' },
    { min: 'minIncome', max: 'maxIncome', label: 'Ingresos' },
    { min: 'minPrice', max: 'maxPrice', label: 'Precio' },
    { min: 'minSurface', max: 'maxSurface', label: 'Superficie' },
    { min: 'registeredFrom', max: 'registeredTo', label: 'Registrado' },
  ];
  rangeKeys.forEach(({ min, max, label }) => {
    const vMin = filters[min] as string;
    const vMax = filters[max] as string;
    if (vMin || vMax) {
      chips.push({
        label: `${label}: ${vMin || '…'} – ${vMax || '…'}`,
        clear: () => onChange({ ...filters, [min]: '', [max]: '' } as AdvFilters),
      });
    }
  });
  (['minBedrooms', 'minBathrooms'] as const).forEach(k => {
    if (filters[k]) chips.push({
      label: `${k === 'minBedrooms' ? 'Hab. mín.' : 'Baños mín.'}: ${filters[k]}`,
      clear: () => onChange({ ...filters, [k]: '' }),
    });
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
          {c.label}
          <button type="button" onClick={c.clear} className="ml-0.5 hover:bg-background/50 rounded p-0.5">
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export default Clients;
