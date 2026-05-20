# Detectar email duplicado al crear usuario

Cuando el admin intenta crear un usuario con un email que ya existe en el sistema de autenticación, la función falla con un 400 genérico y la UI solo muestra "Edge Function returned a non-2xx status code". Solucionamos esto para que se vea un mensaje claro y se ofrezca enviar el email de recuperación de contraseña.

## Cambios

### 1. `supabase/functions/create-team-member/index.ts`
Cuando `auth.admin.createUser` devuelva el error `email_exists` (o mensaje "already been registered"), responder con **HTTP 200** y cuerpo:
```json
{ "error": "Este email ya está registrado en el sistema...", "code": "email_exists", "email": "..." }
```
Se usa 200 porque `supabase.functions.invoke` no expone el cuerpo en respuestas no-2xx; así la UI puede leer `data.code`.

### 2. `src/pages/RolesPermissions.tsx`
En `handleCreateUser`, cuando `data?.code === "email_exists"`:
- Guardar el email en un nuevo estado `existingEmail`.
- Abrir un `AlertDialog` con el mensaje "Este email ya está registrado" y dos botones:
  - **Cancelar**
  - **Enviar email de recuperación** → llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${window.location.origin}/reset-password })` y muestra un toast de confirmación.

Resto de errores se siguen mostrando como toast destructivo igual que ahora.

## Sin cambios
- No tocamos el flujo de creación normal ni `manage-team-member`.
- No se vincula automáticamente el usuario existente a este tenant (riesgo de robarlo de otro tenant); el admin debe coordinarlo con soporte si aplica.
