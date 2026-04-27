# Pagos — Mercado Pago

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/payments/, src/app/api/mp/webhook/

## Proveedor

**Mercado Pago** — plataforma de pagos líder en LATAM (Argentina, Brasil, México, etc.). Es la única integración de pago actualmente.

## Métodos de pago disponibles para el cliente

| Método | Descripción |
|---|---|
| **Efectivo** | Pago al recibir el pedido. No requiere integración. |
| **Mercado Pago** | Pago online: tarjeta, MP Wallet, QR, cuotas. |

## Credenciales por negocio

Cada negocio tiene sus **propias credenciales de Mercado Pago** almacenadas en la tabla `businesses`:

```
businesses.mp_access_token   → clave de acceso a la API de MP
businesses.mp_webhook_secret → secreto para verificar webhooks
```

El admin las configura desde `/[slug]/admin/configuracion`.

Esto significa que los pagos van directamente a la cuenta de MP del negocio, no a una cuenta central de la plataforma.

## Flujo de pago

```
1. Cliente elige "Mercado Pago" en checkout
   │
2. Al confirmar, backend crea una "preferencia de pago" en la API de MP
   └─ POST /checkout/preferences en MP API
   └─ Incluye: items, monto total, URLs de retorno
   │
3. Backend retorna el init_point (URL de checkout de MP)
   │
4. Cliente es redirigido a la página de pago de Mercado Pago
   └─ Completa el pago (tarjeta, wallet, etc.)
   │
5. MP redirige al cliente de vuelta a /[slug]/confirmacion
   │
6. MP llama al webhook asíncrono: POST /api/mp/webhook
   │
7. Webhook actualiza orders.payment_status
```

## Webhook (`/api/mp/webhook`)

### Seguridad
Cada request del webhook se verifica con **HMAC-SHA256**:
- El secret está en `businesses.mp_webhook_secret`
- Si la firma no coincide, se rechaza con 401

### Procesamiento
1. Recibe el evento de MP (ej: `payment.updated`)
2. Busca la orden correspondiente por `mp_payment_id`
3. Actualiza `orders.payment_status`:
   - Pago aprobado → `paid`
   - Pago rechazado → `failed`
   - Pago reembolsado → `refunded`
4. Es **idempotente** — si llega el mismo evento dos veces, no duplica actualizaciones

### Estados de pago en la orden

```
pending  → estado inicial (antes de que MP confirme)
paid     → pago aprobado por MP
failed   → pago rechazado
refunded → pago reembolsado
```

El `payment_status` es independiente del `status` de la orden (que es el estado de preparación).

## Consideraciones importantes

**Sin comisión de plataforma:** Los pagos van directo a la cuenta del negocio. La plataforma Sistema de Pedidos no cobra comisión por transacción (modelo SaaS).

**Sandbox:** Para desarrollo, MP tiene un entorno sandbox con tarjetas de prueba. Las credenciales del negocio demo apuntan al sandbox.

**Moneda:** Se usa la moneda configurada en `businesses.currency` (por defecto `ARS`).

**Cuotas:** Mercado Pago maneja automáticamente las cuotas sin configuración adicional.

## Gaps y mejoras posibles

- Actualmente no hay soporte para **reembolsos** iniciados desde el admin
- No hay integración con **Mercado Pago Point** (cobros presenciales)
- No hay soporte para **otros gateways** (Stripe, PayPal, etc.) — solo MP

## Ver también

- [Flujo de Pedidos](pedidos.md)
- [Negocio](../dominio/negocio.md)
- [Base de Datos — Pedidos](../arquitectura/base-de-datos.md)
- [Multi-Tenancy](../arquitectura/multi-tenancy.md)
