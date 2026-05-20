import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Loader2, Save, Plus, Copy, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const MODULES: { key: string; label: string }[] = [
  { key: "pedidos", label: "Pedidos" },
  { key: "ne", label: "NE (firmadas)" },
  { key: "noticias", label: "Noticias" },
  { key: "clientes", label: "Clientes" },
  { key: "tareas", label: "Tareas" },
  { key: "match_center", label: "Match Center" },
  { key: "pipeline", label: "Pipeline" },
  { key: "documentos", label: "Documentos" },
  { key: "equipo", label: "Equipo" },
  { key: "ajustes", label: "Ajustes" },
  { key: "facturas", label: "Facturas" },
];

const EDITABLE_ROLES: { value: AppRole; label: string; color: string }[] = [
  { value: "admin", label: "Admin", color: "bg-destructive/10 text-destructive border-destructive/20" },
  { value: "socio", label: "Socio", color: "bg-warning/10 text-warning border-warning/20" },
  { value: "coordinadora", label: "Coordinadora", color: "bg-info/10 text-info border-info/20" },
  { value: "asesor", label: "Asesor", color: "bg-secondary/30 text-secondary-foreground border-secondary/40" },
];

interface MemberRow {
  user_id: string;
  email: string;
  name: string;
  role: AppRole | null;
  role_id: string | null;
}

