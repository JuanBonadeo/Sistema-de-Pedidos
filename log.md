
## [2026-04-30] code | Pedidos en vivo: rediseño del kanban

Rediseño visual del kanban de pedidos en vivo ([orders-realtime-board.tsx](code/Sistema-de-Pedidos/src/components/admin/orders-realtime-board.tsx) + [order-card.tsx](code/Sistema-de-Pedidos/src/components/admin/order-card.tsx)). Lógica intacta (suscripción realtime, advance optimista, cancel con motivo).

**Columnas** ahora son contenedores con fondo `muted/30`, ring sutil, y un **accent bar de color** arriba (azul / ámbar / esmeralda / índigo / zinc por estado). Header con título grande + count chip redondeado tonal por columna. Empty state con border dashed y mensaje contextual ("Sin pedidos nuevos", "Cocina libre", etc.) en lugar del `—`.

**OrderCard**:
- Número de pedido en 2xl extrabold + hora más chica al lado (jerarquía clara).
- Channel badge (Delivery/Retiro) como pill tonal con ring (índigo/ámbar) arriba a la derecha.
- Nombre del cliente como `text-base font-semibold`, teléfono como link con icono.
- **Tiempo transcurrido** en vivo con icono Clock — `useElapsedMinutes` actualiza cada 30s. Tono cambia con la espera: muted < 15 min, ámbar 15-30, rosa ≥30.
- Items en bloque `bg-muted/40` con cantidad alineada en columna tabular.
- Total con eyebrow "TOTAL" + monto en bold sobre divider dashed.
- **CTA primario full-width** abajo (antes era pill chico al lado del total).
- "Ver detalle" / "Cancelar" como links secundarios al pie.
- Pedidos nuevos (4s window): ring esmeralda 2px + sombra glow + badge "Nuevo" con Sparkles flotando arriba-izquierda.

**Header de la página**: contador grande con tabular-nums ("12 pedidos en curso") en lugar del `text-sm font-medium`. Description corregida — sacó la mención falsa de "arrastrar entre columnas".

`tsc --noEmit` clean (los errores del seed-golf-jcr-demo son preexistentes y no se tocaron).

## [2026-04-30] code | Pedidos: card minimalista + drawer de detalle

Iteración pedida por Juan: cards seguían cargadas. Solución — clic en cualquier parte de la card abre un **drawer lateral** (sheet `right`, max-w-md) con todo el detalle y todas las acciones, en lugar de navegar a `/pedidos/[id]`.

**Card** ([order-card.tsx](code/Sistema-de-Pedidos/src/components/admin/order-card.tsx)) ahora es solo:
- `#número · 12m` + iconito de canal a la derecha (sin texto, sin dot de pago, sin menú "···").
- Nombre del cliente.
- **Solo el primer ítem** + ` · +N` si hay más (antes mostraba 2-3).
- `$total` + CTA pequeño (h-8) para avanzar al siguiente estado. El CTA hace `stopPropagation` para no abrir el drawer.
- Toda la card es `role=button`, hover con leve `-translate-y-px` + sombra, focus ring para accesibilidad.

**Drawer nuevo** ([order-detail-sheet.tsx](code/Sistema-de-Pedidos/src/components/admin/order-detail-sheet.tsx), client component):
- Fetch on-open al detalle vía Supabase browser client (`order_items`, modificadores, `daily_menu_snapshot`, `delivery_address/notes`, `subtotal/delivery_fee_cents`, `order_status_history`). RLS ya permite admin.
- Header con status pill (dot por estado) + close X.
- Hero: `#N`, hora, "hace X min", nombre cliente. Chips clickables: teléfono (tel:), canal (Delivery/Retiro), pago MP con color por status.
- Sección dirección (solo delivery), ítems con modificadores + componentes de menú del día + notas, breakdown subtotal/envío/total, historial timeline con dots por status, banner de motivo si está cancelado.
- Footer fijo: CTA grande "Avanzar a X" full-width + botón ghost "Cancelar pedido". Clic en cancelar muta el footer a un mini-form con textarea de motivo + Volver/Confirmar (sin abrir un dialog encima de un sheet).
- Avanzar cierra el sheet automáticamente.

Beneficio: la página `/pedidos/[id]` queda solo para deep-link/compartir, pero el flujo diario nunca sale del kanban. Mucho menos ruido visual en las cards.

`tsc --noEmit` clean.

## [2026-04-30] code | Pedidos historial / Catálogo / Clientes: simplificación + drawers

Aplicada la misma lógica del kanban (cards mínimas + drawer para detalle) a tres vistas más del admin.

**Pedidos historial** ([orders-historial-client.tsx](code/Sistema-de-Pedidos/src/components/admin/orders/orders-historial-client.tsx)):
- Tabla de 8 columnas reemplazada por **lista de filas** (`<ul>` con divide-y) limpias: `#número` · nombre cliente · fecha+items · icono canal · pill de estado (sm+) · `$total` · chevron.
- Clic en la fila abre el `OrderDetailSheet` existente (mismo del kanban, reutilizado) en lugar de navegar a `/pedidos/[id]`. Optimistic advance también se refleja en la lista.
- Sacado: filas zebra, columnas Tipo/Items/Pago separadas, link clickable al `#`. Toda la fila es un `<button>`.

**Catálogo** ([product-row.tsx](code/Sistema-de-Pedidos/src/components/admin/catalog/product-row.tsx) + nuevo [product-detail-sheet.tsx](code/Sistema-de-Pedidos/src/components/admin/catalog/product-detail-sheet.tsx)):
- ProductRow ahora es solo: foto 48px (o icono `ImageOff` si `image_url` es null) · nombre + flags inline (`EyeOff` si oculto, pill "Sin stock" si `!is_available && is_active`) · precio · chevron. Sin checkboxes, sin botones edit/delete inline.
- Si no hay foto, **no se muestra el placeholder gris** anterior — se muestra un icono fino dentro de un cuadrado `bg-muted/60` (compromiso entre "no la muestres" y mantener el grid alineado). Si Juan prefiere ocultar el cuadrado entero, fácil swap.
- **ProductDetailSheet** nuevo: side="right", muestra hero con imagen aspect-[4/3] **solo si existe**, nombre + precio grandes, chips de categoría/oculto/sin stock, descripción, sección de toggles (Disponible / Visible) con un `Toggle` inline custom (no había `Switch` en `ui/`), preview de modificadores (grupo + lista joineada), footer con CTA "Editar producto" (Link al form completo) + "Eliminar" en ghost rosa (con dialog de confirmación que respeta soft-delete si tiene pedidos).
- Categoría pasada del CatalogClient para que el chip funcione sin re-fetch.

**Clientes** ([customers-list-client.tsx](code/Sistema-de-Pedidos/src/components/admin/customers/customers-list-client.tsx)):
- Tabla de 7 columnas reemplazada por **lista de filas**: nombre + 1 segmento principal en chip · teléfono y "último DD MMM" en una línea · total gastado + cantidad de pedidos a la derecha (sm+, oculto en mobile) · chevron.
- Sin avatar circular con iniciales (era ruido), sin columnas de ticket promedio / lista de segmentos múltiples (vivían en cada fila). El detalle queda en `/clientes/[id]` (sin drawer — fue pedido explícitamente "drawer solo pedidos").
- Si querés más adelante, agregar fácilmente un drawer-version reutilizando el patrón.

`tsc --noEmit` clean (errores del seed son preexistentes).
