# Resumen diario por email a los socios (vía Resend)

## Viabilidad
Sí es viable. Requisitos que debes aportar tú:
- Una cuenta en **Resend** (gratis hasta 3.000 correos/mes, 100/día) que conectaremos al CRM desde la tarjeta de conexión.
- Verificar en Resend un dominio propio para el remitente (por ejemplo `avisos.valoracasa.es`), añadiendo los registros DNS que Resend indique.

## Cómo funcionará
1. En Ajustes > Perfil, cada socio (y administradores) tiene **"Recibir resumen diario por email"**, con hora de envío (por defecto 21:00 Madrid) y qué incluir: Hoja de zona y/o Control de leads.
2. Cada día, a la hora elegida, el sistema prepara un correo por socio con la actividad del día de su inmobiliaria. Si no hubo actividad, no se envía nada.
3. Botón al final para abrir **Estadísticas** en el CRM con el día ya filtrado.
4. Activable por inmobiliaria con la clave `resumen_email` en Configuraciones.
5. Enlace para darse de baja en el propio correo (desactiva la opción del perfil).

## Cómo será el email
```text
De: ValoraCasa CRM <resumen@valoracasa.es>
Asunto: Resumen del día · Huelin · martes 21/10

[Logo ValoraCasa, verde corporativo]

Hola Ana, esto es lo que ha pasado hoy:

TOTALES DEL DÍA
  Hojas de zona 6 · Puertas 84 · Contactados (M) 22 · Noticias 5 · Leads 3

HOJA DE ZONA POR EMPLEADO
  Empleado   Hojas  Puertas  M   Noticias  Entrada-Salida
  Fernando     3      41    11      3      17:30-20:10
  Lucía        3      43    11      2      10:00-13:15

CONTROL DE LEADS POR EMPLEADO
  Empleado   Leads  Llamados  Contactados  NE
  Fernando     2       5          3        1
  Lucía        1       4          2        0

CALLES TRABAJADAS
  C/ Héroe de Sostoa 12 (Fernando) · Av. Velázquez 40 (Lucía) ...

  [ Ver estadísticas completas ]

---
Recibes este resumen porque lo activaste en tu perfil. Darse de baja
```

## Detalles técnicos
- Conectar Resend con el conector de la plataforma (clave como secreto del servidor).
- Tabla `digest_preferences` (user_id, tenant_id, enabled, send_hour, include_zone, include_leads, unsubscribe_token) con RLS por usuario y lectura para admin del tenant.
- Función de servidor `daily-digest`: ejecutada cada hora por tarea programada; selecciona socios cuya hora coincide, agrega `zone_sheets`, `daily_leads` y fichas de asesor del día reutilizando la lógica de `zoneAgg`, genera HTML con estilos en línea y envía por Resend. Registro `digest_log` para no repetir envío el mismo día.
- Función `digest-unsubscribe` para el enlace de baja + página en el CRM.
- UI en Ajustes > Perfil y preset `resumen_email` en Configuraciones.
- Botón "Enviar prueba ahora" para administradores.
