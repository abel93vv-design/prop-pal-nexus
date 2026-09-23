# Hoja de zona

Nueva ventana "Hoja de zona" en el menú principal, que replica la hoja en papel: cabecera con los datos del portal y una tabla de vecinos por piso. Solo aparece si existe la configuración avanzada `hoja_zona` con valor `true`.

## Activación

- Nueva clave en Configuración avanzada: `hoja_zona`.
- Si no está creada o su valor no es `true`, la opción no aparece en el menú ni es accesible.

## Cabecera de la hoja

Campos editables arriba: Agente, Fecha, Calle, Portal, Administrador, Comunidad, Presidente, Tipo de piso (piso/casa), Uso (sí/no), Garaje (sí/no), Ascensor (sí/no).

## Selector de hojas

- Arriba, un selector con fecha y hora de cada hoja para saltar a otra (por ejemplo la del jueves).
- Puede haber varias hojas el mismo día, una por calle/portal; el selector muestra "fecha · calle, portal".
- Botón para crear una hoja nueva y para duplicar la cabecera de una existente.
- Cada agente ve solo sus propias hojas; el administrador de la inmobiliaria puede ver las de su equipo.

## Tabla

Columnas, en este orden:

1. **N** (noticia): casilla antes de la primera columna.
2. **Piso**
3. **Nombre**
4. **P / M**: desplegable con Puerta, Mano y vacío.
5. **Comentario**
6. **Teléfono**

Colores de fila:
- **P (puerta)**: fondo verde suave.
- **M (mano)**: fondo ámbar suave.
- Sin marcar: fondo normal.
- **Noticia**: la fila se destaca por encima de todo, con borde izquierdo marcado y una insignia "N"; predomina sobre el color de P/M.

Filas que se añaden y se borran libremente, guardado automático al salir del campo.

## Crear la noticia en el CRM

En cada fila marcada como noticia aparece un botón "Crear noticia": abre el alta de propiedad tipo Noticia con calle, piso, nombre de contacto y teléfono ya rellenos. Una vez creada, la fila queda enlazada y el botón pasa a "Ver noticia".

## Detalles técnicos

- Tabla `public.zone_sheets`: `tenant_id`, `user_id`, `sheet_date` (date), `sheet_time` (time), cabecera (`agent_name`, `street`, `portal`, `administrator`, `community`, `president`, `property_type`, `has_use`, `has_garage`, `has_elevator`), `rows` jsonb (array de `{id, is_news, floor, name, contact_mode: 'P'|'M'|null, comment, phone, property_id}`), timestamps.
- GRANT a `authenticated` y `service_role`; RLS: el usuario gestiona sus filas (`user_id = auth.uid()` y `tenant_id = get_user_tenant_id()`), y el admin del tenant puede leer las de su inmobiliaria vía `is_tenant_admin`. Trigger `update_updated_at_column`.
- Hook `src/hooks/useZoneSheets.tsx` (React Query): listado de hojas del usuario, hoja activa, crear/actualizar/borrar.
- Página `src/pages/ZoneSheet.tsx` con `Layout`, cabecera en tarjeta, selector de hoja y tabla editable.
- Ruta `/hoja-zona` en `src/App.tsx`; entrada en `mainItems` de `src/components/AppSidebar.tsx` condicionada a `getBool("hoja_zona")` de `useTenantSettings`; la página redirige si la configuración no está activa.
- Añadir el preset `hoja_zona` a `TENANT_SETTING_PRESETS` en `src/hooks/useTenantSettings.tsx` con su descripción.
- Colores mediante tokens semánticos del tema (sin colores fijos).
