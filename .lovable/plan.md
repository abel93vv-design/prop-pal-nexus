# Control de Leads — Plan

Nueva pestaña en el CRM para el seguimiento diario de leads por fuente, con vistas agregadas y comparativas. Multi-tenant, aislada por `tenant_id` con RLS, soft delete y permisos por rol como el resto del CRM.

## 1. Base de datos (Lovable Cloud)

Dos tablas nuevas en `public`, con `tenant_id`, RLS por tenant, GRANTs y triggers `updated_at`.

**`lead_source`** (enum Postgres) con los 20 valores indicados:
`fotocasa, habitaclia, idealista, facebook, facebook_personal, grupos_facebook, marketplace, instagram, instagram_personal, whatsapp, telegram, oficina, escaparate, wallapop, publicidad, zona, referidos, valoracasa, base_de_datos, otros`.

**`daily_leads`** — una fila por (tenant, fecha, fuente):
- `date date`, `source lead_source`
- numéricas (int, default 0): `total_pedidos, pedidos_insertados, pedidos_actualizados, pedidos_llamados, pedidos_llamados_contactados, pedidos_sin_contactar, cv, av, asesoramientos`
- `UNIQUE (tenant_id, date, source)`
- índice por `(tenant_id, date)` y `(tenant_id, source, date)`

**`daily_global_metrics`** — una fila por (tenant, fecha):
- `date date`
- numéricas: `emails_enviados, personas_escaparates, personas_atendidas, personas_que_entran, respuestas_alquiler, pedidos_alquiler, cv_alquiler`
- `UNIQUE (tenant_id, date)`

**RLS / permisos**: políticas basadas en `get_user_tenant_id()` + `has_module_access(auth.uid(), 'control_leads', <action>)`. GRANT a `authenticated` y `service_role`. Se añade el módulo `control_leads` al seed de `role_permissions` (admin total; socio/coordinadora/asesor: view+edit).

No hay borrado físico de filas (se guardan a 0); no se necesita soft delete aquí porque cada celda es un valor numérico que puede volver a 0.

## 2. Navegación y routing

- Nueva entrada en `src/components/AppSidebar.tsx` dentro de "Principal": **Control de leads** → `/control-leads`, módulo `control_leads`, icono `LineChart`.
- Nueva ruta en `src/App.tsx` protegida igual que las demás.

## 3. Página `src/pages/ControlLeads.tsx`

Tabs internas (shadcn `Tabs`): **Diario · Mensual · Anual · Comparativa**.

### 3.1 Vista Diaria (default)
- DatePicker arriba (defecto = hoy).
- Tabla con 20 filas (una por fuente, etiquetas en español) y 9 columnas numéricas como `<Input type="number">` editables in-place.
- Sección inferior "Métricas globales del día" con los 7 inputs.
- Botón **Guardar día** → upsert masivo (20 filas en `daily_leads` + 1 en `daily_global_metrics`) por `(tenant_id, date, source)` y `(tenant_id, date)`.
- Al cambiar fecha: carga automática; si no existe, todo a 0 listo para editar.
- Toast de éxito/error; estado "modificado sin guardar".

### 3.2 Vista Mensual
- Selector mes + año.
- Tabla agregada por fuente (SUM de cada columna) en el rango del mes.
- KPIs: total leads del mes (suma de `pedidos_insertados`), tasa de contacto = `SUM(pedidos_llamados_contactados) / SUM(pedidos_insertados) * 100`, total CV, total AV.
- Gráfico de barras horizontales (recharts): leads por fuente.
- Gráfico de líneas: evolución diaria de `pedidos_insertados` totales del mes.

### 3.3 Vista Anual
- Selector de año.
- Tabla 12 filas (meses) × columnas totales de cada métrica.
- Gráfico de barras apiladas: pedidos_insertados por mes desglosado por las 6 fuentes principales (resto agrupadas en "Otras").
- KPIs: total leads anuales, total CV, total AV, mejor mes, mejor fuente.

### 3.4 Vista Comparativa
- Dos selectores de periodo (mes o año, mismo tipo en ambos).
- Tabla lado a lado por fuente: Periodo A · Periodo B · Δ absoluta · Δ %.
- Indicador visual con tokens semánticos `text-success` / `text-destructive` (definidos en `index.css`, sin colores hardcodeados).

## 4. Datos y hooks

- `src/hooks/useControlLeads.tsx` con React Query:
  - `useDailyLeads(date)` → fila por fuente, normaliza huecos a 0.
  - `useDailyGlobals(date)`.
  - `useUpsertDay()` → mutation con `upsert` (Supabase) e invalidación.
  - `useRangeLeads(from, to)` para mensual/anual/comparativa.
- Constante `LEAD_SOURCES` con `{ value, label }` para iterar y renderizar etiquetas en español.
- Seeding histórico desde el 1 de enero del año en curso: **no se insertan filas vacías** en BD; los días sin datos se muestran como 0 en UI agregando ceros para fechas faltantes. Esto evita inflar la tabla y mantiene consistencia.

## 5. UX / Diseño

- Dashboard limpio, consistente con el resto del CRM (cards shadcn, `Tabs`, `Table`, `Input`).
- Tabla diaria con scroll horizontal en móvil/tablet; sticky en la primera columna (fuente).
- Todos los colores vía tokens (`bg-card`, `text-foreground`, `text-success`, `text-destructive`, `text-primary`). Sin clases tipo `bg-white`/`text-red-500`.
- Responsive tablet/desktop.

## Detalles técnicos

- Migración única que: crea enum, dos tablas, GRANTs, triggers `updated_at`, RLS + políticas (view/insert/update/delete con `has_module_access`), añade `'control_leads'` al array `_modules` de `seed_default_role_permissions` y rellena permisos para tenants existentes.
- `check_plan_limit` no se aplica a estas tablas (no aparece en el `IF/ELSIF`).
- Agregados vía consultas con `select` filtrado por rango + agregación en cliente (React) para evitar nuevas funciones SQL; volumen máximo ≈ 365 × 20 = 7.300 filas/año por tenant, asumible.
- Gráficos con recharts (ya usado en el proyecto, ver `src/components/ui/chart.tsx`).
- Nombre de módulo `control_leads` para encajar con `has_module_access` y el `AppSidebar`.