interface PermRow {
  id?: string;
  role: AppRole;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const RolesPermissions = () => {
  const { isAdmin, isSuperAdmin, tenantId, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [perms, setPerms] = useState<Record<string, PermRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create user dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", appRole: "asesor" as AppRole, tempPassword: "" });
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string; login_url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit / delete state
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("asesor");
  const [savingMember, setSavingMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState<MemberRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState(false);

  const loadAll = async () => {
    if (!tenantId) return;
    setLoading(true);

    const [{ data: tm }, { data: ur }, { data: rp }] = await Promise.all([
      supabase.from("team_members").select("id, name, email, user_id").eq("tenant_id", tenantId).is("deleted_at", null),
      supabase.from("user_roles").select("id, user_id, role, tenant_id").eq("tenant_id", tenantId),
      supabase.from("role_permissions").select("*").eq("tenant_id", tenantId),
    ]);

    const tmList = (tm || []) as { id: string; name: string; email: string; user_id: string | null }[];
    const rolesByUserId: Record<string, { role: AppRole; id: string }> = {};
    ((ur || []) as { id: string; user_id: string; role: AppRole }[]).forEach((r) => {
      rolesByUserId[r.user_id] = { role: r.role, id: r.id };
    });

    const memberRows: MemberRow[] = tmList.map((t) => ({
      user_id: t.user_id || "",
      email: t.email,
      name: t.name,
      role: t.user_id ? (rolesByUserId[t.user_id]?.role ?? null) : null,
      role_id: t.user_id ? (rolesByUserId[t.user_id]?.id ?? null) : null,
    }));

    setMembers(memberRows);

    const permsMap: Record<string, PermRow> = {};
    (rp || []).forEach((p: any) => {
      permsMap[`${p.role}:${p.module}`] = p;
    });
    EDITABLE_ROLES.filter((r) => r.value !== "admin").forEach((r) => {
      MODULES.forEach((m) => {
        const k = `${r.value}:${m.key}`;
        if (!permsMap[k]) {
          permsMap[k] = { role: r.value, module: m.key, can_view: false, can_edit: false, can_delete: false };
        }
      });
    });
    setPerms(permsMap);
    setLoading(false);
  };

  useEffect(() => {
    if (tenantId) loadAll();
  }, [tenantId]);

  const togglePerm = (role: AppRole, module: string, action: "can_view" | "can_edit" | "can_delete") => {
    setPerms((prev) => {
      const k = `${role}:${module}`;
      const current = prev[k] || { role, module, can_view: false, can_edit: false, can_delete: false };
      return { ...prev, [k]: { ...current, [action]: !current[action] } };
    });
  };

  const handleSavePerms = async () => {
    if (!tenantId) return;
    setSaving(true);
    const rows = Object.values(perms).map((p) => ({
      tenant_id: tenantId,
      role: p.role,
      module: p.module,
      can_view: p.can_view,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
    }));
    const { error } = await supabase
      .from("role_permissions")
      .upsert(rows, { onConflict: "tenant_id,role,module" });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permisos guardados", description: "Los cambios se aplican inmediatamente." });
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({ title: "Faltan datos", description: "Nombre y email son obligatorios.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          agency_id: null,
          app_role: newUser.appRole,
          password: newUser.tempPassword || undefined,
        },
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        setCreateOpen(false);
        setCredentials({ name: newUser.name, email: data.email, password: data.password, login_url: data.login_url });
        setNewUser({ name: "", email: "", phone: "", appRole: "asesor", tempPassword: "" });
        loadAll();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text = `🔐 Credenciales de acceso al CRM\n\nNombre: ${credentials.name}\nEmail: ${credentials.email}\nContraseña: ${credentials.password}\nURL de acceso: ${credentials.login_url}\n\n⚠️ Deberás cambiar tu contraseña en el primer inicio de sesión.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditMember = (m: MemberRow) => {
    setEditingMember(m);
    setEditRole((m.role as AppRole) || "asesor");
  };

  const handleSaveMemberRole = async () => {
    if (!editingMember?.user_id) {
      toast({ title: "Error", description: "Este miembro no está vinculado a un usuario.", variant: "destructive" });
      return;
    }
    setSavingMember(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-team-member", {
        body: { action: "update_role", user_id: editingMember.user_id, new_role: editRole },
      });
      if (error || data?.error) {
        toast({ title: "Error", description: error?.message || data?.error, variant: "destructive" });
      } else {
        toast({ title: "Rol actualizado" });
        setEditingMember(null);
        loadAll();
      }
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember?.user_id) {
      toast({ title: "Error", description: "Este miembro no está vinculado a un usuario.", variant: "destructive" });
      return;
    }
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-team-member", {
        body: { action: "delete", user_id: deletingMember.user_id },
      });
      if (error || data?.error) {
        toast({ title: "Error", description: error?.message || data?.error, variant: "destructive" });
      } else {
        toast({ title: "Miembro eliminado" });
        setDeletingMember(null);
        loadAll();
      }
    } finally {
      setDeleting(false);
    }
  };

  if (roleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin && !isSuperAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold">Acceso restringido</h2>
              <p className="text-sm text-muted-foreground">Solo los administradores de la cuenta pueden gestionar roles y permisos.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles y permisos</h1>
            <p className="text-sm text-muted-foreground">Define qué puede ver y editar cada rol dentro de tu cuenta.</p>
          </div>
        </div>

        <Tabs defaultValue="permissions">
          <TabsList>
            <TabsTrigger value="permissions">Matriz de permisos</TabsTrigger>
            <TabsTrigger value="members">Miembros y roles</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={handleSavePerms} disabled={saving || loading} size="sm">
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Guardar cambios
              </Button>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Módulo</TableHead>
                      {EDITABLE_ROLES.filter((r) => r.value !== "admin").map((r) => (
                        <TableHead key={r.value} className="text-center">{r.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((m) => (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium text-sm">{m.label}</TableCell>
                        {EDITABLE_ROLES.filter((r) => r.value !== "admin").map((r) => {
                          const k = `${r.value}:${m.key}`;
                          const p = perms[k] || { can_view: false, can_edit: false, can_delete: false };
                          return (
                            <TableCell key={r.value} className="text-center">
                              <div className="flex justify-center gap-3 text-xs">
                                <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                                  <Checkbox checked={p.can_view} onCheckedChange={() => togglePerm(r.value, m.key, "can_view")} />
                                  <span className="text-[10px] text-muted-foreground">Ver</span>
                                </label>
                                <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                                  <Checkbox checked={p.can_edit} onCheckedChange={() => togglePerm(r.value, m.key, "can_edit")} />
                                  <span className="text-[10px] text-muted-foreground">Editar</span>
                                </label>
                                <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                                  <Checkbox checked={p.can_delete} onCheckedChange={() => togglePerm(r.value, m.key, "can_delete")} />
                                  <span className="text-[10px] text-muted-foreground">Borrar</span>
                                </label>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              <strong>Admin</strong> tiene siempre acceso total y no se muestra en la matriz. Los cambios se aplican al instante en toda la cuenta.
            </p>
          </TabsContent>

          <TabsContent value="members" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />Crear usuario
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Crea nuevos usuarios desde aquí o desde <strong>Equipo</strong>. Los roles disponibles son:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EDITABLE_ROLES.map((r) => (
                    <Badge key={r.value} variant="outline" className={r.color}>{r.label}</Badge>
                  ))}
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Miembros del equipo ({members.length})</p>
                  {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3">Aún no has creado ningún miembro.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m, i) => {
                          const roleDef = EDITABLE_ROLES.find((r) => r.value === m.role);
                          return (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{m.name}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">{m.email}</TableCell>
                              <TableCell>
                                {roleDef ? (
                                  <Badge variant="outline" className={roleDef.color}>{roleDef.label}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">Sin rol</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => openEditMember(m)} disabled={!m.user_id} title={!m.user_id ? "Miembro sin usuario vinculado" : "Editar rol"}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setDeletingMember(m)} disabled={!m.user_id} className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create user dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Crear nuevo usuario</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Nombre *</Label><Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
              <div><Label className="text-xs">Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
              <div><Label className="text-xs">Teléfono</Label><Input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Rol</Label>
                <Select value={newUser.appRole} onValueChange={(v) => setNewUser({ ...newUser, appRole: v as AppRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EDITABLE_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Contraseña temporal (opcional)</Label>
                <Input value={newUser.tempPassword} onChange={e => setNewUser({ ...newUser, tempPassword: e.target.value })} placeholder="Se generará una si se deja vacío" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credentials dialog */}
        <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" />Usuario creado</DialogTitle></DialogHeader>
            {credentials && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Comparte estas credenciales con <strong>{credentials.name}</strong>. Deberá cambiar la contraseña en el primer acceso.</p>
                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5 text-sm font-mono">
                  <div><span className="text-muted-foreground">Email:</span> {credentials.email}</div>
                  <div><span className="text-muted-foreground">Contraseña:</span> {credentials.password}</div>
                  <div><span className="text-muted-foreground">URL:</span> {credentials.login_url}</div>
                </div>
                <Button onClick={copyCredentials} variant="outline" className="w-full">
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-1 text-success" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copiado" : "Copiar credenciales"}
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setCredentials(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit role dialog */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Editar rol de {editingMember?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Rol</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EDITABLE_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancelar</Button>
              <Button onClick={handleSaveMemberRole} disabled={savingMember}>
                {savingMember && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar a {deletingMember?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará el acceso de este miembro al CRM de forma permanente. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMember} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default RolesPermissions;
