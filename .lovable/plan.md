## Problema

En `/tenants` aparecen URLs como `valoracasa-huelin.tudominio.com`. Es un **placeholder hardcodeado** que nunca ha sido una URL real. La URL real de cada tenant es:

- Su **dominio personalizado** si tiene uno verificado (ej. `crm.valoracasa.es`)
- O un subdominio basado en el host actual donde corre la app

## Cambios

**`src/pages/Tenants.tsx`**

1. Crear helper `getTenantUrl(t)` que devuelva la URL correcta según prioridad:
   - Si `t.custom_domain` y `t.domain_verified` → `https://{custom_domain}`
   - Si `t.custom_domain` (sin verificar) → `https://{custom_domain}` (con badge de pendiente, que ya existe)
   - Si no → `https://{slug}.{rootDomain}` donde `rootDomain` se calcula del `window.location.hostname` actual quitando cualquier subdominio inicial (ej. si la app corre en `crm.valoracasa.es`, el root es `valoracasa.es`; si corre en `prop-pal-nexus.lovable.app`, el root es `prop-pal-nexus.lovable.app`)

2. Reemplazar las dos apariciones de `tudominio.com`:
   - Línea ~245 (tarjeta): mostrar `getTenantUrl(t)` sin protocolo
   - Línea ~211 (`getAccessUrl`): retornar `getTenantUrl(t)` completo

3. Lógica del root domain:
   ```ts
   const host = window.location.hostname;
   const parts = host.split(".");
   // Si hay 3+ partes y la primera no es "www", quitarla
   const rootDomain = parts.length >= 3 && parts[0] !== "www" 
     ? parts.slice(1).join(".") 
     : host;
   ```
   Esto cubre: `crm.valoracasa.es` → `valoracasa.es`, `app.kagesan.com` → `kagesan.com`, `prop-pal-nexus.lovable.app` → `lovable.app` (aunque en lovable.app los subdominios de tenant no funcionarán realmente; solo el dominio publicado funciona como root cuando hay multitenant configurado a nivel DNS).

## Resultado

- **Valoracasa Huelin** (con `custom_domain = crm.valoracasa.es` verificado) → mostrará `crm.valoracasa.es`
- Tenants sin dominio personalizado → mostrarán `{slug}.{dominio-raíz-actual}` (ej. `valoracasa-huelin.valoracasa.es`)
- Nunca más aparecerá `tudominio.com`

## Nota importante

Para que los subdominios autogenerados (ej. `valoracasa-huelin.valoracasa.es`) funcionen, necesitas un **DNS wildcard** (`*.valoracasa.es` → IP de Lovable) configurado en tu registrador. Sin eso, la URL se muestra correctamente pero al hacer click no resolverá. La resolución por subdominio en código (`TenantContext`) ya está lista para funcionar cuando el wildcard esté activo.
