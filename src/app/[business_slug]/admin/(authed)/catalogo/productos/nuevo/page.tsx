import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/catalog/product-form";
import { getAdminCatalog } from "@/lib/admin/catalog-query";
import { getBusiness } from "@/lib/tenant";

export default async function NuevoProductoPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const { categories } = await getAdminCatalog(business.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/${business_slug}/admin/catalogo`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" /> Volver al catálogo
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold">Nuevo producto</h1>
      <ProductForm
        slug={business_slug}
        businessId={business.id}
        categories={categories}
      />
    </main>
  );
}

export const dynamic = "force-dynamic";
