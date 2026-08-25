import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSendWhatsApp, useWhatsAppStatus } from "@/hooks/useWhatsAppSend";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

interface WhatsAppSendButtonProps {
  phone?: string | null;
  clientId?: string;
  clientName?: string;
  defaultMessage: string;
  variant?: "icon" | "labeled";
  className?: string;
}

/**
 * Botón de envío automático de WhatsApp (vía Twilio).
 * Solo aparece si el backend tiene la integración configurada.
 */
export function WhatsAppSendButton({
  phone,
  clientId,
  clientName,
  defaultMessage,
  variant = "icon",
  className = "",
}: WhatsAppSendButtonProps) {
  const { data: status } = useWhatsAppStatus();
  const send = useSendWhatsApp();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const normalized = normalizePhoneForWhatsApp(phone || "");
  if (!status?.configured || !normalized) return null;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessage(defaultMessage);
    setOpen(true);
  };

  const handleSend = async () => {
    await send.mutateAsync({ phone: phone!, message, clientId });
    setOpen(false);
  };

  return (
    <>
      {variant === "labeled" ? (
        <Button variant="outline" type="button" onClick={handleOpen} className={className}>
          <Send className="w-4 h-4 mr-1 text-success" />
          Enviar WhatsApp
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={`h-8 w-8 ${className}`}
          onClick={handleOpen}
          title="Enviar WhatsApp automático"
        >
          <Send className="w-3.5 h-3.5 text-success" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Enviar WhatsApp {clientName ? `a ${clientName}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Destinatario</Label>
              <p className="text-sm font-mono">+{normalized}</p>
            </div>
            <div>
              <Label className="text-xs">Mensaje</Label>
              <Textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">{message.length}/4000 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={send.isPending || !message.trim()}>
              {send.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
