import { notFound, redirect } from "next/navigation";

import { WelcomeForm } from "@/components/admin/welcome/welcome-form";
import { BrandStyle } from "@/components/admin/shell/brand-style";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness, getBusinessSettings } from "@/lib/tenant";

export default async function BienvenidaPage({
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
  if (!user) redirect(`/${business_slug}/admin/login`);

  // Si ya pasó por la bienvenida antes, lo mandamos directo al panel.
  if (user.user_metadata?.welcomed_at) {
    redirect(`/${business_slug}/admin`);
  }

  const settings = getBusinessSettings(business);
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0];

  return (
    <div
      data-admin-brand
      className="min-h-screen bg-zinc-100/60 px-4 py-12 sm:px-6"
    >
      <BrandStyle
        primary={settings.primary_color}
        primaryForeground={settings.primary_foreground}
      />
      <WelcomeForm
        businessName={business.name}
        businessSlug={business_slug}
        businessLogoUrl={business.logo_url}
        email={user.email ?? ""}
        displayName={displayName ?? ""}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
