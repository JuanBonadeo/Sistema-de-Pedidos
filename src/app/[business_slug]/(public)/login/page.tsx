import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { LoginWithGoogleButton } from "@/components/public/login-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function CustomerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ business_slug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { business_slug } = await params;
  const { next } = await searchParams;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : `/${business_slug}/menu`;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(safeNext);

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-10">
      <header className="flex flex-col items-center gap-4 text-center">
        {business.logo_url && (
          <div className="relative size-16 overflow-hidden rounded-full">
            <Image
              src={business.logo_url}
              alt={business.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold">{business.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Entrá con tu cuenta para hacer el pedido.
          </p>
        </div>
      </header>

      <LoginWithGoogleButton nextPath={safeNext} />

      <p className="text-muted-foreground text-center text-xs">
        Al continuar aceptás los términos y la política de privacidad.
      </p>
    </main>
  );
}
