import { Badge } from "@/components/ui/badge";
import { MatchScore } from "@/hooks/useMatchCenter";
import { Client, Property } from "@/types/crm";
import { Target, DollarSign, TrendingUp } from "lucide-react";

const categoryLabels: Record<string, string> = { high: "Alto", medium: "Medio", low: "Bajo" };
const categoryColors: Record<string, string> = {
  high: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};
const viabilityColors: Record<string, string> = {
  Viable: "text-success",
  Risk: "text-warning",
  "Not Viable": "text-destructive",
};
const viabilityLabels: Record<string, string> = {
  Viable: "Viable",
  Risk: "en riesgo",
  "Not Viable": "No viable",
};

interface TopPropertyMatchesProps {
  matches: MatchScore[];
  properties: Property[];
}

export function TopPropertyMatches({ matches, properties }: TopPropertyMatchesProps) {
  if (matches.length === 0) return (
    <div className="text-xs text-muted-foreground italic py-2">
      No hay matches calculados. Ve al Match Center para recalcular.
    </div>
  );

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-primary" /> Top Property Matches
      </h4>
      {matches.map((m) => {
        const prop = properties.find((p) => p.id === m.property_id);
        if (!prop) return null;
        return (
          <div key={m.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20 text-xs">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{prop.title}</p>
              <p className="text-[10px] text-muted-foreground">{prop.price.toLocaleString("es-ES")} € · {prop.address}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <div className="text-right">
                <span className="font-bold text-sm">{m.total_score}</span>
                <div className="flex gap-1 text-[9px] text-muted-foreground">
                  <span>P:{m.property_score}</span>
                  <span>F:{m.financial_score}</span>
                </div>
              </div>
              <Badge variant="outline" className={`text-[9px] ${categoryColors[m.category]}`}>
                {categoryLabels[m.category]}
              </Badge>
              <span className={`text-[9px] font-medium ${viabilityColors[m.viability_status]}`}>
                {viabilityLabels[m.viability_status] || m.viability_status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TopClientMatchesProps {
  matches: MatchScore[];
  clients: Client[];
  users: { id: string; name: string }[];
}

export function TopClientMatches({ matches, clients, users }: TopClientMatchesProps) {
  if (matches.length === 0) return (
    <div className="text-xs text-muted-foreground italic py-2">
      No hay matches calculados. Ve al Match Center para recalcular.
    </div>
  );

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-primary" /> Top Interested Clients
      </h4>
      {matches.map((m) => {
        const client = clients.find((c) => c.id === m.client_id);
        if (!client) return null;
        return (
          <div key={m.id} className="p-2 rounded-md border border-border bg-muted/20 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{client.name}</p>
                <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                  {client.email && <span>{client.email}</span>}
                  {client.phone && <span>{client.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className="text-right">
                  <span className="font-bold text-sm">{m.total_score}</span>
                  <div className="flex gap-1 text-[9px] text-muted-foreground">
                    <span>F:{m.financial_score}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] ${categoryColors[m.category]}`}>
                  {categoryLabels[m.category]}
                </Badge>
                <span className={`text-[9px] font-medium ${viabilityColors[m.viability_status]}`}>
                  {m.viability_status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {client.leadStatus && (
                <Badge variant="outline" className="text-[9px] px-1 py-0">{client.leadStatus}</Badge>
              )}
              {client.contactCount != null && (
                <span>{client.contactCount} contactos</span>
              )}
              {client.lastContactedAt && (
                <span>Últ: {new Date(client.lastContactedAt).toLocaleDateString("es-ES")}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
