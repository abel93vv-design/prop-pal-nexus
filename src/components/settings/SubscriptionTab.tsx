import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlanLimits, ResourceUsage } from "@/hooks/usePlanLimits";
import { PLAN_ORDER, PLAN_LABELS, PLAN_PRICES, getPlanLimits, isUnlimited, PlanName, ResourceKey } from "@/config/planLimits";
import { Crown, Zap, Building2, Users, ClipboardList, Landmark, Plug, Settings2, KeyRound, Kanban, CheckCircle2, Lock, FileText, Download, Loader2, Eye, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const RESOURCE_LABELS: Record<ResourceKey, { label: string; icon: React.ComponentType<any> }> = {
  properties: { label: "Propiedades", icon: Building2 },
  clients: { label: "Clientes", icon: Users },
  team_members: { label: "Miembros del equipo", icon: Users },
  agencies: { label: "Inmobiliarias", icon: Landmark },
  portals: { label: "Portales", icon: Plug },
  custom_fields: { label: "Campos personalizados", icon: Settings2 },
  api_keys: { label: "API Keys", icon: KeyRound },
  pipelines: { label: "Oportunidades pipeline", icon: Kanban },
};

function UsageBar({ resource, usage }: { resource: ResourceKey; usage: ResourceUsage }) {
  const info = RESOURCE_LABELS[resource];
  const Icon = info.icon;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{info.label}</span>
        </div>
        <span className="text-muted-foreground text-xs">
          {usage.unlimited ? `${usage.current} / ∞` : `${usage.current} / ${usage.limit}`}
        </span>
      </div>
      {!usage.unlimited && (
        <Progress
          value={Math.min(usage.percentage, 100)}
          className={`h-2 ${usage.atLimit ? '[&>div]:bg-destructive' : usage.percentage > 80 ? '[&>div]:bg-amber-500' : ''}`}
        />
      )}
      {usage.atLimit && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <Lock className="w-3 h-3" /> Límite alcanzado. Actualiza tu plan.
        </p>
      )}
    </div>
  );
}

