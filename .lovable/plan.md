# Sistema de roles personalizable por cuenta

## Estado actual (lo que hay hoy)

Existen **dos sistemas de roles paralelos** que no están conectados, y eso es la causa de la mayor parte de la confusión:

**1. Tabla `user_roles` (con enum `app_role`)**
- Valores: `admin`, `agent`, `viewer`.
- Es **global**, no por tenant.
- Se usa con la función `has_role(user_id, 'admin')` para controlar acceso a cosas globales (gestión de tenants, facturas).
- Es la única que está protegida por RLS en la base de datos.
- Hoy `huelin@valoracasa.es` probablemente solo tiene perfil + tenant, sin fila en `user_roles` (es un usuario "normal" del tenant, no super-admin).

**2. Tabla `team_members` (campo `role` libre)**
- Valores definidos en código: `admin_global`, `admin_inmobiliaria`, `agente`, `personalizado`.
- Tiene además `access_type` (`total` / `solo_inmobiliaria` / `personalizado`) y un array `permissions` con permisos sueltos (`ver_clientes`, `editar_propiedades`, etc.).
- **Nada de esto se valida en el backend.** Las RLS de `clients`, `properties`, `tasks`, etc. solo comprueban `tenant_id = get_user_tenant_id()`. Es decir, hoy cualquier miembro del tenant puede leer y editar todo, los permisos del panel Equipo son **decorativos**.

**Consecuencia:** ahora mismo no hay forma real de limitar a un asesor a "solo NE y noticias". El UI lo deja configurar, pero la base de datos lo ignora.

---

## Propuesta

Unificar en un único modelo de roles **por tenant**, enforced en BD, configurable desde un panel visual.

### 1. Modelo de datos

**Roles fijos (jerarquía):**

```text
super_admin   ← tú (global, fuera de tenant)
   │
   admin      ← admin de la cuenta (tenant). Puede crear más admins y asignar roles.
   │
   ├─ socio
   ├─ coordinadora
   └─ asesor
```

**Cambios en BD:**

- Ampliar el enum `app_role` con: `super_admin`, `admin`, `socio`, `coordinadora`, `asesor`. Mantener `agent` y `viewer` como deprecated por compatibilidad.
- Añadir columna `tenant_id` a `user_roles` (excepto para `super_admin`, que va sin tenant).
- Nueva tabla `role_permissions(tenant_id, role, module, can_view, can_edit, can_delete)` — define qué módulos puede tocar cada rol **dentro de cada tenant**. Así el admin de cada cuenta personaliza sus permisos sin tocar código.
- Módulos iniciales: `pedidos`, `ne`, `noticias`, `clientes`, `equipo`, `ajustes`, `match_center`, `tareas`, `pipeline`.
- Función `has_module_access(_user_id, _module, _action)` que mira el rol del usuario en su tenant y consulta `role_permissions`. Es `SECURITY DEFINER` para evitar recursión.

**RLS:**

- Reemplazar las políticas actuales (`tenant_id = get_user_tenant_id()`) por `tenant_id = get_user_tenant_id() AND has_module_access(auth.uid(), '<modulo>', 'view'/'edit'/'delete')` en cada tabla.
- `super_admin` siempre devuelve `true` en `has_module_access`.
- Defaults sembrados al crear un tenant: socio/coordinadora/asesor → ver+editar en pedidos, ne, noticias; admin → todo.

### 2. UI: Panel de Roles y Permisos

Nueva página **Ajustes → Roles y permisos** (visible solo para `admin` del tenant y `super_admin`):

- **Tab 1 · Miembros**: lista usuarios del tenant con su rol actual. El admin puede cambiar el rol de cada uno con un dropdown (socio / coordinadora / asesor / admin). Botón "Promover a admin" y "Quitar admin".
- **Tab 2 · Matriz de permisos**: tabla rol × módulo con checkboxes (ver / editar / eliminar). Cambios se guardan en `role_permissions`. El admin puede dejar a "asesor" sin acceso a clientes, por ejemplo, sin tocar código.
- **Tab 3 · Invitar usuario** (reusar el flujo actual de `create-team-member`): elige email + rol al invitar. El edge function asigna la fila correspondiente en `user_roles` con el `tenant_id` del invitador.

La página de **Equipo** actual se simplifica para mostrar solo info de contacto; la gestión de permisos se mueve a este panel nuevo.

### 3. Sidebar dinámica

`AppSidebar` lee los permisos del usuario y oculta los módulos a los que no tiene `can_view = true`. Así un asesor sin acceso a "Clientes" no ve el item del menú.

### 4. Migración de datos existentes

- A `huelin@valoracasa.es` se le asigna rol `admin` en su tenant (es el dueño de la cuenta).
- A ti (`super_admin`) se te crea fila en `user_roles` sin `tenant_id`.
- Resto de team_members se migran mapeando: `admin_inmobiliaria → admin`, `agente → asesor`, `personalizado → asesor` (y se respetan sus `permissions` actuales generando filas en `role_permissions` si difieren del default).

---

## Detalles técnicos

- **Tablas tocadas**: `user_roles` (+ `tenant_id`), nueva `role_permissions`, enum `app_role` ampliado.
- **Funciones SQL**: `has_module_access(uuid, text, text)` SECURITY DEFINER, `get_user_role(uuid)` SECURITY DEFINER.
- **Políticas RLS**: reescribir las de `properties`, `clients`, `tasks`, `opportunities`, `documents`, `match_scores` para incluir `has_module_access`.
- **Edge functions**: `create-team-member` actualizada para insertar en `user_roles` con tenant + rol elegido, y validar que el invitador es admin del tenant. `manage-tenant-admin` se mantiene para super_admin.
- **Frontend**: nuevo `useRolePermissions()` hook, página `RolesPermissions.tsx`, ajustes en `AppSidebar.tsx` para ocultar items, ajuste en `useUserRole.tsx` para devolver `{ role, tenantId, can(module, action) }`.
- **Compatibilidad**: enum amplía valores, no rompe código existente; `has_role(uid, 'admin')` sigue funcionando para super_admin.

## Cosas que decidir antes de implementar

1. ¿"Pedidos" se refiere al pipeline (oportunidades) o es un módulo nuevo?
2. ¿Los tres roles (socio/coordinadora/asesor) tienen exactamente los mismos permisos por defecto, o quieres que socio tenga algo más (p.ej. ver finanzas/facturas)?
3. ¿Un admin del tenant puede borrar a otro admin, o solo el super_admin puede degradar admins?
