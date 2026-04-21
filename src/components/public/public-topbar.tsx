import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { OpenBadge } from "@/components/menu/open-badge";
import { ProfileMenu } from "@/components/profile-menu";
import { computeIsOpen } from "@/lib/business-hours";
import { currentDayOfWeek } from "@/lib/day-of-week";
import { getMenu } from "@/lib/menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export async function PublicTopbar({ slug }: { slug: string }) {
  const business = await getBusiness(slug);
  if (!business) return null;

  // La topbar solo usa `menu.hours`; el `todayDow` no afecta pero es obligatorio
  // tras la extensión de getMenu para daily menus.
  const [menu, supabase] = await Promise.all([
    getMenu(business.id, currentDayOfWeek(business.timezone)),
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOpenInitial = computeIsOpen(menu.hours, business.timezone);

  return (
    <header className="bg-background/90 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link
          href={`/${slug}/menu`}
          className="flex min-w-0 items-center gap-3"
        >
          {business.logo_url && (
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
              <Image
                src={business.logo_url}
                alt={business.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold tracking-tight">
              {business.name}
            </p>
            <div className="mt-0.5">
              <OpenBadge
                isOpenInitial={isOpenInitial}
                hours={menu.hours}
                timezone={business.timezone}
              />
            </div>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <ProfileMenu
              name={
                (user.user_metadata?.full_name as string | undefined) ??
                (user.user_metadata?.name as string | undefined)
              }
              email={user.email ?? ""}
              redirectAfterSignOut={`/${slug}/menu`}
            />
          ) : (
            <Link
              href={`/${slug}/login?next=${encodeURIComponent(`/${slug}/menu`)}`}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
