import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, MapPin, Bed, Bath, Ruler, Search, Plus, Pencil, Trash2, FileText, Upload, X, Kanban, FileSignature, Newspaper, ArrowRightLeft, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { PortalPublicationControls } from "@/components/PortalPublicationControls";
import { PropertySeoChecklist } from "@/components/PropertySeoChecklist";
import { usePortalConnections, usePropertyPortalStatus, validatePropertyForPortal } from "@/hooks/usePortals";
import { PropertyZoneSelector } from "@/components/PropertyZoneSelector";
import { Property, PropertyType, PropertyStatus, Document, DocumentType, OperationType } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { useCustomFieldDefinitions, useCustomFieldValues } from "@/hooks/useCustomFields";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useInterests } from "@/hooks/useInterests";
import { InterestedClients } from "@/components/InterestManager";
import { useMatchCenter } from "@/hooks/useMatchCenter";
import { TopClientMatches } from "@/components/MatchScoreWidgets";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenant } from "@/context/TenantContext";
import { supabase } from "@/integrations/supabase/client";

const typeLabels: Record<PropertyType, string> = { piso: 'Piso', casa: 'Casa', local: 'Local', terreno: 'Terreno', parking: 'Parking' };
const statusLabels: Record<PropertyStatus, string> = { disponible: 'Disponible', reservado: 'Reservado', vendido_alquilado: 'Vendido/Alquilado', no_disponible: 'No Disponible' };
const docTypeLabels: Record<DocumentType, string> = { nota_simple: 'Nota Simple', contrato: 'Contrato', fotos: 'Fotos', proteccion_datos: 'Protección de Datos', otros: 'Otros' };
const statusColors: Record<PropertyStatus, string> = {
  disponible: 'bg-success/10 text-success border-success/20',
  reservado: 'bg-warning/10 text-warning border-warning/20',
  vendido_alquilado: 'bg-muted text-muted-foreground border-border',
  no_disponible: 'bg-destructive/10 text-destructive border-destructive/20',
};



const conditionLabels: Record<string, string> = {
  '': 'Sin especificar',
  entrar_a_vivir: 'Entrar a vivir',
  a_reformar: 'A reformar',
  reformado: 'Reformado',
  traspaso: 'Traspaso',
  cambio_de_uso: 'Cambio de uso',
  urbano: 'Urbano',
  urbanizable: 'Urbanizable',
  rustico: 'Rústico',
};

const defaultExtras = { reference: '', year_built: null as number | null, postal_code: '', latitude: null as number | null, longitude: null as number | null, built_surface: 0, plot_surface: 0, energy_cert: 'en_tramite', neighborhood: '', floor: null as number | null, community_fees: 0, ibi_annual: 0, has_elevator: false, has_terrace: false, has_pool: false, has_garage: false, has_air_conditioning: false };

const emptyProperty: Omit<Property, "id"> = {
  title: "", address: "", type: "piso", status: "disponible", price: 0, surface: 0,
  bedrooms: 0, bathrooms: 0, photos: [], agentId: "", interestedClientIds: [],
  publishedAt: new Date().toISOString().split("T")[0], description: "",
  agencyId: "", category: "residencial", ...defaultExtras,
  operationType: "venta", monthly_rent: 0, condition: "", unavailable_reason: "",
  listing_type: "noticia", ne_start_date: null, ne_end_date: null,
  contact_name: "", contact_phone: "", contact_notes: "",
};

const getDaysUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const end = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
};

const emptyDoc: Omit<Document, "id"> = {
  name: "", type: "nota_simple", file: "", uploadedAt: new Date().toISOString().split("T")[0], propertyId: "",
};

