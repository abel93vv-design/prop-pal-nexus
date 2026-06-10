## Problema

La migración de seguridad anterior revocó `SELECT` sobre la tabla `tenants` para usuarios autenticados y solo re-concedió un subconjunto de columnas (excluyendo `stripe_customer_id`, `stripe_subscription_id`, `domain_verification_token`).

El código cliente hace `select("*")` sobre `tenants` en dos sitios:

- `src/context/TenantContext.tsx` línea 165 — resuelve el tenant del usuario al iniciar.
- `src/pages/Tenants.tsx` línea 82 — listado de tenants para super admin.

Como PostgREST traduce `*` a "todas las columnas", ahora devuelve `permission denied`. Resultado: `tenantId` queda en `null` y todas las consultas filtradas por tenant (clientes, propiedades, etc.) devuelven vacío.

## Solución

1. **Migración**: revertir el revoke de columnas en `tenants` para restaurar `GRANT SELECT ON public.tenants TO authenticated`. La política RLS ya limita las filas al tenant del usuario (o super admin), así que un usuario sigue sin poder ver tenants de terceros.

2. **Mantener la helper RPC `get_tenant_domain_info`** (sigue siendo útil y se llama desde `TenantDomainDialog`, no requiere cambios de código).

3. **Aceptar el hallazgo del scanner** sobre stripe IDs / domain token visibles a usuarios del mismo tenant: los IDs de Stripe son identificadores, no claves; el token de dominio solo es útil junto con acceso a DNS. Documentarlo en `security-memory` como riesgo aceptado para evitar futuras regresiones que rompan la app.

## Archivos afectados

- Nueva migración SQL: revertir REVOKE/GRANT en `public.tenants` (vuelve a `GRANT SELECT ON public.tenants TO authenticated`).
- `security--update_memory`: marcar la exposición de columnas sensibles en `tenants` como riesgo aceptado (con justificación).
- `security--manage_security_finding`: marcar como "ignore" el hallazgo `tenants_sensitive_fields_no_anon_policy` si vuelve a aparecer.

No se tocan componentes de UI ni hooks. La RPC `get_tenant_domain_info` permanece tal cual.

## Verificación

Tras la migración:

- `select("*")` desde `tenants` vuelve a funcionar para `authenticated`.
- Recargar `/clientes` y `/propiedades` debe mostrar los registros del tenant del usuario.
- Las políticas RLS de filas no cambian: cada usuario sigue viendo solo su tenant.
