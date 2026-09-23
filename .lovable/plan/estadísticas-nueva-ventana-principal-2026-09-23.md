# Estadísticas: nueva ventana principal

Convertir el panel de estadísticas (hoy una pestaña dentro de Hoja de zona) en una sección propia del menú, que reúna los datos de **Hoja de zona** y de **Control de leads**, con filtros por empleado y por periodo, y descarga de los datos.

## Acceso

- Nueva entrada "Estadísticas" en el menú lateral, visible solo para administradores (admin y superadmin).
- Se retira la pestaña Estadísticas de Hoja de zona (esa página vuelve a mostrar solo las hojas).

## Filtros (barra superior, se aplican a todo)

- **Empleado**: todos o uno concreto.
- **Periodo**: Semana / Quincena / Mes / Año / Personalizado (dos fechas).
  - Semana, quincena, mes y año se eligen sobre un calendario y calculan automáticamente las fechas de inicio y fin.
- Todos los bloques y las descargas respetan estos filtros.

## Contenido

**1. Resumen general**
Tarjetas con: hojas de zona realizadas, puertas visitadas, contactados (P+M), noticias generadas, pedidos, llamadas realizadas y contactadas, citas.

**2. Hoja de zona**
- Por empleado: hojas, puertas, P, M, noticias, % de contacto.
- Por estado de vivienda: Ocupado, Vacío, Alquilado, En venta, Vacacional.
- Por calle/portal.

**3. Control de leads**
- Por empleado: totales de pedidos, insertados, actualizados, llamados, contactados, sin contactar, CV, AV, AA, CA, NE, propuestas, asesoramientos.
- Por origen (Idealista, Fotocasa, zona, escaparate, etc.).
- Métricas generales del día agregadas al periodo: emails enviados y respondidos, personas en escaparate, atendidas, entrantes, citas de alquiler.
- Marketing y llamadas de las fichas de asesor: publicaciones, contactos, pedidos, llamadas, contactadas.

**4. Evolución**
Gráfico de barras por día o semana del periodo (puertas y pedidos), para ver la tendencia.

## Descarga

Botón "Descargar" que genera un archivo con el periodo y el empleado seleccionados:
- CSV (UTF-8 con BOM, como el resto de exportaciones del CRM) con una hoja de resumen por empleado.
- Además, un Excel con varias pestañas: Resumen, Hoja de zona, Control de leads, Por origen.

## Detalles técnicos

- Nueva página `src/pages/Statistics.tsx` y ruta `/estadisticas` en `src/App.tsx`; entrada en `mainItems` de `AppSidebar.tsx` condicionada a `isAdmin`.
- Componentes en `src/components/stats/`: `StatsFilters.tsx` (empleado + periodo), `ZoneStatsSection.tsx` (reutiliza la lógica de agregación de `ZoneSheetStats.tsx`), `LeadsStatsSection.tsx`, `StatsTrendChart.tsx` (recharts, ya en el proyecto).
- Datos: `useAllZoneSheets` (filtrado por rango en memoria), `useLeadsRange`/`useGlobalMetricsRange` de `useControlLeads.tsx` y `useAdvisorRange` de `useAdvisorSheet.tsx`, todos ya aceptan rango de fechas y `userId`; se añade una variante que traiga todo el tenant cuando el filtro de empleado es "todos".
- Sin migraciones: todo se agrega en memoria con `useMemo`; las políticas de acceso actuales ya permiten a administradores leer las tablas del tenant.
- Exportación: CSV con `Blob`; Excel con la librería `xlsx` (se añade como dependencia si no está).
- Se elimina el bloque de pestañas de `ZoneSheet.tsx` y se mueve `ZoneSheetStats.tsx` a `src/components/stats/`.
