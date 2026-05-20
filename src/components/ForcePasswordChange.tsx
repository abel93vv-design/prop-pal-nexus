import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ForcePasswordChange = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mustChange, setMustChange] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("user_id", user.id)
        .single();
      if (data?.must_change_password) setMustChange(true);
    };
    check();
  }, [user?.id]);

  if (!mustChange) return null;

  const handleChange = async () => {
    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Clear the flag
    await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user!.id);
    setMustChange(false);
    toast({ title: "Contraseña actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
    setSaving(false);
  };

  return (
    <Dialog open={mustChange} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Cambio de contraseña obligatorio
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Por seguridad, debes cambiar tu contraseña antes de continuar.
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nueva contraseña</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <Label className="text-xs">Confirmar contraseña</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite la contraseña" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleChange} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Cambiar contraseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
