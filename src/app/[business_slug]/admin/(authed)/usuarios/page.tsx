import { redirect } from "next/navigation";

// La ruta `/admin/usuarios` se renombró a `/admin/empleados` (CU-12).
// Mantenemos este redirect para no romper bookmarks ni links viejos.
export default async function UsuariosRedirectPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  redirect(`/${business_slug}/admin/empleados`);
}
