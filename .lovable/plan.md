## Problema

Al entrar o cambiar de pantalla, en el sidebar aparecen brevemente **Equipo** e **Inmobiliarias** y luego se ocultan. Esto pasa porque `useUserRole` arranca con `role = null` y `permissions = []` mientras carga desde Supabase, y la función `can()` tiene un fallback legacy:

```ts
if (!role) return true; // ← permite todo mientras carga
```

Resultado: durante ~200-500ms el sidebar muestra TODO el menú; cuando llega el rol real (`coordinadora`, `asesor`, etc.) y sus permisos, los módulos sin permiso desaparecen → parpadeo visible.

## Solución

No renderizar los ítems que dependen de permisos hasta que `useUserRole` haya terminado de cargar. Así el usuario solo ve los ítems definitivos, sin parpadeo.

### Cambios

**1. `src/hooks/useUserRole.tsx`**
- Ya expone `loading`. Sin cambios de lógica.

**2. `src/components/AppSidebar.tsx`**
- Leer `loading` de `useUserRole()`.
- Al filtrar `visibleMain`:
  - Si el ítem no tiene `module` (Dashboard) → siempre visible.
  - Si tiene `module` y `loading === true` → ocultar (en vez del fallback actual que lo muestra).
  - Si `loading === false` → aplicar la lógica actual `can(i.module, "view") || isAdmin`.
- Mismo tratamiento para la sección **Admin** (Roles, Tenants, Panel Global): no mostrarla hasta que `loading` sea `false`.

Esto evita el "flash de contenido no autorizado" sin tocar la lógica de permisos.

### Detalle técnico

```tsx
const { isAdmin, isSuperAdmin, can, loading } = useUserRole();

const visibleMain = loading
  ? mainItems.filter((i) => !i.module) // solo Dashboard mientras carga
  : mainItems.filter((i) => !i.module || can(i.module, "view") || isAdmin);
```

Y envolver el bloque `{isAdmin && (...)}` con `{!loading && isAdmin && (...)}`.

## Validación

- Login como `cartama@valoracasa.es` (coordinadora) → el sidebar debe mostrar directamente solo los módulos permitidos, sin que Equipo / Inmobiliarias aparezcan y desaparezcan.
- Login como admin/super_admin → siguen viendo todo (incluyendo Admin/Tenants) en cuanto carga.
- Navegar entre páginas → sin parpadeo (el hook ya cachea por sesión vía estado de React).
