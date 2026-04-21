import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/catalog/product-form";
import { PageHeader, PageShell, Surface } from "@/components/admin/shell/page-shell";
import {
  getAdminCatalog,
  getAdminProduct,
} from "@/lib/admin/catalog-query";
import { getBusiness } from "@/lib/tenant";

export default async function EditProductoPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const [product, { categories }] = await Promise.all([
    getAdminProduct(id),
    getAdminCatalog(business.id),
  ]);
  if (!product) notFound();

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Catálogo · editar"
        title={product.name}
        back={{
          href: `/${business_slug}/admin/catalogo`,
          label: "Volver al catálogo",
        }}
        size="compact"
      />
      <Surface padding="default">
        <ProductForm
          slug={business_slug}
          businessId={business.id}
          categories={categories}
          product={product}
        />
      </Surface>
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
