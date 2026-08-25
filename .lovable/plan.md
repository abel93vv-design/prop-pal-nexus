# Plan: Configuración clara de WhatsApp

## Problema
La integración de WhatsApp automático fue preparada sin un número de empresa configurado, lo que genera confusión. Se necesita que el usuario pueda ver y configurar el número de WhatsApp Business/Twilio desde el CRM.

## Solución

### 1. Configuración de número de empresa
- Añadir en **Ajustes > Conexiones** una tarjeta de configuración de WhatsApp.
- Campos:
  - `whatsapp_business_number`: número de empresa en formato internacional (ej. +34600000000).
  - Indicador de estado: "Click-to-chat activo" / "Envío automático pendiente de Twilio".
- Guardar el valor en `tenant_settings` (o crear la tabla si no existe) vinculado al `tenant_id` actual.

### 2. Uso del número configurado
- El botón de click-to-chat sigue usando el teléfono del cliente (no cambia).
- La función Edge `send-whatsapp` leerá `whatsapp_business_number` de la configuración del tenant como remitente por defecto, permitiendo sobrescribirlo con `TWILIO_WHATSAPP_FROM` si existe.
- Si no hay número configurado ni `TWILIO_WHATSAPP_FROM`, la función devolverá un error claro: "Configura el número de WhatsApp Business en Ajustes > Conexiones".

### 3. UI de estado en Conexiones
- Mostrar si el envío automático está listo (número configurado + Twilio conectado) o qué falta.
- No permitir envío automático masivo si falta configuración.

### 4. Limpieza
- Eliminar referencias confusas a "API de WhatsApp" cuando solo hay click-to-chat disponible.
- Asegurar que el botón de WhatsApp en ficha de cliente y matching siga funcionando sin configuración.

## Archivos a modificar
- `src/components/settings/ConnectionsTab.tsx`
- `supabase/functions/send-whatsapp/index.ts`
- `src/lib/whatsapp.ts` (documentación del remitente)
- Posible migración SQL para guardar `whatsapp_business_number` por tenant.

## No se toca
- Funcionalidad de click-to-chat existente.
- Conector de Twilio (solo se usa si el usuario lo conecta).
