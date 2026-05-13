## Diagnóstico

Verificar el dominio en el CRM **solo marca el TXT como válido en nuestra base de datos**. No hace que `crm.valoracasa.es` apunte realmente a la app. Para que el navegador cargue algo en esa URL hacen falta **tres capas**, y ahora mismo solo tienes una:

```
[1] DNS del cliente (valoracasa.es)
       ↓ A crm → 185.158.133.1   ✅ (ya hecho)
       ↓ TXT _kagesan-verify.crm  ✅ (verificado en CRM)

[2] Lovable Hosting (Project Settings → Domains)
       ↓ Connect Domain: crm.valoracasa.es   ❌ FALTA
       ↓ Provisión SSL automática (Let's Encrypt)

[3] TenantContext resuelve por hostname
       ↓ get_tenant_by_domain('crm.valoracasa.es')   ✅ (código listo)
```

El paso **[2] está sin hacer**. Por eso:
- El servidor `185.158.133.1` recibe la petición pero **no sabe que `crm.valoracasa.es` pertenece a este proyecto** → devuelve nada / error / cert inválido.
- HTTPS falla porque **no se ha emitido certificado SSL** para ese host.

## Cómo solucionarlo (acción manual, no es código)

1. Abre **Project Settings → Domains** en Lovable (lo hace el super admin del proyecto, tú).
2. Pulsa **Connect Domain** → escribe `crm.valoracasa.es` (sin `https://`, sin `/`).
3. Lovable detectará que el A record ya apunta correctamente y pasará a estado **Verifying → Setting up → Active**. Tarda entre 5 min y 1h normalmente.
4. Cuando aparezca **Active**, abre `https://crm.valoracasa.es` → cargará el CRM y `TenantContext` lo resolverá automáticamente al tenant **Valoracasa Huelin**.

## Verificaciones rápidas mientras tanto

- **DNS propagado**: `dig crm.valoracasa.es +short` debe devolver `185.158.133.1`. Si devuelve otra IP, el cliente tiene un registro antiguo en conflicto y hay que borrarlo.
- **Sin Cloudflare proxy**: si el cliente usa Cloudflare con la nube naranja, hay que ponerla en gris (DNS only) o, en el paso 2, marcar la casilla "Domain uses Cloudflare or a similar proxy" en el diálogo de Lovable.
- **CAA records**: si el dominio tiene registros CAA, deben permitir `letsencrypt.org`, si no el SSL fallará.

## Qué NO hay que tocar en código

El flag `domain_verified = true` que ves en el CRM es correcto y suficiente por nuestro lado. El `TenantContext` ya hace `get_tenant_by_domain(hostname)` como prioridad 0 y carga el tenant correcto en cuanto Lovable enrute el dominio. **No hace falta cambiar nada en el repositorio**, solo el paso 2 en Project Settings.

## Si después de "Active" sigue sin verse nada

Entonces sí miramos código:
- Revisar logs de la edge function en producción.
- Revisar que `resolveDomainTenant()` no quede cacheado con `null` de un intento previo (el `cached` module-level se reinicia con un hard reload).
- Confirmar que el tenant Valoracasa Huelin tiene `is_active = true` y `deleted_at IS NULL`.

Pero el 99% de los casos se arregla con el **paso 2**.
