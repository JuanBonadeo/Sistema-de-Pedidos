import { notFound } from "next/navigation";

import { ReservarFlow } from "@/components/reservations/reservar-flow";
import { getReservationSettings } from "@/lib/reservations/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pre-fill name + phone from auth profile when logged in. Falls back to
  // user_metadata so Google sign-in users see their name on the form.
  let name: string | null = null;
  let phone: string | null = null;
  if (user) {
    name =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null;
    phone = (user.phone as string | undefined) ?? null;
  }

  const settings = await getReservationSettings(business.id, { useService: true });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Reservas
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Reservá tu mesa en {business.name}
        </h1>
      </header>
      <ReservarFlow
        slug={business_slug}
        settings={{
          advance_days_max: settings.advance_days_max,
          max_party_size: settings.max_party_size,
          slot_duration_min: settings.slot_duration_min,
          schedule: settings.schedule,
        }}
        user={{ isLoggedIn: !!user, name, phone }}
      />
    </main>
  );
}
