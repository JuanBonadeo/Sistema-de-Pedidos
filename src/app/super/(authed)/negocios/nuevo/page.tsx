import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { NewBusinessForm } from "@/components/super/new-business-form";

export default function NewBusinessPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/super"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold">Nuevo negocio</h1>
      <NewBusinessForm />
    </main>
  );
}

export const dynamic = "force-dynamic";
