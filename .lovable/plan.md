# Saltar paso "Tu inmobiliaria" siempre que el usuario ya pertenezca a un tenant

## Problema
La lógica actual sólo salta el paso si el tenant ya tiene ≥ 1 agencia. Pero usuarios como `informaticovaloracasa@gmail.com`, que pertenecen a un tenant existente sin agencias creadas todavía, siguen viendo el paso. El admin del tenant debería ser quien crea las agencias, no un asesor invitado.

## Cambio
`src/components/OnboardingWizard.tsx`: simplificar `skipAgencyStep` para que sea `true` siempre que `tenantId` esté presente (el usuario ya está asociado a una inmobiliaria), sin importar si hay agencias. Quitar el `useEffect` que consulta `agencies`.

- `skipAgencyStep = !!tenantId`
- El botón "Comenzar configuración" salta a `step 2` cuando `skipAgencyStep` es true (ya lo hace).
- El `steps` filtrado y la barra de progreso siguen igual (2 pasos visibles).

## Sin cambios
- Backend, RLS, o lógica de creación de agencia.
- Usuarios sin tenant (caso muy raro) seguirán viendo los 3 pasos.
