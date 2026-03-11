import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePlanLimits, ResourceUsage } from "@/hooks/usePlanLimits";
import { PLAN_ORDER, PLAN_LABELS, PLAN_PRICES, getPlanLimits, isUnlimited, PlanName, ResourceKey } from "@/config/planLimits";
import { Crown, Zap, Building2, Users, ClipboardList, Landmark, Plug, Settings2, KeyRound, Kanban, CheckCircle2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
