import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Loader2, Globe, Copy, CheckCircle2, AlertCircle, Eye, EyeOff, Users, KeyRound, ExternalLink, Activity, ShieldCheck, ShieldAlert } from "lucide-react";
import { ActivityLogViewer } from "@/components/ActivityLogViewer";
import { TenantDomainDialog } from "@/components/TenantDomainDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface TenantUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}



interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  custom_domain: string | null;
  domain_verified: boolean;
}

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw + "!1";
};

const emptyForm = { name: "", slug: "", plan: "free", is_active: true, is_demo: false };
const emptyProvision = { admin_email: "", admin_name: "", admin_password: generatePassword() };

const Tenants = () => {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [provision, setProvision] = useState(emptyProvision);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ success: boolean; message: string; credentials?: { email: string; password: string } } | null>(null);
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [domainTenant, setDomainTenant] = useState<Tenant | null>(null);

  

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    if (data) setTenants(data as Tenant[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  if (roleLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setProvision({ ...emptyProvision, admin_password: generatePassword() });
    setProvisionResult(null);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, plan: t.plan, is_active: t.is_active, is_demo: t.is_demo });
    setProvisionResult(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: "Error", description: "Nombre y slug son obligatorios", variant: "destructive" });
      return;
    }
    const slugClean = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (slugClean !== form.slug) {
      setForm({ ...form, slug: slugClean });
      toast({ title: "Slug corregido", description: "Solo se permiten letras minúsculas, números y guiones" });
      return;
    }

    setSaving(true);

    if (editing) {
      // Simple update
      const { error } = await supabase.from("tenants").update({
        name: form.name, slug: form.slug, plan: form.plan, is_active: form.is_active, is_demo: form.is_demo,
      }).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Tenant actualizado" }); setDialogOpen(false); }
    } else {
      // Provision via edge function
      if (!provision.admin_email.trim()) {
        toast({ title: "Error", description: "El email del administrador es obligatorio", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("provision-tenant", {
        body: {
          name: form.name,
          slug: slugClean,
          plan: form.plan,
          is_active: form.is_active,
          is_demo: form.is_demo,
          admin_email: provision.admin_email,
          admin_password: provision.admin_password,
          admin_name: provision.admin_name || form.name,
        },
      });

      if (error || !data?.success) {
        toast({ title: "Error", description: data?.error || error?.message || "Error al provisionar", variant: "destructive" });
      } else {
        setProvisionResult({
          success: true,
          message: data.message,
          credentials: { email: provision.admin_email, password: provision.admin_password },
        });
        toast({ title: "¡Tenant provisionado!", description: "Se ha creado el tenant con su usuario administrador" });
      }
    }
    setSaving(false);
    fetchTenants();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("tenants").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Tenant eliminado" });
    setDeleteTarget(null);
    fetchTenants();
  };

  const toggleActive = async (t: Tenant) => {
    await supabase.from("tenants").update({ is_active: !t.is_active }).eq("id", t.id);
    fetchTenants();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado al portapapeles" });
  };

  const openDetail = async (t: Tenant) => {
    setDetailTenant(t);
    setTenantUsers([]);
    setResetUserId(null);
    setNewPassword("");
    setLoadingUsers(true);
    const { data, error } = await supabase.functions.invoke("manage-tenant-admin", {
      body: { action: "get_admin_users", tenant_id: t.id },
    });
    if (!error && data?.users) setTenantUsers(data.users);
    setLoadingUsers(false);
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !newPassword.trim()) return;
    setResettingPassword(true);
    const { data, error } = await supabase.functions.invoke("manage-tenant-admin", {
      body: { action: "reset_password", user_id: resetUserId, new_password: newPassword },
    });
    if (error || !data?.success) {
      toast({ title: "Error", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada", description: "El usuario deberá cambiarla en su próximo login" });
      setResetUserId(null);
      setNewPassword("");
    }
    setResettingPassword(false);
  };

  const getAccessUrl = (slug: string) => `https://${slug}.tudominio.com`;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
            <p className="text-sm text-muted-foreground mt-1">{tenants.length} tenants registrados</p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nuevo Tenant</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {tenants.map(t => (
              <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow relative group">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setDomainTenant(t)} title="Dominio personalizado"><Globe className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openDetail(t)} title="Ver usuarios"><Users className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate">{t.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{t.slug}.tudominio.com</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{t.plan}</Badge>
                    {t.is_demo && <Badge variant="outline" className="border-amber-400 text-amber-600">Demo</Badge>}
                    {t.custom_domain && (
                      t.domain_verified
                        ? <Badge className="bg-success/15 text-success border-success/30 gap-1"><ShieldCheck className="w-3 h-3" />{t.custom_domain}</Badge>
                        : <Badge variant="outline" className="border-amber-400 text-amber-600 gap-1"><ShieldAlert className="w-3 h-3" />{t.custom_domain}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Creado: {new Date(t.created_at).toLocaleDateString("es-ES")}
                    </span>
                    <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) setDialogOpen(false); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Tenant" : "Provisionar Nuevo Tenant"}</DialogTitle>
          </DialogHeader>

          {provisionResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                <span className="text-foreground font-medium">{provisionResult.message}</span>
              </div>

              {provisionResult.credentials && (
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Credenciales del administrador</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <p className="text-sm font-mono text-foreground">{provisionResult.credentials.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(provisionResult.credentials!.email)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Contraseña temporal</p>
                        <p className="text-sm font-mono text-foreground">{provisionResult.credentials.password}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(provisionResult.credentials!.password)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground">
                      Al iniciar sesión por primera vez, el usuario deberá cambiar su contraseña. Envía estas credenciales de forma segura.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Datos del tenant</p>
                <div>
                  <Label className="text-xs">Nombre del negocio *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Valoracasa" />
                </div>
                <div>
                  <Label className="text-xs">Slug (subdominio) *</Label>
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="valoracasa" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    URL: <span className="font-mono font-medium">{form.slug || "slug"}.tudominio.com</span>
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Plan</Label>
                  <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Activo</Label>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tenant demo</Label>
                  <Switch checked={form.is_demo} onCheckedChange={v => setForm({ ...form, is_demo: v })} />
                </div>

                {!editing && (
                  <>
                    <div className="border-t border-border pt-3 mt-3">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">Administrador del tenant</p>
                    </div>
                    <div>
                      <Label className="text-xs">Nombre del administrador</Label>
                      <Input value={provision.admin_name} onChange={e => setProvision({ ...provision, admin_name: e.target.value })} placeholder="Juan García" />
                    </div>
                    <div>
                      <Label className="text-xs">Email del administrador *</Label>
                      <Input type="email" value={provision.admin_email} onChange={e => setProvision({ ...provision, admin_email: e.target.value })} placeholder="admin@valoracasa.com" />
                    </div>
                    <div>
                      <Label className="text-xs">Contraseña temporal</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={provision.admin_password}
                            onChange={e => setProvision({ ...provision, admin_password: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-9"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setProvision({ ...provision, admin_password: generatePassword() })}>
                          Generar
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Se le pedirá cambiarla en el primer login</p>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editing ? "Guardar" : "Provisionar Tenant"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar tenant?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong>{deleteTarget?.name}</strong> permanentemente. Esto NO elimina los datos asociados (clientes, propiedades, etc.).</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailTenant} onOpenChange={() => setDetailTenant(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {detailTenant?.name}
            </DialogTitle>
          </DialogHeader>

          {detailTenant && (
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="users" className="flex-1"><Users className="w-3 h-3 mr-1" />Usuarios</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1"><Activity className="w-3 h-3 mr-1" />Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4 mt-4">
                {/* Access URL */}
                <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> URL de acceso
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-primary break-all">{getAccessUrl(detailTenant.slug)}</code>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(getAccessUrl(detailTenant.slug))}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Users */}
                <div className="space-y-2">
                  {loadingUsers ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                  ) : tenantUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">No se encontraron usuarios</p>
                  ) : (
                    <div className="space-y-2">
                      {tenantUsers.map(u => (
                        <div key={u.id} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{u.full_name || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(u.email)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>Creado: {new Date(u.created_at).toLocaleDateString("es-ES")}</span>
                            <span>Último login: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("es-ES") : "Nunca"}</span>
                          </div>

                          {resetUserId === u.id ? (
                            <div className="space-y-2 pt-2 border-t border-border">
                              <Label className="text-xs">Nueva contraseña</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                  />
                                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-9" onClick={() => setShowNewPassword(!showNewPassword)}>
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </Button>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setNewPassword(generatePassword())}>Generar</Button>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleResetPassword} disabled={resettingPassword || newPassword.length < 6}>
                                  {resettingPassword && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                  Cambiar
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setResetUserId(null); setNewPassword(""); }}>Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" className="w-full" onClick={() => { setResetUserId(u.id); setNewPassword(generatePassword()); setShowNewPassword(false); }}>
                              <KeyRound className="w-3 h-3 mr-1" /> Cambiar contraseña
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <ActivityLogViewer tenantId={detailTenant.id} />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTenant(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TenantDomainDialog
        tenantId={domainTenant?.id || null}
        tenantName={domainTenant?.name}
        onClose={() => setDomainTenant(null)}
        onSaved={fetchTenants}
      />
    </Layout>
  );
};

export default Tenants;