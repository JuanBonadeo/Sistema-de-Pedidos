import { notFound } from "next/navigation";

import { MenuClient } from "@/components/menu/menu-client";
import { computeIsOpen } from "@/lib/business-hours";
import { getMenu } from "@/lib/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const [menu, supabase] = await Promise.all([
    getMenu(business.id),
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOpen = computeIsOpen(menu.hours, business.timezone);
  const tagline =
    (business.settings as { tagline?: string } | null)?.tagline ??
    business.address ??
    null;

  return (
    <MenuClient
      slug={business_slug}
      businessName={business.name}
      tagline={tagline}
      coverImageUrl={business.cover_image_url ?? business.logo_url}
      logoUrl={business.logo_url}
      categories={menu.categories}
      deliveryFeeCents={Number(business.delivery_fee_cents)}
      minOrderCents={Number(business.min_order_cents)}
      estimatedMinutes={business.estimated_delivery_minutes}
      hours={menu.hours}
      timezone={business.timezone}
      isOpenInitial={isOpen}
      user={
        user
          ? {
              name:
                (user.user_metadata?.full_name as string | undefined) ??
                (user.user_metadata?.name as string | undefined),
              email: user.email ?? "",
            }
          : null
      }
    />
  );
}
