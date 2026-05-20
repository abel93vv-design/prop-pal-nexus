## Resumen

Añadir un flag por tenant `allow_password_recovery` (boolean) editable desde el modal de edición de tenant en `/tenants`. El login (`Auth.tsx`) detecta el tenant por dominio y, según el flag, muestra el flujo actual de email o un mensaje "Contacta con el administrador".

## Cambios

### 1. Base de datos (migración)

```sql
ALTER TABLE public.tenants
  ADD COLUMN allow_password_recovery boolean NOT NULL DEFAULT true;

-- Exponer el campo en la función pública usada por el login para resolver tenant por dominio
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(_host text)
RETURNS TABLE(id uuid, name text, slug text, custom_domain text,
              domain_verified boolean, is_active boolean,
              allow_password_recovery boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT t.id, t.name, t.slug, t.custom_domain, t.domain_verified,
         t.is_active, t.allow_password_recovery
  FROM public.tenants t
  WHERE t.deleted_at IS NULL
    AND lower(t.custom_domain) = lower(_host)
  LIMIT 1
$$;
```

Default `true` para no romper tenants existentes; el super admin lo desactiva manualmente en los que quiera (ej. Valoracasa Huelin).

### 2. `src/pages/Tenants.tsx` — Edición de tenant

En el modal de editar tenant (si existe) o creando uno si no, añadir un `Switch`:

> **Permitir recuperación de contraseña por email**
> Si se desactiva, los usuarios verán un mensaje para contactar con el administrador en vez de poder pedir un email de reset.

Guardar el valor en `tenants.allow_password_recovery` con un simple `update`. También pasar el campo en el alta vía `provision-tenant` (opcional, solo si se quiere fijar al crear).

### 3. `src/pages/Auth.tsx` — Comportamiento condicional

- Al montar, llamar a `supabase.rpc('get_tenant_by_domain', { _host: window.location.hostname })` y guardar `allowRecovery` (default `true` si no se resuelve tenant).
- En el bloque de login, sustituir el botón `setMode("forgot")` por lógica condicional:
  - Si `allowRecovery === true` → comportamiento actual (link "¿Has olvidado tu contraseña?" → vista forgot → `resetPasswordForEmail`).
  - Si `allowRecovery === false` → mostrar el link "¿Has olvidado tu contraseña?" igual, pero al pulsarlo abrir una pequeña vista/alert con:
    > *Por seguridad, el reset de contraseña está deshabilitado. Contacta con el administrador de tu inmobiliaria para que te asigne una nueva.*
    Con un botón "Volver al login".
- Bloquear también `mode === "forgot"` defensivamente si `allowRecovery` es false.

## Archivos

- Migración SQL (columna + función `get_tenant_by_domain`).
- `src/pages/Tenants.tsx` — Switch en modal editar.
- `src/pages/Auth.tsx` — Lookup por host + render condicional.

## Notas

- El admin del tenant ya puede resetear contraseñas internamente vía `manage-tenant-admin` → `reset_password` (sin cambios).
- En el dominio raíz (Lovable preview, super admin) no hay tenant → se mantiene el flujo de email.
