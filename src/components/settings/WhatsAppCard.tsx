import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useWhatsAppStatus } from "@/hooks/useWhatsAppSend";

const requirements = [
  "Una cuenta de Twilio activa.",
  "Un número de WhatsApp Business verificado en Twilio.",
  "El Account SID y Auth Token (o API Key) de Twilio.",
  "El número remitente en formato internacional (ej. +34600123456).",
];

export function WhatsAppCard() {
  const { data: status, isLoading } = useWhatsAppStatus();
  const configured = status?.configured ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-success" />
              WhatsApp
            </CardTitle>
            <CardDescription>Click-to-chat y envío automático de mensajes</CardDescription>
          </div>
          {isLoading ? null : configured ? (
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="w-3 h-3 mr-1" /> Envío automático activo
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <AlertCircle className="w-3 h-3 mr-1" /> Solo click-to-chat
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
          <p className="text-sm font-medium">Click-to-chat (activo, gratuito)</p>
          <p className="text-xs text-muted-foreground">
            Los botones de WhatsApp en fichas de cliente y en Matching abren una conversación con el
            teléfono del cliente. No requiere ninguna configuración.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          <p className="text-sm font-medium">Envío automático (requiere Twilio)</p>
          <p className="text-xs text-muted-foreground">
            Permite enviar mensajes desde el CRM sin abrir WhatsApp, con registro en el historial de
            actividad. Todo el código está listo: solo falta conectar Twilio y fijar el número remitente.
          </p>
          {!configured && (
            <ul className="list-disc ml-5 text-xs text-muted-foreground space-y-1">
              {requirements.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
          {status && !configured && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant={status.missing.twilio_connection ? "destructive" : "outline"} className="text-[10px]">
                Conexión Twilio: {status.missing.twilio_connection ? "pendiente" : "OK"}
              </Badge>
              <Badge variant={status.missing.sender_number ? "destructive" : "outline"} className="text-[10px]">
                Número remitente: {status.missing.sender_number ? "pendiente" : "OK"}
              </Badge>
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Cuando se conecte Twilio, los botones de <strong>Enviar WhatsApp</strong> aparecerán
            automáticamente en las fichas de cliente y en el Match Center.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
