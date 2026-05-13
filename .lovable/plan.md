## Objetivo

Cuando alguien intenta iniciar sesión en un tenant (por subdominio o dominio personalizado como `crm.valoracasa.es`) con credenciales que **no pertenecen a ese tenant** (usuario inexistente o usuario de otro tenant), mostrar siempre el mismo mensaje genérico:

> **"Datos de inicio de sesión incorrectos. Por favor, inténtalo de nuevo."**

Sin revelar si el usuario existe en otra inmobiliaria (importante por seguridad y aislamiento multi-tenant).

## Comportamiento actual

- `TenantContext` resuelve el tenant por dominio/subdominio correctamente.
- `Auth.tsx` hace `signIn(email, password)` y, si Supabase devuelve OK, deja entrar al usuario **sin verificar** si su `profiles.tenant_id` coincide con el tenant del dominio.
- Resultado: un usuario de Tenant A puede iniciar sesión en `crm.valoracasa.es` (Tenant B) y el `TenantContext` luego lo redirige raro o le muestra datos del tenant equivocado.

## Cambio propuesto

### 1. Validación post-login en `src/pages/Auth.tsx`

Tras un `signIn` exitoso, antes de dejar al usuario entrar:

1. Resolver el tenant del host actual (usar `resolveDomainTenant()` para dominios custom o `extractSubdomain()` + lookup por slug para subdominios). En hosts Lovable/localhost no se aplica restricción (acceso libre por perfil).
2. Leer `profiles.tenant_id` del usuario recién autenticado.
3. Comparar:
   - Si el usuario es `super_admin` → permitir siempre.
   - Si `profile.tenant_id === tenantDelHost.id` → permitir.
   - Si no coincide (o el usuario no tiene perfil) → `supabase.auth.signOut()` y mostrar el toast genérico de credenciales incorrectas, además de contar el intento fallido como hasta ahora (`recordFailure`).

### 2. Mensaje uniforme

Reemplazar todos los mensajes de error de login (contraseña incorrecta, usuario de otro tenant, usuario inexistente) por uno único:

> "Datos de inicio de sesión incorrectos. Por favor, inténtalo de nuevo."

(El contador de intentos restantes se mantiene como info adicional, pero el motivo nunca se revela.)

### 3. Defensa adicional en `TenantContext` (opcional pero recomendada)

En la prioridad 0 (dominio custom) y 1 (subdominio), si hay sesión activa pero `profile.tenant_id` no coincide con el tenant resuelto y el usuario no es super_admin → forzar `signOut()` y dejar `tenant` válido para que aparezca la pantalla de login limpia. Esto cubre el caso de un usuario que ya tenía sesión guardada en otro subdominio y abre uno nuevo.

## Detalles técnicos

- **Archivos a modificar**:
  - `src/pages/Auth.tsx` → añadir validación tenant tras `signIn`, unificar mensaje.
  - `src/context/TenantContext.tsx` → añadir guardia de cross-tenant session.
- **No se tocan**: edge functions, RLS, esquema BD, ni el flujo de signup.
- **Hosts Lovable** (`*.lovable.app`, `localhost`, etc.) siguen funcionando como hoy: el usuario entra y se resuelve el tenant por su perfil.
- **Super admin** queda exento de la restricción para poder entrar a cualquier tenant.

## Mensaje único

```
toast({
  title: "Error",
  description: "Datos de inicio de sesión incorrectos. Por favor, inténtalo de nuevo.",
  variant: "destructive"
});
```
