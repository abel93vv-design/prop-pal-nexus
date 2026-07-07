## Filtros avanzados en la página de Clientes

Añadir un botón **"Filtros avanzados"** en la barra superior de `/clientes`, junto a los filtros existentes (búsqueda, tipo, inmobiliaria). Al pulsarlo se abre un panel lateral (Sheet) con todos los filtros disponibles, aplicables en combinación.

### Filtros incluidos en el panel

**Datos básicos**
- Tipo de cliente (comprador / vendedor / arrendador / arrendatario)
- Operación (compra / alquiler / venta / ambos)
- Estado del lead (nuevo / contactado / en negociación / cerrado / inactivo)
- Origen del cliente (Fotocasa, Idealista, Web, Referido, etc.)
- Inmobiliaria (si hay varias)
- Categoría

**Contacto**
- Rango de "Último contacto" (desde / hasta)
- Nº de contactos (mín / máx)
- Sólo sin contactar aún

**Financiación**
- Al contado / Necesita hipoteca / Hipoteca pre-aprobada / Cualquiera
- Rango de ahorros disponibles (mín / máx)
- Rango de ingresos netos/mes (mín / máx)

**Preferencias de búsqueda**
- Rango de precio deseado (mín / máx)
- Rango de superficie (mín / máx)
- Habitaciones mínimas
- Baños mínimos
- Tipología deseada (piso, casa, local, terreno, parking) — multi
- Zonas preferidas (usando `ZoneSelector` existente)
- Extras indispensables (ascensor, terraza, piscina, garaje, aire acondicionado, acepta mascotas) — multi

**Otros**
- Rango de fecha de registro (desde / hasta)

### Comportamiento

- El panel muestra en el botón un contador con el nº de filtros activos (ej. "Filtros avanzados (3)").
- Botón **"Limpiar filtros"** dentro del panel.
- Los filtros se aplican en vivo sobre la lista (se combinan con el buscador y los selectores rápidos ya visibles).
- Debajo de la barra aparecen "chips" con los filtros activos, cada uno con una X para quitarlo individualmente.
- El conteo del encabezado ("N clientes registrados") pasa a mostrar "Mostrando X de N".

### Detalles técnicos

- Nuevo componente `ClientsAdvancedFilters.tsx` que renderiza el contenido del Sheet (`@/components/ui/sheet` ya usado en el proyecto).
- Estado consolidado `advancedFilters` en `Clients.tsx` (un solo objeto), inicializado vacío.
- Para los filtros que dependen de `client_financials` y `client_preferences`, cargar mapas por `tenant_id` una sola vez (siguiendo el patrón ya usado para `financialsMap`) y añadir `preferencesMap`.
- La función `filtered` en `Clients.tsx` se amplía para aplicar todos los criterios; se mantiene la ordenación actual por último contacto.
- Los chips de filtros activos se renderizan encima de la tabla con `Badge` + icono `X`.
- Sin cambios en la base de datos ni en tipos existentes.
