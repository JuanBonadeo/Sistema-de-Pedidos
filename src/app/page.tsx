export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Pedidos</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Plataforma multi-tenant para pedidos online. Visitá el subdominio de tu
        negocio o <code>/:slug/menu</code> en dev.
      </p>
    </main>
  );
}
