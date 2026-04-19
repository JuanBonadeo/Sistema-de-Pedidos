import { notFound, redirect } from "next/navigation";
import { Users } from "lucide-react";

import { InviteUserForm } from "@/components/admin/users/invite-user-form";
import { UserRow } from "@/components/admin/users/user-row";
import {
  canManageBusiness,
  ensureAdminAccess,
} from "@/lib/admin/context";
import { listBusinessMembers } from "@/lib/admin/members-query";
import { getBusiness } from "@/lib/tenant";

export default async function UsuariosPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  if (!canManageBusiness(ctx)) redirect(`/${business_slug}/admin`);

  const members = await listBusinessMembers(business.id);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            Equipo
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Usuarios
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quiénes tienen acceso al panel de este negocio.
          </p>
        </div>
      </header>

      <section className="bg-card space-y-3 rounded-2xl border p-5">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Invitar miembro
        </h2>
        <InviteUserForm slug={business_slug} />
        <p className="text-muted-foreground text-xs">
          Le mandamos un mail con un link para que configure su contraseña.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold">
            Miembros
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({members.length})
            </span>
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="bg-card text-muted-foreground grid place-items-center gap-3 rounded-2xl border p-10 text-center">
            <div className="bg-muted flex size-12 items-center justify-center rounded-2xl">
              <Users className="size-5" />
            </div>
            <p className="text-sm">Nadie tiene acceso todavía.</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {members.map((m) => (
              <UserRow
                key={m.user_id}
                slug={business_slug}
                member={m}
                canRemove
                isCurrentUser={m.user_id === ctx.user.id}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";