function PlanCard({ planName, currentPlan }: { planName: PlanName; currentPlan: PlanName }) {
  const limits = getPlanLimits(planName);
  const isCurrent = planName === currentPlan;
  const isUpgrade = PLAN_ORDER.indexOf(planName) > PLAN_ORDER.indexOf(currentPlan);
  const price = PLAN_PRICES[planName];

  const highlights = [
    `${isUnlimited(limits.properties) ? '∞' : limits.properties} propiedades`,
    `${isUnlimited(limits.clients) ? '∞' : limits.clients} clientes`,
    `${isUnlimited(limits.team_members) ? '∞' : limits.team_members} miembros`,
    limits.match_center ? 'Match Center ✓' : 'Match Center ✗',
    `${isUnlimited(limits.portals) ? '∞' : limits.portals} portales`,
  ];

  return (
    <Card className={`relative ${isCurrent ? 'border-primary ring-2 ring-primary/20' : ''}`}>
      {isCurrent && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-primary text-primary-foreground text-xs">Plan actual</Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {planName === 'enterprise' && <Crown className="w-5 h-5 text-amber-500" />}
          {planName === 'pro' && <Zap className="w-5 h-5 text-primary" />}
          {PLAN_LABELS[planName]}
        </CardTitle>
        <div className="text-2xl font-bold text-foreground">
          {price === 0 ? 'Gratis' : `${price}€`}
          {price > 0 && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {highlights.map((h) => (
            <li key={h} className="text-sm flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              {h}
            </li>
          ))}
        </ul>
        {isUpgrade && (
          <Button
            className="w-full mt-2"
            size="sm"
            onClick={() => toast({
              title: "Contacta con ventas",
              description: "Para actualizar tu plan, contacta con el equipo de ventas o tu administrador.",
            })}
          >
            Actualizar a {PLAN_LABELS[planName]}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface Invoice {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: string;
  plan: string;
  created_at: string;
  pdf_url: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  paid: { label: "Pagada", variant: "default" },
  pending: { label: "Pendiente", variant: "secondary" },
  overdue: { label: "Vencida", variant: "destructive" },
};

function generateInvoiceHTML(inv: Invoice) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  const statusLabel = STATUS_MAP[inv.status]?.label || inv.status;
  const base = Number(inv.amount) / 1.21;
  const iva = Number(inv.amount) - base;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Factura ${inv.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:40px;max-width:800px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:3px solid #16a34a;padding-bottom:20px}
.logo{font-size:24px;font-weight:700;color:#16a34a}
.logo span{color:#64748b;font-weight:400;font-size:14px;display:block}
.invoice-info{text-align:right}
.invoice-info h2{font-size:28px;color:#16a34a;margin-bottom:4px}
.invoice-info p{font-size:13px;color:#64748b}
.status{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-top:8px}
.status-paid{background:#dcfce7;color:#16a34a}
.status-pending{background:#fef3c7;color:#d97706}
.status-overdue{background:#fee2e2;color:#dc2626}
.details{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px}
.detail-block h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px}
.detail-block p{font-size:14px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin-bottom:30px}
th{background:#f1f5f9;padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;border-bottom:2px solid #e2e8f0}
td{padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px}
.text-right{text-align:right}
.total-row td{font-weight:700;font-size:16px;border-top:2px solid #16a34a;color:#16a34a}
.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}
@media print{body{padding:20px}button,.no-print{display:none!important}}
</style></head><body>
<div class="header">
  <div class="logo">KageSan CRM<span>Software Inmobiliario</span></div>
  <div class="invoice-info">
    <h2>${inv.invoice_number}</h2>
    <p>Emitida: ${formatDate(inv.created_at)}</p>
    <span class="status status-${inv.status}">${statusLabel}</span>
  </div>
</div>
<div class="details">
  <div class="detail-block">
    <h3>Período de facturación</h3>
    <p>${formatDate(inv.period_start)} — ${formatDate(inv.period_end)}</p>
  </div>
  <div class="detail-block">
    <h3>Plan contratado</h3>
    <p style="text-transform:capitalize">${inv.plan}</p>
  </div>
</div>
<table>
  <thead><tr><th>Concepto</th><th class="text-right">Importe</th></tr></thead>
  <tbody>
    <tr><td>Suscripción plan ${inv.plan} — ${formatDate(inv.period_start).split(' de ').slice(1).join(' de ')}</td><td class="text-right">${formatCurrency(base)}</td></tr>
    <tr><td>IVA (21%)</td><td class="text-right">${formatCurrency(iva)}</td></tr>
    <tr class="total-row"><td>Total</td><td class="text-right">${formatCurrency(inv.amount)}</td></tr>
  </tbody>
</table>
<div class="footer">
  <p>KageSan CRM · CIF: B12345678 · info@kagesan.com</p>
  <p style="margin-top:4px">Este documento es una factura simplificada generada automáticamente.</p>
</div>
</body></html>`;
}

function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("period_start", { ascending: false });
      if (!error && data) setInvoices(data as Invoice[]);
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  const handleDownload = (inv: Invoice) => {
    const html = generateInvoiceHTML(inv);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Factura descargada", description: inv.invoice_number });
  };

  const handlePreview = (inv: Invoice) => {
    setPreviewInvoice(inv);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" /> Facturas
          </CardTitle>
          <CardDescription>Historial de facturación mensual</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay facturas disponibles todavía</p>
              <p className="text-xs mt-1">Las facturas se generan mensualmente</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((inv) => {
                const statusInfo = STATUS_MAP[inv.status] || STATUS_MAP.paid;
                return (
                  <div key={inv.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {inv.invoice_number}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {formatDate(inv.period_start)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="capitalize text-xs hidden sm:inline-flex">{inv.plan}</Badge>
                      <span className="text-sm font-semibold text-foreground w-20 text-right">
                        {formatCurrency(inv.amount)}
                      </span>
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver factura" onClick={() => handlePreview(inv)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Descargar factura" onClick={() => handleDownload(inv)}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-4 pb-2 flex flex-row items-center justify-between">
            <DialogTitle className="text-base">
              {previewInvoice?.invoice_number}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={() => previewInvoice && handleDownload(previewInvoice)}>
              <Download className="w-3.5 h-3.5 mr-1" /> Descargar
            </Button>
          </DialogHeader>
          {previewInvoice && (
            <iframe
              srcDoc={generateInvoiceHTML(previewInvoice)}
              className="w-full border-0"
              style={{ height: "70vh" }}
              title="Vista previa de factura"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SubscriptionTab() {
  const { plan, planLabel, usage } = usePlanLimits();

  const resourceKeys: ResourceKey[] = ['properties', 'clients', 'team_members', 'agencies', 'portals', 'custom_fields', 'api_keys', 'pipelines'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-primary" /> Tu suscripción
          </CardTitle>
          <CardDescription>
            Plan actual: <Badge variant="outline" className="ml-1 capitalize">{planLabel}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resourceKeys.map((key) => (
            <UsageBar key={key} resource={key} usage={usage[key]} />
          ))}
        </CardContent>
      </Card>

      <InvoicesList />

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Planes disponibles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_ORDER.map((p) => (
            <PlanCard key={p} planName={p} currentPlan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}
