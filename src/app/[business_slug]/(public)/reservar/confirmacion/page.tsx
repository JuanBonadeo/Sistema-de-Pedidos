import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { CheckCircle2 } from "lucide-react";

import { CancelReservationButton } from "@/components/reservations/cancel-reservation-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";
import type { Reservation } from "@/lib/reservations/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function ReservarConfirmacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ business_slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { business_slug } = await params;
  const { id } = await searchParams;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  if (!id) redirect(`/${business_slug}/reservar`);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${business_slug}/login?next=/${business_slug}/reservar/confirmacion?id=${id}`);

  const service = createSupabaseServiceClient() as unknown as SupabaseClient;
  const { data } = await service
    .from("reservations")
    .select("*, tables(label)")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  const reservation = data as (Reservation & { tables: { label: string } | null }) | null;
  if (!reservation || reservation.user_id !== user.id) notFound();

  const tz = business.timezone;
  const dateLabel = formatInTimeZone(new Date(reservation.starts_at), tz, "EEEE d 'de' MMMM");
  const timeLabel = formatInTimeZone(new Date(reservation.starts_at), tz, "HH:mm");

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-3 text-emerald-600">
          <CheckCircle2 className="size-6" />
          <h1 className="text-2xl font-semibold tracking-tight">Reserva confirmada</h1>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Día</dt>
            <dd className="font-medium capitalize">{dateLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Horario</dt>
            <dd className="font-medium">{timeLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Comensales</dt>
            <dd className="font-medium">{reservation.party_size}</dd>
          </div>
          {reservation.tables ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Mesa</dt>
              <dd className="font-medium">{reservation.tables.label}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Estado</dt>
            <dd className="font-medium capitalize">{reservation.status}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href={`/${business_slug}/perfil/reservas`}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Mis reservas
          </Link>
          {reservation.status === "confirmed" || reservation.status === "seated" ? (
            <CancelReservationButton id={reservation.id} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
