# Ajustar Onboarding Wizard según contexto del usuario

## Objetivo
Cuando un usuario ya está asociado a un tenant existente (por ejemplo, un asesor invitado por un admin), no tiene sentido mostrarle el paso 2 ("Tu inmobiliaria") del wizard, porque la inmobiliaria ya existe y no debería crear una nueva.

## Comportamiento esperado

- **Usuario nuevo sin tenant / primer admin de un tenant recién creado** → ve los 3 pasos actuales (Bienvenida → Inmobiliaria → Listo).
- **Usuario ya asociado a un tenant con al menos 1 agencia existente** → ve solo 2 pasos (Bienvenida → Listo), saltándose la creación de inmobiliaria.

## Criterio técnico

En `OnboardingWizard.tsx`, al abrir el wizard:
1. Consultar si ya existe alguna `agencies` para el `tenantId` actual (count rápido, `head: true`).
2. Si existe ≥ 1 agencia → marcar `skipAgencyStep = true`.
3. Ajustar el array `steps` para excluir el paso "agency".
4. En el paso "Bienvenida", el botón "Comenzar configuración" salta directamente al paso final cuando `skipAgencyStep` es true.
5. La barra de progreso refleja el número real de pasos (2 vs 3).

## Archivo a modificar

- `src/components/OnboardingWizard.tsx` — Añadir efecto que consulta agencias del tenant, estado `skipAgencyStep`, y lógica condicional para `steps` y navegación.

## Sin cambios

- `OnboardingGuard` en `App.tsx` sigue decidiendo si mostrar el wizard según `onboarding_completed`.
- No se toca backend ni RLS.
