import { notFound, redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function CheckoutPage({
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
  if (!user) {
    const next = encodeURIComponent(`/${business_slug}/checkout`);
    redirect(`/${business_slug}/login?next=${next}`);
  }

  return (
    <CheckoutForm
      slug={business_slug}
      businessName={business.name}
      businessAddress={business.address}
      deliveryFeeCents={Number(business.delivery_fee_cents)}
      estimatedMinutes={business.estimated_delivery_minutes}
      initialName={
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        ""
      }
      initialEmail={user.email ?? ""}
    />
  );
}
