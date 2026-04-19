import "server-only";

import { fetchPayment } from "@/lib/payments/mercadopago";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Fetches a payment from MP using the business's access token and updates
 * the matching order's payment_status (and status if it advances).
 *
 * Used by:
 *  - /api/mp/webhook (when MP notifies us)
 *  - /confirmacion/[id]?payment_id=X (when the user redirects back from MP)
 *
 * Idempotent: safe to call multiple times with the same paymentId.
 */
export async function reconcileMpPayment(args: {
  orderId: string;
  businessId: string;
  paymentId: string;
}): Promise<{ ok: boolean; paymentStatus?: string; reason?: string }> {
  const service = createSupabaseServiceClient();

  const [{ data: business }, { data: order }] = await Promise.all([
    service
      .from("businesses")
      .select("id, mp_access_token")
      .eq("id", args.businessId)
      .maybeSingle(),
    service
      .from("orders")
      .select("id, business_id, status, payment_status, mp_payment_id")
      .eq("id", args.orderId)
      .maybeSingle(),
  ]);

  if (!business?.mp_access_token) {
    return { ok: false, reason: "business_no_mp" };
  }
  if (!order) {
    return { ok: false, reason: "order_not_found" };
  }
  if (order.business_id !== args.businessId) {
    return { ok: false, reason: "business_mismatch" };
  }

  // Fast path: we've already processed this specific payment.
  if (order.mp_payment_id === args.paymentId && order.payment_status !== "pending") {
    return { ok: true, paymentStatus: order.payment_status };
  }

  let payment;
  try {
    payment = await fetchPayment(business.mp_access_token, args.paymentId);
  } catch (err) {
    console.error("reconcileMpPayment fetch failed", err);
    return { ok: false, reason: "mp_fetch_failed" };
  }

  if (payment.externalReference !== order.id) {
    return { ok: false, reason: "external_reference_mismatch" };
  }

  const nextPaymentStatus =
    payment.status === "approved"
      ? "paid"
      : payment.status === "rejected" || payment.status === "cancelled"
        ? "failed"
        : payment.status === "refunded" || payment.status === "charged_back"
          ? "refunded"
          : "pending";

  // Note: we intentionally do NOT auto-advance `status` from pending to
  // confirmed when the payment clears. Payment verification (MP says "paid")
  // and order acceptance ("admin reviewed + approved") are distinct events.
  // The admin still has to click "Confirmar" in the dashboard to move the
  // order forward. The paid badge on the card gives them the signal.
  const updatePayload: Record<string, unknown> = {
    mp_payment_id: args.paymentId,
    payment_status: nextPaymentStatus,
  };

  // Skip if nothing changed.
  if (
    order.payment_status === nextPaymentStatus &&
    order.mp_payment_id === args.paymentId
  ) {
    return { ok: true, paymentStatus: nextPaymentStatus };
  }

  const { error } = await service
    .from("orders")
    .update(updatePayload)
    .eq("id", order.id);
  if (error) {
    console.error("reconcileMpPayment update failed", error);
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true, paymentStatus: nextPaymentStatus };
}
