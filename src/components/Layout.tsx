import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { HelpChat } from "@/components/HelpChat";
import { FeedbackTab } from "@/components/FeedbackTab";
import { useEffect } from "react";

// Safety net: Radix sometimes leaves `pointer-events: none` on <body> when a
// Dialog/Select closes. This watcher clears it as soon as no overlay is open,
// preventing the entire page from becoming unresponsive.
function useBodyPointerEventsGuard() {
  useEffect(() => {
    const sanitize = () => {
      const hasOpenOverlay = document.querySelector(
        '[data-state="open"][role="dialog"], [data-radix-popper-content-wrapper]'
      );
      if (hasOpenOverlay) return;
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
      if (document.body.hasAttribute("data-scroll-locked")) {
        document.body.removeAttribute("data-scroll-locked");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
      }
    };
    const observer = new MutationObserver(sanitize);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked"],
    });
    return () => observer.disconnect();
  }, []);
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  useBodyPointerEventsGuard();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground flex-1">KageSan CRM</span>
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} title="Cerrar sesión">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
        <HelpChat />
        <FeedbackTab />
      </div>
    </SidebarProvider>
  );
}
