import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PLAN_LIMITS,
  PLAN_PRICES,
  PLAN_LABELS,
  PLAN_ORDER,
  isUnlimited,
  type PlanName,
} from "@/config/planLimits";
import {
  BookOpen,
  Shield,
  CreditCard,
  Wrench,
  Crown,
  Lock,
  Receipt,
  HelpCircle,
} from "lucide-react";

const SECTIONS = [
  { id: "overview", title: "Visión general", icon: BookOpen },
  { id: "roles", title: "Roles y permisos", icon: Shield },
  { id: "plans", title: "Planes y precios", icon: CreditCard },
  { id: "modules", title: "Módulos y herramientas", icon: Wrench },
  { id: "admin-panel", title: "Panel Global", icon: Crown },
  { id: "security", title: "Seguridad y datos", icon: Lock },
  { id: "billing", title: "Facturación", icon: Receipt },
  { id: "faq", title: "FAQ operativo", icon: HelpCircle },
];

const ROLES = [
  {
    key: "super_admin",
    name: "Super Admin",
    desc: "Tú (Abel). Visión global de todos los tenants. No pertenece a ningún tenant concreto.",
    can: [
      "Ver y gestionar todos los tenants",
      "Cambiar el plan de cualquier tenant",
      "Provisionar nuevos tenants y su admin",
      "Ver actividad y facturación consolidada",
      "Acceder al Panel Global (/admin)",
    ],
    cant: ["No edita datos internos del tenant (clientes, propiedades) salvo soporte explícito"],
  },
  {
    key: "admin",
    name: "Admin del tenant",
    desc: "Dueño de la cuenta del tenant. Gestiona el equipo y la configuración.",
    can: [
      "Crear, editar y eliminar miembros del equipo",
      "Asignar roles (socio, coordinadora, asesor)",
      "Configurar ajustes, integraciones, portales",
      "Acceso total a clientes, propiedades, pipeline, match center",
      "Ver facturación y suscripción del tenant",
    ],
    cant: ["No ve datos de otros tenants"],
  },
  {
    key: "socio",
    name: "Socio",
    desc: "Perfil de gestión amplio sin permisos de administración del equipo.",
    can: [
      "Acceso total a clientes, propiedades, tareas, pipeline",
      "Match Center y publicaciones en portales",
      "Ver informes y dashboard",
    ],
    cant: ["No gestiona miembros ni cambia el plan"],
  },
  {
    key: "coordinadora",
    name: "Coordinadora",
    desc: "Coordinación operativa: agenda, asignaciones, seguimiento.",
    can: [
      "Crear y editar clientes, tareas y visitas",
      "Asignar tareas a asesores",
      "Editar propiedades",
    ],
    cant: ["No gestiona equipo, no cambia plan, no borra registros sensibles"],
  },
  {
    key: "asesor",
    name: "Asesor",
    desc: "Comercial de calle: trabaja con sus clientes y propiedades asignadas.",
    can: [
      "Ver y editar sus clientes y propiedades",
      "Registrar interacciones y tareas",
      "Usar Match Center",
    ],
    cant: ["No ve datos de otros asesores salvo configuración del admin", "No gestiona equipo ni configuración"],
  },
];

const PERMISSION_MATRIX: Array<{
  module: string;
  super_admin: string;
  admin: string;
  socio: string;
  coordinadora: string;
  asesor: string;
}> = [
  { module: "Clientes", super_admin: "—", admin: "Total", socio: "Total", coordinadora: "Crear/editar", asesor: "Suyos" },
  { module: "Propiedades", super_admin: "—", admin: "Total", socio: "Total", coordinadora: "Crear/editar", asesor: "Suyas" },
  { module: "Tareas", super_admin: "—", admin: "Total", socio: "Total", coordinadora: "Total", asesor: "Suyas" },
  { module: "Pipeline", super_admin: "—", admin: "Total", socio: "Total", coordinadora: "Editar", asesor: "Suyas" },
  { module: "Match Center", super_admin: "—", admin: "Total", socio: "Total", coordinadora: "Lectura", asesor: "Lectura" },
  { module: "Equipo / Roles", super_admin: "—", admin: "Total", socio: "Lectura", coordinadora: "—", asesor: "—" },
  { module: "Ajustes / Portales", super_admin: "—", admin: "Total", socio: "Lectura", coordinadora: "—", asesor: "—" },
  { module: "Facturación tenant", super_admin: "Lectura global", admin: "Lectura", socio: "—", coordinadora: "—", asesor: "—" },
  { module: "Panel Global /admin", super_admin: "Total", admin: "—", socio: "—", coordinadora: "—", asesor: "—" },
];

