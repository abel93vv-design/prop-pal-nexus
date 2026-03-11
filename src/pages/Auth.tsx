import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Separator } from "@/components/ui/separator";

const MAX_ATTEMPTS = 5;

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const checkAttempts = async (emailToCheck: string) => {
    try {
      const { data } = await supabase.functions.invoke("login-attempts", {
        body: { action: "check", email: emailToCheck },
      });
      if (data?.locked) {
        setLocked(true);
        setMinutesLeft(data.minutes_left || 0);
        return false;
      }
      setLocked(false);
      setAttemptsRemaining(data?.remaining ?? MAX_ATTEMPTS);
      return true;
    } catch { return true; }
  };

  const recordFailure = async (emailToRecord: string) => {
    try {
      const { data } = await supabase.functions.invoke("login-attempts", {
        body: { action: "record_failure", email: emailToRecord },
      });
      if (data?.locked) {
        setLocked(true);
        setMinutesLeft(120);
      } else {
        setAttemptsRemaining(data?.remaining ?? 0);
      }
    } catch {}
  };

  const resetAttempts = async (emailToReset: string) => {
    try {
      await supabase.functions.invoke("login-attempts", {
        body: { action: "reset", email: emailToReset },
      });
      setLocked(false);
      setAttemptsRemaining(MAX_ATTEMPTS);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Error", description: "Introduce tu email", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado", description: "Revisa tu bandeja para restablecer tu contraseña." });
      setMode("login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        const canProceed = await checkAttempts(email);
        if (!canProceed) {
          toast({ title: "Cuenta bloqueada", description: `Demasiados intentos. Intenta de nuevo en ${minutesLeft} minutos.`, variant: "destructive" });
          setSubmitting(false);
          return;
        }
        const { error } = await signIn(email, password);
        if (error) {
          await recordFailure(email);
          const msg = attemptsRemaining <= 1
            ? "Contraseña incorrecta. Cuenta bloqueada por 2 horas."
            : `Contraseña incorrecta. Te quedan ${Math.max(0, attemptsRemaining - 1)} intentos.`;
          toast({ title: "Error", description: msg, variant: "destructive" });
        } else {
          await resetAttempts(email);
        }
      } else if (mode === "register") {
        if (!fullName.trim()) {
          toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        else toast({ title: "Registro exitoso", description: "Revisa tu email para confirmar tu cuenta." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
            <CardDescription>Te enviaremos un enlace para restablecer tu contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar enlace
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <button className="text-primary hover:underline font-medium" onClick={() => setMode("login")}>
                Volver a iniciar sesión
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">{mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}</CardTitle>
          <CardDescription>
            {mode === "login" ? "Accede a tu CRM inmobiliario" : "Regístrate para empezar a gestionar tu inmobiliaria"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-3 text-sm font-medium"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              o
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label className="text-xs">Nombre completo</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Tu nombre" />
              </div>
            )}
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div>
              <Label className="text-xs">Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
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
              {mode === "login" && (
                <div className="text-right mt-1">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setMode("forgot")}
                  >
                    ¿Olvidaste la contraseña?
                  </button>
                </div>
              )}
            </div>
            {locked && mode === "login" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                <p className="text-sm text-destructive font-medium">Cuenta bloqueada temporalmente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demasiados intentos fallidos. Intenta de nuevo en {minutesLeft} minutos.
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting || (locked && mode === "login")}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "login" ? "Iniciar sesión" : "Registrarse"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button className="text-primary hover:underline font-medium" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
