import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm } from "@/components/admin/catalog/product-form";
import {
  getAdminCatalog,
  getAdminProduct,
} from "@/lib/admin/catalog-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function EditProductoPage({
  params,
}: {
  params: Promise<{ business_slug: string; id: string }>;
}) {
  const { business_slug, id } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${business_slug}/admin/login`);

  const [product, { categories }] = await Promise.all([
    getAdminProduct(id),
    getAdminCatalog(business.id),
  ]);
  if (!product) notFound();

  return (
    <div className="bg-background min-h-screen">
      <AdminNav
        slug={business_slug}
        businessName={business.name}
        userEmail={user.email ?? ""}
        userName={
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined)
        }
      />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href={`/${business_slug}/admin/catalogo`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4" /> Volver al catálogo
        </Link>
        <h1 className="mt-4 mb-6 text-2xl font-extrabold">
          Editar {product.name}
        </h1>
        <ProductForm
          slug={business_slug}
          businessId={business.id}
          categories={categories}
          product={product}
        />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