const MODULES = [
  {
    title: "Dashboard",
    desc: "KPIs del tenant: clientes activos, propiedades disponibles, tareas urgentes, gráfica mensual.",
    how: ["Se carga automáticamente al iniciar sesión.", "Filtros por agencia/categoría desde la cabecera."],
    who: "Todos los roles ven KPIs del ámbito que les corresponde.",
  },
  {
    title: "Clientes",
    desc: "Gestión de leads y clientes: comprador, vendedor, arrendador, arrendatario.",
    how: [
      "Crear cliente → ficha → módulos extras (intereses, tareas) se habilitan tras guardar.",
      "Importar CSV con mapeo difuso de columnas.",
      "Exportar CSV (UTF-8 con BOM) desde la lista.",
      "Lead status dinámico: nuevo → contactado → negociación → cerrado.",
    ],
    who: "Admin, Socio, Coordinadora con permiso total. Asesor solo los suyos.",
    limit: "Limitado por plan (campo «clients»).",
  },
  {
    title: "Propiedades",
    desc: "Inmuebles del tenant. Dos vistas: NE (firmadas) y Noticias.",
    how: [
      "Crear propiedad con multi-imagen, datos técnicos, ubicación de Málaga.",
      "Marcar como no disponible con motivo.",
      "Publicar en Fotocasa / Idealista vía XML automático (portales).",
      "Filtros por tipo de operación (venta/alquiler/ambos).",
    ],
    who: "Admin, Socio, Coordinadora editan. Asesor solo las suyas.",
    limit: "Limitado por plan (campos «properties» y «portals»).",
  },
  {
    title: "Match Center",
    desc: "Motor de cruce cliente↔propiedad con 4 ejes ponderados y filtros duros.",
    how: [
      "Configura pesos en Ajustes → Match Center.",
      "Genera matches al editar cliente/propiedad o bajo demanda.",
      "Los filtros duros descartan; los pesos puntúan.",
    ],
    who: "Disponible en todos los planes. Lectura total para asesores.",
  },
  {
    title: "Pipeline de ventas",
    desc: "Kanban con etapas configurables por tenant. Sin importe esperado.",
    how: ["Arrastrar tarjetas entre etapas.", "Editar etapas en Ajustes (color, posición, tipo activo/won/lost)."],
    who: "Admin/Socio gestionan etapas; resto opera tarjetas según permiso.",
  },
  {
    title: "Tareas y recordatorios",
    desc: "Llamadas, emails, visitas y recordatorios con prioridad y vencimiento.",
    how: ["Crear tarea desde cliente o propiedad.", "Estado: pendiente → en progreso → completada."],
    who: "Coordinadora total. Asesor solo las suyas.",
  },
  {
    title: "Equipo y miembros",
    desc: "Alta y gestión de usuarios del tenant con rol asignado.",
    how: [
      "Roles y permisos → tabla de miembros.",
      "Crear miembro (email + nombre + rol). Se le fuerza cambio de contraseña en el primer login.",
      "Editar rol o eliminar.",
    ],
    who: "Solo Admin del tenant.",
    limit: "Limitado por plan (campo «team_members»).",
  },
  {
    title: "Inmobiliarias / Agencias",
    desc: "Sub-agencias dentro del tenant para segregar datos.",
    how: ["Crear agencia con logo y color.", "Asignar clientes/propiedades/usuarios a una agencia."],
    limit: "Limitado por plan (campo «agencies»).",
  },
  {
    title: "Ajustes",
    desc: "Perfil, seguridad, sesiones activas, historial de auditoría, copias de seguridad.",
    how: [
      "Pestaña Seguridad: cambio de contraseña, sesiones.",
      "Pestaña Backup: papelera y snapshots.",
      "Pestaña Suscripción: plan actual y facturas.",
    ],
    who: "Admin total. Resto ve su perfil.",
  },
  {
    title: "Onboarding",
    desc: "Wizard que se muestra hasta que el tenant marca onboarding_completed.",
    how: ["Aparece automáticamente al primer login del admin del tenant."],
  },
  {
    title: "Asistente IA",
    desc: "Chat conversacional (Gemini 3 Flash) que guía al usuario por el CRM.",
    how: ["Botón flotante en la esquina inferior."],
  },
  {
    title: "Feedback",
    desc: "Pestaña flotante para enviar sugerencias o reportar bugs.",
  },
];

