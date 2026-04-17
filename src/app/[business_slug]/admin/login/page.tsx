import { notFound, redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBusiness } from "@/lib/tenant";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  // If already signed in AND member of this business, skip login
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const service = createSupabaseServiceClient();
    const { data: membership } = await service
      .from("business_users")
      .select("role")
      .eq("business_id", business.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership) redirect(`/${business_slug}/admin`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">{business.name}</h1>
        <p className="text-muted-foreground text-sm">Panel de pedidos</p>
      </div>
      <LoginForm slug={business_slug} />
    </main>
  );
}
