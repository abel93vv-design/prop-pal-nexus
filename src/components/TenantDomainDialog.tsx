import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";

interface Props {
  tenantId: string | null;
  tenantName?: string;
  onClose: () => void;
  onSaved?: () => void;
}

interface DomainState {
  custom_domain: string | null;
  domain_verified: boolean;
  domain_verification_token: string | null;
  lovable_domain_added: boolean;
}

const LOVABLE_IP = "185.158.133.1";

export const TenantDomainDialog = ({ tenantId, tenantName, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [state, setState] = useState<DomainState>({ custom_domain: null, domain_verified: false, domain_verification_token: null, lovable_domain_added: false });
  const [domainInput, setDomainInput] = useState("");
  const [savingLovableFlag, setSavingLovableFlag] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    supabase
      .rpc("get_tenant_domain_info", { _tenant_id: tenantId })
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          setState(row as DomainState);
          setDomainInput(row.custom_domain || "");
        }
        setLoading(false);
      });
  }, [tenantId]);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast({ title: "Copiado" });
  };

  const handleSave = async () => {
    if (!tenantId) return;
    const clean = domainInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (clean && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) {
      toast({ title: "Dominio inválido", description: "Ej: crm.valoracasa.es", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({ custom_domain: clean || null })
      .eq("id", tenantId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dominio guardado", description: clean ? "Configura los DNS y verifica." : "Dominio eliminado." });
      const { data } = await supabase
        .rpc("get_tenant_domain_info", { _tenant_id: tenantId });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setState(row as DomainState);
      onSaved?.();
    }
    setSaving(false);
  };

  const handleVerify = async () => {
    if (!tenantId) return;
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("verify-tenant-domain", {
      body: { tenant_id: tenantId },
    });
    if (error || !data?.success) {
      toast({
        title: "No se pudo verificar",
        description: data?.error || error?.message || "Revisa los DNS",
        variant: "destructive",
      });
    } else {
      toast({ title: "¡Dominio verificado!" });
      setState(s => ({ ...s, domain_verified: true }));
      onSaved?.();
    }
    setVerifying(false);
  };

  const handleRemove = async () => {
    setDomainInput("");
    await handleSave();
  };

  const handleToggleLovableAdded = async (checked: boolean) => {
    if (!tenantId) return;
    setSavingLovableFlag(true);
    const { error } = await supabase
      .from("tenants")
      .update({ lovable_domain_added: checked })
      .eq("id", tenantId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setState(s => ({ ...s, lovable_domain_added: checked }));
      onSaved?.();
    }
    setSavingLovableFlag(false);
  };

  return (
    <Dialog open={!!tenantId} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dominio personalizado · {tenantName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-5">
            <div>
              <Label className="text-xs">Dominio del cliente</Label>
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  placeholder="crm.valoracasa.es"
                />
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Guardar
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {state.custom_domain && (
                  state.domain_verified
                    ? <Badge className="bg-success/15 text-success border-success/30"><ShieldCheck className="w-3 h-3 mr-1" />Verificado</Badge>
                    : <Badge variant="outline" className="border-amber-400 text-amber-600"><ShieldAlert className="w-3 h-3 mr-1" />Pendiente de verificar</Badge>
                )}
                {state.custom_domain && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemove}>
                    <Trash2 className="w-3 h-3 mr-1" /> Quitar
                  </Button>
                )}
              </div>
            </div>

            {state.custom_domain && state.domain_verification_token && (
              <>
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Paso 1 · Registros DNS</p>
                  <p className="text-xs text-muted-foreground">
                    Pide al cliente que añada estos registros en el panel DNS de <code className="font-mono">{state.custom_domain}</code>:
                  </p>

                  <div className="space-y-2">
                    <div className="rounded-md border border-border bg-background p-3 text-sm font-mono">
                      <div className="grid grid-cols-[60px_1fr_auto] gap-2 items-center">
                        <Badge variant="outline">A</Badge>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Nombre</div>
                          <div>{state.custom_domain.split(".").length > 2 ? state.custom_domain.split(".")[0] : "@"}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(LOVABLE_IP)}><Copy className="w-3 h-3" /></Button>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">Valor</div>
                      <div className="text-xs">{LOVABLE_IP}</div>
                    </div>

                    <div className="rounded-md border border-border bg-background p-3 text-sm font-mono">
                      <div className="grid grid-cols-[60px_1fr_auto] gap-2 items-center">
                        <Badge variant="outline">TXT</Badge>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Nombre</div>
                          <div className="break-all">_kagesan-verify.{state.custom_domain}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(state.domain_verification_token!)}><Copy className="w-3 h-3" /></Button>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">Valor</div>
                      <div className="text-xs break-all">{state.domain_verification_token}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Paso 2 · Conectar el dominio en Lovable
                  </p>
                  <p className="text-xs text-foreground">
                    Para que el SSL y el enrutamiento funcionen, también debes añadir <code className="font-mono">{state.custom_domain}</code> en
                    {" "}<strong>Project Settings → Domains</strong> de Lovable. Esto solo lo puede hacer el super admin del proyecto.
                  </p>
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-400/30">
                    <div className="flex-1">
                      <Label className="text-xs text-amber-800 dark:text-amber-300">Ya lo añadí en Lovable</Label>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                        Marca esto para no perder de vista el paso manual al gestionar varios clientes.
                      </p>
                    </div>
                    <Switch
                      checked={state.lovable_domain_added}
                      onCheckedChange={handleToggleLovableAdded}
                      disabled={savingLovableFlag}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Paso 3 · Verificar</p>
                  <p className="text-xs text-muted-foreground">
                    Cuando los DNS hayan propagado (puede tardar hasta 72h), pulsa para validar el TXT.
                  </p>
                  <Button onClick={handleVerify} disabled={verifying} className="w-full">
                    {verifying ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Verificando…</> : <><CheckCircle2 className="w-4 h-4 mr-1" />Verificar dominio</>}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
