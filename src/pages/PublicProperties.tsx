import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Bed, Bath, Ruler, Search, Phone } from "lucide-react";
import { PropertyType } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<PropertyType, string> = { piso: 'Piso', casa: 'Casa', local: 'Local', terreno: 'Terreno' };

const PublicProperties = () => {
  const { properties, users } = useData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");

  const available = properties.filter(p => p.status === 'disponible');
  const filtered = available.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    let matchPrice = true;
    if (priceRange === "low") matchPrice = p.price <= 300000;
    else if (priceRange === "mid") matchPrice = p.price > 300000 && p.price <= 600000;
    else if (priceRange === "high") matchPrice = p.price > 600000;
    return matchSearch && matchType && matchPrice;
  });

  const handleSubmitLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: "¡Solicitud enviada!", description: "Un agente se pondrá en contacto contigo pronto." });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Encuentra tu propiedad ideal</h1>
          <p className="text-primary-foreground/70 text-lg mb-8">Explora nuestra selección de propiedades exclusivas</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
              <Input placeholder="Buscar por título o ubicación..." className="pl-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-[150px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"><SelectValue placeholder="Precio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier precio</SelectItem>
                <SelectItem value="low">Hasta 300.000€</SelectItem>
                <SelectItem value="mid">300.000€ - 600.000€</SelectItem>
                <SelectItem value="high">Más de 600.000€</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-sm text-muted-foreground mb-6">{filtered.length} propiedades encontradas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => {
            const agent = users.find(u => u.id === p.agentId);
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/20 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-primary/20" />
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2">{typeLabels[p.type]}</Badge>
                    <h3 className="font-bold text-foreground">{p.title}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3" />{p.address}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{p.bedrooms} hab.</span>}
                    {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathrooms} baños</span>}
                    <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{p.surface} m²</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xl font-bold text-foreground">{p.price.toLocaleString('es-ES')} €</span>
                    <Dialog>
                      <DialogTrigger asChild><Button size="sm" className="text-xs">Contactar</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle className="text-lg">Contactar sobre {p.title}</DialogTitle></DialogHeader>
                        {agent && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{agent.name}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{agent.phone}</p>
                            </div>
                          </div>
                        )}
                        <form onSubmit={handleSubmitLead} className="space-y-3">
                          <div><Label className="text-xs">Nombre</Label><Input placeholder="Tu nombre" required /></div>
                          <div><Label className="text-xs">Email</Label><Input type="email" placeholder="tu@email.com" required /></div>
                          <div><Label className="text-xs">Teléfono</Label><Input placeholder="+34 600 000 000" /></div>
                          <div><Label className="text-xs">Mensaje</Label><Textarea placeholder="Me interesa esta propiedad..." rows={3} /></div>
                          <Button type="submit" className="w-full">Enviar solicitud</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PublicProperties;
