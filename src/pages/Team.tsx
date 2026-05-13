import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Phone, Building2, Users, Plus, Pencil, Trash2, ShieldCheck, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { User } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

type TeamRole = "admin" | "socio" | "coordinadora" | "asesor";

const roleLabels: Record<TeamRole, string> = {
  admin: "Admin",
  socio: "Socio",
  coordinadora: "Coordinadora",
  asesor: "Asesor",
};

const roleColors: Record<TeamRole, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  socio: "bg-warning/10 text-warning border-warning/20",
  coordinadora: "bg-info/10 text-info border-info/20",
  asesor: "bg-secondary/30 text-secondary-foreground border-secondary/40",
};

interface FormState {
  name: string;
  email: string;
  phone: string;
  agencyId: string;
  appRole: TeamRole;
  tempPassword: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  agencyId: "",
  appRole: "asesor",
  tempPassword: "",
};

interface CreatedCredentials {
  email: string;
  password: string;
  login_url: string;
  name: string;
}

const Team = () => {
  const { users, agencies, updateUser, deleteUser } = useData();
  const { user: authUser } = useAuth();
  const { isAdmin, isSuperAdmin, tenantId } = useUserRole();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, TeamRole>>({});
  const [memberUserIds, setMemberUserIds] = useState<Record<string, string>>({}); // team_member.id -> user_id

  const canAssignAdmin = isAdmin || isSuperAdmin;

  // Load user_roles for current tenant + user_id binding from team_members
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const [{ data: tm }, { data: ur }] = await Promise.all([
        supabase.from("team_members").select("id, user_id").eq("tenant_id", tenantId),
        supabase.from("user_roles").select("user_id, role").eq("tenant_id", tenantId),
      ]);
      const tmMap: Record<string, string> = {};
      (tm || []).forEach((t: any) => { if (t.user_id) tmMap[t.id] = t.user_id; });
      setMemberUserIds(tmMap);

      const rolesMap: Record<string, TeamRole> = {};
      (ur || []).forEach((r: any) => {
        if (["admin", "socio", "coordinadora", "asesor"].includes(r.role)) {
          rolesMap[r.user_id] = r.role as TeamRole;
        }
      });
      setRolesByUserId(rolesMap);
    })();
  }, [tenantId, dialogOpen, credentials]);

  const getMemberRole = (u: User): TeamRole | null => {
    const uid = memberUserIds[u.id];
    if (uid && rolesByUserId[uid]) return rolesByUserId[uid];
    return null;
  };

  const filtered = users.filter((u) => {
    if (roleFilter === "all") return true;
    return getMemberRole(u) === roleFilter;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    const currentRole = getMemberRole(u) || "asesor";
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      agencyId: u.agencyId,
      appRole: currentRole,
      tempPassword: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Error", description: "Nombre y email son obligatorios", variant: "destructive" });
      return;
    }
    if (form.appRole === "admin" && !canAssignAdmin) {
      toast({ title: "Error", description: "No tienes permisos para asignar el rol Admin", variant: "destructive" });
      return;
    }

    if (editing) {
      // Update team_members basic data
      updateUser({ ...editing, name: form.name, phone: form.phone, agencyId: form.agencyId });

      // Update role if user_id is linked
      const uid = memberUserIds[editing.id];
      if (uid && tenantId) {
        const { error } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: uid, tenant_id: tenantId, role: form.appRole as AppRole },
            { onConflict: "user_id,tenant_id,role" as any },
          );
        // Fallback: delete old non-matching tenant roles, then insert
        if (error) {
          await supabase.from("user_roles").delete().eq("user_id", uid).eq("tenant_id", tenantId);
          await supabase.from("user_roles").insert({ user_id: uid, tenant_id: tenantId, role: form.appRole as AppRole });
        } else {
          // Make sure no other role for same tenant remains
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", uid)
            .eq("tenant_id", tenantId)
            .neq("role", form.appRole);
        }
        setRolesByUserId((prev) => ({ ...prev, [uid]: form.appRole }));
      } else {
        toast({
          title: "Aviso",
          description: "Este miembro no está vinculado a un usuario. El rol no se puede cambiar.",
        });
      }

      toast({ title: "Miembro actualizado" });
      setDialogOpen(false);
      return;
    }

    // Create new user
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          agency_id: form.agencyId || null,
          app_role: form.appRole,
          password: form.tempPassword || undefined,
        },
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setDialogOpen(false);
        setCredentials({
          email: data.email,
          password: data.password,
          login_url: data.login_url,
          name: form.name,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteUser(deleteTarget.id);
      toast({ title: "Miembro eliminado" });
      setDeleteTarget(null);
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text = `🔐 Credenciales de acceso al CRM\n\nNombre: ${credentials.name}\nEmail: ${credentials.email}\nContraseña: ${credentials.password}\nURL de acceso: ${credentials.login_url}\n\n⚠️ Deberás cambiar tu contraseña en el primer inicio de sesión.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            const memberRole = getMemberRole(u);
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
                    {memberRole ? (
                      <Badge variant="outline" className={`text-[10px] mt-1 ${roleColors[memberRole]}`}>
                        {roleLabels[memberRole]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] mt-1 bg-muted text-muted-foreground border-border">
                        Sin rol asignado
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center justify-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                    {u.phone && <p className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                    {agency && <p className="flex items-center justify-center gap-1"><Building2 className="w-3 h-3" />{agency.name}</p>}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-center gap-3 text-xs text-muted-foreground">
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div><Label className="text-xs">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!!editing} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                {!editing && (
                  <div>
                    <Label className="text-xs">Contraseña (auto si vacío)</Label>
                    <Input type="password" value={form.tempPassword} onChange={e => setForm({ ...form, tempPassword: e.target.value })} placeholder="Auto-generada" />
                  </div>
                )}
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

            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">Rol del miembro *</p>
              </div>
              <Select value={form.appRole} onValueChange={(v) => setForm({ ...form, appRole: v as TeamRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(roleLabels) as [TeamRole, string][])
                    .filter(([k]) => k !== "admin" || canAssignAdmin)
                    .map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {form.appRole === "admin"
                  ? "Acceso total al CRM de la inmobiliaria."
                  : <>Los permisos de cada rol se gestionan en <Link to="/roles" className="underline text-primary">Roles y permisos</Link>.</>}
              </p>
              {editing && !memberUserIds[editing.id] && (
                <p className="text-[11px] text-warning">
                  ⚠️ Este miembro no está vinculado a una cuenta de usuario. El rol no se aplicará hasta que inicie sesión por primera vez.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editing ? "Guardar" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Usuario creado exitosamente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Comparte estas credenciales con <strong>{credentials?.name}</strong>. El usuario deberá cambiar su contraseña en el primer inicio de sesión.
            </p>
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground font-medium">{credentials?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contraseña:</span>
                <span className="text-foreground font-medium">{credentials?.password}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">URL:</span>
                <span className="text-foreground font-medium text-xs break-all">{credentials?.login_url}</span>
              </div>
            </div>
            <p className="text-xs text-destructive flex items-center gap-1">
              ⚠️ Esta contraseña no se mostrará de nuevo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyCredentials}>
              {copied ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copiado" : "Copiar credenciales"}
            </Button>
            <Button onClick={() => setCredentials(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
