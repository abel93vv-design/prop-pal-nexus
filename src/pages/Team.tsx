import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Phone, Building2, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { User, UserRole } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<UserRole, string> = { administrador: 'Admin', agente: 'Agente', marketing: 'Marketing' };
const roleColors: Record<UserRole, string> = {
  administrador: 'bg-destructive/10 text-destructive border-destructive/20',
  agente: 'bg-info/10 text-info border-info/20',
  marketing: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
};

const emptyUser: Omit<User, "id"> = { name: "", email: "", role: "agente", phone: "", propertyIds: [], clientIds: [], avatar: "" };

const Team = () => {
  const { users, addUser, updateUser, deleteUser } = useData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>(emptyUser);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const openCreate = () => { setEditing(null); setForm(emptyUser); setDialogOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone, propertyIds: u.propertyIds, clientIds: u.clientIds, avatar: u.avatar }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: "Error", description: "Nombre y email son obligatorios", variant: "destructive" }); return; }
    if (editing) { updateUser({ ...editing, ...form }); toast({ title: "Miembro actualizado" }); }
    else { addUser(form); toast({ title: "Miembro añadido" }); }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) { deleteUser(deleteTarget.id); toast({ title: "Miembro eliminado" }); setDeleteTarget(null); }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
            <p className="text-sm text-muted-foreground mt-1">{users.length} miembros del equipo</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo Miembro</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {users.map(u => (
            <Card key={u.id} className="hover:shadow-md transition-shadow relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)}><Trash2 className="w-3 h-3" /></Button>
              </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
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
          <DialogHeader><DialogTitle>¿Eliminar miembro?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará a <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Team;
