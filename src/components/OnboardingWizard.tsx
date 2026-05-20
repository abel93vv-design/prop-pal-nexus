import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Building2, Users, Home, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/context/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const allSteps = [
  { id: "welcome", icon: Sparkles, title: "¡Bienvenido a KageSan CRM!", subtitle: "Configuremos tu cuenta en 2 minutos" },
  { id: "agency", icon: Building2, title: "Tu inmobiliaria", subtitle: "Datos básicos de tu empresa" },
  { id: "ready", icon: CheckCircle2, title: "¡Todo listo!", subtitle: "Tu cuenta está configurada" },
];

export const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipAgencyStep, setSkipAgencyStep] = useState(false);

  useEffect(() => {
    if (!open || !tenantId) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("agencies")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
      if (!cancelled && (count ?? 0) > 0) setSkipAgencyStep(true);
    })();
    return () => { cancelled = true; };
  }, [open, tenantId]);

  const steps = useMemo(
    () => skipAgencyStep ? allSteps.filter(s => s.id !== "agency") : allSteps,
    [skipAgencyStep]
  );

  const handleCreateAgency = async () => {
    if (!agencyName.trim()) {
      toast({ title: "Error", description: "El nombre de la inmobiliaria es obligatorio", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("agencies").insert({
        name: agencyName,
        phone: agencyPhone,
        email: agencyEmail || user?.email || "",
        tenant_id: tenantId,
      });
      if (error) throw error;
      setStep(2);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true } as any)
        .eq("user_id", user?.id);
    } catch {}
    onComplete();
  };

  const currentStep = allSteps[step];
  const Icon = currentStep.icon;
  const visibleIndex = steps.findIndex(s => s.id === currentStep.id);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-accent p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-primary-foreground">{currentStep.title}</h2>
          <p className="text-sm text-primary-foreground/80 mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-8 pt-4">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= visibleIndex ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 pt-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Building2, label: "Propiedades", desc: "Gestiona tu cartera" },
                  { icon: Users, label: "Clientes", desc: "CRM completo" },
                  { icon: Home, label: "Portales", desc: "Publica automáticamente" },
                ].map((feat) => (
                  <Card key={feat.label} className="p-3 text-center border-border/50">
                    <feat.icon className="w-6 h-6 mx-auto text-primary mb-1.5" />
                    <p className="text-xs font-semibold text-foreground">{feat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{feat.desc}</p>
                  </Card>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(1)}>
                Comenzar configuración <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nombre de la inmobiliaria *</Label>
                <Input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Ej: Inmobiliaria García"
                />
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={agencyPhone}
                  onChange={(e) => setAgencyPhone(e.target.value)}
                  placeholder="Ej: +34 612 345 678"
                />
              </div>
              <div>
                <Label className="text-xs">Email de contacto</Label>
                <Input
                  type="email"
                  value={agencyEmail}
                  onChange={(e) => setAgencyEmail(e.target.value)}
                  placeholder={user?.email || "info@tuinmobiliaria.com"}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button className="flex-1" onClick={handleCreateAgency} disabled={submitting}>
                  {submitting ? "Creando..." : "Crear inmobiliaria"}
                </Button>
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
                onClick={() => setStep(2)}
              >
                Omitir por ahora
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Ya puedes empezar a añadir propiedades, clientes y gestionar tu pipeline de ventas.
                </p>
              </div>
              <Button className="w-full" onClick={handleFinish}>
                Ir al Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
