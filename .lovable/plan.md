# Integración de WhatsApp con Twilio (envío automático)

## Objetivo
Activar el envío automático de WhatsApp desde el CRM usando Twilio como puente, manteniendo el click-to-chat (`wa.me`) que ya funciona gratis.

## Estado actual
- Click-to-chat ya implementado: abre WhatsApp Web con el teléfono del cliente.
- Edge Function `send-whatsapp` ya existe y está preparada para Twilio, pero necesita:
  1. Conector Twilio vinculado (proporciona `TWILIO_API_KEY`).
  2. Secreto `TWILIO_WHATSAPP_FROM` con el número de remitente verificado.
- No hay UI para enviar mensajes automatizados masivamente; solo el botón de click-to-chat.

## Pasos del plan

### 1. Conectar Twilio
- Usar el conector estándar `twilio` para vincular la cuenta.
- Esto inyectará `TWILIO_API_KEY` como variable de entorno del Edge Function.
- Requisitos previos del usuario:
  - Cuenta Twilio activa.
  - Número de WhatsApp Business verificado en Twilio (puede ser el mismo móvil de la inmobiliaria convertido a WhatsApp Business o un número de Twilio).

### 2. Configurar el remitente
- Añadir el secreto `TWILIO_WHATSAPP_FROM` con el número E.164 del remitente (ej. `+34600123456`).
- Este valor se usará en el campo `From` de los mensajes de WhatsApp.

### 3. Hardering menor de la Edge Function
- Revisar `supabase/functions/send-whatsapp/index.ts` para:
  - Incluir validación de tenant (usar `tenant_id` del perfil autenticado).
  - Registrar en auditoría cada envío (tabla `activity_logs` o similar).
  - Evitar envíos si el usuario no pertenece al mismo `tenant_id` o no tiene permisos.

### 4. UI de envío automatizado
Añadir acciones de "Enviar por WhatsApp" con mensaje predefinido en:
- **Ficha de cliente**: botón junto al actual click-to-chat que permita enviar un mensaje automatizado (saludo o personalizado).
- **Matching / Match Center**: al compartir una propiedad desde el matching, ofrecer tanto click-to-chat como envío automático si el usuario tiene permisos.

### 5. Prueba y validación
- Llamar a `send-whatsapp` desde el chat para confirmar que el mensaje llega.
- Verificar que los errores de Twilio (falta de saldo, número no verificado, etc.) se muestran al usuario.

## Qué necesito del usuario
1. Confirmar que quiere usar Twilio (no Inmovilla/Web QR).
2. Tener a mano para la configuración:
   - Account SID / Auth Token o API Key de Twilio.
   - Número de WhatsApp Business verificado en Twilio (formato `+34...`).

## Qué NO incluye este plan
- No se modifica el click-to-chat existente (sigue gratuito e independiente).
- No se implementa recepción de mensajes ni bandeja de entrada (solo envío saliente).
