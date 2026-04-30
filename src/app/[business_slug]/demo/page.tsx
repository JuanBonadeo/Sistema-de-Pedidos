import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  ChefHat,
  CheckCircle2,
  ClipboardList,
  Contact,
  LayoutDashboard,
  LogIn,
  Megaphone,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  UserCircle,
  UtensilsCrossed,
  Users,
  Utensils,
} from "lucide-react";

import { getBusiness } from "@/lib/tenant";

type Role = {
  href: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

type SubLink = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default async function DemoHubPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug } = await params;
  const business = await getBusiness(business_slug);
  if (!business) notFound();

  const roles: Role[] = [
    {
      href: `/${business_slug}/mozo`,
      title: "Mozos",
      subtitle: "Equipo de salón",
      description:
        "Tus mozos atienden más mesas y con menos errores: ven el estado de cada mesa, toman pedidos desde el celular y reciben avisos cuando un plato está listo.",
      icon: UtensilsCrossed,
      accent: "from-emerald-500/20 to-emerald-500/0",
    },
    {
      href: `/${business_slug}/cocina`,
      title: "Cocina",
      subtitle: "Pantalla del chef",
      description:
        "Las comandas llegan ordenadas y con tiempo a la vista. Menos confusión, salidas más rápidas y alergias destacadas para evitar errores.",
      icon: ChefHat,
      accent: "from-orange-500/20 to-orange-500/0",
    },
  ];

  const adminLinks: SubLink[] = [
    {
      href: `/${business_slug}/admin`,
      title: "Inicio",
      description: "Cómo va el día de un vistazo: ventas, pedidos y mesas activas.",
      icon: LayoutDashboard,
    },
    {
      href: `/${business_slug}/admin/pedidos`,
      title: "Pedidos",
      description: "Todos los pedidos en un solo lugar, en vivo y con historial.",
      icon: Receipt,
    },
    {
      href: `/${business_slug}/admin/catalogo`,
      title: "Tu carta",
      description: "Cambiá precios, fotos y disponibilidad en segundos.",
      icon: Utensils,
    },
    {
      href: `/${business_slug}/admin/menu-del-dia`,
      title: "Menú del día",
      description: "Programá los menús ejecutivos de toda la semana.",
      icon: CalendarDays,
    },
    {
      href: `/${business_slug}/admin/reservas`,
      title: "Reservas",
      description: "Agenda visual con tu plano de salón real.",
      icon: CalendarDays,
    },
    {
      href: `/${business_slug}/admin/clientes`,
      title: "Clientes",
      description: "Conocé quién vuelve, cuánto gasta y qué le gusta.",
      icon: Contact,
    },
    {
      href: `/${business_slug}/admin/promociones`,
      title: "Promociones",
      description: "Lanzá descuentos y cupones cuando quieras.",
      icon: Tag,
    },
    {
      href: `/${business_slug}/admin/campanas`,
      title: "Campañas",
      description: "Recuperá clientes inactivos con ofertas dirigidas.",
      icon: Megaphone,
    },
    {
      href: `/${business_slug}/admin/chatbot`,
      title: "Asistente IA",
      description: "Atiende consultas y toma pedidos por WhatsApp 24/7.",
      icon: Bot,
    },
    {
      href: `/${business_slug}/admin/reportes`,
      title: "Reportes",
      description: "Decisiones con datos: qué vende más, cuándo y a quién.",
      icon: BarChart3,
    },
    {
      href: `/${business_slug}/admin/usuarios`,
      title: "Equipo",
      description: "Sumá a tu equipo con permisos según el rol de cada uno.",
      icon: ShieldCheck,
    },
    {
      href: `/${business_slug}/admin/configuracion`,
      title: "Tu negocio",
      description: "Personalizá colores, horarios, pagos y zonas de delivery.",
      icon: Settings,
    },
  ];

  const clienteLinks: SubLink[] = [
    {
      href: `/${business_slug}/menu`,
      title: "Carta digital",
      description: "Tu menú con fotos y descripciones, siempre actualizado.",
      icon: UtensilsCrossed,
    },
    {
      href: `/${business_slug}/carrito`,
      title: "Carrito",
      description: "El cliente arma su pedido a su ritmo, sin presión.",
      icon: ShoppingCart,
    },
    {
      href: `/${business_slug}/checkout`,
      title: "Pago online",
      description: "Cobrás antes de que el pedido entre a cocina.",
      icon: ClipboardList,
    },
    {
      href: `/${business_slug}/confirmacion`,
      title: "Seguimiento",
      description: "El cliente sabe en qué estado va su pedido en cada momento.",
      icon: CheckCircle2,
    },
    {
      href: `/${business_slug}/reservar`,
      title: "Reservas",
      description: "Reservas online 24/7 sin que nadie atienda el teléfono.",
      icon: CalendarDays,
    },
    {
      href: `/${business_slug}/perfil`,
      title: "Mi cuenta",
      description: "Historial de pedidos y reservas para fidelizar al cliente.",
      icon: UserCircle,
    },
    {
      href: `/${business_slug}/login`,
      title: "Ingreso",
      description: "Acceso simple sin contraseñas que recordar.",
      icon: LogIn,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Demo personalizada · {business.name}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
            Una plataforma, todo tu restaurante
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Recorré la experiencia desde cada punto de contacto: el cliente que pide, el equipo que atiende y vos que dirigís el negocio.
          </p>
        </header>

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">Tus clientes</h2>
                <p className="text-sm text-muted-foreground">
                  La experiencia del comensal, de la carta al pedido en su mesa.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {clienteLinks.length} pantallas
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {clienteLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col rounded-xl bg-white p-4 ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:ring-zinc-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold">
                      {link.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {link.description}
                  </p>
                  <div className="mt-3 text-xs font-medium text-zinc-900 opacity-0 transition group-hover:opacity-100">
                    Ver →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">Vos al mando</h2>
                <p className="text-sm text-muted-foreground">
                  Todo el control del negocio en un solo panel.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {adminLinks.length} herramientas
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col rounded-xl bg-white p-4 ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:ring-zinc-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold">
                      {link.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {link.description}
                  </p>
                  <div className="mt-3 text-xs font-medium text-zinc-900 opacity-0 transition group-hover:opacity-100">
                    Ver →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tu equipo de trabajo
          </span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.href}
                href={role.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:ring-zinc-300 hover:shadow-lg"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${role.accent} opacity-0 transition group-hover:opacity-100`}
                />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {role.subtitle}
                  </span>
                </div>
                <h2 className="relative mt-6 font-heading text-2xl font-semibold">
                  {role.title}
                </h2>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {role.description}
                </p>
                <div className="relative mt-6 text-sm font-medium text-zinc-900">
                  Ver demo →
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Esta demo usa datos de ejemplo para que puedas explorar la plataforma
          sin compromiso.
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
