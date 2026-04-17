"use client";

import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { Bike, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import type { OrderStatus } from "@/lib/orders/status";

import type { AdminOrder } from "@/lib/admin/orders-query";

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Confirmar",
  confirmed: "Preparar",
  preparing: "Marcar listo",
  ready: "En camino",
  on_the_way: "Entregar",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "on_the_way",
  on_the_way: "delivered",
};

export function OrderCard({
  order,
  slug,
  timezone,
  onAdvance,
  isNew = false,
}: {
  order: AdminOrder;
  slug: string;
  timezone: string;
  onAdvance: (order: AdminOrder, next: OrderStatus) => void;
  isNew?: boolean;
}) {
  // For pickup orders, skip the on_the_way step.
  const nextForDelivery =
    order.delivery_type === "pickup" && order.status === "ready"
      ? "delivered"
      : NEXT_STATUS[order.status];

  const advanceLabel =
    order.delivery_type === "pickup" && order.status === "ready"
      ? "Entregar"
      : NEXT_LABEL[order.status];

  const shown = order.items.slice(0, 3);
  const rest = order.items.length - shown.length;

  return (
    <article
      className={[
        "bg-card grid gap-2 rounded-lg p-3 shadow-[0_1px_3px_rgba(19,27,46,0.04)]",
        isNew ? "animate-[fadeIn_0.3s_ease-out]" : "",
      ].join(" ")}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-lg font-extrabold">
              #{order.order_number}
            </span>
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wider"
            >
              {order.delivery_type === "delivery" ? (
                <Bike className="size-3" />
              ) : (
                <ShoppingBag className="size-3" />
              )}
              {order.delivery_type === "delivery" ? "Delivery" : "Retiro"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {formatInTimeZone(order.created_at, timezone, "HH:mm")}
          </p>
        </div>
        <Link
          href={`/${slug}/admin/pedidos/${order.id}`}
          className="text-primary text-xs font-medium underline-offset-2 hover:underline"
        >
          Ver
        </Link>
      </header>

      <div>
        <p className="text-sm font-medium">{order.customer_name}</p>
        <a
          href={`tel:${order.customer_phone}`}
          className="text-muted-foreground text-xs"
        >
          {order.customer_phone}
        </a>
      </div>

      <ul className="text-sm">
        {shown.map((it, i) => (
          <li key={i} className="text-muted-foreground truncate">
            {it.quantity}× {it.product_name}
          </li>
        ))}
        {rest > 0 && (
          <li className="text-muted-foreground text-xs italic">
            y {rest} más
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between pt-1">
        <span className="font-bold">{formatCurrency(order.total_cents)}</span>
        {advanceLabel && nextForDelivery && (
          <Button
            size="sm"
            onClick={() => onAdvance(order, nextForDelivery)}
          >
            {advanceLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
