# Flujo de Pedidos

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/orders/, src/app/[business_slug]/(public)/, src/components/

## Flujo completo del cliente (web)

```
1. /[slug]/menu
   └─ Navega el catálogo, selecciona productos y modificadores
   └─ Items se agregan al carrito (Zustand + localStorage)

2. /[slug]/cart (o /carrito — legacy)
   └─ Revisa el carrito: items, cantidades, subtotal
   └─ Puede modificar o vaciar

3. /[slug]/checkout
   └─ Completa: nombre, teléfono, email
   └─ Elige: delivery (con dirección) o pickup en local
   └─ Ve: subtotal + costo de delivery = total
   └─ Elige método de pago: efectivo o Mercado Pago
   └─ Confirma el pedido

4. /[slug]/confirmacion
   └─ Ve número de orden y resumen
   └─ Si eligió MP: redirige a Mercado Pago para pagar
   └─ Puede seguir estado desde /[slug]/perfil
```

## Creación de la orden (backend)

Al confirmar checkout, se ejecuta una Server Action en `src/lib/orders/`:

1. Verifica que el negocio esté abierto (business_hours)
2. Recalcula el total server-side (no confía en el total del cliente)
3. Genera `order_number` usando advisory lock de PostgreSQL (evita duplicados)
4. Inserta en `orders`, `order_items`, `order_item_modifiers`
5. Registra el primer estado en `order_status_history` (`pending`)
6. Si el método es Mercado Pago: crea preferencia de pago y retorna el link
7. Vacía el carrito del cliente (Zustand)

## Estado de una orden

```
PENDING
  │
  ▼ (admin confirma)
CONFIRMED
  │
  ▼ (admin prepara)
PREPARING
  │
  ▼ (admin marca listo)
READY
  │
  ├─ (delivery) ──▶ ON_THE_WAY ──▶ DELIVERED
  │
  └─ (pickup)  ──▶ DELIVERED
  
CANCELLED  ◀── desde cualquier estado
```

Cada cambio de estado se registra en `order_status_history` con timestamp y quién lo cambió.

## Carrito (client-side)

El carrito vive en **Zustand** con persistencia en `localStorage`:

```typescript
// src/stores/cart.ts
{
  items: CartItem[]   // productos + modificadores seleccionados
  businessSlug: string
  addItem(item)
  removeItem(itemId)
  updateQuantity(itemId, qty)
  clearCart()
}
```

El carrito es **por negocio** — si el cliente cambia de negocio, el carrito del anterior se descarta.

Soporta tanto **productos regulares** como **menús del día** (combos).

## Delivery vs Pickup

En checkout el cliente elige:
- **Delivery:** ingresa dirección completa → se calcula el costo de envío según zonas
- **Pickup:** retiro en el local → sin costo de envío

La dirección se guarda como snapshot en `orders.delivery_address` (jsonb).

Si el cliente está logueado, puede seleccionar una dirección guardada desde `customer_addresses`.

## Cálculo del total

```
subtotal = Σ (precio_producto × cantidad) + Σ price_deltas de modificadores
delivery_fee = según zona de delivery (o 0 si pickup)
total = subtotal + delivery_fee
```

El servidor **recalcula todo** en el momento de confirmar. El cliente no puede alterar los precios.

## Pago con Mercado Pago

Si el cliente elige Mercado Pago:
1. Al confirmar la orden, el backend crea una **preferencia** en la API de MP con las credenciales del negocio
2. El cliente es redirigido a la checkout de MP
3. Después del pago, MP llama al **webhook** `/api/mp/webhook`
4. El webhook verifica la firma HMAC y actualiza `orders.payment_status` a `paid` / `failed`

Ver más detalles en [Pagos Mercado Pago](pagos.md).

## Board de pedidos en tiempo real (admin)

`/[slug]/admin/pedidos` muestra el board de pedidos del día:
- Columnas por estado (pendiente, confirmado, preparando, listo, en camino)
- Actualización en **tiempo real** vía Supabase Realtime subscriptions
- El admin puede cambiar estados con un click
- Puede cancelar un pedido con una razón

Componente: `src/components/admin/orders-realtime-board.tsx`

## Historial de pedidos del cliente

En `/[slug]/perfil` el cliente logueado puede ver:
- Órdenes activas (pendiente → en camino)
- Historial de órdenes pasadas
- Detalle de cada orden (items, total, estado)

## Ver también

- [Pagos Mercado Pago](pagos.md)
- [Catálogo](catalogo.md)
- [Menús del Día](menus-del-dia.md)
- [Base de Datos — Pedidos](../arquitectura/base-de-datos.md)
- [Orden (dominio)](../dominio/orden.md)
- [Cliente (dominio)](../dominio/cliente.md)
