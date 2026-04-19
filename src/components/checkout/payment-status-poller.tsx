"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refreshes the current route every 3s while the MP payment is still
 * pending, for up to 60s. This covers the gap between the customer landing
 * on /confirmacion (after MP redirect) and our webhook actually firing and
 * updating `payment_status`.
 *
 * Renders nothing — pure side effect.
 */
export function PaymentStatusPoller({
  paymentStatus,
  paymentMethod,
}: {
  paymentStatus: string;
  paymentMethod: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (paymentMethod !== "mp") return;
    if (paymentStatus !== "pending") return;

    const deadline = Date.now() + 60_000;
    const id = setInterval(() => {
      if (Date.now() > deadline) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 3000);

    return () => clearInterval(id);
  }, [paymentStatus, paymentMethod, router]);

  return null;
}
