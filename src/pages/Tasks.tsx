import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { TaskStatus, TaskType } from "@/types/crm";

const typeLabels: Record<TaskType, string> = { llamada: 'Llamada', email: 'Email', visita: 'Visita', recordatorio: 'Recordatorio' };
const statusLabels: Record<TaskStatus, string> = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada' };
const typeIcons: Record<TaskType, React.ElementType> = { llamada: Phone, email: Mail, visita: MapPin, recordatorio: Clock };
const statusIcons: Record<TaskStatus, React.ElementType> = { pendiente: Circle, en_progreso: Loader2, completada: CheckCircle2 };
const statusColors: Record<TaskStatus, string> = {
  pendiente: 'text-warning',
  en_progreso: 'text-info',
  completada: 'text-success',
};

const Tasks = () => {
  const { tasks, users, clients, properties } = useData();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = tasks.filter(t => statusFilter === "all" || t.status === statusFilter);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tareas</h1>
            <p className="text-sm text-muted-foreground mt-1">{tasks.length} tareas en total</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map(t => {
            const agent = users.find(u => u.id === t.agentId);
            const client = clients.find(c => c.id === t.clientId);
            const property = properties.find(p => p.id === t.propertyId);
            const TypeIcon = typeIcons[t.type];
            const StatusIcon = statusIcons[t.status];

            return (
              <Card key={t.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                    <TypeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-foreground truncate">{t.title}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">{typeLabels[t.type]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {agent && <span>{agent.name}</span>}
                      {client && <span>· {client.name}</span>}
                      {property && <span>· {property.title}</span>}
                    </div>
                    {t.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{t.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className={`flex items-center gap-1 text-xs font-medium ${statusColors[t.status]}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusLabels[t.status]}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(t.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Tasks;
