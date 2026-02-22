import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Loader2, Users, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUPER_ADMIN_EMAIL = "avelascocorpo@gmail.com";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
}

const emptyForm = { name: "", slug: "", plan: "free", is_active: true, is_demo: false };

const Tenants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    if (data) setTenants(data as Tenant[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, plan: t.plan, is_active: t.is_active, is_demo: t.is_demo });
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
      const { error } = await supabase.from("tenants").update({
        name: form.name, slug: form.slug, plan: form.plan, is_active: form.is_active, is_demo: form.is_demo,
      }).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Tenant actualizado" });
    } else {
      const { error } = await supabase.from("tenants").insert({
        name: form.name, slug: form.slug, plan: form.plan, is_active: form.is_active, is_demo: form.is_demo,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Tenant creado" });
    }
    setSaving(false);
    setDialogOpen(false);
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
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate">{t.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-3 h-3" />{t.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline">{t.plan}</Badge>
                    {t.is_demo && <Badge variant="outline" className="border-amber-400 text-amber-600">Demo</Badge>}
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Tenant" : "Nuevo Tenant"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mi Inmobiliaria" />
            </div>
            <div>
              <Label className="text-xs">Slug (subdominio) *</Label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="mi-inmobiliaria" />
              <p className="text-[10px] text-muted-foreground mt-1">{form.slug || "slug"}.tudominio.com</p>
            </div>
            <div>
              <Label className="text-xs">Plan</Label>
              <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar tenant?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se eliminará <strong>{deleteTarget?.name}</strong> permanentemente.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Tenants;
