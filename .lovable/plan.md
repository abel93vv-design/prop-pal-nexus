# Plan: Cambios Control de Leads

## 1. Fuentes (`LEAD_SOURCES` en `src/hooks/useControlLeads.tsx`)
- Renombrar la etiqueta de `base_de_datos` de "Base de datos" a **"CRM"** (valor en BD intacto).
- Añadir nueva fuente **`tiktok`** con etiqueta "TikTok". Aparecerá automáticamente en diario / mensual / anual / comparativa (las filas se generan desde `LEAD_SOURCES`).
- Sin migración: el campo `source` es `text`, no enum.

## 2. Métricas globales del día (sustituyen el bloque actual)
Nueva estructura en `ControlLeads.tsx`, 3 filas con dos placeholders cada una, lado a lado:

```text
[ Emails enviados      ] [ Emails respondidos ]
[ Personas escaparate  ] [ Personas atendidas ]
[ Pedidos alquiler     ] [ Citas de alquiler  ]
```

Campos en BD (nuevas columnas en `daily_global_metrics`):
- `emails_enviados` (ya existe, se reutiliza)
- `emails_respondidos` (nueva)
- `personas_escaparate` (nueva — se añade en singular; la antigua `personas_escaparates` queda en la tabla pero oculta)
- `personas_atendidas` (ya existe)
- `pedidos_alquiler` (ya existe)
- `citas_alquiler` (nueva)

Las columnas antiguas que dejan de usarse (`personas_escaparates`, `personas_que_entran`, `respuestas_alquiler`, `cv_alquiler`) se **mantienen en la tabla** para conservar datos históricos, pero desaparecen de la UI y de `GLOBAL_COLUMNS`.

> Nota: he eliminado la fila de "Personas que entran" y sus 4 sub-campos según tu indicación ("por 3 nada más"). Si querías conservarla sin los 4 sub-placeholders, dímelo y la añado.

## 3. Cambios técnicos

**Migración SQL** (`daily_global_metrics`):
- Añadir columnas `emails_respondidos integer not null default 0`, `personas_escaparate integer not null default 0`, `citas_alquiler integer not null default 0`.
- No se tocan columnas existentes ni RLS/GRANTs.

**`src/hooks/useControlLeads.tsx`:**
- Actualizar `LEAD_SOURCES` (label CRM + nueva tiktok).
- Reescribir `GLOBAL_COLUMNS` con los 6 campos nuevos en el orden de la maqueta.
- Actualizar `DailyGlobalRow` y `emptyGlobalRow()` con los campos nuevos; quitar los obsoletos del tipo (la fila de BD puede traer más columnas, las ignoramos).
- Mantener lógica de upsert / aggregation tal cual (itera sobre `GLOBAL_COLUMNS`).

**`src/pages/ControlLeads.tsx`:**
- Sección "Métricas del día" pasa de grid plano a 3 filas × 2 columnas (grid-cols-2 con gap), inputs numéricos con label encima.
- Tabs Mensual / Anual / Comparativa: las tablas que listan métricas globales se generan desde `GLOBAL_COLUMNS`, por lo que se actualizan solas.
- Notas mensuales: sin cambios.

**`src/integrations/supabase/types.ts`:** se regenera tras la migración.

## 4. Verificación
1. Aplicar migración.
2. Comprobar en preview: nueva fuente TikTok visible, etiqueta CRM, layout de métricas 3×2.
3. Guardar un día de prueba y recargar para confirmar persistencia.
