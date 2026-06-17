## Objetivo

Que **Control de leads** se comporte como **Propiedades** en el sidebar: al estar dentro de la sección se despliegan dos subitems —**Coordinadoras** y **Asesores**— en vez de las dos pestañas internas actuales en `/control-leads`.

## Cambios

### 1. Sidebar (`src/components/AppSidebar.tsx`)
Añadir `controlLeadsSubItems` y enlazarlo al ítem "Control de leads":

```text
Control de leads  (/control-leads)
 ├─ Coordinadoras  (/control-leads/coordinadoras)
 └─ Asesores       (/control-leads/asesores)
```

Iconos: `Users` para Coordinadoras, `UserCog` (o similar) para Asesores. Ambos sub-items usan el mismo `module: "control_leads"` para el gating de permisos.

### 2. Rutas (`src/App.tsx`)
Añadir dos rutas nuevas, ambas protegidas con `ProtectedRoute` y apuntando al mismo componente `ControlLeads`:

- `/control-leads/coordinadoras`
- `/control-leads/asesores`

La ruta existente `/control-leads` se mantiene y redirige a `/control-leads/coordinadoras` (vista por defecto al hacer clic en el ítem padre, igual que Propiedades).

### 3. Página (`src/pages/ControlLeads.tsx`)
- Eliminar las `Tabs` de primer nivel "Coordinadoras / Asesores" que se añadieron antes.
- En su lugar, decidir qué vista renderizar a partir de la URL (`useLocation`):
  - `/control-leads/asesores` → renderiza `<AsesoresView>`.
  - cualquier otra (`/control-leads` o `/control-leads/coordinadoras`) → renderiza el bloque actual con las pestañas internas **Diario / Mensual / Anual / Comparativa**.
- El selector "Ver datos de" (admin/super admin) y el título de la página se mantienen en la cabecera común para ambas subsecciones.

### 4. Sin cambios en
- Hooks (`useControlLeads`, `useAdvisorSheet`).
- Tablas de base de datos.
- Permisos (`role_permissions`): se sigue usando el módulo `control_leads`.

## Resultado visual

- Click en "Control de leads" en el sidebar → entra a `/control-leads/coordinadoras` y aparecen los subitems desplegados debajo, como en Propiedades.
- Click en "Asesores" → navega a `/control-leads/asesores` y muestra la ficha de control diario con las 3 tablas (Zona, Marketing, Llamadas).
- El subitem activo queda resaltado igual que en Propiedades.
