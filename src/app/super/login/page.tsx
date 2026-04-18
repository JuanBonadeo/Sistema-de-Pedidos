import { redirect } from "next/navigation";

import { SuperLoginForm } from "@/components/super/super-login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export default async function SuperLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const service = createSupabaseServiceClient();
    const { data: profile } = await service
      .from("users")
      .select("is_platform_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_platform_admin) redirect("/super");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold">Pedidos</h1>
        <p className="text-muted-foreground text-sm">Panel de plataforma</p>
      </div>
      <SuperLoginForm />
    </main>
  );
}
