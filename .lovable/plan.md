## Problema

En la ficha del cliente, el botón "Añadir" de Protección de Datos solo crea un registro en `documents` con el campo `file` vacío: nunca se sube un archivo real al storage, por eso no hay nada que visualizar.

## Solución

Convertir el flujo en una subida real al bucket `documents` y añadir un botón "Ver" que abra el archivo.

### Cambios

1. **`ClientDocumentsSection` en `src/pages/Clients.tsx`**
   - Sustituir el botón "Añadir" por un `<input type="file">` (PDF / imágenes).
   - Al seleccionar el archivo:
     - Subirlo a `documents/{tenant_id}/clients/{clientId}/{timestamp}-{nombre}` con `supabase.storage.from('documents').upload(...)`.
     - Guardar la ruta resultante en `documents.file` al llamar a `addDocument` (en vez de `file: ''`).
   - Mostrar estado de carga y `toast` de error/éxito.

2. **Visualización**
   - Añadir un botón "Ver" (icono ojo) en cada documento listado.
   - Al pulsar: `supabase.storage.from('documents').createSignedUrl(d.file, 60)` y abrir la URL en una pestaña nueva.
   - Solo mostrar "Ver" cuando `d.file` no esté vacío (los registros antiguos sin archivo seguirán visibles pero sin botón).

3. **Borrado**
   - En `onDelete`, si `d.file` existe, eliminar también el objeto del storage (`storage.from('documents').remove([d.file])`) antes de borrar el registro.

### Notas técnicas

- El bucket `documents` ya existe y tiene policies para usuarios autenticados; no se requiere migración.
- Se respeta el aislamiento por tenant al prefijar la ruta con `tenant_id` (obtenido vía `get_user_tenant_id` o desde `useUserRole`).
- No se cambian tipos ni tablas: el campo `documents.file` ya está en el esquema.
- Misma mejora se podrá replicar en Properties más adelante (fuera del alcance de esta tarea).
