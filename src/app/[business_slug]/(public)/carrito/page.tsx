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
    <main className="bg-background mx-auto min-h-screen max-w-md px-4 pb-28">
      <header className="flex items-center justify-between pt-5">
        <h1 className="text-xl font-extrabold tracking-tight">
          {business.name}
        </h1>
      </header>
      <CartPageClient slug={business_slug} />
    </main>
  );
}
