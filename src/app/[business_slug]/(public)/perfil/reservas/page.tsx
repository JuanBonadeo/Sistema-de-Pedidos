import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";

import { CancelReservationButton } from "@/components/reservations/cancel-reservation-button";
import type { Reservation } from "@/lib/reservations/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Reservation["status"], string> = {
  confirmed: "Confirmada",
  seated: "En curso",
  completed: "Completada",
  no_show: "No te presentaste",
  cancelled: "Cancelada",
};

export default async function MisReservasPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${business_slug}/login?next=/${business_slug}/perfil/reservas`);

  const service = createSupabaseServiceClient() as unknown as SupabaseClient;
  const { data } = await service
    .from("reservations")
    .select("*, tables(label)")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .order("starts_at", { ascending: false });
  const reservations = (data ?? []) as (Reservation & { tables: { label: string } | null })[];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Mis reservas</h1>
        <Link
          href={`/${business_slug}/reservar`}
          className="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          Nueva reserva
        </Link>
      </header>
      {reservations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no tenés reservas.</p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((r) => {
            const canCancel = r.status === "confirmed" || r.status === "seated";
            return (
              <li key={r.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">
                      {formatInTimeZone(new Date(r.starts_at), business.timezone, "EEEE d 'de' MMMM, HH:mm")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.party_size} comensales{r.tables ? ` · ${r.tables.label}` : ""} · {STATUS_LABEL[r.status]}
                    </p>
                  </div>
                  {canCancel ? <CancelReservationButton id={r.id} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
