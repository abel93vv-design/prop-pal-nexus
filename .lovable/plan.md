## Objetivo

Que cada inmobiliaria (agency) vea únicamente sus propios matches en Match Center. Los asesores de una misma inmobiliaria comparten vista; admins del tenant siguen viendo todo.

## Diagnóstico

Hoy hay dos puntos donde se filtra el agency:

1. **Edge function `calculate-matches`** — empareja todos los clientes × propiedades del tenant y solo descarta el cruce cuando AMBOS (cliente y propiedad) tienen `agency_id` y son distintos. Si alguno es `null`, se crea el match (lógica "legacy").
2. **RLS de `match_scores`** — los asesores pueden leer filas donde `agency_id = su agencia` **O** `agency_id IS NULL` **O** no tienen agencia asignada.

Resultado: cualquier propiedad/cliente sin `agency_id` o cualquier match con `agency_id` nulo se ve entre inmobiliarias.

## Cambios

### 1. Edge function `supabase/functions/calculate-matches/index.ts`
- Cambiar el filtro de emparejamiento por una regla estricta: solo emparejar cliente y propiedad cuando **`client.agency_id === prop.agency_id`** y **ambos son no nulos**. Saltar el resto.
- Guardar siempre `agency_id` de la propiedad (= del cliente) en la fila resultante; nunca `null`.
- Las propiedades o clientes sin inmobiliaria asignada no generan matches (se mostrarán cero matches hasta que se les asigne agencia).

### 2. RLS de `match_scores` (migración SQL)
- Reemplazar la policy de SELECT para que sea estrictamente:
  - `tenant_id = get_user_tenant_id()` Y
  - (`is_tenant_admin(...)` Ó `agency_id = get_user_agency_id()`).
- Quitar las ramas permisivas (`agency_id IS NULL`, `get_user_agency_id() IS NULL`).
- Aplicar la misma regla en INSERT/UPDATE/DELETE para evitar inserciones cruzadas.

### 3. Limpieza de datos existentes
- Borrar de `match_scores` las filas con `agency_id IS NULL` (residuo legacy que ya no encaja con el nuevo modelo). El siguiente "Recalcular" repoblará lo que corresponda.

### 4. UI (sin cambios funcionales)
- `src/pages/MatchCenter.tsx` y `src/hooks/useMatchCenter.tsx` no requieren cambios: ya filtran por `tenant_id` y dependen de RLS para el filtro por inmobiliaria.
- El usuario verá menos resultados si tiene clientes/propiedades sin agencia asignada — eso es el comportamiento deseado.

## Notas técnicas

- `get_user_agency_id()` ya existe y devuelve la primera agencia del usuario en `team_members`.
- `is_tenant_admin()` ya existe; admins del tenant siguen viendo todo.
- Tras el deploy, el usuario debe pulsar "Recalcular Matches" para regenerar con la nueva lógica.