const Properties = () => {
  const { properties, users, agencies, clients, documents, addProperty, updateProperty, deleteProperty, convertListingType, addDocument, deleteDocument } = useData();
  const { isAdmin, can } = useUserRole();
  const canEditNe = can("ne", "edit");
  const canEditNoticias = can("noticias", "edit");
  const canDeleteNe = can("ne", "delete");
  const canDeleteNoticias = can("noticias", "delete");
  const canEditListing = (lt?: string | null) => ((lt || "noticia") === "ne" ? canEditNe : canEditNoticias);
  const canDeleteListing = (lt?: string | null) => ((lt || "noticia") === "ne" ? canDeleteNe : canDeleteNoticias);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await qc.refetchQueries({ queryKey: ['properties'] });
      toast({ title: 'Lista actualizada' });
    } finally {
      setRefreshing(false);
    }
  };
  const navigate = useNavigate();
  const { listingType: routeListing } = useParams<{ listingType?: string }>();
  const activeListing: 'ne' | 'noticia' | 'all' =
    routeListing === 'ne' ? 'ne' : routeListing === 'noticias' ? 'noticia' : 'all';
  const { definitions: customFields } = useCustomFieldDefinitions('property');
  const { interests, addInterest, removeInterest, updateInterestType } = useInterests();
  const { getTopMatchesForProperty, runMatching, calculating } = useMatchCenter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [operationFilter, setOperationFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<Omit<Property, "id">>(emptyProperty);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [convertTarget, setConvertTarget] = useState<Property | null>(null);
  const [convertNeStart, setConvertNeStart] = useState<string>("");
  const [convertNeEnd, setConvertNeEnd] = useState<string>("");
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);
  const [unavailableReasonDraft, setUnavailableReasonDraft] = useState("");
  const [docsProperty, setDocsProperty] = useState<Property | null>(null);
  const [docForm, setDocForm] = useState<Omit<Document, "id">>(emptyDoc);
  const [cfValues, setCfValues] = useState<Record<string, any>>({});
  const { values: loadedCfValues, saveValues: saveCfValues } = useCustomFieldValues(editing?.id ?? null);

  // Selección múltiple para publicación masiva en portales
  const { getConnection } = usePortalConnections();
  const { bulkTogglePublication, getPublishedCount } = usePropertyPortalStatus();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleBulkPublish = async (portal: 'fotocasa' | 'idealista', publish: boolean) => {
    const conn = getConnection(portal);
    const portalLabel = portal === 'fotocasa' ? 'Fotocasa' : 'Idealista';
    if (!conn?.is_active) {
      toast({ title: "Portal no configurado", description: `Activa ${portalLabel} en Ajustes > Conexiones`, variant: "destructive" });
      return;
    }
    const targets = properties.filter(p => selected.has(p.id));
    if (targets.length === 0) return;

    setBulkWorking(true);
    try {
      if (publish) {
        const valid = targets.filter(p => validatePropertyForPortal(p).length === 0 && p.status !== 'vendido_alquilado' && p.status !== 'no_disponible');
        const skipped = targets.length - valid.length;
        const room = Math.max((conn.max_ads || 0) - getPublishedCount(portal), 0);
        const allowed = valid.slice(0, room);
        if (allowed.length > 0) await bulkTogglePublication(allowed.map(p => p.id), portal, true);
        toast({
          title: "Publicación masiva",
          description: `${allowed.length} publicadas en ${portalLabel}`
            + (skipped > 0 ? ` · ${skipped} omitidas por datos incompletos o estado no disponible` : "")
            + (valid.length > allowed.length ? ` · límite de ${conn.max_ads} anuncios alcanzado` : ""),
        });
      } else {
        await bulkTogglePublication(targets.map(p => p.id), portal, false);
        toast({ title: "Despublicación masiva", description: `${targets.length} despublicadas de ${portalLabel}` });
      }
      setSelected(new Set());
    } finally {
      setBulkWorking(false);
    }
  };

  // Cleanup Radix overlay leftover (pointer-events:none / overflow lock) on dialog close.
  // Runs repeatedly to combat Radix re-applying the lock after nested Select dropdowns close.
  const cleanupBodyLocks = () => {
    const reset = () => {
      // Only clear if no other Radix overlay/dialog is still open
      const stillOpen = document.querySelector('[data-state="open"][role="dialog"], [data-radix-popper-content-wrapper]');
      if (stillOpen) return;
      if (document.body.style.pointerEvents === "none") document.body.style.pointerEvents = "";
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      document.body.removeAttribute("data-scroll-locked");
    };
    [0, 50, 150, 300, 600].forEach(t => setTimeout(reset, t));
  };

  const [returnTo, setReturnTo] = useState<string | null>(null);

  const handleDialogOpenChange = (open: boolean) => {
    if (saving) return; // prevent close while saving
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      setForm(emptyProperty);
      setCfValues({});
      cleanupBodyLocks();
      if (returnTo) {
        const target = returnTo;
        setReturnTo(null);
        setTimeout(() => navigate(target), 0);
      }
    }
  };

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchOp = operationFilter === "all" || p.operationType === operationFilter || p.operationType === "ambos" || operationFilter === "ambos";
    const matchListing = activeListing === 'all' || (p.listing_type || 'noticia') === activeListing;
    const matchAgency = agencyFilter === "all" || p.agencyId === agencyFilter;
    return matchSearch && matchType && matchStatus && matchOp && matchListing && matchAgency;
  });

  filtered.sort((a, b) => {
    const da = a.ne_end_date ? new Date(a.ne_end_date).getTime() : Number.POSITIVE_INFINITY;
    const db = b.ne_end_date ? new Date(b.ne_end_date).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });

  // Photos are uploaded to Storage and referenced by a public URL: the web feeds
  // (WordPress, portals) cannot import base64 images.
  const { tenantId } = useTenant();
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const uploadPhotos = async (files: File[]) => {
    if (!tenantId) {
      toast({ title: "Error", description: "No se pudo identificar la inmobiliaria.", variant: "destructive" });
      return;
    }
    setUploadingPhotos(true);
    const base = import.meta.env.VITE_SUPABASE_URL;
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (error) {
        toast({ title: "Error al subir la foto", description: error.message, variant: "destructive" });
        continue;
      }
      const url = `${base}/functions/v1/property-photo/${path}`;
      setForm(prev => ({ ...prev, photos: [...prev.photos, url] }));
    }
    setUploadingPhotos(false);
  };


  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyProperty, listing_type: activeListing === 'all' ? 'noticia' : activeListing });
    setCfValues({});
    setDialogOpen(true);
  };
  const openEdit = (p: Property) => {
    setEditing(p);
    setForm({
      title: p.title, address: p.address, type: p.type, status: p.status, price: p.price, surface: p.surface,
      bedrooms: p.bedrooms, bathrooms: p.bathrooms, photos: p.photos, agentId: p.agentId,
      interestedClientIds: p.interestedClientIds, publishedAt: p.publishedAt, description: p.description,
      agencyId: p.agencyId, category: p.category,
      reference: (p as any).reference || "", year_built: (p as any).year_built ?? null,
      postal_code: p.postal_code || "", latitude: p.latitude, longitude: p.longitude,
      built_surface: p.built_surface || 0, plot_surface: p.plot_surface || 0,
      energy_cert: p.energy_cert || "en_tramite", neighborhood: p.neighborhood || "",
      floor: p.floor, community_fees: p.community_fees || 0, ibi_annual: p.ibi_annual || 0,
      has_elevator: p.has_elevator || false, has_terrace: p.has_terrace || false,
      has_pool: p.has_pool || false, has_garage: p.has_garage || false,
      has_air_conditioning: p.has_air_conditioning || false,
      operationType: p.operationType || "venta", monthly_rent: p.monthly_rent || 0,
      condition: (p as any).condition || "", unavailable_reason: (p as any).unavailable_reason || "",
      listing_type: p.listing_type || "noticia",
      ne_start_date: p.ne_start_date || null,
      ne_end_date: p.ne_end_date || null,
      contact_name: (p as any).contact_name || "",
      contact_phone: (p as any).contact_phone || "",
      contact_notes: (p as any).contact_notes || "",
    });
    setCfValues(loadedCfValues);
    setDialogOpen(true);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    const from = searchParams.get('from');
    if (editId && properties.length > 0) {
      const p = properties.find(x => x.id === editId);
      if (p) {
        if (from && from.startsWith('cliente:')) {
          setReturnTo(`/clientes?edit=${from.slice('cliente:'.length)}`);
        }
        cleanupBodyLocks();
        setTimeout(() => openEdit(p), 0);
        searchParams.delete('edit');
        searchParams.delete('from');
        setSearchParams(searchParams, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, searchParams]);
  const handleSave = async () => {
    if (saving) return;
    if (!form.title.trim() || !form.address.trim()) { toast({ title: "Error", description: "Título y dirección son obligatorios", variant: "destructive" }); return; }
    if (form.listing_type === 'ne' && (!form.ne_start_date || !form.ne_end_date)) {
      toast({ title: "Error", description: "Las fechas de inicio y fin de la NE son obligatorias", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateProperty({ ...editing, ...form });
        await saveCfValues(editing.id, cfValues);
        toast({ title: "Propiedad actualizada" });
      } else {
        await addProperty(form);
        toast({ title: "Propiedad creada" });
      }
      setSaving(false);
      handleDialogOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error al guardar", description: e?.message || "Inténtalo de nuevo", variant: "destructive" });
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProperty(deleteTarget.id);
      toast({ title: "Propiedad movida a la papelera" });
      setDeleteTarget(null);
    } catch {
      // El hook muestra el error concreto.
    }
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {activeListing === 'ne' && <FileSignature className="w-5 h-5 text-primary" />}
              {activeListing === 'noticia' && <Newspaper className="w-5 h-5 text-primary" />}
              {activeListing === 'ne' ? 'Propiedades · NE (firmadas)'
                : activeListing === 'noticia' ? 'Propiedades · Noticias'
                : 'Propiedades'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} {filtered.length === 1 ? 'propiedad' : 'propiedades'}{activeListing !== 'all' ? ' en este apartado' : ' en el sistema'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />Refrescar
            </Button>
            {(activeListing === 'ne' ? canEditNe : canEditNoticias) && (
              <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva {activeListing === 'ne' ? 'NE' : activeListing === 'noticia' ? 'Noticia' : 'Propiedad'}</Button>
            )}
          </div>
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
          <Select value={operationFilter} onValueChange={setOperationFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Operación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="venta">Venta</SelectItem>
              <SelectItem value="alquiler">Alquiler</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Inmobiliaria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const agent = users.find(u => u.id === p.agentId);
            const docCount = documents.filter(d => d.propertyId === p.id).length;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {canEditNe && canEditNoticias && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      title={p.listing_type === 'ne' ? 'Convertir a Noticia' : 'Convertir a NE (firmada)'}
                      onClick={() => setConvertTarget(p)}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                    </Button>
                  )}
                  <Button variant="secondary" size="icon" className="h-7 w-7" title="Crear oportunidad" onClick={() => navigate(`/pipeline?property=${p.id}`)}><Kanban className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" title="Documentos" onClick={() => openDocs(p)}><FileText className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" title={canEditListing(p.listing_type) ? 'Editar' : 'Ver ficha'} onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                  {canDeleteListing(p.listing_type) && (
                    <Button variant="secondary" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </div>
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden relative">
                  {p.photos.length > 0 ? (
                    <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-12 h-12 text-primary/30" />
                  )}
                  {p.listing_type === 'ne' && (() => {
                    if (!p.ne_end_date) {
                      return (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                          NE sin fecha
                        </div>
                      );
                    }
                    const days = getDaysUntil(p.ne_end_date)!;
                    const cls = days <= 15 ? 'bg-destructive text-destructive-foreground'
                      : 'bg-success text-success-foreground';
                    const label = days < 0 ? `Caducada hace ${Math.abs(days)} d.`
                      : days === 0 ? 'Caduca hoy'
                      : `Quedan ${days} día${days === 1 ? '' : 's'}`;
                    const endFmt = new Date(p.ne_end_date).toLocaleDateString('es-ES');
                    return (
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[11px] font-semibold shadow-md ${cls}`}>
                        Fin NE: {endFmt} · {label}
                      </div>
                    );
                  })()}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{p.title}</h3>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${p.listing_type === 'ne' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                        {p.listing_type === 'ne' ? 'NE' : 'Noticia'}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[p.status]}`}>{statusLabels[p.status]}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{p.address}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                    {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.surface}m²</span>
                    {docCount > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{docCount} doc.</span>}
                  </div>
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">{p.price.toLocaleString('es-ES')} €</span>
                      <span className="text-xs text-muted-foreground">{agent?.name}</span>
                    </div>
                    <PortalPublicationControls property={p} compact />
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {selected.size > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card shadow-lg px-4 py-3">
            <span className="text-sm font-medium text-foreground">{selected.size} seleccionada{selected.size === 1 ? '' : 's'}</span>
            <Button size="sm" variant="outline" disabled={bulkWorking} onClick={() => handleBulkPublish('fotocasa', true)}>Publicar en Fotocasa</Button>
            <Button size="sm" variant="outline" disabled={bulkWorking} onClick={() => handleBulkPublish('idealista', true)}>Publicar en Idealista</Button>
            <Button size="sm" variant="ghost" disabled={bulkWorking} onClick={async () => { await handleBulkPublish('fotocasa', false); await handleBulkPublish('idealista', false); }}>Despublicar</Button>
            <Button size="sm" variant="ghost" disabled={bulkWorking} onClick={() => setSelected(new Set())}>Limpiar</Button>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>{editing ? "Editar Propiedad" : "Nueva Propiedad"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label className="text-xs">Dirección *</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Apartado</Label>
              <Select
                value={form.listing_type || 'noticia'}
                onValueChange={(v) => setForm({ ...form, listing_type: v as 'ne' | 'noticia' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="noticia">Noticia (sin firmar)</SelectItem>
                  <SelectItem value="ne">NE (Nota de Encargo firmada)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.listing_type === 'ne' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-md border border-primary/20 bg-primary/5">
                <div>
                  <Label className="text-xs">Fecha inicio NE *</Label>
                  <Input type="date" value={form.ne_start_date || ""} onChange={e => setForm({ ...form, ne_start_date: e.target.value || null })} />
                </div>
                <div>
                  <Label className="text-xs">Fecha fin NE *</Label>
                  <Input type="date" value={form.ne_end_date || ""} onChange={e => setForm({ ...form, ne_end_date: e.target.value || null })} />
                </div>
              </div>
            )}
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
              <Label className="text-xs font-semibold">Contacto</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nombre de contacto</Label>
                  <Input value={form.contact_name || ""} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Ej.: Juan Pérez" />
                </div>
                <div>
                  <Label className="text-xs">Teléfono de contacto</Label>
                  <Input value={form.contact_phone || ""} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+34 600 000 000" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Comentarios</Label>
                <Textarea value={form.contact_notes || ""} onChange={e => setForm({ ...form, contact_notes: e.target.value })} rows={2} placeholder="Ej.: llamar por la tarde" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PropertyType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Condición</Label>
                <Select value={form.condition || "none"} onValueChange={(v) => setForm({ ...form, condition: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    {Object.entries(conditionLabels).filter(([k]) => k !== '').map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => {
                    const newStatus = v as PropertyStatus;
                    if (newStatus === 'no_disponible' && form.status !== 'no_disponible') {
                      setUnavailableReasonDraft(form.unavailable_reason || "");
                      setUnavailableDialogOpen(true);
                    }
                    setForm({ ...form, status: newStatus });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {form.status === 'no_disponible' && form.unavailable_reason && (
              <div className="text-xs rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                <strong>Motivo no disponible:</strong> {form.unavailable_reason}
                <button type="button" className="ml-2 underline" onClick={() => { setUnavailableReasonDraft(form.unavailable_reason || ""); setUnavailableDialogOpen(true); }}>Editar</button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Operación</Label>
                <Select value={form.operationType} onValueChange={(v) => setForm({ ...form, operationType: v as OperationType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venta">Venta</SelectItem>
                    <SelectItem value="alquiler">Alquiler</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                    <SelectItem value="alquiler_opcion_compra">Alquiler con opción a compra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(form.operationType === 'alquiler' || form.operationType === 'ambos' || form.operationType === 'alquiler_opcion_compra') && (
                <div><Label className="text-xs">Renta mensual (€)</Label><Input type="number" value={form.monthly_rent || ""} onChange={e => setForm({ ...form, monthly_rent: Number(e.target.value) })} /></div>
              )}
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
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Precio (€)</Label><Input type="number" value={form.price || ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Metros útiles (m²)</Label><Input type="number" value={form.surface || ""} onChange={e => setForm({ ...form, surface: Number(e.target.value) })} /></div>
              <div>
                <Label className="text-xs">Agente</Label>
                <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Habitaciones</Label><Input type="number" value={form.bedrooms || ""} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Baños</Label><Input type="number" value={form.bathrooms || ""} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Planta</Label><Input type="number" value={form.floor ?? ""} onChange={e => setForm({ ...form, floor: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Sup. construida (m²)</Label><Input type="number" value={form.built_surface || ""} onChange={e => setForm({ ...form, built_surface: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Sup. parcela (m²)</Label><Input type="number" value={form.plot_surface || ""} onChange={e => setForm({ ...form, plot_surface: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <PropertyZoneSelector
                  value={form.neighborhood || ""}
                  onChange={(zoneId) => setForm({ ...form, neighborhood: zoneId })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Código Postal</Label><Input value={form.postal_code || ""} onChange={e => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div><Label className="text-xs">Referencia</Label><Input value={form.reference || ""} placeholder="INM-1042" onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
              <div><Label className="text-xs">Año construcción</Label><Input type="number" value={form.year_built ?? ""} onChange={e => setForm({ ...form, year_built: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Cert. Energético</Label>
                <Select value={form.energy_cert || "en_tramite"} onValueChange={v => setForm({ ...form, energy_cert: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_tramite">En trámite</SelectItem>
                    <SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem><SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem><SelectItem value="exento">Exento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Comunidad (€/mes)</Label><Input type="number" value={form.community_fees || ""} onChange={e => setForm({ ...form, community_fees: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">IBI (€/año)</Label><Input type="number" value={form.ibi_annual || ""} onChange={e => setForm({ ...form, ibi_annual: Number(e.target.value) })} /></div>
            </div>
            {/* Extras booleanos */}
            <div>
              <Label className="text-xs font-semibold">Extras</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {([
                  ['has_elevator', 'Ascensor'], ['has_terrace', 'Terraza'], ['has_pool', 'Piscina'],
                  ['has_garage', 'Garaje'], ['has_air_conditioning', 'Aire acond.']
                ] as [string, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox checked={!!form[key]} onCheckedChange={v => setForm({ ...form, [key]: !!v })} />
                    {label}
                  </label>
                ))}
              </div>
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
                  <span>{uploadingPhotos ? "Subiendo..." : "Añadir imagen"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingPhotos}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      void uploadPhotos(Array.from(files));
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
            {editing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Matches calculados para esta propiedad</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={calculating}
                    onClick={async () => {
                      const res = await runMatching(undefined, editing.id);
                      toast({
                        title: "Recalculado",
                        description: `${res?.matches ?? 0} matches actualizados para esta propiedad`,
                      });
                    }}
                  >
                    {calculating ? "Calculando..." : "Recalcular matches"}
                  </Button>
                </div>
                <TopClientMatches
                  matches={getTopMatchesForProperty(editing.id)}
                  clients={clients}
                  users={users}
                  fromPropertyId={editing.id}
                  property={editing}
                />
              </div>
            )}
            <PropertySeoChecklist property={form} />
            {editing && (
              <PortalPublicationControls property={editing} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : (editing ? "Guardar" : "Crear")}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* Unavailable reason */}
      <Dialog open={unavailableDialogOpen} onOpenChange={(o) => { if (!o) setUnavailableDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Motivo de no disponibilidad</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Indica por qué esta propiedad pasa a estado "No disponible". Esta información se guardará junto con la propiedad.</p>
          <Textarea
            value={unavailableReasonDraft}
            onChange={e => setUnavailableReasonDraft(e.target.value)}
            rows={4}
            placeholder="Ej.: retirada por el propietario, en obras, problemas legales..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUnavailableDialogOpen(false); }}>Cancelar</Button>
            <Button onClick={() => { setForm(prev => ({ ...prev, unavailable_reason: unavailableReasonDraft.trim() })); setUnavailableDialogOpen(false); }}>Guardar motivo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar propiedad?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se moverá <strong>{deleteTarget?.title}</strong> a la papelera de reciclaje y podrás restaurarla desde Ajustes.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Listing Type Confirm */}
      <Dialog open={!!convertTarget} onOpenChange={(o) => { if (!o) { setConvertTarget(null); setConvertNeStart(""); setConvertNeEnd(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {convertTarget?.listing_type === 'ne' ? '¿Convertir a Noticia?' : '¿Convertir a NE (firmada)?'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {convertTarget?.listing_type === 'ne'
              ? <>La propiedad <strong>{convertTarget?.title}</strong> pasará al apartado <strong>Noticias</strong> (sin firmar). Podrás volver a convertirla cuando quieras.</>
              : <>La propiedad <strong>{convertTarget?.title}</strong> pasará al apartado <strong>NE (firmadas)</strong>. Indica las fechas de la nota de encargo.</>}
          </p>
          {convertTarget && (convertTarget.listing_type || 'noticia') === 'noticia' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label className="text-xs">Inicio NE *</Label>
                <Input type="date" value={convertNeStart} onChange={e => setConvertNeStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Fin NE *</Label>
                <Input type="date" value={convertNeEnd} onChange={e => setConvertNeEnd(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConvertTarget(null); setConvertNeStart(""); setConvertNeEnd(""); }}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!convertTarget) return;
                const next: 'ne' | 'noticia' = (convertTarget.listing_type || 'noticia') === 'ne' ? 'noticia' : 'ne';
                if (next === 'ne' && (!convertNeStart || !convertNeEnd)) {
                  toast({ title: 'Faltan fechas', description: 'Indica fecha de inicio y fin de la NE.', variant: 'destructive' });
                  return;
                }
                try {
                  await convertListingType({
                    id: convertTarget.id,
                    target: next,
                    ne_start_date: next === 'ne' ? convertNeStart : null,
                    ne_end_date: next === 'ne' ? convertNeEnd : null,
                  });
                  toast({
                    title: next === 'ne' ? 'Convertida a NE (firmada)' : 'Convertida a Noticia',
                    description: next === 'ne'
                      ? 'La propiedad ya aparece en el apartado NE.'
                      : 'La propiedad ya aparece en el apartado Noticias.',
                  });
                  setConvertTarget(null);
                  setConvertNeStart("");
                  setConvertNeEnd("");
                  navigate(next === 'ne' ? '/propiedades/ne' : '/propiedades/noticias');
                } catch {
                  // toast ya mostrado por la mutación
                }
              }}
            >
              Confirmar
            </Button>
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
