import Image from "next/image";
import { notFound } from "next/navigation";

import { MenuClient } from "@/components/menu/menu-client";
import { OpenBadge } from "@/components/menu/open-badge";
import { computeIsOpen } from "@/lib/business-hours";
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
  const isOpenInitial = computeIsOpen(menu.hours, business.timezone);

  return (
    <main className="bg-background mx-auto min-h-screen max-w-md px-4 pb-28">
      <header className="flex items-center gap-3 pt-5 pb-4">
        {business.logo_url && (
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full">
            <Image
              src={business.logo_url}
              alt={business.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold tracking-tight">
            {business.name}
          </h1>
          <div className="mt-0.5 flex items-center gap-2">
            <OpenBadge
              isOpenInitial={isOpenInitial}
              hours={menu.hours}
              timezone={business.timezone}
            />
          </div>
        </div>
      </header>

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
