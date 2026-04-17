import Link from "next/link";

import { ProfileMenu } from "@/components/profile-menu";

export function AdminNav({
  slug,
  businessName,
  userEmail,
  userName,
}: {
  slug: string;
  businessName: string;
  userEmail: string;
  userName?: string | null;
}) {
  return (
    <header className="bg-card flex items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 items-center gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{businessName}</p>
          <p className="text-muted-foreground text-xs">Panel</p>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href={`/${slug}/admin`}
            className="hover:text-primary rounded-md px-2 py-1"
          >
            Pedidos
          </Link>
          <Link
            href={`/${slug}/admin/catalogo`}
            className="hover:text-primary rounded-md px-2 py-1"
          >
            Catálogo
          </Link>
          <Link
            href={`/${slug}/admin/reportes`}
            className="hover:text-primary rounded-md px-2 py-1"
          >
            Reportes
          </Link>
        </nav>
      </div>
      <ProfileMenu
        name={userName}
        email={userEmail}
        redirectAfterSignOut={`/${slug}/admin/login`}
      />
    </header>
  );
}
