import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Monitor, Loader2, Activity, Plus, Pencil, Trash2, RotateCcw, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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

export function SecurityTab() {
  const { user, signOut } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const loadLogs = async () => {
    setShowLogs(true);
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setLogs(data);
    setLogsLoading(false);
  };

  const handleSignOutOtherSessions = async () => {
    // Supabase doesn't support signing out other sessions directly,
    // but we can sign out everywhere and re-sign in
    toast({
      title: "Sesión actual",
      description: "Estás conectado desde este dispositivo. Para cerrar otras sesiones, cambia tu contraseña.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" /> Seguridad
          </CardTitle>
          <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Autenticación en dos pasos (2FA)</p>
              <p className="text-xs text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
            </div>
            <Badge variant="outline">Próximamente</Badge>
          </div>
          <Separator />

          {/* Active Session */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sesiones activas</p>
              <p className="text-xs text-muted-foreground">Revisa y cierra sesiones en otros dispositivos</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowSessions(!showSessions)}>
              {showSessions ? "Ocultar" : "Ver sesiones"}
            </Button>
          </div>

          {showSessions && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sesión actual</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Último acceso: {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString("es-ES", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })
                      : "—"}
                  </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Activa</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Para cerrar sesiones en otros dispositivos, cambia tu contraseña.
                </p>
                <Button size="sm" variant="destructive" onClick={signOut} className="gap-1">
                  <LogOut className="w-3 h-3" /> Cerrar esta sesión
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Activity Log */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Registro de actividad</p>
              <p className="text-xs text-muted-foreground">Historial de acciones recientes en tu cuenta</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadLogs}>
              {showLogs ? "Actualizar" : "Ver registro"}
            </Button>
          </div>

          {showLogs && (
            <div className="rounded-lg border border-border">
              {logsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="p-3 space-y-1">
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
                              {new Date(log.created_at).toLocaleString("es-ES", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
