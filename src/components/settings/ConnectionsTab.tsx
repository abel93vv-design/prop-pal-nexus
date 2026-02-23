import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plug, Save, Home, Building } from "lucide-react";
import { usePortalConnections, PortalName } from "@/hooks/usePortals";

interface PortalConfig {
  name: PortalName;
  label: string;
  icon: typeof Home;
  description: string;
  color: string;
}

const portals: PortalConfig[] = [
  {
    name: "fotocasa",
    label: "Fotocasa Pro",
    icon: Home,
    description: "Publica propiedades directamente en Fotocasa Pro",
    color: "text-orange-500",
  },
  {
    name: "idealista",
    label: "Idealista",
    icon: Building,
    description: "Publica propiedades en Idealista automáticamente",
    color: "text-green-600",
  },
];

export function ConnectionsTab() {
  const { connections, upsertConnection, getConnection, loading } = usePortalConnections();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plug className="w-5 h-5 text-primary" /> Conexiones a Portales
          </CardTitle>
          <CardDescription>Conecta con portales inmobiliarios para publicar tus propiedades automáticamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {portals.map((portal) => (
            <PortalCard
              key={portal.name}
              portal={portal}
              connection={getConnection(portal.name)}
              onSave={(updates) => upsertConnection(portal.name, updates)}
              loading={loading}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PortalCard({
  portal,
  connection,
  onSave,
  loading,
}: {
  portal: PortalConfig;
  connection: ReturnType<typeof usePortalConnections>["getConnection"] extends (p: any) => infer R ? R : never;
  onSave: (updates: any) => Promise<void>;
  loading: boolean;
}) {
  const [apiKey, setApiKey] = useState(connection?.api_key || "");
  const [feedUrl, setFeedUrl] = useState(connection?.feed_url || "");
  const [maxAds, setMaxAds] = useState(connection?.max_ads || 20);
  const [accepted, setAccepted] = useState(connection?.accepted_requirements || false);
  const [isActive, setIsActive] = useState(connection?.is_active || false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (connection) {
      setApiKey(connection.api_key || "");
      setFeedUrl(connection.feed_url || "");
      setMaxAds(connection.max_ads || 20);
      setAccepted(connection.accepted_requirements || false);
      setIsActive(connection.is_active || false);
    }
  }, [connection]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      api_key: apiKey,
      feed_url: feedUrl,
      max_ads: maxAds,
      accepted_requirements: accepted,
      is_active: isActive,
    });
    setSaving(false);
  };

  const Icon = portal.icon;

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${portal.color}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{portal.label}</p>
            <p className="text-xs text-muted-foreground">{portal.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connection?.is_active ? (
            <Badge className="bg-success/10 text-success border-success/20">Conectado</Badge>
          ) : (
            <Badge variant="outline">Desconectado</Badge>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Conexión activa</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div>
            <Label className="text-xs">API Key</Label>
            <Input
              type="password"
              placeholder="Tu API Key del portal"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs">URL del Feed XML</Label>
            <Input
              placeholder="https://tu-feed.xml"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs">Límite de anuncios contratados</Label>
            <Input
              type="number"
              value={maxAds}
              onChange={(e) => setMaxAds(Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id={`req-${portal.name}`}
              checked={accepted}
              onCheckedChange={(v) => setAccepted(!!v)}
            />
            <label htmlFor={`req-${portal.name}`} className="text-xs text-muted-foreground leading-snug cursor-pointer">
              Acepto los requisitos técnicos del portal {portal.label}. Los inmuebles publicados deben cumplir con los estándares
              de calidad, campos obligatorios y normativas del portal.
            </label>
          </div>

          <Button onClick={handleSave} disabled={saving || loading} size="sm" className="w-full">
            <Save className="w-4 h-4 mr-1" /> Guardar configuración
          </Button>
        </div>
      )}
    </div>
  );
}
