import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/catalog/product-form";
import { PageHeader, PageShell, Surface } from "@/components/admin/shell/page-shell";
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

  const { categories, stations } = await getAdminCatalog(business.id);

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Catálogo"
        title="Nuevo producto"
        description="Cargá un producto que tus clientes puedan elegir a la carta."
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
          stations={stations}
        />
      </Surface>
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
