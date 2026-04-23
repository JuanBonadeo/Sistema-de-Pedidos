import { notFound, redirect } from "next/navigation";
import { Users } from "lucide-react";

import { InviteUserForm } from "@/components/admin/users/invite-user-form";
import { UserRow } from "@/components/admin/users/user-row";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
} from "@/components/admin/shell/page-shell";
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

  const adminCount = members.filter((m) => m.role === "admin").length;
  const staffCount = members.filter((m) => m.role === "staff").length;

  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Equipo"
        title="Usuarios"
        description="Gente con acceso al panel de este negocio. Invitá miembros y definí su rol."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Surface padding="default">
          <SurfaceHeader
            eyebrow="Sumar miembro"
            title="Crear acceso"
            description="Armá el usuario con contraseña y compartila por WhatsApp, o generá un link de invitación."
          />
          <div className="mt-5">
            <InviteUserForm
              slug={business_slug}
              businessName={business.name}
            />
          </div>
        </Surface>

        <Surface padding="default" tone="subtle">
          <SurfaceHeader
            eyebrow="Resumen"
            title={`${members.length} ${members.length === 1 ? "miembro" : "miembros"}`}
          />
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200/60">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Admins
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {adminCount}
              </dd>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200/60">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Staff
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {staffCount}
              </dd>
            </div>
          </dl>
        </Surface>
      </div>

      <section className="space-y-3">
        <SurfaceHeader
          eyebrow="Personas"
          title="Directorio"
        />
        {members.length === 0 ? (
          <Surface padding="default" className="grid place-items-center gap-3 p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
              <Users className="size-5" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">
              Nadie tiene acceso todavía
            </p>
            <p className="max-w-sm text-sm text-zinc-600">
              Invitá al primer miembro desde el formulario de arriba.
            </p>
          </Surface>
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
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
