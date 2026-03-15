import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = [
  { value: "bug", label: "🐛 Error / Bug" },
  { value: "feature", label: "💡 Sugerencia" },
  { value: "ux", label: "🎨 Mejora de UX" },
  { value: "other", label: "📝 Otro" },
];

export function FeedbackTab() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("feature");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!message.trim()) {
      toast({ title: "Escribe tu feedback", variant: "destructive" });
      return;
    }

    setSending(true);

    const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;
    const emailSubject = encodeURIComponent(`[Feedback KageSan] ${categoryLabel} - ${subject || "Sin asunto"}`);
    const emailBody = encodeURIComponent(
      `Categoría: ${categoryLabel}\nAsunto: ${subject || "N/A"}\nUsuario: ${user?.email || "Anónimo"}\n\n${message}`
    );

    window.open(`mailto:info@kagesancrm.com?subject=${emailSubject}&body=${emailBody}`, "_blank");

    toast({ title: "¡Gracias por tu feedback!", description: "Se ha abierto tu cliente de correo." });
    setMessage("");
    setSubject("");
    setCategory("feature");
    setOpen(false);
    setSending(false);
  };

  return (
    <>
      {/* Vertical tab button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 bg-foreground text-background px-2 py-3 rounded-l-lg shadow-lg hover:pr-3 transition-all duration-200 writing-vertical"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        <MessageSquare className="w-4 h-4 rotate-90" />
        <span className="text-xs font-semibold tracking-wide">Feedback</span>
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 w-80 bg-card border border-border rounded-l-xl shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" /> Enviar Feedback
                </h3>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div>
                <Label className="text-xs">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Asunto</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Breve descripción..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Mensaje *</Label>
                <Textarea
                  className="text-xs min-h-[80px]"
                  placeholder="Cuéntanos qué podemos mejorar..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <Button size="sm" className="w-full" onClick={handleSubmit} disabled={sending}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Enviar feedback
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Se enviará a info@kagesancrm.com
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
