# Estadísticas de Hoja de zona solo para administradores

## Qué se construye

Dentro de la página **Hoja de zona** (`/hoja-zona`), una pestaña "Estadísticas" visible únicamente para administradores (admin y super admin). Los asesores solo ven su pestaña actual de hojas.

## Contenido de la pestaña

- **Filtros**: Año, Mes y Asesor (todos opcionales, combinables).
- **Tarjetas resumen**: total de hojas, total de puertas visitadas, contactados (P + M), noticias creadas.
- **Tabla por asesor**: hojas, puertas, P, M, noticias y % de contacto por cada compañero.
- **Desglose por estado de vivienda**: cuántas viviendas quedaron Ocupado, Vacío, Alquilado, En venta y Vacacional en el periodo filtrado.
- **Tabla por calle**: hojas y resultados agrupados por calle/portal, para ver qué zonas se han trabajado.

## Cómo se hace (técnico)

1. `src/hooks/useZoneSheets.tsx`: nueva consulta `useAllZoneSheets(enabled)` que trae todas las hojas del tenant (la política de seguridad ya permite a admin/coordinación leer las de su inmobiliaria; se verifica que la política incluye admin antes de dar por cerrado).
2. `src/pages/ZoneSheet.tsx`:
   - Se añaden pestañas con `Tabs` de shadcn: "Mis hojas" (contenido actual) y "Estadísticas".
   - La pestaña "Estadísticas" solo se renderiza si `isAdmin` de `useUserRole()` (super admin incluido; no socio/coordinadora, salvo que prefieras incluirlos).
   - Agregaciones en memoria con `useMemo` sobre las hojas filtradas por año/mes/asesor; sin cambios en la base de datos.
3. Typecheck con `tsgo --noEmit` antes de confirmar.

## Notas

- Sin migraciones: las filas de vecinos ya están en el JSONB de cada hoja y los estados se guardan ahí.
- Si las políticas de la base de datos no permiten a un admin leer las hojas de otros usuarios, se añade una política de lectura por tenant para roles admin/super admin.
