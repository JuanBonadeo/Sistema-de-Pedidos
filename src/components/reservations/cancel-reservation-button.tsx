"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelOwnReservation } from "@/lib/reservations/booking-actions";

export function CancelReservationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function onClick() {
    if (!confirm("¿Cancelar la reserva?")) return;
    start(async () => {
      const result = await cancelOwnReservation({ id });
      if (result.ok) {
        toast.success("Reserva cancelada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{
        height: 44,
        padding: "0 18px",
        borderRadius: 12,
        background: "var(--bg)",
        color: "var(--ink-2)",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: -0.1,
        border: "1px solid var(--hairline-2)",
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.6 : 1,
        fontFamily: "inherit",
      }}
    >
      {pending ? "Cancelando…" : "Cancelar reserva"}
    </button>
  );
}
