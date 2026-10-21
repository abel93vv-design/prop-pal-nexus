# Avisos por email a socios (Control de leads, Hoja de zona)

## Viabilidad
Sí es viable. Requisito previo: configurar un dominio de envío propio (por ejemplo `avisos.valoracasa.es`); ahora no hay ninguno. Se hace una vez desde el asistente de email y se verifica en unas horas.

Limitación importante: el servicio de email integrado es para avisos individuales provocados por algo concreto (un cambio, un guardado). No permite envíos masivos ni boletines. Por eso el diseño es "un aviso por cambio y por socio que lo ha activado", no un correo a una lista.

## Cómo funcionaría
1. En Ajustes > Perfil, cada socio tiene un interruptor **"Recibir avisos por email"** y elige de qué: Control de leads, Hoja de zona (ambos por defecto activados).
2. Cuando un asesor guarda o modifica una hoja de zona, o una ficha/día del Control de leads, el sistema envía un aviso a cada socio de esa inmobiliaria que lo tenga activado.
3. Para no saturar: si el mismo registro se edita varias veces seguidas, se envía como máximo un aviso cada 30 minutos por registro y socio.
4. El correo lleva un botón que abre directamente la hoja o el día en el CRM (hace falta iniciar sesión; los datos no viajan completos en el email, solo un resumen).
5. Pie de baja obligatorio al final de cada correo; si el socio se da de baja deja de recibirlos.

## Cómo sería el email
```text
De: ValoraCasa CRM <avisos@valoracasa.es>
Asunto: Hoja de zona actualizada · C/ Héroe de Sostoa 12 · Fernando

[Logo ValoraCasa, verde corporativo]

Hola Ana,

Fernando ha actualizado una hoja de zona hoy, 21/10 a las 18:40.

  Calle / portal:    C/ Héroe de Sostoa 12, portal 2
  Entrada – salida:  17:30 – 18:35
  Puertas visitadas: 14
  Contactados (M):   5
  Noticias:          2
  Leads:             1

  [ Ver hoja en el CRM ]

---
Recibes este aviso porque lo activaste en tu perfil.
(pie de baja automático)
```
Control de leads: mismo formato con asesor, fecha y los totales del día (pedidos, llamados, contactados, NE, noticias, leads).

## Detalles técnicos
- Configurar dominio, infraestructura de email y plantillas (`zone-sheet-updated`, `leads-updated`) con colores de marca; página de baja en el CRM.
- Tabla `notification_preferences` (user_id, tenant_id, zone_sheets bool, control_leads bool) con RLS por usuario.
- Disparo desde el guardado en `useZoneSheets` / `useAdvisorSheet` / `useControlLeads`: una llamada a una función de servidor que busca los socios con avisos activos del tenant y encola un envío individual por socio, con clave de idempotencia `registro + socio + franja de 30 min`.
- Activable por inmobiliaria con la clave `avisos_email` en Configuraciones.

## Alternativa
Si preferís un **resumen diario** único en lugar de un aviso por cambio, no puede ir por el email integrado (cuenta como envío periódico de informes); habría que usar un servicio externo de email (p. ej. Resend) o descargar el PDF de Estadísticas.
