"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
    <Button type="button" variant="destructive" onClick={onClick} disabled={pending}>
      Cancelar reserva
    </Button>
  );
}
