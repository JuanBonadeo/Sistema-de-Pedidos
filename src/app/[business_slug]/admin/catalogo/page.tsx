import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { CatalogClient } from "@/components/admin/catalog/catalog-client";
import { getAdminCatalog } from "@/lib/admin/catalog-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function CatalogPage({
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
  if (!user) redirect(`/${business_slug}/admin/login`);

  const { categories, products } = await getAdminCatalog(business.id);

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
      <main className="mx-auto max-w-4xl px-4 py-6">
        <CatalogClient
          slug={business_slug}
          categories={categories}
          products={products}
        />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
