import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, Building2, Users, Plus, Pencil, Trash2, ShieldCheck, Key } from "lucide-react";
import { User, UserRole, AccessType, Permission } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

const SUPER_ADMIN_EMAIL = "avelascocorpo@gmail.com";

const roleLabels: Record<UserRole, string> = {
  admin_global: 'Admin Global',
  admin_inmobiliaria: 'Admin Inmobiliaria',
  agente: 'Agente',
  personalizado: 'Personalizado',
};
const roleColors: Record<UserRole, string> = {
  admin_global: 'bg-destructive/10 text-destructive border-destructive/20',
  admin_inmobiliaria: 'bg-warning/10 text-warning border-warning/20',
  agente: 'bg-info/10 text-info border-info/20',
  personalizado: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
};
const accessLabels: Record<AccessType, string> = {
  total: 'Acceso Total',
  solo_inmobiliaria: 'Solo su Inmobiliaria',
  personalizado: 'Personalizado',
};

const ALL_PERMISSIONS: { key: Permission; label: string }[] = [
  { key: 'ver_clientes', label: 'Ver clientes' },
  { key: 'ver_propiedades', label: 'Ver propiedades' },
  { key: 'ver_tareas', label: 'Ver tareas' },
  { key: 'editar_clientes', label: 'Editar clientes' },
  { key: 'editar_propiedades', label: 'Editar propiedades' },
  { key: 'editar_tareas', label: 'Editar tareas' },
  { key: 'eliminar_registros', label: 'Eliminar registros' },
  { key: 'publicar_propiedades', label: 'Publicar propiedades' },
];

const ALL_PERMS: Permission[] = ALL_PERMISSIONS.map(p => p.key);

const emptyUser: Omit<User, "id"> = {
  name: "", email: "", role: "agente", phone: "", propertyIds: [], clientIds: [],
  avatar: "", agencyId: "", accessType: "solo_inmobiliaria", permissions: ['ver_clientes','ver_propiedades','ver_tareas'], password: "",
};

const Team = () => {
  const { users, agencies, addUser, updateUser, deleteUser } = useData();
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.email === SUPER_ADMIN_EMAIL;
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>(emptyUser);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = users.filter(u => roleFilter === "all" || u.role === roleFilter);

  const openCreate = () => { setEditing(null); setForm(emptyUser); setDialogOpen(true); };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone, propertyIds: u.propertyIds, clientIds: u.clientIds, avatar: u.avatar, agencyId: u.agencyId, accessType: u.accessType, permissions: u.permissions, password: u.password });
    setDialogOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    let accessType: AccessType = 'solo_inmobiliaria';
    let permissions: Permission[] = ALL_PERMS;
    if (role === 'admin_global') { accessType = 'total'; permissions = ALL_PERMS; }
    else if (role === 'agente') { permissions = ['ver_clientes','ver_propiedades','ver_tareas','editar_clientes','editar_propiedades','editar_tareas','publicar_propiedades']; }
    else if (role === 'personalizado') { permissions = []; accessType = 'personalizado'; }
    setForm(f => ({ ...f, role, accessType, permissions }));
  };

  const handleAccessChange = (accessType: AccessType) => {
    const permissions: Permission[] = accessType === 'total' ? ALL_PERMS : accessType === 'solo_inmobiliaria' ? ['ver_clientes','ver_propiedades','ver_tareas','editar_clientes','editar_propiedades','editar_tareas'] : [];
    setForm(f => ({ ...f, accessType, permissions }));
  };

  const togglePermission = (p: Permission) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast({ title: "Error", description: "Nombre y email son obligatorios", variant: "destructive" }); return; }
    if (form.role === 'admin_global' && !isSuperAdmin) { toast({ title: "Error", description: "No tienes permisos para asignar el rol Admin Global", variant: "destructive" }); return; }
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
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo Miembro</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(u => {
            const agency = agencies.find(a => a.id === u.agencyId);
            return (
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
                    {u.phone && <p className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                    {agency && <p className="flex items-center justify-center gap-1"><Building2 className="w-3 h-3" />{agency.name}</p>}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <Key className="w-3 h-3" />
                      {u.accessType === 'total' ? 'Acceso total' : u.accessType === 'solo_inmobiliaria' ? 'Su inmobiliaria' : `${u.permissions.length} permisos`}
                    </div>
                    <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{u.propertyIds.length} prop.</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{u.clientIds.length} cli.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Basic info */}
            <div className="space-y-3">
              <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label className="text-xs">Contraseña</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Rol</Label>
                  <Select value={form.role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(roleLabels).filter(([k]) => k !== 'admin_global' || isSuperAdmin).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Inmobiliaria</Label>
                  <Select value={form.agencyId || "none"} onValueChange={(v) => setForm({ ...form, agencyId: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Access & Permissions */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">Tipo de acceso</p>
              </div>
              <Select value={form.accessType} onValueChange={(v) => handleAccessChange(v as AccessType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(accessLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>

              {form.accessType === 'personalizado' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Permisos personalizados:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} className="flex items-center gap-2 cursor-pointer group">
                        <Checkbox
                          checked={form.permissions.includes(p.key)}
                          onCheckedChange={() => togglePermission(p.key)}
                        />
                        <span className="text-xs text-foreground group-hover:text-primary transition-colors">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
