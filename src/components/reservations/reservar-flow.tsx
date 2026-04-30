"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchAvailability } from "@/lib/reservations/availability-actions";
import { createReservationFromCustomer } from "@/lib/reservations/booking-actions";
import type { ReservationSettings } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

type Slot = { slot: string; starts_at: string; ends_at: string };

type Props = {
  slug: string;
  settings: Pick<
    ReservationSettings,
    "advance_days_max" | "max_party_size" | "slot_duration_min" | "schedule"
  >;
  user: {
    isLoggedIn: boolean;
    name: string | null;
    phone: string | null;
  };
};

function todayInTz(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function maxDate(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export function ReservarFlow({ slug, settings, user }: Props) {
  const router = useRouter();
  const [date, setDate] = useState<string>(todayInTz());
  const [partySize, setPartySize] = useState<number>(2);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, startSlotsTransition] = useTransition();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, startSubmit] = useTransition();

  const minDate = todayInTz();
  const maxDateStr = useMemo(() => maxDate(settings.advance_days_max), [settings.advance_days_max]);

  useEffect(() => {
    setSelectedSlot(null);
    setSlots(null);
  }, [date, partySize]);

  function loadSlots() {
    startSlotsTransition(async () => {
      const result = await fetchAvailability({
        business_slug: slug,
        date,
        party_size: partySize,
      });
      if (result.ok) {
        setSlots(result.data);
      } else {
        toast.error(result.error);
        setSlots([]);
      }
    });
  }

  function onConfirm() {
    if (!selectedSlot) return;

    if (!user.isLoggedIn) {
      const next = encodeURIComponent(
        `/${slug}/reservar?date=${date}&party=${partySize}&slot=${selectedSlot.slot}`,
      );
      router.push(`/${slug}/login?next=${next}`);
      return;
    }

    if (!name.trim() || !phone.trim()) {
      toast.error("Necesitamos nombre y teléfono.");
      return;
    }

    startSubmit(async () => {
      const result = await createReservationFromCustomer({
        business_slug: slug,
        date,
        slot: selectedSlot.slot,
        party_size: partySize,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        notes,
      });
      if (result.ok) {
        router.push(`/${slug}/reservar/confirmacion?id=${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="size-4" /> Fecha y comensales
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="r-date">Fecha</Label>
            <Input
              id="r-date"
              type="date"
              min={minDate}
              max={maxDateStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-party">Comensales</Label>
            <Input
              id="r-party"
              type="number"
              min={1}
              max={settings.max_party_size}
              value={partySize}
              onChange={(e) =>
                setPartySize(Math.max(1, Math.min(settings.max_party_size, Number(e.target.value) || 1)))
              }
            />
          </div>
        </div>
        <Button type="button" onClick={loadSlots} disabled={loadingSlots}>
          <Users className="size-4" />
          {loadingSlots ? "Buscando…" : "Ver horarios"}
        </Button>
      </section>

      {slots !== null ? (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="size-4" /> Elegí un horario
          </h2>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quedan lugares para ese día. Probá otra fecha o achicá el grupo.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.slot}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition",
                    selectedSlot?.slot === s.slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {s.slot}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {selectedSlot ? (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Tus datos</h2>
          {user.isLoggedIn ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="r-name">Nombre</Label>
                  <Input
                    id="r-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-phone">Teléfono</Label>
                  <Input
                    id="r-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-notes">Notas (opcional)</Label>
                <Textarea
                  id="r-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Cumpleaños, alergias, preferencia de mesa…"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Iniciá sesión para confirmar la reserva. Vamos a guardar tus datos para
              que el local pueda contactarte.
            </p>
          )}
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            {user.isLoggedIn ? "Confirmar reserva" : "Iniciar sesión y reservar"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
