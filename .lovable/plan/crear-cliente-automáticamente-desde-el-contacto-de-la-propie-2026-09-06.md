# Crear cliente automáticamente desde el contacto de la propiedad

Cuando se guarda una propiedad nueva con datos de contacto (nombre y/o teléfono), el CRM creará automáticamente la ficha de cliente correspondiente y la dejará vinculada a esa propiedad.

## Comportamiento

- Al crear una propiedad, si hay nombre o teléfono de contacto, se genera la ficha de cliente sin preguntar.
- Si ya existe un cliente activo con ese mismo teléfono, no se duplica: se reutiliza y se vincula la propiedad.
- Tipo de cliente según la operación: venta (o venta y alquiler) → vendedor; alquiler → arrendador.
- Los comentarios del contacto se copian en las notas del cliente.
- El cliente queda con origen "propiedad" y con la propiedad asociada, para verlo desde su ficha.
- Aviso al guardar: "Propiedad creada y contacto añadido como cliente" o "vinculado a un cliente existente".
- Al editar una propiedad existente no se crea nada nuevo, para no generar duplicados en fichas antiguas.
- Un asesor sin permiso para crear clientes guarda la propiedad igual; simplemente no se crea la ficha (aviso discreto).

## Detalles técnicos

- En `src/pages/Properties.tsx`, dentro de `handleSave` (rama de creación): tras `addProperty(form)`, si `contact_name` o `contact_phone` tienen valor, buscar en `clients` (de `useData`) una coincidencia por teléfono normalizado (solo dígitos, últimos 9).
- Si no hay coincidencia, llamar a `addClient` con: `name` (contact_name o "Contacto sin nombre"), `phone`, `notes` = contact_notes, `type` = `vendedor` / `arrendador` según `form.operationType`, `operationType` alineada, `leadStatus: 'nuevo'`, `isActive: true`, `agencyId` de la propiedad, `propertyIds: [nuevaPropiedad.id]`, `source: 'propiedad'`.
- Si hay coincidencia, `updateClient` añadiendo el id de la propiedad a `propertyIds` (sin duplicar) y sin sobrescribir sus datos.
- `addProperty` debe devolver la fila creada para obtener el id; comprobar en `usePropertyMutations` (`src/hooks/useQueryData.tsx`) y ajustar el `select().single()` si hiciera falta.
- Errores al crear el cliente se capturan aparte: no deben hacer fallar el guardado de la propiedad.
- Sin cambios de base de datos.
