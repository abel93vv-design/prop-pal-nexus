import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTenantSettings, TENANT_SETTING_PRESETS, TenantSetting } from "@/hooks/useTenantSettings";

const emptyForm = { id: undefined as string | undefined, key: "", label: "", value: "true" };

export function AdvancedSettingsTab() {
  const { settings, loading, upsertSetting, deleteSetting } = useTenantSettings();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<TenantSetting | null>(null);

  const openCreate = (preset?: { key: string; label: string }) => {
    setForm(preset ? { id: undefined, key: preset.key, label: preset.label, value: "true" } : emptyForm);
    setOpen(true);
  };

  const openEdit = (s: TenantSetting) => {
    setForm({ id: s.id, key: s.key, label: s.label || "", value: s.value });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.key.trim()) {
      toast({ title: "Falta el nombre", description: "Escribe el nombre de la configuración", variant: "destructive" });
      return;
    }
    try {
      await upsertSetting.mutateAsync({ id: form.id, key: form.key, label: form.label || null, value: form.value.trim() });
      toast({ title: form.id ? "Configuración actualizada" : "Configuración creada" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSetting.mutateAsync(deleteTarget.id);
      toast({ title: "Configuración eliminada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const missingPresets = TENANT_SETTING_PRESETS.filter((p) => !settings.some((s) => s.key === p.key));
  const activeKeys = new Set(settings.filter((s) => ["true", "1", "si", "s\u00ed", "yes", "on"].includes(s.value.trim().toLowerCase())).map((s) => s.key));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="w-5 h-5 text-primary" /> Configuración avanzada
            </CardTitle>
            <CardDescription>
              Activa funciones opcionales creando una configuración con su nombre y el valor <strong>true</strong>.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="w-4 h-4 mr-1" /> Nueva configuración
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {missingPresets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Añadir rápido:</span>
            {missingPresets.map((p) => (
              <Button key={p.key} variant="outline" size="sm" className="h-7 text-xs" onClick={() => openCreate(p)}>
                <Plus className="w-3 h-3 mr-1" /> {p.label}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : settings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todavía no hay configuraciones avanzadas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{s.label || s.key}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{s.key}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{s.value}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="pt-4 border-t space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Configuraciones disponibles</h3>
            <p className="text-xs text-muted-foreground">Qu\u00e9 activa cada una cuando su valor es <span className="font-mono">true</span>.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TENANT_SETTING_PRESETS.map((p) => (
              <div key={p.key} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  <Badge variant={activeKeys.has(p.key) ? "default" : "outline"} className="text-[10px]">
                    {activeKeys.has(p.key) ? "Activa" : "Desactivada"}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">{p.key}</div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar configuración" : "Nueva configuración"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.key}
                disabled={!!form.id}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="whatsapp"
              />
              <p className="text-[11px] text-muted-foreground">
                Nombres reconocidos: <span className="font-mono">whatsapp</span>, <span className="font-mono">portal_idealista</span>, <span className="font-mono">portal_fotocasa</span>.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Para qué sirve" />
            </div>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="true" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsertSetting.isPending}>
              {upsertSetting.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {form.id ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar configuración?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <strong>{deleteTarget?.label || deleteTarget?.key}</strong>. La función asociada dejará de mostrarse.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
