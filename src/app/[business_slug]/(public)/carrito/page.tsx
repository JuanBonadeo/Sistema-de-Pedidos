import { notFound } from "next/navigation";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { getMenu } from "@/lib/menu";
import { getBusiness } from "@/lib/tenant";

export default async function CarritoPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const menu = await getMenu(business.id);
  const primary = menu.zones[0];

  return (
    <CartPageClient
      slug={business_slug}
      businessName={business.name}
      deliveryFeeCents={primary?.delivery_fee_cents ?? 0}
      minOrderCents={primary?.min_order_cents ?? 0}
    />
  );
}
