import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { getAllDeletedSnapshots, getSnapshots, Snapshot } from "@/hooks/useSnapshots";
import { useData } from "@/context/DataContext";
import { toast } from "@/hooks/use-toast";
import {
  Trash2, RotateCcw, History, Archive, Clock, Eye, Loader2, Database,
  Building2, Users, Home, ClipboardList, FileText
} from "lucide-react";

const ENTITY_LABELS: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  agency: { label: "Inmobiliaria", icon: Building2 },
  client: { label: "Cliente", icon: Users },
  property: { label: "Propiedad", icon: Home },
  task: { label: "Tarea", icon: ClipboardList },
  team_member: { label: "Miembro", icon: Users },
  document: { label: "Documento", icon: FileText },
};

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  create: { label: "Creado", variant: "default" },
  update: { label: "Modificado", variant: "secondary" },
  delete: { label: "Eliminado", variant: "destructive" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function TrashSection() {
  const [deleted, setDeleted] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getAllDeletedSnapshots(filter === "all" ? undefined : filter);
    setDeleted(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleRestore = async (snap: Snapshot) => {
    setRestoring(snap.id);
    const tableMap: Record<string, string> = {
      agency: "agencies", client: "clients", property: "properties",
      task: "tasks", team_member: "team_members", document: "documents",
    };
    const table = tableMap[snap.entity_type];
    if (table) {
      await (supabase as any).from(table).update({ deleted_at: null }).eq('id', snap.entity_id);
      toast({ title: "Restaurado", description: `${ENTITY_LABELS[snap.entity_type]?.label || snap.entity_type} restaurado correctamente` });
      load();
    }
    setRestoring(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trash2 className="w-5 h-5 text-primary" /> Papelera de reciclaje
        </CardTitle>
        <CardDescription>Registros eliminados que puedes restaurar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="agency">Inmobiliarias</SelectItem>
            <SelectItem value="client">Clientes</SelectItem>
            <SelectItem value="property">Propiedades</SelectItem>
            <SelectItem value="task">Tareas</SelectItem>
            <SelectItem value="team_member">Miembros</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : deleted.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">La papelera está vacía</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {deleted.map((snap) => {
              const info = ENTITY_LABELS[snap.entity_type] || { label: snap.entity_type, icon: Database };
              const Icon = info.icon;
              const name = snap.snapshot?.name || snap.snapshot?.title || snap.entity_id;
              return (
                <div key={snap.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {info.label} · {formatDate(snap.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoring === snap.id}
                    onClick={() => handleRestore(snap)}
                    className="shrink-0"
                  >
                    {restoring === snap.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                    Restaurar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistorySection() {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Snapshot | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from('entity_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (filter !== "all") query = query.eq('entity_type', filter);
      const { data } = await query;
      setHistory((data || []) as unknown as Snapshot[]);
      setLoading(false);
    };
    load();
  }, [filter]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" /> Historial de cambios
          </CardTitle>
          <CardDescription>Últimos 50 cambios registrados con snapshot completo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="agency">Inmobiliarias</SelectItem>
              <SelectItem value="client">Clientes</SelectItem>
              <SelectItem value="property">Propiedades</SelectItem>
              <SelectItem value="task">Tareas</SelectItem>
              <SelectItem value="team_member">Miembros</SelectItem>
              <SelectItem value="document">Documentos</SelectItem>
            </SelectContent>
          </Select>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay historial de cambios</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((snap) => {
                const info = ENTITY_LABELS[snap.entity_type] || { label: snap.entity_type, icon: Database };
                const actionInfo = ACTION_LABELS[snap.action] || ACTION_LABELS.update;
                const Icon = info.icon;
                const name = snap.snapshot?.name || snap.snapshot?.title || snap.entity_id?.slice(0, 8);
                return (
                  <div key={snap.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {info.label} · {formatDate(snap.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={actionInfo.variant} className="text-xs">{actionInfo.label}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(snap)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Snapshot del registro</DialogTitle>
            <DialogDescription>
              {selected && `${ENTITY_LABELS[selected.entity_type]?.label || selected.entity_type} — ${formatDate(selected.created_at)}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {selected && JSON.stringify(selected.snapshot, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BackupTab() {
  return (
    <div className="space-y-6">
      <TrashSection />
      <HistorySection />
    </div>
  );
}
