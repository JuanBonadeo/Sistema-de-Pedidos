import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

export default async function ConfirmacionPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = createSupabaseServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, total_cents, subtotal_cents, delivery_fee_cents, delivery_type, created_at, order_items(product_name, quantity, subtotal_cents, order_item_modifiers(modifier_name))",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!order) notFound();

  return (
    <main className="bg-background mx-auto min-h-screen max-w-md px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-2xl font-extrabold">¡Pedido recibido!</h1>
        <p className="text-muted-foreground">
          Tu número de pedido es
        </p>
        <p className="text-primary text-4xl font-black">
          #{order.order_number}
        </p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Te contactamos por teléfono si hace falta. Método de pago: efectivo al
          recibir.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="font-bold">Tu pedido</h2>
        <ul className="mt-3 grid gap-3">
          {order.order_items.map((item) => (
            <li key={item.product_name} className="bg-card rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">
                  {item.quantity}× {item.product_name}
                </span>
                <span className="font-semibold">
                  {formatCurrency(item.subtotal_cents)}
                </span>
              </div>
              {item.order_item_modifiers.length > 0 && (
                <p className="text-muted-foreground mt-0.5 text-xs tracking-wider">
                  {item.order_item_modifiers
                    .map((m) => m.modifier_name.toUpperCase())
                    .join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <dl className="bg-card mt-4 grid gap-2 rounded-xl p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium">{formatCurrency(order.subtotal_cents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {order.delivery_type === "delivery" ? "Envío" : "Retiro"}
          </dt>
          <dd className="font-medium">
            {formatCurrency(order.delivery_fee_cents)}
          </dd>
        </div>
        <div className="mt-1 flex justify-between border-t pt-3">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="text-base font-bold">
            {formatCurrency(order.total_cents)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 text-center">
        <Link
          href={`/${business_slug}/menu`}
          className={buttonVariants({ size: "lg" })}
        >
          Volver al menú
        </Link>
      </div>
    </main>
  );
}
