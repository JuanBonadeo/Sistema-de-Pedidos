import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Negocio no encontrado</h1>
      <p className="text-muted-foreground max-w-md">
        No pudimos encontrar el negocio que buscás. Verificá el link o volvé al
        inicio.
      </p>
      <Link href="/" className={buttonVariants()}>
        Volver
      </Link>
    </div>
  );
}
