## Diagnóstico

La base de datos sí está guardando `listing_type = ne`, y la petición PATCH devuelve éxito. El problema probable está en la lógica del botón: el cálculo de destino usa `convertTarget.listing_type` antiguo. Si por caché o estado visual la tarjeta sigue pensando que es `noticia`, cada clic vuelve a mandar `ne`, por eso parece que “no pasan” o no alternan correctamente.

## Plan de corrección

1. **Hacer la conversión explícita por acción**
   - Cambiar el botón para guardar no solo la propiedad, sino también el destino exacto: `ne` o `noticia`.
   - Evitar calcular el destino dentro del diálogo con datos potencialmente antiguos.

2. **Actualizar solo el campo necesario**
   - Crear/usar una mutación específica para cambiar `listing_type` por `id`.
   - Enviar únicamente `{ listing_type: destino }`, no toda la propiedad completa.
   - Así se evita sobrescribir otros campos y se reduce el riesgo de inconsistencias.

3. **Actualizar la lista local de forma inmediata**
   - Al recibir la respuesta de la base de datos, sustituir esa propiedad en todas las cachés de `properties`.
   - Después invalidar/refrescar la consulta.

4. **Comprobar visualmente el resultado**
   - Convertir una propiedad de Noticias a NE y confirmar que desaparece de Noticias y aparece en NE.
   - Convertirla de NE a Noticias y confirmar el camino inverso.

## Qué puedes hacer ahora

Pulsa **Implementar plan** y lo corrijo directamente con este enfoque más robusto.