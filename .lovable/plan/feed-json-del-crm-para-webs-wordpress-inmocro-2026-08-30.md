# Feed JSON del CRM para webs WordPress (Inmocro)

Cada web inmobiliaria en WordPress leerá cada 10 minutos un feed JSON público del CRM con las viviendas que se hayan marcado para esa web. El CRM es la única fuente de la verdad.

El proyecto ya tiene un mecanismo de publicación en portales (Idealista/Fotocasa) con `portal_connections`, `property_portal_status` y la función `portal-feed`. Se reutiliza todo eso añadiendo un tipo de portal nuevo con el convenio `web:<slug>`, en lugar de duplicar tablas.

## 1. Base de datos

Ampliar `portal_connections` (no crear tabla nueva):

- `display_name text` — nombre visible de la web (ej. "Demo Premium").
- `slug text` — slug de la web (ej. "demo-premium"); `portal_name` se guarda como `web:<slug>`.
- Índice único por `(tenant_id, portal_name)`.
- Se sigue usando la columna existente `feed_token` como token secreto (se generará de 32+ caracteres) y `is_active` como interruptor "enabled".
- Los límites de plan actuales cuentan `portal_connections`; se ajustará para que las webs propias no consuman el cupo de portales externos.

Ampliar `properties` con los campos que pide el feed y hoy no existen:

- `reference text` — referencia comercial (ej. "INM-1042").
- `year_built integer` — año de construcción.

`property_portal_status` ya existe con `(property_id, portal_name, is_published)` y sirve tal cual para las webs.

## 2. Fotos públicas (punto importante)

Hoy las fotos de una vivienda se guardan como texto base64 dentro del registro, no como URL. WordPress necesita URLs https públicas, así que:

- Crear un bucket público de Storage `property-photos`.
- Al subir fotos en la ficha de la vivienda, el archivo se sube al bucket y se guarda su URL pública (en vez de base64).
- Migración de las fotos actuales: al abrir/guardar una vivienda con fotos antiguas en base64, se convierten y suben automáticamente; el feed omite cualquier foto que no sea una URL https (ya lo hace hoy).

## 3. Edge function `portal-feed`

Se amplía la función existente (pública, sin auth de Supabase) para responder en JSON cuando el portal empieza por `web:`; Fotocasa e Idealista siguen devolviendo su XML actual.

`GET /functions/v1/portal-feed?tenant_id=<uuid>&portal=web:<slug>&token=<token>`

- Valida que exista una fila en `portal_connections` con ese `tenant_id`, ese `portal_name`, token exacto y activa. Si no: `401` con `{"error":"..."}`.
- `200` con `Content-Type: application/json` y cuerpo `{ "properties": [ ... ] }` (clave obligatoria, siempre array).
- Snapshot completo en cada llamada: todas las viviendas del tenant con el interruptor de esa web activado y no borradas. Al desactivar el interruptor, la vivienda desaparece del feed.
- Reservadas y vendidas SÍ salen, con su `status` real (no se filtran como en el feed XML de portales).
- Sin caché agresiva (`no-store` o caché corta) para que los cambios se reflejen en el siguiente ciclo de 10 min.

Mapa de campos por vivienda: `id`, `ref`, `title`, `description`, `operation_type`, `price`, `monthly_rent`, `bedrooms`, `bathrooms`, `built_surface`, `plot_surface`, `address`, `neighborhood`, `postal_code`, `latitude`, `longitude`, `year`, `energy_cert`, `status`, `type`, `features` (array con `pool`, `terrace`, `garage`, `elevator`, `air_conditioning` según los booleanos ya existentes), `photos` (array de URLs https ordenadas). Números como número JSON crudo; sin dato = campo omitido.

## 4. Interfaz del CRM

**Ajustes ▸ Conexiones ▸ "Webs Inmocro"** (bloque nuevo bajo las tarjetas de Fotocasa/Idealista):

- Lista de webs conectadas con nombre, slug y estado.
- Botón "Añadir web": pide nombre visible y slug, genera el token automáticamente.
- Por fila: URL completa del feed en campo de solo lectura con botón "Copiar", acción "Regenerar token" (con aviso de que invalida la anterior), interruptor activo/inactivo y opción de eliminar.

**Ficha de propiedad ▸ "Publicación en Portales"**:

- Los controles actuales pasan a listar también un interruptor por cada web conectada del tenant.
- Al activar/desactivar se hace upsert en `property_portal_status`.
- En el listado de propiedades, icono de globo por web para activar/desactivar rápido (modo compacto ya existente).
- Las webs propias no aplican la validación estricta ni el límite de anuncios de los portales externos.

## 5. Verificación

- `curl` de la URL del feed con token válido → 200, JSON con `properties`.
- Token inválido o web desactivada → 401.
- Activar el interruptor de una web en una vivienda → aparece en el feed; desactivarlo → desaparece.
- Las URLs de fotos abren sin login.

## Detalles técnicos

- Migración: columnas nuevas + `GRANT` correspondientes, sin tocar RLS existente (las políticas por `tenant_id` ya cubren ambas tablas).
- `usePortals.tsx`: `PortalName` pasa a `string`, se añaden `createWebConnection`, `deleteConnection` y helpers para listar conexiones `web:*`.
- `portal-feed`: rama JSON para `web:` reutilizando la validación de token ya implementada; se mantiene `verify_jwt = false`.
- Tokens: 32 bytes hex generados con `crypto.getRandomValues`.
