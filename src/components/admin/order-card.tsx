"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import {
  Bike,
  CircleDollarSign,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency";
import type { OrderStatus } from "@/lib/orders/status";
import { updateOrderStatus } from "@/lib/orders/update-status";

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
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  // For pickup orders, skip the on_the_way step.
  const nextForDelivery =
    order.delivery_type === "pickup" && order.status === "ready"
      ? "delivered"
      : NEXT_STATUS[order.status];

  const advanceLabel =
    order.delivery_type === "pickup" && order.status === "ready"
      ? "Entregar"
      : NEXT_LABEL[order.status];

  const isTerminal =
    order.status === "delivered" || order.status === "cancelled";

  const handleCancel = () => {
    if (!reason.trim()) {
      toast.error("Ingresá un motivo.");
      return;
    }
    startTransition(async () => {
      const result = await updateOrderStatus({
        order_id: order.id,
        business_slug: slug,
        next_status: "cancelled",
        cancelled_reason: reason.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Pedido cancelado.");
      setCancelOpen(false);
      setReason("");
      router.refresh();
    });
  };

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
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
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
            <PaymentBadge
              method={order.payment_method}
              status={order.payment_status}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {formatInTimeZone(order.created_at, timezone, "HH:mm")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <Link
            href={`/${slug}/admin/pedidos/${order.id}`}
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            Ver
          </Link>
          {!isTerminal && (
            <>
              <span className="text-muted-foreground/60" aria-hidden>
                ·
              </span>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="text-rose-700 font-medium underline-offset-2 hover:underline"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
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
          <Button size="sm" onClick={() => onAdvance(order, nextForDelivery)}>
            {advanceLabel}
          </Button>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cancelar pedido #{order.order_number}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`cancel-reason-${order.id}`}>Motivo</Label>
            <Textarea
              id={`cancel-reason-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Sin stock, zona fuera de cobertura, etc."
              maxLength={500}
              rows={3}
            />
            <p className="text-muted-foreground text-xs">
              El cliente ve este motivo en el tracker del pedido.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={pending}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={pending}
            >
              {pending ? "Cancelando…" : "Cancelar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function PaymentBadge({
  method,
  status,
}: {
  method: string | null | undefined;
  status: string | null | undefined;
}) {
  if (!method || method !== "mp") return null;

  const styles: Record<string, { bg: string; text: string; label: string }> = {
    paid: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Pagado",
    },
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "Pago pendiente",
    },
    failed: {
      bg: "bg-rose-100",
      text: "text-rose-800",
      label: "Pago rechazado",
    },
    refunded: {
      bg: "bg-zinc-200",
      text: "text-zinc-700",
      label: "Reembolsado",
    },
  };
  const style = styles[status ?? "pending"] ?? styles.pending;

  return (
    <Badge
      variant="secondary"
      className={`flex items-center gap-1 border-transparent text-[0.65rem] uppercase tracking-wider ${style.bg} ${style.text}`}
    >
      {status === "paid" ? (
        <CircleDollarSign className="size-3" />
      ) : (
        <CreditCard className="size-3" />
      )}
      MP · {style.label}
    </Badge>
  );
}
