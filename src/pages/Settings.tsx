import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  User, Lock, Plug, Palette, Bell, Shield,
  Facebook, Globe, Save, RefreshCw
} from "lucide-react";

function GeneralTab() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user?.id ?? "");
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil actualizado" });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Contraseña actualizada" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" /> Información personal
          </CardTitle>
          <CardDescription>Actualiza tu nombre y datos de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Nombre completo</Label>
            <Input
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading} size="sm">
            <Save className="w-4 h-4 mr-1" /> Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-primary" /> Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nueva contraseña</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirmar contraseña</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={loading} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-1" /> Cambiar contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionsTab() {
  const connections = [
    {
      name: "WordPress",
      description: "Publica propiedades directamente en tu sitio WordPress",
      icon: Globe,
      connected: false,
    },
    {
      name: "Facebook",
      description: "Comparte propiedades en Facebook e Instagram automáticamente",
      icon: Facebook,
      connected: false,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plug className="w-5 h-5 text-primary" /> Conexiones
          </CardTitle>
          <CardDescription>Conecta con plataformas externas para automatizar tu trabajo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.map((conn) => (
            <div key={conn.name} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <conn.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{conn.name}</p>
                  <p className="text-xs text-muted-foreground">{conn.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conn.connected ? (
                  <Badge className="bg-success text-success-foreground">Conectado</Badge>
                ) : (
                  <Badge variant="outline">Desconectado</Badge>
                )}
                <Button size="sm" variant={conn.connected ? "outline" : "default"}>
                  {conn.connected ? "Desconectar" : "Conectar"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PersonalizationTab() {
  const colorOptions = [
    { name: "Azul Corporativo", primary: "201 96% 32%", accent: "38 85% 55%" },
    { name: "Verde Natural", primary: "152 60% 42%", accent: "38 85% 55%" },
    { name: "Rojo Elegante", primary: "0 72% 45%", accent: "38 85% 55%" },
    { name: "Púrpura Moderno", primary: "270 60% 50%", accent: "38 85% 55%" },
  ];

  const [selected, setSelected] = useState(0);

  const applyTheme = (index: number) => {
    setSelected(index);
    toast({ title: "Tema aplicado", description: `Se aplicó "${colorOptions[index].name}"` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5 text-primary" /> Personalización
        </CardTitle>
        <CardDescription>Cambia los colores y apariencia del CRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label>Tema de color</Label>
        <div className="grid grid-cols-2 gap-3">
          {colorOptions.map((opt, i) => (
            <button
              key={opt.name}
              onClick={() => applyTheme(i)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selected === i ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: `hsl(${opt.primary})` }}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: `hsl(${opt.accent})` }}
                />
              </div>
              <p className="text-sm font-medium">{opt.name}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-primary" /> Notificaciones
        </CardTitle>
        <CardDescription>Configura cómo y cuándo recibes alertas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {[
          { label: "Nuevos clientes", desc: "Recibir alerta cuando se registre un nuevo cliente" },
          { label: "Tareas vencidas", desc: "Recordatorio de tareas próximas a vencer" },
          { label: "Cambios en propiedades", desc: "Alerta cuando se modifique una propiedad" },
          { label: "Resumen semanal", desc: "Recibir resumen de actividad por email" },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-primary" /> Seguridad
        </CardTitle>
        <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Autenticación en dos pasos (2FA)</p>
            <p className="text-xs text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
          </div>
          <Badge variant="outline">Próximamente</Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sesiones activas</p>
            <p className="text-xs text-muted-foreground">Revisa y cierra sesiones en otros dispositivos</p>
          </div>
          <Button size="sm" variant="outline">Ver sesiones</Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Registro de actividad</p>
            <p className="text-xs text-muted-foreground">Historial de acciones recientes en tu cuenta</p>
          </div>
          <Button size="sm" variant="outline">Ver registro</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Ajustes</h1>
          <p className="text-sm text-muted-foreground">Configura tu cuenta y preferencias del CRM</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="general" className="text-xs sm:text-sm">
              <User className="w-4 h-4 mr-1 hidden sm:inline" /> General
            </TabsTrigger>
            <TabsTrigger value="connections" className="text-xs sm:text-sm">
              <Plug className="w-4 h-4 mr-1 hidden sm:inline" /> Conexiones
            </TabsTrigger>
            <TabsTrigger value="personalization" className="text-xs sm:text-sm">
              <Palette className="w-4 h-4 mr-1 hidden sm:inline" /> Colores
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1 hidden sm:inline" /> Alertas
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1 hidden sm:inline" /> Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general"><GeneralTab /></TabsContent>
          <TabsContent value="connections"><ConnectionsTab /></TabsContent>
          <TabsContent value="personalization"><PersonalizationTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
