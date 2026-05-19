## Objetivo

Dentro de cada tenant, restringir la visibilidad de propiedades por inmobiliaria según el rol:

- **admin** (y `super_admin`): ve **todas** las propiedades del tenant.
- **socio, coordinadora, asesor**: ven **solo** las propiedades de **su inmobiliaria** (la del `team_member` vinculado a su `user_id`).
- El **Match Center** se calcula y se muestra **solo entre clientes y propiedades de la misma inmobiliaria** (para todos los roles).

## Cambios

### 1. Base de datos (migración)

- Crear función `public.get_user_agency_id()` `SECURITY DEFINER STABLE` que devuelve el `agency_id` del registro activo en `team_members` para `auth.uid()` (o `NULL` si no está vinculado).
- **Properties — RLS SELECT**: reemplazar la política `Tenant users can read active properties` por una que además exija:
  ```
  tenant_id = get_user_tenant_id()
  AND deleted_at IS NULL
  AND (
    is_tenant_admin(auth.uid(), tenant_id)
    OR get_user_agency_id() IS NULL          -- usuario sin agency asignada (legacy/admin)
    OR agency_id IS NULL                     -- propiedad sin agency (legacy)
    OR agency_id = get_user_agency_id()
  )
  ```
  Mismo criterio se aplica en INSERT/UPDATE/DELETE para que un asesor no pueda crear/editar propiedades de otra inmobiliaria.
- **Match scores — RLS SELECT**: añadir filtro equivalente para no exponer matches de otras inmobiliarias a los no-admin (filtrando por `agency_id` del `match_score`).

### 2. Edge function `calculate-matches`

- Al construir los pares cliente×propiedad, **solo emparejar cuando coincida `agency_id`** (o cuando alguno sea `NULL` para datos legacy). Esto vale para todos los roles, no solo admins.
- Garantizar que el `agency_id` guardado en `match_scores` sea el común del par.

### 3. UI

- `src/pages/Properties.tsx`: ocultar el filtro "Inmobiliaria" cuando `!isAdmin` (con `useUserRole`), ya que solo verá una. Mantener visible para admin.
- `src/pages/MatchCenter.tsx`: ningún cambio funcional (la RLS y el cálculo ya restringen los datos), pero ocultar también filtros por inmobiliaria si existieran.

## Detalles técnicos

- "admin" = rol `admin` del tenant en `user_roles` (helper `is_tenant_admin`). `super_admin` queda cubierto por el mismo helper.
- El vínculo usuario↔inmobiliaria se hace por `team_members.user_id = auth.uid()` → `agency_id`. Si un usuario tiene varios `team_members`, se toma el primero activo (`deleted_at IS NULL`).
- Datos legacy: propiedades con `agency_id IS NULL` y usuarios sin `team_member` siguen viendo todo para no romper tenants existentes; se documenta para que admin asigne agencias.
- Cliente Supabase tipos se regeneran tras la migración (automático).

## Fuera de alcance

- No se modifica la asignación de `agency_id` a clientes ni se cambia la lógica de pipeline/tareas en esta tanda (se puede hacer en un paso posterior si lo pides).
