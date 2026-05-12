## Objetivo

Que tú, como **super_admin**, puedas:
1. Ver todas las inmobiliarias (tenants) con acceso al CRM.
2. Ver los usuarios de cada una y su rol.
3. Cambiar plan, activar/desactivar.
4. Asignar a cada inmobiliaria su propio dominio (ej. `crm.valoracasa.es`) de forma que, al entrar por ese dominio, el sistema fije automáticamente su tenant y solo vea sus datos.

## Cambios en base de datos

Tabla `tenants` — añadir columnas:
- `custom_domain text unique` (ej. `crm.valoracasa.es`)
- `domain_verified boolean default false`
- `domain_verification_token text` (para validar propiedad por DNS TXT)

Función SQL `get_tenant_by_domain(_host text)` (SECURITY DEFINER) → devuelve `id, name, slug, custom_domain` del tenant cuyo `custom_domain = _host`. Pública para `anon` (necesaria antes del login).

RLS de `tenants`: super_admin puede UPDATE/DELETE/INSERT (hoy solo `admin` legacy puede). Reescribir políticas con `is_super_admin(auth.uid())`.

## Resolución de tenant por dominio

Nuevo `src/lib/tenantResolver.ts`:
- Lee `window.location.hostname`.
- Si coincide con un `custom_domain` verificado → fija ese `tenant_id` como **tenant activo forzado** en `localStorage` y en un contexto `TenantContext`.
- Si el usuario logueado pertenece a otro tenant distinto del dominio → bloquea acceso con mensaje "Este dominio pertenece a otra inmobiliaria".
- En dominios Lovable (`*.lovable.app`, `localhost`) → comportamiento actual (tenant del perfil).

`get_user_tenant_id()` se mantiene; el bloqueo por dominio se aplica en cliente. (Aislamiento real ya está garantizado por RLS sobre `profiles.tenant_id`.)

## Panel super_admin (`/inmobiliarias`)

Reescribir `src/pages/Tenants.tsx` (ya existe, 520 líneas) como panel completo. Solo accesible si `is_super_admin`.

Listado con columnas:
- Nombre / slug
- Plan (badge editable)
- Estado activo (switch)
- Dominio propio + estado de verificación
- Nº usuarios (link a detalle)
- Acciones: Editar dominio · Ver usuarios · Cambiar plan · Activar/Desactivar

**Modal "Gestionar dominio"** por tenant:
- Input para `custom_domain`.
- Al guardar, genera `domain_verification_token` y muestra instrucciones DNS:
  - `A` record: `@` o subdominio → IP del proyecto Lovable (`185.158.133.1`).
  - `TXT` record: `_kagesan-verify` → token.
- Botón "Verificar ahora" → edge function `verify-tenant-domain` que hace DNS lookup (Deno `Deno.resolveDns`) y marca `domain_verified=true`.
- Aviso: el dominio también debe añadirse en **Project Settings → Domains** de Lovable para que apunte al CRM (paso manual del super_admin).

**Modal "Usuarios de la inmobiliaria"**:
- Lista `profiles` + `user_roles` filtrados por `tenant_id`.
- Muestra nombre, email, rol, último acceso.
- Solo lectura (la gestión de roles se hace desde `/roles` dentro del tenant).

**Cambio de plan**: select `free | basic | pro | enterprise` → UPDATE directo.

**Activar/Desactivar**: toggle `is_active`. Si está inactivo, el login bloquea entrada al tenant.

## Edge function `verify-tenant-domain`

- Input: `tenant_id`.
- Lee `custom_domain` y `domain_verification_token` del tenant.
- Hace `Deno.resolveDns(\`_kagesan-verify.\${domain}\`, "TXT")` y comprueba que el token está presente.
- Si OK → `UPDATE tenants SET domain_verified=true`.
- Solo invocable por super_admin (verifica JWT + `is_super_admin`).

## Sidebar

En `AppSidebar`, el ítem "Inmobiliarias" solo se muestra si `is_super_admin` (ya está así, confirmar).

## Flujo de uso

1. Super_admin entra en **Inmobiliarias** → ve Valoracasa Huelin, Demo, etc.
2. Click en Valoracasa Huelin → "Gestionar dominio" → escribe `crm.valoracasa.es`.
3. Da al cliente las instrucciones DNS (A + TXT).
4. Cliente añade los registros en su DNS.
5. Super_admin (o el cliente desde Lovable) añade el dominio en **Project Settings → Domains** de Lovable.
6. Click "Verificar" → tenant queda atado al dominio.
7. Cualquiera que entre por `crm.valoracasa.es` solo puede operar dentro del tenant Valoracasa Huelin.

## Detalles técnicos

- Migración: ALTER `tenants` + nuevas RLS para super_admin + función `get_tenant_by_domain`.
- Edge function nueva: `supabase/functions/verify-tenant-domain/index.ts`.
- Frontend: reescribir `src/pages/Tenants.tsx`, crear `src/lib/tenantResolver.ts`, hook `useTenantDomain.tsx`, componentes `TenantDomainDialog.tsx` y `TenantUsersDialog.tsx`.
- App.tsx: en bootstrap, llamar al resolver para fijar tenant si el host coincide.

## Limitaciones que debes saber

- Lovable hosting requiere añadir cada dominio en **Project Settings → Domains** manualmente — no puedo automatizarlo desde código. El panel mostrará un recordatorio claro.
- SSL lo aprovisiona Lovable automáticamente tras la verificación.
- La propagación DNS puede tardar hasta 72h.
