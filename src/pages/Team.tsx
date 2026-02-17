import { Layout } from "@/components/Layout";
import { users } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, Users } from "lucide-react";
import { UserRole } from "@/types/crm";

const roleLabels: Record<UserRole, string> = { administrador: 'Admin', agente: 'Agente', marketing: 'Marketing' };
const roleColors: Record<UserRole, string> = {
  administrador: 'bg-destructive/10 text-destructive border-destructive/20',
  agente: 'bg-info/10 text-info border-info/20',
  marketing: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
};

const Team = () => {
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} miembros del equipo</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {users.map(u => (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-primary">{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{u.name}</h3>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${roleColors[u.role]}`}>{roleLabels[u.role]}</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center justify-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                  <p className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>
                </div>
                <div className="flex justify-center gap-4 pt-2 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{u.propertyIds.length} prop.</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{u.clientIds.length} clientes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Team;
