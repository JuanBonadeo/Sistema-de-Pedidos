import { notFound } from "next/navigation";

import { MenuClient } from "@/components/menu/menu-client";
import { getMenu } from "@/lib/menu";
import { getBusiness } from "@/lib/tenant";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const menu = await getMenu(business.id);

  return (
    <main className="bg-background mx-auto min-h-screen max-w-md px-4 pt-4 pb-28">
      {menu.categories.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center">
          Este negocio todavía no cargó su menú.
        </p>
      ) : (
        <MenuClient slug={business_slug} categories={menu.categories} />
      )}
    </main>
  );
}
