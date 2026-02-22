import { useState } from "react";
import { InterestType, ClientPropertyInterest } from "@/hooks/useInterests";
import { Client, Property } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Home, User, ShoppingCart, Key, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const interestLabels: Record<InterestType, string> = {
  compra: 'Compra',
  alquiler: 'Alquiler',
  inversion: 'Inversión',
};
const interestColors: Record<InterestType, string> = {
  compra: 'bg-success/10 text-success border-success/20',
  alquiler: 'bg-info/10 text-info border-info/20',
  inversion: 'bg-warning/10 text-warning border-warning/20',
};
const interestIcons: Record<InterestType, typeof ShoppingCart> = {
  compra: ShoppingCart,
  alquiler: Key,
  inversion: TrendingUp,
};

interface InterestedClientsProps {
  propertyId: string;
  interests: ClientPropertyInterest[];
  clients: Client[];
  onAdd: (clientId: string, interestType: InterestType) => Promise<any>;
  onRemove: (id: string) => void;
  onUpdateType: (id: string, type: InterestType) => void;
}

export function InterestedClients({ propertyId, interests, clients, onAdd, onRemove, onUpdateType }: InterestedClientsProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedType, setSelectedType] = useState<InterestType>('compra');

  const propertyInterests = interests.filter(i => i.property_id === propertyId);
  const linkedClientIds = propertyInterests.map(i => i.client_id);
  const availableClients = clients.filter(c => !linkedClientIds.includes(c.id));

  const handleAdd = async () => {
    if (!selectedClient) return;
    const result = await onAdd(selectedClient, selectedType);
    if (result?.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Interés añadido" });
      setAddOpen(false);
      setSelectedClient('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Clientes interesados ({propertyInterests.length})
        </p>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Añadir
        </Button>
      </div>

      {propertyInterests.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-3">Sin clientes interesados</p>
      ) : (
        <div className="space-y-1.5">
          {propertyInterests.map(interest => {
            const client = clients.find(c => c.id === interest.client_id);
            if (!client) return null;
            const Icon = interestIcons[interest.interest_type];
            return (
              <div key={interest.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:bg-muted/20 transition-colors group">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{client.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{client.email}</p>
                </div>
                <Select value={interest.interest_type} onValueChange={(v) => onUpdateType(interest.id, v as InterestType)}>
                  <SelectTrigger className="h-6 w-auto min-w-[90px] text-[10px] border-0 bg-transparent p-1">
                    <Badge variant="outline" className={`text-[10px] gap-1 ${interestColors[interest.interest_type]}`}>
                      <Icon className="w-3 h-3" />{interestLabels[interest.interest_type]}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(interestLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => onRemove(interest.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Añadir cliente interesado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {availableClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Tipo de interés</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as InterestType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(interestLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!selectedClient}>Añadir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface InterestedPropertiesProps {
  clientId: string;
  interests: ClientPropertyInterest[];
  properties: Property[];
  onAdd: (propertyId: string, interestType: InterestType) => Promise<any>;
  onRemove: (id: string) => void;
  onUpdateType: (id: string, type: InterestType) => void;
}

export function InterestedProperties({ clientId, interests, properties, onAdd, onRemove, onUpdateType }: InterestedPropertiesProps) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedType, setSelectedType] = useState<InterestType>('compra');

  const clientInterests = interests.filter(i => i.client_id === clientId);
  const linkedPropertyIds = clientInterests.map(i => i.property_id);
  const availableProperties = properties.filter(p => !linkedPropertyIds.includes(p.id));

  const handleAdd = async () => {
    if (!selectedProperty) return;
    const result = await onAdd(selectedProperty, selectedType);
    if (result?.error) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    } else {
      toast({ title: "Interés añadido" });
      setAddOpen(false);
      setSelectedProperty('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5" /> Propiedades de interés ({clientInterests.length})
        </p>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Añadir
        </Button>
      </div>

      {clientInterests.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-3">Sin propiedades de interés</p>
      ) : (
        <div className="space-y-1.5">
          {clientInterests.map(interest => {
            const property = properties.find(p => p.id === interest.property_id);
            if (!property) return null;
            const Icon = interestIcons[interest.interest_type];
            return (
              <div key={interest.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:bg-muted/20 transition-colors group">
                <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Home className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{property.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{property.address} · {property.price.toLocaleString('es-ES')} €</p>
                </div>
                <Select value={interest.interest_type} onValueChange={(v) => onUpdateType(interest.id, v as InterestType)}>
                  <SelectTrigger className="h-6 w-auto min-w-[90px] text-[10px] border-0 bg-transparent p-1">
                    <Badge variant="outline" className={`text-[10px] gap-1 ${interestColors[interest.interest_type]}`}>
                      <Icon className="w-3 h-3" />{interestLabels[interest.interest_type]}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(interestLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => onRemove(interest.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Añadir propiedad de interés</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Propiedad</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger><SelectValue placeholder="Seleccionar propiedad" /></SelectTrigger>
                <SelectContent>
                  {availableProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.title} — {p.price.toLocaleString('es-ES')} €</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Tipo de interés</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as InterestType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(interestLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!selectedProperty}>Añadir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
