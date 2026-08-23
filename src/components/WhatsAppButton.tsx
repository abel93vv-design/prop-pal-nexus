import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
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
  const url = buildWhatsAppUrl(phone || "", message);
  if (!url) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Si por algún motivo el enlace nativo no se abre, mostramos feedback.
    toast({
      title: "Abriendo WhatsApp",
      description: "Si no se abre, revisa que no haya un bloqueador de pop-ups.",
    });
  };

  if (variant === "labeled") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick} title={title} className={className}>
        <Button variant="outline" type="button" asChild>
          <span>
            <MessageCircle className="w-4 h-4 mr-1 text-success" />
            WhatsApp
          </span>
        </Button>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick} title={title} className={className}>
      <Button variant="ghost" size="icon" type="button" className="h-8 w-8" asChild>
        <span>
          <MessageCircle className="w-3.5 h-3.5 text-success" />
        </span>
      </Button>
    </a>
  );
}
