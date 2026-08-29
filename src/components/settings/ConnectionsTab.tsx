import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Home, Building, Globe, CheckCircle, AlertCircle, Copy, RefreshCw, Trash2, Info } from "lucide-react";
import { usePortalConnections, PortalName } from "@/hooks/usePortals";
import { toast } from "@/hooks/use-toast";
import { WhatsAppCard } from "@/components/settings/WhatsAppCard";


const portalMeta: Record<PortalName, { label: string; icon: typeof Home; color: string }> = {
  fotocasa: { label: "Fotocasa", icon: Home, color: "text-orange-500" },
  idealista: { label: "Idealista", icon: Building, color: "text-green-600" },
};

const setupSteps = [
  "Activa la conexión con el interruptor superior.",
  "Copia la URL del feed generada automáticamente.",
  "Pégala en tu panel del portal (Idealista/Fotocasa) o envíala a tu gestor de cuenta.",
  "El portal importará y actualizará tus anuncios automáticamente desde esta URL.",
];

function PortalCard({ portal }: { portal: PortalName }) {
  const { getConnection, getFeedUrl, upsertConnection, regenerateFeedToken } = usePortalConnections();
  const connection = getConnection(portal);
  const meta = portalMeta[portal];
  const Icon = meta.icon;

  const [isActive, setIsActive] = useState(connection?.is_active || false);
  const [apiKey, setApiKey] = useState(connection?.api_key || "");
  const [maxAds, setMaxAds] = useState(connection?.max_ads || 50);

  useEffect(() => {
    setIsActive(connection?.is_active || false);
    setApiKey(connection?.api_key || "");
    setMaxAds(connection?.max_ads || 50);
  }, [connection?.id, connection?.is_active, connection?.api_key, connection?.max_ads]);

  const feedUrl = getFeedUrl(portal);

  const handleSave = () => {
    upsertConnection(portal, {
      api_key: apiKey,
      max_ads: maxAds,
      is_active: isActive,
      accepted_requirements: true,
    });
  };

  const copyFeedUrl = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({ title: "URL copiada", description: "Pégala en tu panel del portal." });
    } catch {
      toast({ title: "No se pudo copiar", description: "Copia la URL manualmente.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${meta.color}`} />
            {meta.label}
          </CardTitle>
          <div className="flex items-center gap-2">
            {connection?.is_active ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Activo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <AlertCircle className="w-3 h-3 mr-1" />
                Inactivo
              </Badge>
            )}
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>API Key (opcional)</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Tu API key del portal"
            />
          </div>
          <div className="space-y-2">
            <Label>Límite de anuncios</Label>
            <Input
              type="number"
              value={maxAds}
              onChange={(e) => setMaxAds(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>

        {isActive && feedUrl && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <Label className="text-xs font-semibold">URL del feed XML (auto-generada)</Label>
            <div className="flex gap-2">
              <Input readOnly value={feedUrl} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" size="icon" onClick={copyFeedUrl} title="Copiar URL">
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => regenerateFeedToken(portal)}
                title="Regenerar URL (invalida la anterior)"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Esta URL es única y segura para tu inmobiliaria. Si la regeneras, deberás actualizarla en el portal.
            </p>
          </div>
        )}

        <Button onClick={handleSave} size="sm">Guardar configuración</Button>
      </CardContent>
    </Card>
  );
}

// Webs Inmocro: cada fila es un WordPress propio que consume el feed JSON de portal-feed.
function WebsitesCard() {
  const { websites, getFeedUrl, addWebsite, setWebsiteActive, removeWebsite, regenerateFeedToken } = usePortalConnections();
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");

  const handleAdd = async () => {
    if (!slug.trim()) { toast({ title: "Indica el slug del sitio", variant: "destructive" }); return; }
    await addWebsite(slug, label);
    setSlug("");
    setLabel("");
  };

  const copy = async (url: string | null) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copiada", description: "Pégala en integrations.crm.feed_url de site.json." });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Webs Inmocro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Conecta cada web inmobiliaria (WordPress). El sitio consultará esta URL cada pocos minutos e
          importará las viviendas que marques como publicadas en él. El <code>slug</code> debe coincidir con
          <code> sites/&lt;slug&gt;/site.json</code>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Slug del sitio</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="costa-del-sol-homes" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nombre visible</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Costa del Sol Homes" />
          </div>
          <Button type="button" size="sm" onClick={handleAdd}>Añadir web</Button>
        </div>

        {websites.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aún no hay webs conectadas.</p>
        ) : (
          <div className="space-y-3">
            {websites.map((w) => {
              const url = getFeedUrl(w.portal_name);
              const name = w.label || w.portal_name.replace("web:", "");
              return (
                <div key={w.portal_name} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono">{w.portal_name}</Badge>
                      {w.is_active ? (
                        <Badge className="bg-success/10 text-success border-success/20 text-[9px]">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[9px]">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={w.is_active} onCheckedChange={(v) => setWebsiteActive(w.portal_name, v)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWebsite(w.portal_name)}
                        title="Desconectar esta web"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input readOnly value={url ?? ""} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                    <Button type="button" variant="outline" size="icon" onClick={() => copy(url)} title="Copiar URL del feed">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => regenerateFeedToken(w.portal_name)}
                      title="Regenerar URL (invalida la anterior)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Secreta: contiene el token de acceso. Ponla en <code>integrations.crm.feed_url</code> de
                    <code> site.json</code> (o en la variable de entorno <code>INMOCRO_CRM_FEED_URL</code>).
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ConnectionsTab() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cómo publicar en Idealista y Fotocasa:</strong>
          <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
            {setupSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Las viviendas vendidas, no disponibles o eliminadas se retiran del feed automáticamente.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortalCard portal="fotocasa" />
        <PortalCard portal="idealista" />
      </div>

      <WebsitesCard />

      <WhatsAppCard />

    </div>
  );
}
