import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Globe, Copy, RefreshCw, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { usePortalConnections } from "@/hooks/usePortals";
import { toast } from "@/hooks/use-toast";

export function WebsInmocroCard() {
  const { webConnections, getFeedUrl, createWebConnection, regenerateFeedToken, setConnectionActive, deleteConnection } =
    usePortalConnections();

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "URL copiada", description: "Pégala en la configuración de la web." });
    } catch {
      toast({ title: "No se pudo copiar", description: "Copia la URL manualmente.", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    const ok = await createWebConnection(displayName, slug);
    setSaving(false);
    if (ok) {
      setDisplayName("");
      setSlug("");
      setOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Webs Inmocro
          </CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Conectar web
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Aquí solo se conecta una web ya existente: el plugin de WordPress lee este feed cada 10
          minutos. El CRM no crea ni aloja ninguna web. Solo se envían las viviendas con esa web
          marcada en su ficha.
        </p>

        {webConnections.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            Todavía no has conectado ninguna web.
          </p>
        )}

        {webConnections.map((conn) => {
          const feedUrl = getFeedUrl(conn.portal_name);
          return (
            <div key={conn.id} className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{conn.display_name || conn.slug}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{conn.portal_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {conn.is_active ? (
                    <Badge className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="w-3 h-3 mr-1" /> Activa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <AlertCircle className="w-3 h-3 mr-1" /> Inactiva
                    </Badge>
                  )}
                  <Switch
                    checked={conn.is_active}
                    onCheckedChange={(v) => setConnectionActive(conn.portal_name, v)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">URL del feed</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={feedUrl || ""}
                    className="font-mono text-xs"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button variant="outline" size="icon" title="Copiar URL" onClick={() => feedUrl && copy(feedUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Regenerar token (invalida la URL anterior)"
                    onClick={() => regenerateFeedToken(conn.portal_name)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Desconectar web"
                    onClick={() => setDeleteTarget(conn.portal_name)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conectar web existente</DialogTitle>
            <DialogDescription>
              No se crea ninguna web: se genera la URL del feed para que el plugin de tu web ya
              existente lea las propiedades. El slug debe coincidir con el configurado en el plugin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre visible</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Demo Premium" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="demo-premium" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>Conectar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Desconectar web</DialogTitle>
            <DialogDescription>
              La URL del feed dejará de funcionar y el plugin pasará sus anuncios a borrador. La web
              en sí no se elimina.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) await deleteConnection(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
