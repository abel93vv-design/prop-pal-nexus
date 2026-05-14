# Panel Super Admin Global

Crear un panel exclusivo para `abel93vv@gmail.com` (rol `super_admin`) que muestre la actividad consolidada de todos los tenants del sistema.

## Acceso

- Nueva ruta `/admin` protegida: solo visible y accesible si el usuario tiene rol `super_admin` en `user_roles`.
- Nuevo enlace "Panel Global" en el sidebar, oculto para el resto de usuarios.
- El email `abel93vv@gmail.com` ya tendrá rol `super_admin` (verificar y asignar si falta).

## Secciones del panel

### 1. Resumen general (KPIs arriba)
- Nº total de tenants activos
- Nº total de usuarios en la plataforma
- Nº total de clientes
- Nº total de propiedades
- Ingresos del mes (suma de facturas pagadas)
- Tenants en riesgo (≥80% de algún límite del plan)

### 2. Tabla de tenants
Una fila por tenant con:
- Nombre + slug + dominio
- Plan contratado (free / basic / pro / enterprise) + estado de suscripción
- Fecha de alta
- Nº usuarios actuales / límite del plan + barra de progreso
- Nº propiedades / límite + barra
- Nº clientes / límite + barra
- Estado: activo / inactivo / cerca del límite (badge color)
- Acciones: Ver detalle, Ver facturas, Cambiar plan, Suspender

### 3. Detalle de un tenant (modal o sub-página)
- Datos del tenant + admin principal
- Lista de usuarios del tenant con rol y último acceso
- Últimos clientes creados (10 más recientes)
- Últimas propiedades creadas
- Historial de facturas con importe, periodo, estado, descarga
- Log de actividad reciente (`activity_logs`)
- Uso de almacenamiento (documentos)

### 4. Actividad global en tiempo real
- Feed cronológico de últimos eventos en todos los tenants: nuevos usuarios, nuevos clientes, nuevas propiedades, nuevas facturas
- Filtros por tipo de evento y por tenant

### 5. Facturación consolidada
- Tabla de todas las facturas de todos los tenants
- Filtros por mes, plan, estado
- Total facturado por mes (gráfico)
- Exportar CSV

## Sugerencias adicionales que añadiría

1. **Alertas automáticas** — destacar tenants que: no han iniciado sesión en 30 días, están al 90% de un límite, tienen suscripción vencida, llevan >7 días sin actividad.
2. **Gráfico de crecimiento** — nuevos tenants/clientes/propiedades por mes (últimos 6 meses).
3. **Ranking de tenants** — más activos por nº de operaciones, más clientes, más propiedades publicadas.
4. **Health score por tenant** — métrica compuesta (uso, actividad, pago al día) para ver de un vistazo cuáles necesitan atención.
5. **Acceso rápido "Impersonar"** — botón para entrar al CRM de un tenant como super admin (solo lectura) para dar soporte.
6. **Resumen de portales** — qué tenants tienen Fotocasa/Idealista activos y cuántos anuncios publican.
7. **Notas internas por tenant** — campo libre para que Abel anote acuerdos, incidencias, contactos.
8. **Exportación mensual** — informe PDF/CSV con resumen del mes para enviar o archivar.

## Detalles técnicos

- **Edge function nueva** `super-admin-dashboard` (verify_jwt, valida `is_super_admin(auth.uid())` server-side) que devuelve:
  - Lista completa de tenants con conteos agregados (usuarios, clientes, propiedades) usando `service_role` para saltarse RLS.
  - Facturas, actividad y detalles bajo demanda.
- **Nueva página** `src/pages/SuperAdminDashboard.tsx` con tabs: Resumen / Tenants / Actividad / Facturación.
- **Componentes nuevos**: `TenantStatsCard`, `TenantDetailDrawer`, `GlobalActivityFeed`, `BillingTable`.
- **Cálculo de límites**: reutilizar `PLAN_LIMITS` de `src/config/planLimits.ts`. Marcar fila en ámbar a ≥80% y rojo a 100%.
- **Sidebar**: añadir item "Panel Global" condicionado a `isSuperAdmin` desde `useUserRole`.
- **Ruta** `/admin` envuelta en guard que redirige si no es super_admin.
- **Migración mínima**: ninguna estructural necesaria (todo se calcula sobre tablas existentes); opcional añadir tabla `tenant_notes` si quieres incluir la sugerencia 7.

## ¿Confirmas?

¿Incluyo todas las sugerencias adicionales (1–8) o prefieres empezar solo con las secciones 1–5 base y añadir el resto después?
