import { notFound, redirect } from "next/navigation";

import { AddressesScreen } from "@/components/public/addresses-screen";
import { listUserAddresses } from "@/lib/customers/addresses";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBusiness } from "@/lib/tenant";

export default async function PerfilDireccionesPage({
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
  if (!user) {
    const next = encodeURIComponent(`/${business_slug}/perfil/direcciones`);
    redirect(`/${business_slug}/login?next=${next}`);
  }

  const addresses = await listUserAddresses(user.id, business.id);

  return <AddressesScreen slug={business_slug} addresses={addresses} />;
}

export const dynamic = "force-dynamic";
