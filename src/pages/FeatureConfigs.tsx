import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeatureConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  default_value: unknown;
  created_at: string;
}

const emptyForm = { key: "", name: "", description: "", default_value: "{}" };

const FeatureConfigs = () => {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<FeatureConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureConfig | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<FeatureConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("feature_configs").select("*").order("created_at", { ascending: false });
    if (data) setConfigs(data as FeatureConfig[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  if (roleLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: FeatureConfig) => {
    setEditing(c);
    setForm({ key: c.key, name: c.name, description: c.description || "", default_value: JSON.stringify(c.default_value ?? {}, null, 2) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.key.trim() || !form.name.trim()) {
      toast({ title: "Error", description: "Clave y nombre son obligatorios", variant: "destructive" });
      return;
    }
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(form.default_value || "{}");
    } catch {
      toast({ title: "Error", description: "El valor por defecto debe ser JSON válido", variant: "destructive" });
      return;
    }

    setSaving(true);
    const keyClean = form.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (editing) {
      const { error } = await supabase.from("feature_configs").update({
        name: form.name, description: form.description || null, default_value: parsedValue,
      }).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Configuración actualizada" }); setDialogOpen(false); }
    } else {
      const { error } = await supabase.from("feature_configs").insert({
        key: keyClean, name: form.name, description: form.description || null, default_value: parsedValue,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Configuración creada", description: "Ya puedes activarla en cualquier tenant Pro/Enterprise" }); setDialogOpen(false); }
    }
    setSaving(false);
    fetchConfigs();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("feature_configs").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Configuración eliminada" });
    setDeleteTarget(null);
    fetchConfigs();
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuraciones</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Catálogo reutilizable. Créalas aquí una vez, actívalas por tenant desde Tenants → Configuraciones (planes Pro/Enterprise).
            </p>
          </div>
          <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-1" />Nueva Configuración</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : configs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Todavía no has creado ninguna configuración</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {configs.map(c => (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow relative group">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(c)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Settings2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate">{c.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">{c.key}</p>
                    </div>
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  <pre className="text-[10px] font-mono bg-muted/50 rounded-md p-2 overflow-x-auto max-h-24">{JSON.stringify(c.default_value, null, 2)}</pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) setDialogOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Configuración" : "Nueva Configuración"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Clave (identificador único) *</Label>
              <Input
                value={form.key}
                disabled={!!editing}
                onChange={e => setForm({ ...form, key: e.target.value })}
                placeholder="ej: dashboard_widget_extra"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Se usa en el código para consultar esta configuración. No se puede cambiar después de crearla.</p>
            </div>
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Widget extra del dashboard" />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Para qué sirve esta configuración" />
            </div>
            <div>
              <Label className="text-xs">Valor por defecto (JSON)</Label>
              <Textarea
                value={form.default_value}
                onChange={e => setForm({ ...form, default_value: e.target.value })}
                className="font-mono text-xs min-h-[100px]"
                placeholder='{ "enabled": true }'
              />
              <p className="text-[10px] text-muted-foreground mt-1">Cada tenant que la active puede sobrescribir este valor individualmente.</p>
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

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar configuración?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <strong>{deleteTarget?.name}</strong> y se desactivará automáticamente en todos los tenants que la tuvieran activada.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default FeatureConfigs;
