import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { normalizePhoneForWhatsApp } from "@/lib/whatsapp";

interface WhatsAppStatus {
  configured: boolean;
  missing: { twilio_connection: boolean; sender_number: boolean };
}

async function readError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.details || body?.error || "Error desconocido";
    } catch {
      return "Error desconocido";
    }
  }
  return error instanceof Error ? error.message : "Error desconocido";
}

/** Indica si el envío automático (Twilio) está configurado en el backend. */
export function useWhatsAppStatus() {
  return useQuery<WhatsAppStatus>({
    queryKey: ["whatsapp-status"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { action: "status" },
      });
      if (error) throw new Error(await readError(error));
      return data as WhatsAppStatus;
    },
  });
}

/** Envía un WhatsApp automático a través de Twilio. */
export function useSendWhatsApp() {
  return useMutation({
    mutationFn: async ({
      phone,
      message,
      clientId,
    }: {
      phone: string;
      message: string;
      clientId?: string;
    }) => {
      const to = normalizePhoneForWhatsApp(phone || "");
      if (!to) throw new Error("El teléfono del cliente no es válido");
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { action: "send", to, message, client_id: clientId },
      });
      if (error) throw new Error(await readError(error));
      return data as { ok: boolean; sid?: string };
    },
    onSuccess: () => {
      toast({ title: "WhatsApp enviado", description: "El mensaje se ha enviado correctamente." });
    },
    onError: (e: Error) => {
      toast({ title: "No se pudo enviar", description: e.message, variant: "destructive" });
    },
  });
}
