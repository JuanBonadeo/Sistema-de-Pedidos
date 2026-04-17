import { formatCurrency } from "@/lib/currency";

export function CartSummary({
  subtotalCents,
  deliveryFeeCents,
  deliveryFeeLabel,
  totalCents,
}: {
  subtotalCents: number;
  deliveryFeeCents: number | null;
  deliveryFeeLabel?: string;
  totalCents: number;
}) {
  return (
    <dl className="bg-card grid gap-2 rounded-xl p-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="font-medium">{formatCurrency(subtotalCents)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Envío</dt>
        <dd className="font-medium">
          {deliveryFeeCents === null
            ? (deliveryFeeLabel ?? "—")
            : formatCurrency(deliveryFeeCents)}
        </dd>
      </div>
      <div className="mt-1 flex justify-between border-t pt-3">
        <dt className="text-base font-semibold">Total</dt>
        <dd className="text-base font-bold">{formatCurrency(totalCents)}</dd>
      </div>
    </dl>
  );
}
