## Fechas de la Nota de Encargo (NE)

### Cambios

**1. Base de datos** (migración)
- Añadir a `properties`: `ne_start_date date`, `ne_end_date date` (ambos nullable).

**2. Formulario de propiedad** (`src/pages/Properties.tsx`)
- Cuando el apartado seleccionado sea `NE`, mostrar dos campos de fecha: **Fecha inicio NE** y **Fecha fin NE** (ambos obligatorios para NE).
- Si es `Noticia`, no se muestran (se guardan como null).

**3. Tarjeta de propiedad (vista listado)**
- En propiedades NE, mostrar solo la **Fecha fin** y un contador dinámico:
  - `Quedan X días` (verde si >15, ámbar si 6-15, rojo si ≤5)
  - `Caduca hoy` si =0
  - `Caducada hace X días` si <0
- En la pestaña NE, ordenar por `ne_end_date` ascendente (las que están a punto de caducar primero). Las sin fecha al final.

**4. Tipos**
- Añadir `ne_start_date?: string` y `ne_end_date?: string` en `Property` (`src/types/crm.ts`).
- Mapear en `useQueryData.tsx` (lectura/escritura).

### Detalles técnicos
- Usar `<Input type="date">` para mantener simplicidad (consistente con otros campos del formulario).
- Contador calculado en cliente con `Math.ceil((endDate - now) / 86400000)`.
- Orden solo aplica cuando `activeListing === 'ne'`; en `noticia`/`all` mantiene el orden actual.
