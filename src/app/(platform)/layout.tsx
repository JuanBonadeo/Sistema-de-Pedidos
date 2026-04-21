import { redirect } from "next/navigation";

import { SuperSidebar } from "@/components/super/super-sidebar";
import { ensurePlatformAdmin } from "@/lib/platform/queries";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await ensurePlatformAdmin();
  if (!admin) redirect("/login");

  const userName =
    (admin.user.user_metadata?.full_name as string | undefined) ??
    (admin.user.user_metadata?.name as string | undefined);

  return (
    <div className="min-h-screen bg-zinc-100/60 lg:flex">
      <SuperSidebar userEmail={admin.email} userName={userName} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
