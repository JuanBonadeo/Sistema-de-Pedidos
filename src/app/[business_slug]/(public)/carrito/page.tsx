import { notFound } from "next/navigation";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { getBusiness } from "@/lib/tenant";

export default async function CarritoPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  return (
    <CartPageClient
      slug={business_slug}
      businessName={business.name}
      deliveryFeeCents={Number(business.delivery_fee_cents)}
      minOrderCents={Number(business.min_order_cents)}
    />
  );
}