const FAQS = [
  {
    q: "Un usuario de un tenant no puede entrar",
    a: "Comprueba en orden: 1) suscripción del tenant activa, 2) usuario no bloqueado por 5 fallos en 2h, 3) si tiene must_change_password pendiente, 4) email confirmado.",
  },
  {
    q: "Cómo doy de alta un nuevo cliente del CRM (nuevo tenant)",
    a: "Ve a /tenants → Nuevo tenant. Rellena nombre, slug, plan, email y contraseña del admin. Se crea el tenant, su admin, las etapas de pipeline por defecto y los campos personalizados base.",
  },
  {
    q: "Cómo cambio el plan de un tenant",
    a: "Panel Global → pestaña Tenants → botón «Cambiar plan» en la fila del tenant. Aplica de inmediato; los nuevos límites empiezan a evaluarse al instante.",
  },
  {
    q: "Cómo recupero datos borrados",
    a: "Los borrados son lógicos (deleted_at). El admin del tenant entra en Ajustes → Backup → Papelera y restaura. Snapshots disponibles para versiones anteriores.",
  },
  {
    q: "Qué pasa al alcanzar un límite del plan",
    a: "La fila del tenant se marca en ámbar (≥80%) o rojo (100%) en el Panel Global. El tenant ve aviso y se le impide crear nuevos registros del recurso afectado hasta subir de plan.",
  },
  {
    q: "Cómo provisiono usuarios sin que se autoregistren",
    a: "El signup público está deshabilitado. Solo el super admin crea tenants, y solo el admin del tenant crea miembros desde Roles y permisos.",
  },
];

const fmt = (n: number) => (isUnlimited(n) ? "Ilimitado" : n.toLocaleString("es-ES"));
const fmtMb = (n: number) => (isUnlimited(n) ? "Ilimitado" : n >= 1000 ? `${n / 1000} GB` : `${n} MB`);

const planRows: Array<{ label: string; key: keyof typeof PLAN_LIMITS.free; format?: (n: number) => string }> = [
  { label: "Propiedades", key: "properties" },
  { label: "Clientes", key: "clients" },
  { label: "Miembros del equipo", key: "team_members" },
  { label: "Agencias", key: "agencies" },
  { label: "Portales (Fotocasa/Idealista)", key: "portals" },
  { label: "Campos personalizados", key: "custom_fields" },
  { label: "API keys", key: "api_keys" },
  { label: "Pipelines", key: "pipelines" },
  { label: "Almacenamiento", key: "storage_mb", format: fmtMb },
  { label: "Retención logs (días)", key: "activity_logs_days" },
];

