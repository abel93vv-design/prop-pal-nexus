# Mejoras en navegación entre Propiedades ↔ Clientes

## 1. Botón "Contactar" dentro de la ficha del cliente
Hoy el botón `PhoneCall` (marcar contactado) sólo existe en la fila de la tabla. Se añade también dentro del modal de edición de cliente.

- En `src/pages/Clients.tsx`, en el `DialogFooter` del diálogo de edición, añadir (sólo cuando `editing` existe) un botón **"Marcar contactado"** con icono `PhoneCall` que llama a `markContacted(editing)` y muestra el contador actual (`editing.contactCount`).
- Se mantiene el botón existente en la fila de la tabla.

## 2. La ficha del cliente se abre y se cierra al entrar desde una propiedad
Causa: al hacer click en un match dentro del diálogo de propiedad, se navega a `/clientes?edit=X` mientras el `Dialog` de Radix de Propiedades aún está montado. La limpieza de pointer-events / focus de Radix entra en conflicto con la apertura inmediata del nuevo `Dialog` en Clientes, que recibe un `onOpenChange(false)` espurio.

Cambios:
- En `src/pages/Clients.tsx` (useEffect de `?edit=`):
  - Diferir la apertura con `setTimeout(() => openEdit(c), 0)` para que la apertura ocurra después de que se desmonte el diálogo de Propiedades y se restablezca el foco.
  - Llamar a `cleanupBodyLocks()` (mismo helper que ya usa `Properties.tsx`) antes de `openEdit` para liberar cualquier `pointer-events:none` heredado.
- Replicar la misma corrección en `src/pages/Properties.tsx` para el caso simétrico (entrar a una propiedad desde un match de cliente).

## 3. Al cerrar la ficha, volver a la página de origen
Hoy: si entras a un cliente desde una propiedad y cierras, te quedas en Clientes y tienes que volver a Propiedades manualmente. Se añade un "return path".

Cambios:
- En `src/components/MatchScoreWidgets.tsx`:
  - `TopClientMatches` (se usa dentro del diálogo de Propiedad): al navegar al cliente, añadir el parámetro `from=propiedad:<propertyId>`. Necesita recibir el `propertyId` actual como prop nueva (`fromPropertyId`). Pasarlo desde `Properties.tsx`.
  - `TopPropertyMatches` (se usa dentro del diálogo de Cliente): al navegar a propiedad, añadir `from=cliente:<clientId>`. Recibir `fromClientId` como prop y pasarlo desde `Clients.tsx`.
- En `src/pages/Clients.tsx`:
  - Al procesar `?edit=`, leer también `from`. Si vale `propiedad:<id>`, guardar `returnTo = '/propiedades?edit=<id>'` en un `useState`.
  - En `Dialog onOpenChange`: cuando se cierre y exista `returnTo`, llamar `navigate(returnTo)` y limpiar el estado.
- En `src/pages/Properties.tsx`: simétrico — leer `from=cliente:<id>`, guardar `returnTo = '/clientes?edit=<id>'` y navegar al cerrar.

## Detalles técnicos

- No se tocan hooks de datos ni el esquema; sólo `src/pages/Clients.tsx`, `src/pages/Properties.tsx` y `src/components/MatchScoreWidgets.tsx`.
- El parámetro `from` se elimina junto con `edit` en el mismo `setSearchParams({ replace: true })` para que no quede en la URL.
- El `returnTo` se aplica únicamente cuando el cierre lo provoca el usuario (no tras guardar), o también tras guardar — confirmar abajo.

## A confirmar
1. Al pulsar "Guardar" en el cliente (entrando desde propiedad), ¿también quieres volver automáticamente a la propiedad, o sólo al cerrar/cancelar?
