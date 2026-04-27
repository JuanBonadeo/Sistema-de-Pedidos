# Orden (Order)

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/orders/, supabase/migrations/

## Qué es

Una `Order` representa un pedido completo de un cliente a un negocio. Incluye los items, el total, el método de pago, el estado de preparación, y el estado de pago.

## Campos clave

```
id               UUID interno
order_number     Número secuencial por negocio (1, 2, 3...) — mostrado al cliente
business_id      A qué negocio pertenece
customer_id      Cliente (nullable — puede haber pedidos como guest)
status           Estado de preparación (ver ciclo de vida)
payment_method   cash | mercadopago
payment_status   Estado del pago (ver abajo)
delivery_type    delivery | pickup
delivery_address Snapshot de la dirección (jsonb)
subtotal         Suma de items sin delivery
delivery_fee     Costo de delivery (0 si pickup)
total            subtotal + delivery_fee
notes            Notas del cliente
mp_payment_id    ID del pago en Mercado Pago (si aplica)
created_at       Timestamp de creación
```

## Ciclo de vida (status)

```
┌─────────────┐
│   PENDING   │ ← orden recién creada
└──────┬──────┘
       │ admin confirma
┌──────▼──────┐
│  CONFIRMED  │
└──────┬──────┘
       │ cocina empieza
┌──────▼──────┐
│  PREPARING  │
└──────┬──────┘
       │ listo para retiro/envío
┌──────▼──────┐
│    READY    │
└──────┬──────┘
       │
   ┌───┴──────────────────┐
   │ delivery              │ pickup
┌──▼──────────┐       ┌──▼────────┐
│  ON_THE_WAY │       │ DELIVERED │
└──────┬──────┘       └───────────┘
       │
┌──────▼──────┐
│  DELIVERED  │
└─────────────┘

CANCELLED ← desde cualquier estado
```

Cada transición se registra en `order_status_history` con:
- `status` nuevo
- `changed_by` (admin que hizo el cambio, nullable)
- `notes` (requerido si es CANCELLED — razón de cancelación)
- `created_at`

## Estados de pago (payment_status)

```
pending  → inicial, esperando confirmación de MP (o siempre si es efectivo)
paid     → MP confirmó el pago
failed   → MP rechazó el pago
refunded → pago reembolsado
```

El `payment_status` es independiente del `status` de preparación.

## Items de la orden

```
order_items
└── id, order_id, product_id (nullable), name (snapshot), price (snapshot), quantity, subtotal
    └── order_item_modifiers
        └── id, order_item_id, modifier_id (nullable), name (snapshot), price_delta (snapshot)
```

**Snapshots importantes:** El `name` y `price` del producto se capturan en el momento del pedido. Si el admin actualiza el precio después, los pedidos históricos mantienen el precio original. Lo mismo para los modificadores.

## Número de orden

El `order_number` es un número entero secuencial **por negocio** (no global). La primera orden del negocio A es #1, la primera del negocio B también es #1.

Se genera usando `pg_advisory_lock` para garantizar unicidad bajo alta concurrencia sin usar `SERIAL` (que podría saltar números).

## Guest orders

Un cliente puede hacer un pedido sin estar registrado (`customer_id = null`). En ese caso:
- El nombre, teléfono y email se capturan en el checkout y se guardan en la orden
- El cliente no puede ver el historial de órdenes anteriores (solo la actual por link)

## Ver también

- [Flujo de Pedidos](../features/pedidos.md)
- [Pagos Mercado Pago](../features/pagos.md)
- [Dashboard Admin](../features/dashboard-admin.md)
- [Base de Datos](../arquitectura/base-de-datos.md)
- [Cliente](cliente.md)
