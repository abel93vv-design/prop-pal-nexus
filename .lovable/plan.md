# Verificación: redirección de login para usuarios ya autenticados

## Resultado

**Funciona correctamente.** No hay nada que arreglar.

## Prueba realizada

Navegué a `/auth` con una sesión activa en el navegador. El sistema redirigió automáticamente a `/` (dashboard) sin mostrar el formulario de login.

## Cómo está implementado

- **`src/App.tsx:38`** — `ProtectedRoute`: si no hay `user`, manda a `/auth`. Si hay `user`, renderiza la página protegida.
- **`src/pages/Auth.tsx:91`** — `if (user) return <Navigate to="/" replace />`: si entras a `/auth` con sesión, te manda al dashboard.
- **`src/hooks/useAuth.tsx`** — `AuthProvider` mantiene `loading=true` hasta que `getSession()` resuelve, evitando flashes del login durante la rehidratación.

## Flujo confirmado

```text
Usuario logueado entra a crm.valoracasa.es/
  → ProtectedRoute ve user → renderiza Index (dashboard)

Usuario logueado entra a crm.valoracasa.es/auth
  → Auth.tsx detecta user → Navigate a "/"
  → ProtectedRoute renderiza Index

Usuario sin sesión entra a crm.valoracasa.es/
  → ProtectedRoute no ve user → Navigate a "/auth"
  → Auth.tsx muestra formulario
```

## Nota

Si en algún caso real ves que un usuario logueado sí ve el login, lo más probable es que `TenantContext` lo haya cerrado sesión porque su `profile.tenant_id` no coincide con el tenant resuelto por el dominio (protección multi-tenant). Avísame si quieres revisar ese caso concreto.

## No hay cambios de código en este plan
