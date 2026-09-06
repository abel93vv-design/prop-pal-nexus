# Configuración avanzada (activar funciones por clave/valor)

Nueva sección donde se crean ajustes con **nombre** y **valor**. Las conexiones de WhatsApp, Idealista y Fotocasa dejan de mostrarse por defecto y solo aparecen si existe el ajuste correspondiente con valor `true`.

## Qué verás

- Nueva pestaña **Configuración avanzada** en Ajustes, visible para el administrador de cada inmobiliaria (y para el super admin).
- Dentro: lista de ajustes con su nombre y valor, botón para añadir uno nuevo, editar y borrar.
- Al crear: campo **Nombre** (ej. `whatsapp`) y campo **Valor** (ej. `true`).
- Atajos de un clic para las tres claves conocidas (WhatsApp, Idealista, Fotocasa), para no tener que escribirlas a mano.

## Comportamiento

- En Ajustes > Conexiones:
  - Tarjeta de Fotocasa: solo si existe `portal_fotocasa` = `true`.
  - Tarjeta de Idealista: solo si existe `portal_idealista` = `true`.
  - Tarjeta de WhatsApp: solo si existe `whatsapp` = `true`.
  - Si no hay ninguna activa, la pestaña Conexiones muestra un aviso corto explicando que se activan desde Configuración avanzada.
- La tarjeta de conexión con las webs (WordPress) se mantiene siempre visible.
- Fuera de Ajustes no cambia nada: los botones de WhatsApp en clientes/matching y las casillas de portales en las viviendas siguen dependiendo de que la conexión esté activa, como ahora.

## Detalles técnicos

- Nueva tabla `tenant_settings` (`tenant_id`, `key`, `value` texto, `label`, timestamps), única por `tenant_id` + `key`.
- GRANT a `authenticated` y `service_role`; RLS: lectura para cualquier usuario del mismo tenant; escritura/borrado solo para admin del tenant (`is_tenant_admin`) o `super_admin`. Trigger de `updated_at`.
- Nuevo hook `useTenantSettings` (React Query): lista, `getBool(key)`, crear/actualizar/borrar.
- Nuevo componente `src/components/settings/AdvancedSettingsTab.tsx` con la tabla y el diálogo de alta/edición (`max-w-2xl`, `max-h-[90vh]`).
- `src/pages/Settings.tsx`: añadir la pestaña (mostrar solo si `isAdmin` o `isSuperAdmin`) y ajustar el número de columnas de `TabsList`.
- `src/components/settings/ConnectionsTab.tsx`: renderizar `PortalCard` de fotocasa/idealista y `WhatsAppCard` condicionados a `getBool(...)`; mientras carga, no parpadear (no mostrar nada hasta tener el valor).
