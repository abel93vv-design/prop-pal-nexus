import { Building2, Users, Newspaper, FileCheck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { Layout } from "@/components/Layout";

const statusLabels: Record<string, string> = {
  disponible: 'Disponible', reservado: 'Reservado', vendido_alquilado: 'Vendido/Alquilado',
  nuevo: 'Nuevo', contactado: 'Contactado', en_negociacion: 'En negociación', cerrado: 'Cerrado',
  pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada',
};

const Index = () => {
  const { properties, clients, tasks, users } = useData();
  const neCount = properties.filter(p => p.listing_type === 'ne').length;
  const noticiaCount = properties.filter(p => p.listing_type === 'noticia').length;
  const clientCount = clients.length;
  const urgentClients = clients.filter(c => c.leadStatus === 'en_negociacion');

  const stats = [
    { label: 'NE', value: neCount, icon: FileCheck, color: 'text-primary' },
    { label: 'Noticias', value: noticiaCount, icon: Newspaper, color: 'text-secondary' },
    { label: 'Clientes', value: clientCount, icon: Users, color: 'text-info' },
  ];

  const quickLinks = [
    { label: 'Propiedades', to: '/propiedades', icon: Building2 },
    { label: 'Clientes', to: '/clientes', icon: Users },
    { label: 'Tareas', to: '/tareas', icon: AlertCircle },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen general de tu inmobiliaria</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-10 h-10 ${s.color} opacity-70`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Accesos Rápidos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickLinks.map(l => (
                <Link key={l.to} to={l.to} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center">
                  <l.icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium text-foreground">{l.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" />Seguimiento Urgente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {urgentClients.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.notes.slice(0, 40)}...</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Urgente</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Tareas Pendientes</CardTitle>
            <Link to="/tareas" className="text-xs text-primary hover:underline font-medium">Ver más →</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'completada').slice(0, 5).map(t => {
                const agent = users.find(u => u.id === t.agentId);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${t.status === 'pendiente' ? 'bg-warning' : 'bg-info'}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{agent?.name} · {new Date(t.dueDate).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{t.type}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
