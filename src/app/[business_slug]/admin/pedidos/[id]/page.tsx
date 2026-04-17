import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { Badge } from "@/components/ui/badge";
import { getOrderDetail } from "@/lib/admin/orders-query";
import { formatCurrency } from "@/lib/currency";
import type { OrderStatus } from "@/lib/orders/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${business_slug}/admin/login`);

  const order = await getOrderDetail(id);
  if (!order) notFound();

  const tz = business.timezone;
  const status = order.status as OrderStatus;
  const history = (order.order_status_history ?? []).toSorted(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <div className="bg-background min-h-screen">
      <AdminNav
        slug={business_slug}
        businessName={business.name}
        userEmail={user.email ?? ""}
        userName={
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined)
        }
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href={`/${business_slug}/admin`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" />
          Volver
        </Link>

        <header className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">
              #{order.order_number}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatInTimeZone(order.created_at, tz, "dd/MM/yyyy HH:mm")}
            </p>
          </div>
          <Badge variant="secondary" className="uppercase tracking-wide">
            {STATUS_LABEL[status]}
          </Badge>
        </header>

        <section className="bg-card mt-6 grid gap-2 rounded-xl p-4">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Cliente
          </h2>
          <p className="font-medium">{order.customer_name}</p>
          <a
            href={`tel:${order.customer_phone}`}
            className="text-primary text-sm underline-offset-2 hover:underline"
          >
            {order.customer_phone}
          </a>
        </section>

        {order.delivery_type === "delivery" && (
          <section className="bg-card mt-4 grid gap-1 rounded-xl p-4">
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Delivery
            </h2>
            <p className="text-sm">{order.delivery_address}</p>
            {order.delivery_zone && (
              <p className="text-muted-foreground text-xs">
                Zona: {order.delivery_zone.name}
              </p>
            )}
            {order.delivery_notes && (
              <p className="text-muted-foreground mt-1 text-xs italic">
                &quot;{order.delivery_notes}&quot;
              </p>
            )}
          </section>
        )}

        <section className="bg-card mt-4 grid gap-3 rounded-xl p-4">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Ítems
          </h2>
          <ul className="grid gap-3">
            {order.order_items.map((item) => (
              <li key={item.id} className="grid gap-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">
                    {item.quantity}× {item.product_name}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.subtotal_cents)}
                  </span>
                </div>
                {item.order_item_modifiers.length > 0 && (
                  <p className="text-muted-foreground text-xs tracking-wider">
                    {item.order_item_modifiers
                      .map((m) => m.modifier_name.toUpperCase())
                      .join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-muted-foreground text-xs italic">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </li>
            ))}
          </ul>
          <dl className="border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatCurrency(order.subtotal_cents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {order.delivery_type === "delivery" ? "Envío" : "Retiro"}
              </dt>
              <dd>{formatCurrency(order.delivery_fee_cents)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t pt-2 font-bold">
              <dt>Total</dt>
              <dd>{formatCurrency(order.total_cents)}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-card mt-4 grid gap-2 rounded-xl p-4">
          <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Línea de tiempo
          </h2>
          <ol className="grid gap-2 text-sm">
            {history.map((h, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {formatInTimeZone(h.created_at, tz, "HH:mm")}
                </span>
                <span>
                  {STATUS_LABEL[h.status as OrderStatus] ?? h.status}
                  {h.notes && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {h.notes}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {order.cancelled_reason && (
          <div className="bg-destructive/10 text-destructive mt-4 rounded-lg p-3 text-sm">
            <span className="font-semibold">Cancelado:</span>{" "}
            {order.cancelled_reason}
          </div>
        )}

        <div className="mt-6">
          <OrderDetailActions
            orderId={order.id}
            slug={business_slug}
            status={status}
            deliveryType={order.delivery_type as "delivery" | "pickup"}
          />
        </div>
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
