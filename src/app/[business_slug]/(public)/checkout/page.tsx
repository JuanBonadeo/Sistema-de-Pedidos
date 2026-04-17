import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getMenu } from "@/lib/menu";
import { getBusiness } from "@/lib/tenant";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const menu = await getMenu(business.id);

  return (
    <main className="bg-background mx-auto min-h-screen max-w-md px-4 pt-6 pb-28">
      <CheckoutForm slug={business_slug} zones={menu.zones} />
    </main>
  );
}
