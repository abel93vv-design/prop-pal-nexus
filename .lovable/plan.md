## Problema actual

En **Equipo → Nuevo miembro** el selector "Tipo de acceso" ofrece opciones legacy (Acceso Total / Solo su Inmobiliaria / Personalizado) que **no están conectadas** con la matriz real de **Roles y permisos** (`socio`, `coordinadora`, `asesor`). La matriz usa la tabla `user_roles` + `role_permissions` (función `has_module_access`), pero al crear un miembro nunca se inserta nada en `user_roles`, así que los permisos definidos en /roles no se aplican al usuario.

## Objetivo

Que al dar de alta a un miembro del equipo se elija directamente uno de los roles reales del sistema (**Admin**, **Socio**, **Coordinadora**, **Asesor**) y que ese rol se inserte en `user_roles` para el `tenant_id` activo. Así los permisos de la matriz **Roles y permisos** se aplican automáticamente.

## Cambios

### 1. `src/pages/Team.tsx` (UI del formulario)
- Eliminar el bloque "Tipo de acceso" (Total / Solo su inmobiliaria / Personalizado) y la lista de permisos personalizados.
- Sustituirlo por un selector único **"Rol del miembro"** con las opciones:
  - **Admin** (acceso total al CRM de la inmobiliaria) — solo visible si el actor ya es admin/super_admin.
  - **Socio**
  - **Coordinadora**
  - **Asesor**
- Mostrar debajo un texto: *"Los permisos de cada rol se gestionan en Roles y permisos"* con enlace a `/roles`.
- En la card del miembro, mostrar el rol real (badge con color) en vez de "Acceso total / Su inmobiliaria / N permisos".
- Eliminar de `emptyUser` y del envío al edge function los campos `accessType` y `permissions` (o enviarlos vacíos para no romper la tabla `team_members`).

### 2. `supabase/functions/create-team-member/index.ts`
- Aceptar un nuevo campo `app_role` (`admin | socio | coordinadora | asesor`) en el body.
- Validar que el actor (caller) sea `admin` del tenant o `super_admin` antes de crear.
- Tras crear el `auth.user` y el `team_members`, **insertar fila en `user_roles`**:
  ```ts
  await adminClient.from("user_roles").insert({
    user_id: userId,
    tenant_id: tenantId,
    role: app_role,  // 'admin' | 'socio' | 'coordinadora' | 'asesor'
  });
  ```
- Si la inserción de `user_roles` falla, hacer rollback (borrar auth user y team_members).

### 3. Edición de miembros existentes
- En el diálogo de edición, permitir cambiar el rol. Como aún no tenemos un endpoint dedicado, añadir una pequeña función en cliente que haga `upsert` en `user_roles` (`onConflict: "user_id,tenant_id"`) — requiere que `team_members` guarde `user_id` (verificar; si no existe, vincular por email vía edge function `manage-tenant-admin`).
- Si el binding por `user_id` no es trivial en el cliente, dejar la edición de rol **solo desde la pestaña Tenants → 👥 usuarios** (ya existente vía `manage-tenant-admin`) y mostrar un aviso en el form de edición: *"Para cambiar el rol de un miembro existente, usa el panel de Tenants"*. Esta opción es la más segura y la recomendada.

### 4. Mostrar rol en la card del Equipo
- Cargar los `user_roles` del tenant en paralelo en `DataContext` o directamente en `Team.tsx` (un `useEffect` con `supabase.from('user_roles').select('user_id, role').eq('tenant_id', tenantId)`).
- Vincular por `email` ↔ `team_members` o, mejor, almacenar `user_id` en `team_members` cuando se cree (paso 2 ya lo hace; añadir columna `user_id` si no existe).

## Detalles técnicos

- Tipo `AccessType` y campo `accessType` quedan obsoletos en la UI; pueden mantenerse en la BD como columnas (no romper) pero ya no se usan.
- La función `has_module_access` ya está implementada y solo necesita que exista la fila en `user_roles` para resolver permisos correctamente.
- El rol `admin` da acceso total automáticamente (línea ya implementada en `has_module_access`), por eso no aparece en la matriz de permisos.

## Resultado esperado

Al crear "Juan Pérez" como **Asesor**, el sistema:
1. Crea el `auth.user`.
2. Inserta su perfil con `tenant_id`.
3. Inserta `user_roles { user_id, tenant_id, role: 'asesor' }`.
4. Juan, al iniciar sesión, ve **exactamente** los módulos marcados como `can_view` para "Asesor" en /roles.
