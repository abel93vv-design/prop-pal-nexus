import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Mail, Phone, MapPin, Plus, Pencil, Trash2, Users } from "lucide-react";
import { Agency } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

const emptyAgency: Omit<Agency, "id"> = {
  name: "", address: "", phone: "", email: "", logo: "", color: "#f59e0b",
};

const Agencies = () => {
  const { agencies, users, properties, clients, addAgency, updateAgency, deleteAgency } = useData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [form, setForm] = useState<Omit<Agency, "id">>(emptyAgency);
  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null);

  const openCreate = () => { setEditing(null); setForm(emptyAgency); setDialogOpen(true); };
  const openEdit = (a: Agency) => {
    setEditing(a);
    setForm({ name: a.name, address: a.address, phone: a.phone, email: a.email, logo: a.logo, color: a.color });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    if (editing) { updateAgency({ ...editing, ...form }); toast({ title: "Inmobiliaria actualizada" }); }
    else { addAgency(form); toast({ title: "Inmobiliaria creada" }); }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteAgency(deleteTarget.id); toast({ title: "Inmobiliaria eliminada" }); setDeleteTarget(null); }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inmobiliarias</h1>
            <p className="text-sm text-muted-foreground mt-1">{agencies.length} inmobiliarias registradas</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva Inmobiliaria</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {agencies.map(a => {
            const agencyUsers = users.filter(u => u.agencyId === a.id);
            const agencyProps = properties.filter(p => p.agencyId === a.id);
            const agencyClients = clients.filter(c => c.agencyId === a.id);
            return (
              <Card key={a.id} className="overflow-hidden hover:shadow-md transition-shadow relative group">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(a)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                {/* Color banner */}
                <div className="h-3" style={{ backgroundColor: a.color }} />
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: a.color + '22', border: `2px solid ${a.color}44` }}>
                      <Building2 className="w-6 h-6" style={{ color: a.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{a.name}</h3>
                      <div className="w-3 h-3 rounded-full inline-block mr-1" style={{ backgroundColor: a.color }} />
                      <span className="text-xs text-muted-foreground">{a.color}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {a.address && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0" />{a.address}</p>}
                    {a.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 shrink-0" />{a.email}</p>}
                    {a.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" />{a.phone}</p>}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-foreground">{agencyUsers.length}</p>
                      <p className="text-[10px] text-muted-foreground">Usuarios</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-foreground">{agencyProps.length}</p>
                      <p className="text-[10px] text-muted-foreground">Propiedades</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-foreground">{agencyClients.length}</p>
                      <p className="text-[10px] text-muted-foreground">Clientes</p>
                    </div>
                  </div>

                  {agencyUsers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {agencyUsers.slice(0, 4).map(u => (
                          <div key={u.id} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center" title={u.name}>
                            <span className="text-[10px] font-bold text-primary">{u.name[0]}</span>
                          </div>
                        ))}
                        {agencyUsers.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">+{agencyUsers.length - 4}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{agencyUsers.map(u => u.name.split(' ')[0]).slice(0, 2).join(', ')}{agencyUsers.length > 2 ? '...' : ''}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Inmobiliaria" : "Nueva Inmobiliaria"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Color identificativo</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                />
                <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="font-mono text-sm" placeholder="#f59e0b" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar inmobiliaria?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong>{deleteTarget?.name}</strong>. Los usuarios, propiedades y clientes asociados quedarán sin asignar.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Agencies;
