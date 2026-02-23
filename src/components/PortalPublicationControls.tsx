import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Building, AlertTriangle } from "lucide-react";
import { usePortalConnections, usePropertyPortalStatus, validatePropertyForPortal, PortalName } from "@/hooks/usePortals";
import { toast } from "@/hooks/use-toast";

interface PortalPublicationControlsProps {
  property: any;
  compact?: boolean;
}

const portalConfig: Record<PortalName, { label: string; icon: typeof Home; color: string }> = {
  fotocasa: { label: "Fotocasa", icon: Home, color: "text-orange-500" },
  idealista: { label: "Idealista", icon: Building, color: "text-green-600" },
};

export function PortalPublicationControls({ property, compact = false }: PortalPublicationControlsProps) {
  const { getConnection } = usePortalConnections();
  const { togglePublication, getStatus, getPublishedCount } = usePropertyPortalStatus();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (portal: PortalName, newValue: boolean) => {
    const connection = getConnection(portal);
    if (!connection?.is_active) {
      toast({ title: "Portal no configurado", description: `Configura ${portalConfig[portal].label} en Ajustes > Conexiones`, variant: "destructive" });
      return;
    }

    if (newValue) {
      // Validate
      const errors = validatePropertyForPortal(property);
      if (errors.length > 0) {
        toast({
          title: "No se puede publicar",
          description: errors.map(e => e.message).join(", "),
          variant: "destructive",
        });
        return;
      }

      // Check ad limit
      const publishedCount = getPublishedCount(portal);
      if (publishedCount >= connection.max_ads) {
        toast({
          title: "Límite alcanzado",
          description: `Has alcanzado el límite de ${connection.max_ads} anuncios en ${portalConfig[portal].label}`,
          variant: "destructive",
        });
        return;
      }
    }

    setToggling(portal);
    await togglePublication(property.id, portal, newValue);
    setToggling(null);
    toast({ title: newValue ? "Publicado" : "Despublicado", description: `${property.title} en ${portalConfig[portal].label}` });
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {(["fotocasa", "idealista"] as PortalName[]).map((portal) => {
            const status = getStatus(property.id, portal);
            const connection = getConnection(portal);
            const cfg = portalConfig[portal];
            const Icon = cfg.icon;
            const isPublished = status?.is_published || false;
            const isConnected = connection?.is_active || false;

            return (
              <Tooltip key={portal}>
                <TooltipTrigger asChild>
                  <button
                    className={`p-1 rounded transition-colors ${
                      isPublished ? "bg-success/10" : isConnected ? "bg-muted hover:bg-muted/80" : "opacity-30"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isConnected) handleToggle(portal, !isPublished);
                    }}
                    disabled={!!toggling || !isConnected}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isPublished ? cfg.color : "text-muted-foreground"}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {!isConnected ? `${cfg.label}: No configurado` : isPublished ? `${cfg.label}: Publicado` : `${cfg.label}: Click para publicar`}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Publicación en Portales</p>
      {(["fotocasa", "idealista"] as PortalName[]).map((portal) => {
        const status = getStatus(property.id, portal);
        const connection = getConnection(portal);
        const cfg = portalConfig[portal];
        const Icon = cfg.icon;
        const isPublished = status?.is_published || false;
        const isConnected = connection?.is_active || false;
        const publishedCount = getPublishedCount(portal);

        return (
          <div key={portal} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${cfg.color}`} />
              <div>
                <p className="text-sm font-medium">{cfg.label}</p>
                {isConnected && (
                  <p className="text-[10px] text-muted-foreground">
                    {publishedCount} de {connection?.max_ads || 0} anuncios
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isConnected ? (
                <Badge variant="outline" className="text-[9px]">No configurado</Badge>
              ) : (
                <>
                  {isPublished && <Badge className="bg-success/10 text-success border-success/20 text-[9px]">Activo</Badge>}
                  <Switch
                    checked={isPublished}
                    onCheckedChange={(v) => handleToggle(portal, v)}
                    disabled={!!toggling}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PortalAdCounter({ portal }: { portal: PortalName }) {
  const { getConnection } = usePortalConnections();
  const { getPublishedCount } = usePropertyPortalStatus();
  const connection = getConnection(portal);
  if (!connection?.is_active) return null;
  
  const count = getPublishedCount(portal);
  const max = connection.max_ads;
  const isNearLimit = count >= max * 0.8;
  const isAtLimit = count >= max;

  return (
    <div className={`flex items-center gap-1 text-xs ${isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"}`}>
      {isAtLimit && <AlertTriangle className="w-3 h-3" />}
      <span>{count}/{max} anuncios</span>
    </div>
  );
}
