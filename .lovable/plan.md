# Ordenar propiedades por Fin NE

## Problema
Actualmente las propiedades solo se ordenan por `ne_end_date` ascendente cuando la pestaña activa es **NE**. En las pestañas **Todas** y **Noticias** el orden es arbitrario, así que una NE a punto de vencer (2 días) puede mostrarse después de una con 25 días.

## Cambio propuesto
En `src/pages/Properties.tsx` (líneas 152–158), aplicar el orden por `ne_end_date` ascendente **siempre**, no solo cuando `activeListing === 'ne'`:

- Propiedades NE con fecha de fin más próxima → primero.
- Propiedades sin `ne_end_date` (Noticias o NE sin fecha) → al final, manteniendo su orden relativo.

Equivale a quitar el `if (activeListing === 'ne')` y dejar el `filtered.sort(...)` siempre activo. La lógica con `Number.POSITIVE_INFINITY` ya empuja correctamente los nulos al final.

## Alcance
- Solo presentación / orden en el listado de Propiedades.
- Sin cambios en datos, backend, RLS, ni en otros módulos.
- Sin cambios visuales más allá del nuevo orden.
