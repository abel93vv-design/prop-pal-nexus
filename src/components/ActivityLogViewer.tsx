import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Activity, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  created_at: string;
  user_id: string;
}

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  restore: RotateCcw,
};

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  update: "bg-blue-500/10 text-blue-600 border-blue-200",
  delete: "bg-red-500/10 text-red-600 border-red-200",
  restore: "bg-amber-500/10 text-amber-600 border-amber-200",
};

const entityLabels: Record<string, string> = {
  client: "Cliente",
  property: "Propiedad",
  task: "Tarea",
  agency: "Inmobiliaria",
  document: "Documento",
  team_member: "Miembro",
};

export const ActivityLogViewer = ({ tenantId }: { tenantId: string }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      // Use edge function to bypass RLS (superadmin viewing another tenant's logs)
      const { data, error } = await supabase.functions.invoke("manage-tenant-admin", {
        body: { action: "get_activity_logs", tenant_id: tenantId },
      });
      if (!error && data?.logs) setLogs(data.logs);
      setLoading(false);
    };
    fetchLogs();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 pr-3">
        {logs.map((log) => {
          const Icon = actionIcons[log.action] || Activity;
          const colorClass = actionColors[log.action] || "bg-muted text-muted-foreground";
          const entityLabel = entityLabels[log.entity_type] || log.entity_type;
          const name = log.metadata?.name || log.metadata?.title || "";

          return (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <Badge variant="outline" className="text-[10px] mr-1.5 capitalize">{log.action}</Badge>
                  <span className="font-medium">{entityLabel}</span>
                  {name && <span className="text-muted-foreground"> — {name}</span>}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(log.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · "}{log.user_id.slice(0, 8)}…
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
