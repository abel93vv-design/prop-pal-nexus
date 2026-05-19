## Diagnóstico

He reproducido el login en `crm.valoracasa.es` con el usuario de Cártama y en mi sesión no se congeló: dashboard cargó, consola sin errores críticos, red OK y rendimiento normal.

Pero sí he encontrado una causa probable del congelado intermitente:

- El guard anti-congelado (`useBodyPointerEventsGuard`) está montado dentro de `Layout`.
- `Layout` solo existe cuando el usuario ya está dentro del CRM.
- Si Radix deja `pointer-events: none`, `data-scroll-locked` u `overflow: hidden` en el `<body>` durante login, cambio de auth, toast/dialog/overlay, o justo antes de montar `Layout`, el guard todavía no está activo o se desmonta entre rutas.
- Resultado: el usuario puede ver el dashboard, pero la página queda aparentemente “congelada” porque el body sigue bloqueando los clicks.

## Plan de implementación

1. **Mover el guard anti-bloqueo a nivel global de la app**
   - Montar `useBodyPointerEventsGuard()` en un componente global dentro de `App`, no dentro de `Layout`.
   - Así estará activo desde `/auth`, durante login, redirecciones y todas las rutas privadas.

2. **Hacer el guard más robusto**
   - Ejecutar una limpieza inicial al montarse.
   - Mantener el `MutationObserver` actual.
   - Añadir comprobación diferida corta tras cambios de estilo/atributos, para capturar locks que Radix reaplique unos milisegundos después.
   - No limpiar si hay dialog/select/overlay real abierto.

3. **Evitar doble montaje**
   - Quitar el hook de `Layout` para no crear múltiples observers al navegar.
   - Mantener un único guard global.

4. **Actualizar el test existente**
   - Añadir caso que simule el problema real: el body ya viene bloqueado antes de montar el guard.
   - Verificar que al montar el guard global se limpia y la página queda interactiva.

5. **Validación**
   - Ejecutar el test del guard.
   - Reprobar manualmente en navegador: login → dashboard → click en sidebar/clientes/propiedades.

## Archivos previstos

- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/hooks/useBodyPointerEventsGuard.ts`
- `src/hooks/__tests__/useBodyPointerEventsGuard.test.tsx`

## Resultado esperado

El CRM no debería quedarse congelado nada más entrar, incluso si Radix deja estilos residuales en `<body>` durante el login o la transición hacia el dashboard.