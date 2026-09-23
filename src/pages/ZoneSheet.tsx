import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, ClipboardList, Newspaper, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { useZoneSheets, useTenantZoneUsers, emptyZoneRow, ZoneSheet as ZoneSheetType, ZoneSheetRow } from "@/hooks/useZoneSheets";
import { useData } from "@/context/DataContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

const DWELLING_STATUSES = [
  { value: "ocupado", label: "Ocupado" },
  { value: "vacio", label: "Vacío" },
  { value: "alquilado", label: "Alquilado" },
  { value: "en_venta", label: "En venta" },
  { value: "vacacional", label: "Vacacional" },
] as const;

const MONTH_NAMES =  ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const formatSheetLabel = (s: ZoneSheetType) => {
  const d = new Date(s.sheet_date + "T00:00:00");
  const date = d.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "short" });
  const entry = (s.sheet_time || "").slice(0, 5);
  const exit = (s.exit_time || "").slice(0, 5);
  const time = exit ? `${entry}–${exit}` : entry;
  const place = [s.street, s.portal ? `portal ${s.portal}` : null].filter(Boolean).join(", ");
  return `${date} ${time}${place ? ` · ${place}` : ""}`;
};

const ZoneSheetPage = () => {
  const { getBool, loading: settingsLoading } = useTenantSettings();
  const enabled = getBool("hoja_zona");
  const { addProperty } = useData();
  const { can, role, isAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const canSeeAll = isAdmin || role === "socio" || role === "coordinadora";
  const [viewUserId, setViewUserId] = useState<string>("me");
  const { data: tenantUsers = [] } = useTenantZoneUsers(canSeeAll);
  const targetUserId = viewUserId === "me" ? undefined : viewUserId;
  const readOnly = !!targetUserId && targetUserId !== user?.id;
  const { sheets, loading, createSheet, updateSheet, deleteSheet } = useZoneSheets(targetUserId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ZoneSheetType | null>(null);
  const [creatingNews, setCreatingNews] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const years = useMemo(
    () => Array.from(new Set(sheets.map((s) => s.sheet_date.slice(0, 4)))).sort((a, b) => b.localeCompare(a)),
    [sheets]
  );
  const months = useMemo(
    () =>
      Array.from(
        new Set(
          sheets
            .filter((s) => filterYear === "all" || s.sheet_date.slice(0, 4) === filterYear)
            .map((s) => s.sheet_date.slice(5, 7))
        )
      ).sort((a, b) => Number(a) - Number(b)),
    [sheets, filterYear]
  );
  const filteredSheets = useMemo(
    () =>
      sheets.filter(
        (s) =>
          (filterYear === "all" || s.sheet_date.slice(0, 4) === filterYear) &&
          (filterMonth === "all" || s.sheet_date.slice(5, 7) === filterMonth)
      ),
    [sheets, filterYear, filterMonth]
  );

  const active = useMemo(
    () => filteredSheets.find((s) => s.id === activeId) || filteredSheets[0] || null,
    [filteredSheets, activeId]
  );

  useEffect(() => {
    if (active && (!draft || draft.id !== active.id)) setDraft(active);
    if (!active && draft) setDraft(null);
  }, [active, draft]);

  if (!settingsLoading && !enabled) return <Navigate to="/" replace />;

  const patch = (changes: Partial<ZoneSheetType>) => {
    if (!draft || readOnly) return;
    setDraft({ ...draft, ...changes });
  };

  const persist = (changes: Partial<ZoneSheetType>) => {
    if (!draft || readOnly) return;
    updateSheet.mutate({ id: draft.id, ...changes });
  };

  const setRows = (rows: ZoneSheetRow[], save = true) => {
    if (!draft || readOnly) return;
    setDraft({ ...draft, rows });
    if (save) updateSheet.mutate({ id: draft.id, rows } as any);
  };

  const updateRow = (rowId: string, changes: Partial<ZoneSheetRow>, save = true) => {
    if (!draft) return;
    setRows(draft.rows.map((r) => (r.id === rowId ? { ...r, ...changes } : r)), save);
  };

  const handleNewSheet = async () => {
    try {
      const created = await createSheet.mutateAsync({});
      setActiveId(created.id);
      setDraft(created);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async () => {
    if (!draft) return;
    try {
      const created = await createSheet.mutateAsync({
        agent_name: draft.agent_name,
        street: draft.street,
        portal: draft.portal,
        administrator: draft.administrator,
        community: draft.community,
        president: draft.president,
        property_type: draft.property_type,
        is_vpo: draft.is_vpo,
        has_garage: draft.has_garage,
        has_elevator: draft.has_elevator,
        has_accessible_access: draft.has_accessible_access,
        building_year: draft.building_year,
      });
      setActiveId(created.id);
      setDraft(created);
      toast({ title: "Hoja creada con la misma cabecera" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!draft) return;
    await deleteSheet.mutateAsync(draft.id);
    setActiveId(null);
    setDraft(null);
  };

  const handleCreateNews = async (row: ZoneSheetRow) => {
    if (!draft) return;
    if (!can("noticias", "edit")) {
      toast({ title: "Sin permiso", description: "No puedes crear noticias", variant: "destructive" });
      return;
    }
    setCreatingNews(row.id);
    try {
      const address = [draft.street, draft.portal ? `Portal ${draft.portal}` : null, row.floor].filter(Boolean).join(", ");
      const created: any = await addProperty({
        title: address || `Noticia ${row.name || ""}`.trim(),
        address,
        type: (draft.property_type === "casa" ? "casa" : "piso") as any,
        status: "disponible" as any,
        price: 0,
        surface: 0,
        bedrooms: 0,
        bathrooms: 0,
        photos: [],
        agentId: "",
        interestedClientIds: [],
        publishedAt: new Date().toISOString().split("T")[0],
        description: row.comment || "",
        agencyId: "",
        category: "residencial",
        reference: "",
        year_built: null,
        postal_code: "",
        latitude: null,
        longitude: null,
        built_surface: 0,
        plot_surface: 0,
        energy_cert: "en_tramite",
        neighborhood: "",
        floor: null,
        community_fees: 0,
        ibi_annual: 0,
        has_elevator: draft.has_elevator,
        has_service_elevator: false,
        has_terrace: false,
        has_pool: false,
        has_garage: draft.has_garage,
        has_air_conditioning: false,
        operationType: "venta" as any,
        monthly_rent: 0,
        condition: "",
        unavailable_reason: "",
        listing_type: "noticia",
        ne_start_date: null,
        ne_end_date: null,
        contact_name: row.name || "",
        contact_phone: row.phone || "",
        contact_notes: row.comment || "",
      } as any);
      if (created?.id) {
        updateRow(row.id, { property_id: created.id });
        toast({ title: "Noticia creada", description: "Ya aparece en Propiedades → Noticias" });
      }
    } catch (e: any) {
      toast({ title: "No se pudo crear la noticia", description: e.message, variant: "destructive" });
    }
    setCreatingNews(null);
  };

  const rowClass = (r: ZoneSheetRow) => {
    if (r.is_news) return "bg-primary/10 border-l-4 border-l-primary";
    if (r.contact_mode === "P") return "bg-success/10";
    if (r.contact_mode === "M") return "bg-warning/10";
    return "";
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> Hoja de zona
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Registra los vecinos de cada portal y marca las noticias.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canSeeAll && (
              <Select value={viewUserId} onValueChange={(v) => { setViewUserId(v); setActiveId(null); setDraft(null); setFilterYear("all"); setFilterMonth("all"); }}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Asesor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">Mis hojas</SelectItem>
                  {tenantUsers
                    .filter((u) => u.user_id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || "Sin nombre"}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            {sheets.length > 0 && (
              <>
                <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setFilterMonth("all"); }}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Año" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los años</SelectItem>
                    {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los meses</SelectItem>
                    {months.map((m) => <SelectItem key={m} value={m}>{MONTH_NAMES[Number(m) - 1]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={active?.id || ""} onValueChange={(v) => setActiveId(v)}>
                  <SelectTrigger className="w-[320px]">
                    <SelectValue placeholder="Día y hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSheets.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{formatSheetLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {!readOnly && (
              <Button size="sm" onClick={handleNewSheet} disabled={createSheet.isPending}>
                <Plus className="w-4 h-4 mr-1" /> Nueva hoja
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !draft ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {readOnly ? "Este asesor todavía no tiene hojas de zona." : "Todavía no tienes ninguna hoja de zona."}
              </p>
              {!readOnly && <Button onClick={handleNewSheet}><Plus className="w-4 h-4 mr-1" /> Crear la primera hoja</Button>}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  Datos del portal
                  {readOnly && <Badge variant="secondary" className="text-[10px]">Solo lectura</Badge>}
                </CardTitle>
                {!readOnly && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDuplicate}>Duplicar cabecera</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-1" /> Borrar hoja
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Agente</Label>
                  <Input disabled={readOnly} value={draft.agent_name || ""} onChange={(e) => patch({ agent_name: e.target.value })} onBlur={() => persist({ agent_name: draft.agent_name })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha</Label>
                  <Input disabled={readOnly} type="date" value={draft.sheet_date} onChange={(e) => patch({ sheet_date: e.target.value })} onBlur={() => persist({ sheet_date: draft.sheet_date })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hora de entrada</Label>
                  <Input disabled={readOnly} type="time" value={(draft.sheet_time || "").slice(0, 5)} onChange={(e) => patch({ sheet_time: `${e.target.value}:00` })} onBlur={() => persist({ sheet_time: draft.sheet_time })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hora de salida</Label>
                  <Input disabled={readOnly} type="time" value={(draft.exit_time || "").slice(0, 5)} onChange={(e) => patch({ exit_time: e.target.value ? `${e.target.value}:00` : null })} onBlur={() => persist({ exit_time: draft.exit_time })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Calle</Label>
                  <Input disabled={readOnly} value={draft.street || ""} onChange={(e) => patch({ street: e.target.value })} onBlur={() => persist({ street: draft.street })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Portal</Label>
                  <Input disabled={readOnly} value={draft.portal || ""} onChange={(e) => patch({ portal: e.target.value })} onBlur={() => persist({ portal: draft.portal })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Administrador</Label>
                  <Input disabled={readOnly} value={draft.administrator || ""} onChange={(e) => patch({ administrator: e.target.value })} onBlur={() => persist({ administrator: draft.administrator })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comunidad</Label>
                  <Input disabled={readOnly} value={draft.community || ""} onChange={(e) => patch({ community: e.target.value })} onBlur={() => persist({ community: draft.community })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Presidente</Label>
                  <Input disabled={readOnly} value={draft.president || ""} onChange={(e) => patch({ president: e.target.value })} onBlur={() => persist({ president: draft.president })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de piso</Label>
                  <Select disabled={readOnly} value={draft.property_type || "none"} onValueChange={(v) => { const val = v === "none" ? null : v; patch({ property_type: val }); persist({ property_type: val }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      <SelectItem value="piso">Piso</SelectItem>
                      <SelectItem value="casa">Casa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Año del bloque</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ej. 1975"
                    value={draft.building_year ?? ""}
                    onChange={(e) => patch({ building_year: e.target.value ? Number(e.target.value) : null })}
                    onBlur={() => persist({ building_year: draft.building_year })}
                  />
                </div>
                <div className="flex flex-wrap items-end gap-4 sm:col-span-2 lg:col-span-4">
                  {([
                    ["is_vpo", "VPO"],
                    ["has_garage", "Garaje"],
                    ["has_elevator", "Ascensor"],
                    ["has_accessible_access", "Acceso minusválido"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox disabled={readOnly}
                        checked={draft[key]}
                        onCheckedChange={(c) => { const val = !!c; patch({ [key]: val } as any); persist({ [key]: val } as any); }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">Vecinos</CardTitle>
                <Button size="sm" variant="outline" disabled={readOnly} onClick={() => setRows([...draft.rows, emptyZoneRow()])}>
                  <Plus className="w-4 h-4 mr-1" /> Añadir fila
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">N</TableHead>
                      <TableHead className="w-24">Piso</TableHead>
                      <TableHead className="w-48">Nombre</TableHead>
                      <TableHead className="w-28">P / M</TableHead>
                      <TableHead className="w-36">Estado</TableHead>
                      <TableHead>Comentario</TableHead>
                      <TableHead className="w-36">Teléfono</TableHead>
                      <TableHead className="w-40 text-right">Noticia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draft.rows.map((r) => (
                      <TableRow key={r.id} className={rowClass(r)}>
                        <TableCell className="text-center">
                          <Checkbox disabled={readOnly} checked={r.is_news} onCheckedChange={(c) => updateRow(r.id, { is_news: !!c })} />
                        </TableCell>
                        <TableCell>
                          <Input disabled={readOnly} className="h-8" value={r.floor} onChange={(e) => updateRow(r.id, { floor: e.target.value }, false)} onBlur={() => persist({ rows: draft.rows } as any)} />
                        </TableCell>
                        <TableCell>
                          <Input disabled={readOnly} className="h-8" value={r.name} onChange={(e) => updateRow(r.id, { name: e.target.value }, false)} onBlur={() => persist({ rows: draft.rows } as any)} />
                        </TableCell>
                        <TableCell>
                          <Select disabled={readOnly} value={r.contact_mode || "none"} onValueChange={(v) => updateRow(r.id, { contact_mode: v === "none" ? null : (v as "P" | "M") })}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="P">P · Puerta</SelectItem>
                              <SelectItem value="M">M · Mano</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select disabled={readOnly} value={r.status || "none"} onValueChange={(v) => updateRow(r.id, { status: v === "none" ? null : (v as ZoneSheetRow["status"]) })}>
                            <SelectTrigger className="h-8"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {DWELLING_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input disabled={readOnly} className="h-8" value={r.comment} onChange={(e) => updateRow(r.id, { comment: e.target.value }, false)} onBlur={() => persist({ rows: draft.rows } as any)} />
                        </TableCell>
                        <TableCell>
                          <Input disabled={readOnly} className="h-8" value={r.phone} onChange={(e) => updateRow(r.id, { phone: e.target.value }, false)} onBlur={() => persist({ rows: draft.rows } as any)} />
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {r.is_news && (
                            r.property_id ? (
                              <Button variant="outline" size="sm" className="h-8" onClick={() => navigate(`/propiedades/noticias?edit=${r.property_id}`)}>
                                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver noticia
                              </Button>
                            ) : (
                              <Button size="sm" className="h-8" disabled={readOnly || creatingNews === r.id} onClick={() => handleCreateNews(r)}>
                                {creatingNews === r.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Newspaper className="w-3.5 h-3.5 mr-1" />}
                                Crear noticia
                              </Button>
                            )
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-1" disabled={readOnly} onClick={() => setRows(draft.rows.filter((x) => x.id !== r.id))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center gap-3 pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/30 inline-block" /> Puerta</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/30 inline-block" /> Mano</span>
                  <Badge variant="outline" className="text-[10px]">N = noticia</Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ZoneSheetPage;
