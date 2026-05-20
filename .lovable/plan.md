## Diagnóstico

En el Match Center de `huelin@valoracasa.es` aparecen filas con cliente y/o propiedad vacíos ("—"). La causa es que la edge function `calculate-matches` está generando matches contra **clientes y propiedades borrados** (`deleted_at IS NOT NULL`).

Confirmado en BD: muchas filas de `match_scores` del tenant referencian propiedades cuyo `deleted_at` no es nulo (ej. `prueba 34`, `H322A`, `H600A` borradas el 2026-05-19). El frontend carga propiedades con `deleted_at IS NULL` (vía RLS + filtros del hook), así que esas referencias no resuelven y se muestran como "—".

El mismo problema ocurre con clientes borrados, aunque en el caso visible el cliente "María García" sigue vivo y por eso sí se ve.

## Cambios

### 1. `supabase/functions/calculate-matches/index.ts`
- Añadir `.is("deleted_at", null)` tanto en `clientsQuery` como en `propsQuery` antes del emparejamiento, para que nunca se generen matches contra registros borrados.

### 2. Migración SQL — limpieza de datos
- Borrar de `match_scores` toda fila cuyo `client_id` o `property_id` apunte a un registro con `deleted_at IS NOT NULL` (incluye los huérfanos ya existentes). Esto deja la tabla coherente con la nueva regla.

### 3. UI (defensa adicional, opcional pero recomendado)
- En `src/pages/MatchCenter.tsx`, filtrar `paged`/`filtered` descartando matches donde no se encuentre cliente **o** propiedad en los arrays cargados. Así, aunque por race condition o por borrado posterior queden referencias rotas momentáneas, nunca se renderizan filas vacías.

## Notas

- Tras aplicar, el usuario debe pulsar **Recalcular Matches** para regenerar con los datos vivos. El count "70 matches calculados" bajará a los que realmente correspondan.
- El cambio no afecta a la regla de aislamiento por inmobiliaria implementada anteriormente.
