# Documentación interna en el Panel Global

Añadir una nueva pestaña **"Documentación"** dentro de `/admin` (SuperAdminDashboard) visible solo para `super_admin`. Será una guía viva de toda la plataforma para que Abel tenga en un solo sitio la referencia de qué hay, cómo funciona y qué cobra.

## Estructura de la pestaña

Layout de dos columnas: índice lateral (sticky) + contenido con secciones ancla. Todo renderizado desde un único componente `AdminDocs.tsx` con datos tipados (no Markdown externo) para que se actualice solo si cambian `PLAN_LIMITS`, `PLAN_PRICES`, etc.

### Secciones

1. **Visión general**
   - Qué es la plataforma (CRM inmobiliario multi-tenant)
   - Arquitectura: tenants aislados por RLS, super admin global
   - Flujo: alta de tenant → admin del tenant → equipo → clientes/propiedades

2. **Roles y permisos**
   - Tabla con los 5 roles: `super_admin`, `admin`, `socio`, `coordinadora`, `asesor`
   - Para cada rol: descripción, qué ve, qué puede crear/editar/eliminar
   - Matriz de permisos por módulo (Clientes, Propiedades, Tareas, Pipeline, Match Center, Equipo, Ajustes, Facturación)
   - Nota: solo el admin del tenant gestiona miembros; super_admin gestiona tenants

3. **Planes y precios**
   - Tabla generada desde `PLAN_LIMITS` + `PLAN_PRICES` + `PLAN_LABELS`
   - Columnas: Free / Basic / Pro / Enterprise
   - Filas: precio €/mes, propiedades, clientes, miembros, agencias, portales, campos personalizados, API keys, pipelines, almacenamiento, match center, retención de logs
   - Badges "Ilimitado" cuando aplique

4. **Módulos y herramientas**
   Una tarjeta por módulo con: para qué sirve, cómo se usa paso a paso, quién tiene acceso, límites del plan que aplican.
   - Dashboard / KPIs
   - Clientes (tipos, lead status, intereses, importación CSV, exportación)
   - Propiedades (NE vs Noticias, multi-imagen, estados, syndication Fotocasa/Idealista)
   - Match Center (4 ejes de ponderación, filtros duros)
   - Pipeline (kanban, etapas configurables)
   - Tareas y recordatorios
   - Equipo y miembros
   - Inmobiliarias / agencias
   - Ajustes (perfil, seguridad, sesiones, auditoría, copias)
   - Onboarding wizard
   - Asistente IA (Gemini)
   - Feedback flotante

5. **Panel Global (super admin)**
   - Qué hace cada pestaña: Resumen, Tenants, Actividad, Facturación, Documentación
   - Cómo cambiar el plan de un tenant
   - Cómo interpretar barras de uso (ámbar ≥80%, rojo 100%)
   - Exportar facturación a CSV
   - Provisionar un nuevo tenant (`/tenants`)

6. **Seguridad y datos**
   - RLS por `tenant_id`
   - Roles en tabla aparte (`user_roles`)
   - Soft delete (`deleted_at`) y papelera
   - Snapshots / versionado
   - Logs de actividad por tenant
   - Lockout de login (5 fallos en 2h), rate limiting auth (10 req/min)
   - Cambio de contraseña forzado en primer login

7. **Facturación y suscripciones**
   - Cómo se generan las facturas HTML
   - Estados de suscripción
   - Qué pasa al alcanzar un límite

8. **FAQ operativo**
   - "Un tenant no puede entrar" → ver bloqueos, must_change_password, suscripción
   - "Cómo doy de alta un nuevo cliente del CRM" → crear tenant + admin
   - "Cómo cambio el plan de alguien" → Panel Global → Tenants → Cambiar plan
   - "Cómo recupero datos borrados" → Papelera del tenant

## Detalles técnicos

- Nuevo archivo: `src/pages/admin/AdminDocs.tsx` (componente puro de presentación)
- Integrar como nueva `<TabsTrigger value="docs">Documentación</TabsTrigger>` en `src/pages/SuperAdminDashboard.tsx`
- Datos derivados de:
  - `src/config/planLimits.ts` (PLAN_LIMITS, PLAN_PRICES, PLAN_LABELS, isUnlimited)
  - Constantes locales para roles/permisos y descripciones de módulos
- UI: shadcn `Card`, `Table`, `Badge`, `Accordion` (FAQ), `ScrollArea`, índice lateral con `<a href="#anchor">` y `scroll-smooth`
- Sin cambios de backend, sin migraciones
- Tokens semánticos del design system (verde KageSan)
- Responsive: índice colapsa en `<lg`

## Fuera de alcance

- No se edita desde la UI (es estática y se actualiza por código)
- No se exporta a PDF (se puede añadir después si lo pides)
- No se traduce (solo español)

¿Lo implemento así, o quieres que la documentación sea **editable** desde la UI (guardada en una tabla `admin_docs`) para poder añadir notas sin tocar código?
