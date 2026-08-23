# Publicación en Idealista y Fotocasa (modelo feed XML, tipo Inmoweb)

Completar la integración ya iniciada (`portal_connections`, `property_portal_status`, función `portal-feed`) para que cada inmobiliaria pueda publicar sus viviendas en Idealista y Fotocasa de forma automática, como hacen Inmoweb/Inmovilla: el CRM genera una URL de feed XML por portal y el portal la descarga periódicamente.

## 1. Ajustes > Conexiones: feed URL autogenerada y asistente

Rediseñar `ConnectionsTab.tsx`:

- Cada portal (Fotocasa, Idealista) muestra su **URL de feed XML generada automáticamente** por el CRM, con botón "Copiar". Ya no se pide al usuario que introduzca una URL (se elimina el input manual de `feed_url`).
- La URL incluye un **token de seguridad único** por tenant y portal (nueva columna `feed_token` en `portal_connections`), para que el feed no sea accesible adivinando el `tenant_id`. Botón "Regenerar token" (invalida la URL anterior).
- **Guía paso a paso** desplegable por portal: cómo darse de alta en Idealista/Fotocasa Pro y dónde entregar la URL del feed a su equipo técnico.
- Se mantienen: interruptor de conexión activa, límite de anuncios contratados y aceptación de requisitos.
- Contador de anuncios publicados vs. límite (`PortalAdCounter`, ya existe).

## 2. Función `portal-feed`: feed real y seguro

Actualizar `supabase/functions/portal-feed/index.ts`:

- **Validar el `feed_token`** del query param contra `portal_connections`; 403 si no coincide o la conexión está inactiva.
- Incluir solo viviendas **publicadas, no eliminadas y disponibles** (excluir `vendido_alquilado` y `no_disponible`, y cualquier registro despublicado).
- Añadir **tipo de operación** (venta / alquiler) usando `operation_type` y `monthly_rent`, para que el portal clasifique bien el anuncio.
- Fotos con URLs absolutas, datos de contacto de la agencia y fecha de actualización por vivienda.
- XML válido y escapado (ya existe `escapeXml`), con cabeceras de caché razonables.

## 3. Despublicación automática

Migración SQL con trigger sobre `properties`:

- Cuando una vivienda pasa a `vendido_alquilado` o `no_disponible`, o se mueve a la papelera (`deleted_at`), sus registros en `property_portal_status` pasan a `is_published = false` en todos los portales.
- Al reactivar la vivienda (vuelve a `disponible`), NO se republica sola: el usuario decide.

## 4. Publicación masiva en la página de Propiedades

En `src/pages/Properties.tsx`:

- Checkbox de selección múltiple en la lista de viviendas.
- Barra de acciones al seleccionar: "Publicar en Fotocasa", "Publicar en Idealista", "Despublicar".
- Al publicar en masa se valida cada vivienda con `validatePropertyForPortal` (ya existe): las que fallan se omiten y se muestra un resumen ("8 publicadas, 2 con errores: falta precio, falta foto...").
- Respeta el límite de anuncios contratados del portal.
- Los controles individuales por vivienda (`PortalPublicationControls`) se mantienen.

## 5. Recomendaciones SEO por vivienda

Nuevo componente `PropertySeoChecklist.tsx` (visible en la ficha/detalle de la vivienda, junto a los controles de publicación):

- Puntuación 0-100 y lista de recomendaciones para posicionar mejor en los portales:
  - Título entre 30 y 70 caracteres y con tipo + zona.
  - Descripción de al menos ~300 caracteres, sin MAYÚSCULAS abusivas ni teléfonos/emails.
  - Mínimo 5-8 fotos (aviso si hay menos), primera foto presente.
  - Campos clave completos: precio, superficie, habitaciones, baños, CP, certificado energético, extras (ascensor, terraza...).
- Semáforo (verde/ámbar/rojo) reutilizable como indicador en la lista de propiedades.
- Bloqueo suave: no impide publicar, pero avisa si la puntuación es baja.

## Detalles técnicos

- **Migración**: `ALTER TABLE portal_connections ADD COLUMN feed_token text` (generado con `gen_random_bytes` por defecto), trigger `unpublish_on_property_unavailable` sobre `properties`. Sin cambios de RLS (las políticas actuales ya cubren las tablas).
- **Feed URL**: `https://<proyecto>.supabase.co/functions/v1/portal-feed?tenant_id=...&portal=...&token=...` (la función ya está desplegada con `verify_jwt = false`, el token sustituye a la sesión).
- **Hooks**: ampliar `usePortals.tsx` con `bulkTogglePublication(propertyIds[], portal, publish)` y `regenerateFeedToken(portal)`.
- **UI**: todo con tokens semánticos del tema (sin colores hardcodeados salvo los ya existentes en `portalConfig`); modales con `max-w-2xl max-h-[90vh]` según convención del proyecto.
- No se tocan otras funciones ni módulos.
