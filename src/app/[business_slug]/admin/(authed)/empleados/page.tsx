import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Users } from "lucide-react";

import { InviteUserForm } from "@/components/admin/users/invite-user-form";
import { UserRow } from "@/components/admin/users/user-row";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
} from "@/components/admin/shell/page-shell";
import { Button } from "@/components/ui/button";
import {
  canManageBusiness,
  ensureAdminAccess,
} from "@/lib/admin/context";
import { listBusinessMembers } from "@/lib/admin/members-query";
import { getBusiness } from "@/lib/tenant";

export default async function EmpleadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ business_slug: string }>;
  searchParams: Promise<{ disabled?: string }>;
}) {
  const { business_slug } = await params;
  const { disabled } = await searchParams;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const ctx = await ensureAdminAccess(business.id, business_slug);
  if (!canManageBusiness(ctx)) redirect(`/${business_slug}/admin`);

  const includeDisabled = disabled === "1";
  const members = await listBusinessMembers(business.id, { includeDisabled });

  const activeMembers = members.filter((m) => !m.disabled_at);
  const adminCount = activeMembers.filter((m) => m.role === "admin").length;
  const encargadoCount = activeMembers.filter(
    (m) => m.role === "encargado",
  ).length;
  const mozoCount = activeMembers.filter((m) => m.role === "mozo").length;
  const disabledCount = members.filter((m) => m.disabled_at).length;

  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Equipo"
        title="Empleados"
        description="Gente con acceso al panel de este negocio. Sumá empleados, definí su rol y deshabilitá cuando dejen de trabajar."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Surface padding="default">
          <SurfaceHeader
            eyebrow="Sumar empleado"
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
            title={`${activeMembers.length} ${
              activeMembers.length === 1 ? "activo" : "activos"
            }`}
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
                Encargados de caja
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {encargadoCount}
              </dd>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200/60">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                Mozos
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {mozoCount}
              </dd>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200/60">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Deshabilitados
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-500">
                {includeDisabled ? disabledCount : "—"}
              </dd>
            </div>
          </dl>
        </Surface>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SurfaceHeader eyebrow="Personas" title="Directorio" />
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                href={
                  includeDisabled
                    ? `/${business_slug}/admin/empleados`
                    : `/${business_slug}/admin/empleados?disabled=1`
                }
              >
                {includeDisabled ? (
                  <>
                    <EyeOff className="size-3.5" />
                    Ocultar deshabilitados
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" />
                    Ver deshabilitados
                  </>
                )}
              </Link>
            }
          />
        </div>
        {members.length === 0 ? (
          <Surface
            padding="default"
            className="grid place-items-center gap-3 p-12 text-center"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
              <Users className="size-5" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">
              Nadie tiene acceso todavía
            </p>
            <p className="max-w-sm text-sm text-zinc-600">
              Sumá al primer empleado desde el formulario de arriba.
            </p>
          </Surface>
        ) : (
          <ul className="grid gap-2">
            {members.map((m) => (
              <UserRow
                key={m.user_id}
                slug={business_slug}
                member={m}
                canManage
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
