import { Building2, Users, ClipboardList, LayoutDashboard, UserCog, Landmark, Settings, ShieldCheck, Kanban, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import logoIsotipo from "@/assets/logo-isotipo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Match Center", url: "/match-center", icon: Target },
  { title: "Propiedades", url: "/propiedades", icon: Building2 },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Tareas", url: "/tareas", icon: ClipboardList },
  { title: "Equipo", url: "/equipo", icon: UserCog },
  { title: "Inmobiliarias", url: "/inmobiliarias", icon: Landmark },
];

const settingsItems = [
  { title: "Ajustes", url: "/ajustes", icon: Settings },
];

export function AppSidebar() {
  const { user } = useAuth();
  const isSuperAdmin = user?.email === "avelascocorpo@gmail.com";

  return (
    <Sidebar className="sidebar-gradient border-r-0">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logoIsotipo} alt="KageSan CRM" className="w-9 h-9 rounded-lg object-contain" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">KageSan CRM</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestión inmobiliaria</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest mb-1 px-3">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest mb-1 px-3">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to="/tenants"
                      className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Tenants</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}