"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Settings2, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateReservationStatus } from "@/lib/reservations/booking-actions";
import type { Reservation, ReservationStatus } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

type Row = Reservation & { tables: { label: string } | null };

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: "Confirmada",
  seated: "En mesa",
  completed: "Completada",
  no_show: "No vino",
  cancelled: "Cancelada",
};

const STATUS_TONE: Record<ReservationStatus, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  seated: "bg-emerald-100 text-emerald-700",
  completed: "bg-zinc-100 text-zinc-600",
  no_show: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export function AdminDayList({
  slug,
  date,
  rows,
  timezone,
}: {
  slug: string;
  date: string;
  rows: Row[];
  timezone: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  function setDate(next: string) {
    const params = new URLSearchParams(searchParams);
    params.set("date", next);
    router.push(`/${slug}/admin/reservas?${params.toString()}`);
  }

  function changeStatus(id: string, status: ReservationStatus) {
    start(async () => {
      const result = await updateReservationStatus({
        business_slug: slug,
        id,
        status,
      });
      if (result.ok) {
        toast.success("Estado actualizado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
        <span className="text-sm text-muted-foreground">
          {rows.length} reserva{rows.length === 1 ? "" : "s"}
        </span>
        <div className="ms-auto flex flex-wrap gap-2">
          <Link
            href={`/${slug}/admin/reservas/plano`}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            <Square className="size-3.5" /> Plano
          </Link>
          <Link
            href={`/${slug}/admin/reservas/configuracion`}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
          >
            <Settings2 className="size-3.5" /> Configuración
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          No hay reservas para esta fecha.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span className="w-12 font-mono text-sm">
                {formatInTimeZone(new Date(r.starts_at), timezone, "HH:mm")}
              </span>
              <span className="min-w-[10rem] flex-1">
                <span className="font-medium">{r.customer_name}</span>
                <span className="ms-2 text-sm text-muted-foreground">
                  {r.party_size}p
                  {r.tables ? ` · ${r.tables.label}` : ""}
                </span>
                {r.notes ? (
                  <span className="ms-2 text-xs text-muted-foreground">— {r.notes}</span>
                ) : null}
              </span>
              <span className="text-sm text-muted-foreground">
                <a href={`tel:${r.customer_phone}`} className="hover:underline">
                  {r.customer_phone}
                </a>
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  STATUS_TONE[r.status],
                )}
              >
                {STATUS_LABEL[r.status]}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {r.status === "confirmed" ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => changeStatus(r.id, "seated")}
                    disabled={pending}
                  >
                    Sentar
                  </Button>
                ) : null}
                {r.status === "seated" ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => changeStatus(r.id, "completed")}
                    disabled={pending}
                  >
                    Completar
                  </Button>
                ) : null}
                {r.status === "confirmed" ? (
                  <>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => changeStatus(r.id, "no_show")}
                      disabled={pending}
                    >
                      No vino
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() => changeStatus(r.id, "cancelled")}
                      disabled={pending}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
