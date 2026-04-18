import { notFound } from "next/navigation";

import { CatalogClient } from "@/components/admin/catalog/catalog-client";
import { getAdminCatalog } from "@/lib/admin/catalog-query";
import { getBusiness } from "@/lib/tenant";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const { categories, products } = await getAdminCatalog(business.id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <CatalogClient
        slug={business_slug}
        categories={categories}
        products={products}
      />
    </main>
  );
}

export const dynamic = "force-dynamic";
