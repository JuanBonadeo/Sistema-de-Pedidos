import { signOut } from "@/lib/auth/sign-out";
import { Button } from "@/components/ui/button";

export function AdminNav({
  slug,
  businessName,
  userEmail,
}: {
  slug: string;
  businessName: string;
  userEmail: string;
}) {
  const signOutBound = signOut.bind(null, slug);
  return (
    <header className="bg-card flex items-center justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{businessName}</p>
        <p className="text-muted-foreground text-xs">Panel de pedidos</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {userEmail}
        </span>
        <form action={signOutBound}>
          <Button type="submit" size="sm" variant="ghost">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </header>
  );
}
