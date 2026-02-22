import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { HelpChat } from "@/components/HelpChat";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground flex-1">CRM Inmobiliario</span>
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
      </div>
    </SidebarProvider>
  );
}
