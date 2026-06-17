import { Building2, Users, ClipboardList, LayoutDashboard, UserCog, Landmark, Settings, ShieldCheck, Kanban, Target, FileSignature, Newspaper, KeyRound, Crown, LineChart } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const propertySubItems = [
  { title: "NE (firmadas)", url: "/propiedades/ne", icon: FileSignature, module: "ne" },
  { title: "Noticias", url: "/propiedades/noticias", icon: Newspaper, module: "noticias" },
];

const controlLeadsSubItems = [
  { title: "Coordinadoras", url: "/control-leads/coordinadoras", icon: Users, module: "control_leads" },
  { title: "Asesores", url: "/control-leads/asesores", icon: UserCog, module: "control_leads" },
];

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, module: null },
  { title: "Pipeline", url: "/pipeline", icon: Kanban, module: "pipeline" },
  { title: "Match Center", url: "/match-center", icon: Target, module: "match_center" },
  { title: "Control de leads", url: "/control-leads", icon: LineChart, subItems: controlLeadsSubItems, module: "control_leads" },
  { title: "Propiedades", url: "/propiedades", icon: Building2, subItems: propertySubItems, module: "ne" },
  { title: "Clientes", url: "/clientes", icon: Users, module: "clientes" },
  { title: "Tareas", url: "/tareas", icon: ClipboardList, module: "tareas" },
  { title: "Equipo", url: "/equipo", icon: UserCog, module: "equipo" },
  { title: "Inmobiliarias", url: "/inmobiliarias", icon: Landmark, module: "ajustes" },
];


const settingsItems = [
  { title: "Ajustes", url: "/ajustes", icon: Settings },
];

export function AppSidebar() {
  const { isAdmin, isSuperAdmin, can, loading } = useUserRole();
  const visibleMain = loading
    ? mainItems.filter((i) => !i.module)
    : mainItems.filter((i) => !i.module || can(i.module, "view") || isAdmin);
  const { pathname } = useLocation();

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
              {visibleMain.map((item) => (
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
                  {item.subItems && pathname.startsWith(item.url) && (
                    <SidebarMenuSub>
                      {item.subItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                            <NavLink to={sub.url} className="flex items-center gap-2 text-xs">
                              <sub.icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{sub.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!loading && isAdmin && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest mb-1 px-3">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to="/roles"
                      className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <KeyRound className="w-4 h-4 shrink-0" />
                      <span>Roles y permisos</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSuperAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to="/admin"
                        className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <Crown className="w-4 h-4 shrink-0" />
                        <span>Panel Global</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isSuperAdmin && (
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
                )}
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