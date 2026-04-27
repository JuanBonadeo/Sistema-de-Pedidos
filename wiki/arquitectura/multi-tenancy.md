# Multi-Tenancy

> **Última actualización:** 2026-04-27
> **Fuentes:** src/middleware.ts, src/lib/tenant.ts, supabase/migrations/

## Modelo de aislamiento

**Un tenant = un negocio** identificado por su `slug` único (ej: `pizzanapoli`).

El aislamiento tiene tres capas:

```
1. URL / Routing     →  /[business_slug]/...
2. Middleware        →  verifica acceso antes de cada request
3. RLS (PostgreSQL)  →  cada tabla filtra por business_id automáticamente
```

## Capa 1: Routing por slug

Todas las rutas del tenant viven bajo `src/app/[business_slug]/`:

```
/pizzanapoli/menu              → menú del cliente
/pizzanapoli/cart              → carrito
/pizzanapoli/checkout          → checkout
/pizzanapoli/admin/pedidos     → panel admin
/pizzanapoli/admin/catalogo    → gestión de catálogo
```

El `slug` se extrae del path en cada Server Component/Action vía `params.business_slug`.

## Capa 2: Middleware

`src/middleware.ts` actúa como gateway:
- Para rutas admin: verifica auth + pertenencia al negocio
- Para rutas públicas: solo resuelve el tenant (no bloquea)

En producción también soporta **subdominio routing**:
```
pizzanapoli.pedidos.com.ar  →  rewrite a  /pizzanapoli/...
```
Esto permite que cada negocio tenga su propia URL "branded" sin cambiar el código de rutas.

## Capa 3: RLS en PostgreSQL

Todas las tablas tienen política RLS que filtra `business_id = auth.uid()` (o vía `business_users`). Ejemplo conceptual:

```sql
-- Solo ver órdenes de mi negocio
CREATE POLICY "orders_business_isolation" ON orders
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM business_users
      WHERE user_id = auth.uid()
    )
  );
```

Incluso si una query olvidara filtrar por `business_id`, la RLS lo hace automáticamente a nivel de base de datos.

## Resolución del tenant: `getTenant()`

`src/lib/tenant.ts` exporta la función `getTenant(slug)`:

```typescript
const business = await getTenant(slug);
// → retorna el registro de `businesses` para ese slug
// → lanza 404 si no existe
```

Se llama en layouts y server components que necesitan datos del negocio.

## Credenciales por tenant

Cada negocio tiene sus **propias credenciales de Mercado Pago** almacenadas en `businesses.mp_access_token` y `businesses.mp_webhook_secret`. Nunca hay una credencial global de MP — cada pago se procesa con las credenciales del negocio correspondiente.

## Datos demo: Pizza Napoli

En `local-data.sql` hay un negocio de demo preconfigurado con slug `pizzanapoli`, con productos, categorías, y un menú del día de ejemplo. Es el tenant de referencia para desarrollo local.

## Ver también

- [Autenticación](autenticacion.md)
- [Base de Datos](base-de-datos.md)
- [Negocio](../dominio/negocio.md)
- [Pagos Mercado Pago](../features/pagos.md)
