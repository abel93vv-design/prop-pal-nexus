import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "@/hooks/use-toast";

interface WhatsAppButtonProps {
  phone?: string | null;
  message?: string;
  title?: string;
  /** "icon" (tabla/listas) o "labeled" (footer de ficha) */
  variant?: "icon" | "labeled";
  className?: string;
}

export function WhatsAppButton({
  phone,
  message,
  title = "Contactar por WhatsApp",
  variant = "icon",
  className = "",
}: WhatsAppButtonProps) {
  if (!phone) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = openWhatsApp(phone, message);
    if (!ok) {
      toast({
        title: "Teléfono no válido",
        description: "Revisa el número del cliente antes de contactar por WhatsApp.",
        variant: "destructive",
      });
    }
  };

  if (variant === "labeled") {
    return (
      <Button variant="outline" onClick={handleClick} title={title} className={className}>
        <MessageCircle className="w-4 h-4 mr-1 text-success" />
        WhatsApp
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${className}`}
      title={title}
      onClick={handleClick}
    >
      <MessageCircle className="w-3.5 h-3.5 text-success" />
    </Button>
  );
}
