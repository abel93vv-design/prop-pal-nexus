import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2, Users, Home, Euro, AlertTriangle, Activity, Eye, Download } from "lucide-react";
import { toast } from "sonner";

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
  counts: { properties: number; clients: number; team_members: number; users: number; invoices: number };
  limits: { properties: number; clients: number; team_members: number };
  usage: { properties: number; clients: number; team_members: number; max: number };
  at_risk: boolean;
}

const planBadge = (plan: string) => {
  const colors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    basic: "bg-blue-500/15 text-blue-700",
    pro: "bg-primary/15 text-primary",
    enterprise: "bg-amber-500/15 text-amber-700",
  };
  return colors[plan] || colors.free;
};

const usageColor = (pct: number) => {
  if (pct >= 100) return "text-destructive";
  if (pct >= 80) return "text-amber-600";
  return "text-muted-foreground";
};

export default function SuperAdminDashboard() {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<any>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filterTenant, setFilterTenant] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [o, a, i] = await Promise.all([
      supabase.functions.invoke("super-admin-dashboard", { body: { action: "overview" } }),
      supabase.functions.invoke("super-admin-dashboard", { body: { action: "global_activity" } }),
      supabase.functions.invoke("super-admin-dashboard", { body: { action: "all_invoices" } }),
    ]);
    if (o.data?.success) {
      setTotals(o.data.totals);
      setTenants(o.data.tenants);
    } else {
      toast.error(o.data?.error || "Error cargando datos");
    }
    if (a.data?.success) setActivity(a.data.logs);
    if (i.data?.success) setInvoices(i.data.invoices);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const openDetail = async (tenantId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    const { data } = await supabase.functions.invoke("super-admin-dashboard", {
      body: { action: "tenant_detail", tenant_id: tenantId },
    });
    if (data?.success) setDetail(data);
    else toast.error(data?.error || "Error");
    setDetailLoading(false);
  };

  const exportInvoicesCSV = () => {
    const header = ["Tenant", "Nº factura", "Periodo", "Plan", "Importe", "Estado", "Fecha"].join(",");
    const rows = invoices.map((i) =>
      [i.tenant_name, i.invoice_number, `${i.period_start} a ${i.period_end}`, i.plan, i.amount, i.status, new Date(i.created_at).toLocaleDateString("es-ES")]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facturas-global-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (roleLoading) {
    return <Layout><div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const filteredTenants = tenants.filter((t) =>
    !filterTenant || t.name.toLowerCase().includes(filterTenant.toLowerCase()) || t.slug.toLowerCase().includes(filterTenant.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Panel Super Admin</h1>
          <p className="text-sm text-muted-foreground">Vista global de todos los tenants de la plataforma</p>
        </div>

        {loading || !totals ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Kpi icon={Building2} label="Tenants activos" value={`${totals.active_tenants}/${totals.tenants}`} />
              <Kpi icon={Users} label="Usuarios" value={totals.users} />
              <Kpi icon={Users} label="Clientes" value={totals.clients} />
              <Kpi icon={Home} label="Propiedades" value={totals.properties} />
              <Kpi icon={Euro} label="Ingresos mes" value={`${totals.revenue_month.toFixed(0)}€`} />
              <Kpi icon={AlertTriangle} label="En riesgo" value={totals.at_risk} highlight={totals.at_risk > 0} />
            </div>

            <Tabs defaultValue="tenants">
              <TabsList>
                <TabsTrigger value="tenants">Tenants</TabsTrigger>
                <TabsTrigger value="activity">Actividad global</TabsTrigger>
                <TabsTrigger value="billing">Facturación</TabsTrigger>
              </TabsList>

              <TabsContent value="tenants" className="space-y-3">
                <Input
                  placeholder="Buscar tenant..."
                  value={filterTenant}
                  onChange={(e) => setFilterTenant(e.target.value)}
                  className="max-w-sm"
                />
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Usuarios</TableHead>
                          <TableHead>Clientes</TableHead>
                          <TableHead>Propiedades</TableHead>
                          <TableHead>Alta</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTenants.map((t) => (
                          <TableRow key={t.id} className={t.at_risk ? "bg-amber-50/40" : ""}>
                            <TableCell>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground">{t.custom_domain || `${t.slug}.app`}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={planBadge(t.plan)}>{t.plan}</Badge>
                            </TableCell>
                            <TableCell>
                              {t.is_active ? <Badge variant="outline" className="text-emerald-700 border-emerald-300">Activo</Badge> : <Badge variant="outline" className="text-destructive">Inactivo</Badge>}
                              {t.at_risk && <div className="mt-1"><Badge variant="outline" className="text-amber-700 border-amber-400">⚠ Cerca del límite</Badge></div>}
                            </TableCell>
                            <UsageCell current={t.counts.team_members} limit={t.limits.team_members} pct={t.usage.team_members} />
                            <UsageCell current={t.counts.clients} limit={t.limits.clients} pct={t.usage.clients} />
                            <UsageCell current={t.counts.properties} limit={t.limits.properties} pct={t.usage.properties} />
                            <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("es-ES")}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => openDetail(t.id)}>
                                <Eye className="w-4 h-4 mr-1" /> Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Últimos 200 eventos</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Entidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activity.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-xs">{new Date(l.created_at).toLocaleString("es-ES")}</TableCell>
                            <TableCell className="text-sm">{l.tenant_name}</TableCell>
                            <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                            <TableCell className="text-sm">{l.entity_type}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Total facturado: <span className="font-semibold text-foreground">{totals.revenue_total.toFixed(2)}€</span></div>
                  <Button size="sm" variant="outline" onClick={exportInvoicesCSV}><Download className="w-4 h-4 mr-1" /> Exportar CSV</Button>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Nº</TableHead>
                          <TableHead>Periodo</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Importe</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="text-xs">{new Date(i.created_at).toLocaleDateString("es-ES")}</TableCell>
                            <TableCell className="text-sm">{i.tenant_name}</TableCell>
                            <TableCell className="text-xs">{i.invoice_number}</TableCell>
                            <TableCell className="text-xs">{i.period_start} → {i.period_end}</TableCell>
                            <TableCell><Badge className={planBadge(i.plan)}>{i.plan}</Badge></TableCell>
                            <TableCell className="font-medium">{Number(i.amount).toFixed(2)}€</TableCell>
                            <TableCell><Badge variant={i.status === "paid" ? "outline" : "destructive"}>{i.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detail?.tenant?.name || "Detalle del tenant"}</DialogTitle>
            </DialogHeader>
            {detailLoading || !detail ? (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <Info label="Plan" value={detail.tenant?.plan} />
                  <Info label="Estado suscripción" value={detail.tenant?.subscription_status} />
                  <Info label="Slug" value={detail.tenant?.slug} />
                  <Info label="Dominio" value={detail.tenant?.custom_domain || "—"} />
                </div>

                <Section title={`Usuarios (${detail.users.length})`}>
                  <Table>
                    <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Nombre</TableHead><TableHead>Rol</TableHead><TableHead>Último acceso</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {detail.users.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell className="text-sm">{u.email}</TableCell>
                          <TableCell className="text-sm">{u.full_name}</TableCell>
                          <TableCell>{u.roles.map((r: string) => <Badge key={r} variant="outline" className="mr-1">{r}</Badge>)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("es-ES") : "Nunca"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Section>

                <Section title={`Últimos clientes (${detail.clients.length})`}>
                  <ul className="text-sm space-y-1">{detail.clients.map((c: any) => <li key={c.id}>• {c.name} <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("es-ES")}</span></li>)}</ul>
                </Section>

                <Section title={`Últimas propiedades (${detail.properties.length})`}>
                  <ul className="text-sm space-y-1">{detail.properties.map((p: any) => <li key={p.id}>• {p.title} — {Number(p.price).toLocaleString("es-ES")}€ <Badge variant="outline" className="ml-1 text-xs">{p.status}</Badge></li>)}</ul>
                </Section>

                <Section title={`Facturas (${detail.invoices.length})`}>
                  <Table>
                    <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Periodo</TableHead><TableHead>Importe</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {detail.invoices.map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell className="text-xs">{i.invoice_number}</TableCell>
                          <TableCell className="text-xs">{i.period_start} → {i.period_end}</TableCell>
                          <TableCell>{Number(i.amount).toFixed(2)}€</TableCell>
                          <TableCell><Badge variant={i.status === "paid" ? "outline" : "destructive"}>{i.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Section>

                <Section title={`Actividad reciente (${detail.activity.length})`}>
                  <ul className="text-xs space-y-1 max-h-60 overflow-y-auto">
                    {detail.activity.map((a: any) => (
                      <li key={a.id} className="text-muted-foreground">
                        <span className="text-foreground">{new Date(a.created_at).toLocaleString("es-ES")}</span> — {a.action} {a.entity_type}
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

const Kpi = ({ icon: Icon, label, value, highlight }: any) => (
  <Card className={highlight ? "border-amber-400" : ""}>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" />{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </CardContent>
  </Card>
);

const UsageCell = ({ current, limit, pct }: { current: number; limit: number; pct: number }) => {
  const unlimited = limit >= 999999;
  return (
    <TableCell>
      <div className={`text-sm font-medium ${usageColor(pct)}`}>
        {current}{unlimited ? " / ∞" : ` / ${limit}`}
      </div>
      {!unlimited && <Progress value={Math.min(100, pct)} className="h-1 mt-1" />}
    </TableCell>
  );
};

const Info = ({ label, value }: any) => (
  <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>
);

const Section = ({ title, children }: any) => (
  <div>
    <h3 className="font-semibold text-sm mb-2">{title}</h3>
    {children}
  </div>
);