export default function AdminDocs() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 scroll-smooth">
      {/* Índice lateral */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Índice</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="flex flex-col">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {s.title}
                  </a>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Contenido */}
      <ScrollArea className="lg:max-h-[calc(100vh-220px)]">
        <div className="space-y-8 pr-4">
          {/* Visión general */}
          <section id="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Visión general
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                <p>
                  CRM inmobiliario multi-tenant. Cada cliente (tenant) opera en su propio espacio aislado por
                  RLS de base de datos. El super admin (tú) tiene una vista global de toda la plataforma.
                </p>
                <p className="text-muted-foreground">
                  Flujo típico: <strong>Super admin crea el tenant + su admin</strong> → el admin entra,
                  cambia contraseña, configura su equipo y agencias → el equipo trabaja con clientes,
                  propiedades, pipeline y match center.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Roles */}
          <section id="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> Roles y permisos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <Card key={r.key} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{r.name}</CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">{r.key}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground">{r.desc}</p>
                        <div>
                          <p className="font-medium text-xs uppercase tracking-wide mb-1">Puede</p>
                          <ul className="list-disc list-inside space-y-0.5 text-sm">
                            {r.can.map((c) => <li key={c}>{c}</li>)}
                          </ul>
                        </div>
                        {r.cant && (
                          <div>
                            <p className="font-medium text-xs uppercase tracking-wide mb-1 mt-2">No puede</p>
                            <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                              {r.cant.map((c) => <li key={c}>{c}</li>)}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Matriz de permisos</h3>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Módulo</TableHead>
                          <TableHead>Super Admin</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Socio</TableHead>
                          <TableHead>Coordinadora</TableHead>
                          <TableHead>Asesor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PERMISSION_MATRIX.map((row) => (
                          <TableRow key={row.module}>
                            <TableCell className="font-medium">{row.module}</TableCell>
                            <TableCell>{row.super_admin}</TableCell>
                            <TableCell>{row.admin}</TableCell>
                            <TableCell>{row.socio}</TableCell>
                            <TableCell>{row.coordinadora}</TableCell>
                            <TableCell>{row.asesor}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Planes */}
          <section id="plans">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Planes y precios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Característica</TableHead>
                        {PLAN_ORDER.map((p) => (
                          <TableHead key={p} className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-semibold">{PLAN_LABELS[p]}</span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {PLAN_PRICES[p] === 0 ? "Gratis" : `${PLAN_PRICES[p]} €/mes`}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          {PLAN_ORDER.map((p) => {
                            const v = PLAN_LIMITS[p as PlanName][row.key] as number;
                            const text = row.format ? row.format(v) : fmt(v);
                            return (
                              <TableCell key={p} className="text-center">
                                {isUnlimited(v) ? (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    Ilimitado
                                  </Badge>
                                ) : (
                                  text
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-medium">Match Center</TableCell>
                        {PLAN_ORDER.map((p) => (
                          <TableCell key={p} className="text-center">
                            {PLAN_LIMITS[p as PlanName].match_center ? "✓" : "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Datos sincronizados con <code>src/config/planLimits.ts</code>. Para cambiar precios o
                  límites, edita ese archivo y se reflejará aquí automáticamente.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Módulos */}
          <section id="modules">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" /> Módulos y herramientas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {MODULES.map((m) => (
                    <Card key={m.title} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{m.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground">{m.desc}</p>
                        {m.how && (
                          <div>
                            <p className="font-medium text-xs uppercase tracking-wide mb-1">Cómo se usa</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {m.how.map((h) => <li key={h}>{h}</li>)}
                            </ul>
                          </div>
                        )}
                        {m.who && (
                          <p className="text-xs"><strong>Acceso:</strong> {m.who}</p>
                        )}
                        {m.limit && (
                          <p className="text-xs text-amber-700"><strong>Límite:</strong> {m.limit}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Panel Global */}
          <section id="admin-panel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" /> Panel Global (super admin)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Resumen:</strong> KPIs agregados de toda la plataforma.</li>
                  <li><strong>Tenants:</strong> tabla con uso vs límite, botón cambiar plan, ver detalle, suspender.</li>
                  <li><strong>Actividad global:</strong> feed cronológico de últimos 200 eventos.</li>
                  <li><strong>Facturación:</strong> todas las facturas con filtros y exportación CSV.</li>
                  <li><strong>Documentación:</strong> esta sección.</li>
                </ul>
                <p className="text-muted-foreground">
                  Las barras de uso se colorean en <span className="text-amber-600 font-medium">ámbar al ≥80%</span>{" "}
                  y <span className="text-destructive font-medium">rojo al 100%</span>. Los tenants en riesgo
                  aparecen en el KPI superior «Tenants en riesgo».
                </p>
                <p className="text-muted-foreground">
                  Para crear un tenant nuevo: <strong>/tenants → Nuevo tenant</strong>. Provisiona admin,
                  pipeline base y campos personalizados de inicio.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Seguridad */}
          <section id="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" /> Seguridad y datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Aislamiento por <code>tenant_id</code> con políticas RLS estrictas.</li>
                  <li>Roles en tabla aparte (<code>user_roles</code>) para evitar escalado de privilegios.</li>
                  <li>Soft delete (<code>deleted_at</code>) en todas las entidades. Nunca hay borrado físico.</li>
                  <li>Snapshots automáticos al modificar/eliminar para auditoría y restauración.</li>
                  <li>Logs de actividad por tenant con retención según plan.</li>
                  <li>Lockout de login: 5 intentos fallidos en 2 horas.</li>
                  <li>Rate limit en endpoints de auth: 10 req/min.</li>
                  <li>Cambio de contraseña forzado en el primer login de usuarios provisionados.</li>
                  <li>Complejidad de contraseña estricta en el alta.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Facturación */}
          <section id="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" /> Facturación y suscripciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li>Generación de facturas en HTML por tenant.</li>
                  <li>Estados de suscripción: activa, suspendida, vencida.</li>
                  <li>Al alcanzar un límite del plan, el tenant deja de poder crear nuevos registros del recurso afectado.</li>
                  <li>Vista consolidada y exportación CSV en el Panel Global → Facturación.</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section id="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" /> FAQ operativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
