import { useState } from "react";
import { Layout } from "@/components/Layout";
import { properties, users, clients } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Bed, Bath, Ruler, Search } from "lucide-react";
import { PropertyType, PropertyStatus } from "@/types/crm";

const typeLabels: Record<PropertyType, string> = { piso: 'Piso', casa: 'Casa', local: 'Local', terreno: 'Terreno' };
const statusLabels: Record<PropertyStatus, string> = { disponible: 'Disponible', reservado: 'Reservado', vendido_alquilado: 'Vendido/Alquilado' };
const statusColors: Record<PropertyStatus, string> = {
  disponible: 'bg-success/10 text-success border-success/20',
  reservado: 'bg-warning/10 text-warning border-warning/20',
  vendido_alquilado: 'bg-muted text-muted-foreground border-border',
};

const Properties = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Propiedades</h1>
            <p className="text-sm text-muted-foreground mt-1">{properties.length} propiedades en el sistema</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por título o dirección..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const agent = users.find(u => u.id === p.agentId);
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-primary/30" />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-foreground leading-tight">{p.title}</h3>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[p.status]}`}>
                      {statusLabels[p.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {p.address}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                    {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.surface}m²</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-lg font-bold text-foreground">{p.price.toLocaleString('es-ES')} €</span>
                    <span className="text-xs text-muted-foreground">{agent?.name}</span>
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

export default Properties;
