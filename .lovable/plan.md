## Restringir exportación CSV solo a administradores

Actualmente cualquier usuario puede exportar CSV desde **Clientes** y **Match Center**. Lo restringiremos para que solo usuarios con rol `admin` o `super_admin` puedan hacerlo.

### Cambios

1. **`src/pages/Clients.tsx`**
   - Importar `useUserRole`.
   - Ocultar el botón "Exportar CSV" (línea 503) si `!isAdmin`.
   - Como defensa extra, salir temprano dentro de `exportCSV()` si el usuario no es admin (mostrando un toast de permiso denegado).

2. **`src/pages/MatchCenter.tsx`**
   - Importar `useUserRole`.
   - Ocultar el botón "Exportar CSV" (línea 172) si `!isAdmin`.
   - Misma comprobación dentro de la función de exportar.

3. **`SuperAdminDashboard.tsx`** ya es solo accesible por super_admin → sin cambios.

### Notas
- Se usa `isAdmin` de `useUserRole` (cubre `admin` y `super_admin`).
- No se modifica la importación CSV ni otras funcionalidades.
- No requiere cambios de backend/RLS (la exportación es client-side sobre datos ya filtrados por RLS).