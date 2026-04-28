"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  Hash,
  Mail,
  MapPin,
  Moon,
  Palette,
  Phone,
  Shapes,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Truck,
} from "lucide-react";

import {
  SectionField,
  SettingsSection,
} from "@/components/admin/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/admin/catalog/image-uploader";
import {
  MenuPreview,
  type PreviewProduct,
} from "@/components/admin/settings/menu-preview";
import { updateBusinessSettings } from "@/lib/admin/business-actions";
import {
  DENSITY_SCALE,
  FONT_KEYS,
  FONT_OPTIONS,
  ICON_STROKE_SCALE,
  ICON_STROKE_VALUE,
  ICON_STYLE_SCALE,
  MODE_SCALE,
  RADIUS_PX,
  RADIUS_SCALE,
  SHADOW_SCALE,
  SHADOW_VALUE,
  type FontKey,
  type IconStroke,
  type IconStyle,
  type Mode,
  type RadiusScale,
  type ShadowScale,
} from "@/lib/branding/tokens";
import { SLUG_PATTERN, slugify } from "@/lib/reserved-slugs";
import { cn } from "@/lib/utils";

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color inválido.");

const Schema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres.")
    .max(60, "Máximo 60 caracteres.")
    .regex(SLUG_PATTERN, "Sólo minúsculas, números y guiones."),
  name: z.string().min(1, "Requerido.").max(120),
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  address: z.string().max(200).optional(),
  timezone: z.string().min(1, "Requerido."),
  logo_url: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  logo_mark_url: z.string().nullable(),
  logo_mono_url: z.string().nullable(),
  favicon_url: z.string().nullable(),
  primary_color: HexColor,
  primary_foreground: HexColor,
  secondary_color: HexColor,
  secondary_foreground: HexColor,
  accent_color: HexColor,
  accent_foreground: HexColor,
  background_color: HexColor,
  background_color_dark: HexColor,
  surface_color: HexColor,
  muted_color: HexColor,
  border_color: HexColor,
  success_color: HexColor,
  warning_color: HexColor,
  destructive_color: HexColor,
  font_heading: z.enum(FONT_KEYS),
  font_body: z.enum(FONT_KEYS),
  radius_scale: z.enum(RADIUS_SCALE),
  shadow_scale: z.enum(SHADOW_SCALE),
  density: z.enum(DENSITY_SCALE),
  icon_stroke_width: z.enum(ICON_STROKE_SCALE),
  icon_style: z.enum(ICON_STYLE_SCALE),
  default_mode: z.enum(MODE_SCALE),
  delivery_fee_cents: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(0, "No puede ser negativo."),
  min_order_cents: z.coerce
    .number()
    .int("Tiene que ser un número entero.")
    .min(0, "No puede ser negativo."),
  estimated_delivery_minutes: z
    .union([z.coerce.number().int().min(0), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  mp_access_token: z.string().max(300).optional(),
  mp_public_key: z.string().max(300).optional(),
  mp_webhook_secret: z.string().max(300).optional(),
  mp_accepts_payments: z.boolean(),
});

type Values = z.infer<typeof Schema>;

export function BusinessSettingsForm({
  slug,
  businessId,
  initial,
  sampleProducts,
}: {
  slug: string;
  businessId: string;
  initial: Values;
  sampleProducts: PreviewProduct[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const form = useForm<Values>({
    resolver: zodResolver(Schema) as unknown as Resolver<Values>,
    defaultValues: initial,
  });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    try {
      const r = await updateBusinessSettings({
        business_slug: slug,
        ...values,
        delivery_fee_cents: Math.round(values.delivery_fee_cents * 100),
        min_order_cents: Math.round(values.min_order_cents * 100),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const newSlug = r.data.slug;
      if (newSlug !== slug) {
        toast.success("Configuración guardada. URL actualizada.");
        router.replace(`/${newSlug}/admin/configuracion`);
        router.refresh();
        return;
      }
      toast.success("Configuración guardada.");
      form.reset(values);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const logoUrl = form.watch("logo_url");
  const logoMarkUrl = form.watch("logo_mark_url");
  const logoMonoUrl = form.watch("logo_mono_url");
  const faviconUrl = form.watch("favicon_url");
  const coverImageUrl = form.watch("cover_image_url");
  const nameValue = form.watch("name");
  const primaryValue = form.watch("primary_color");
  const primaryFgValue = form.watch("primary_foreground");
  const backgroundLight = form.watch("background_color");
  const backgroundDark = form.watch("background_color_dark");
  const fontHeadingValue = form.watch("font_heading");
  const fontBodyValue = form.watch("font_body");
  const radiusValue = form.watch("radius_scale");
  const shadowValue = form.watch("shadow_scale");
  const strokeValue = form.watch("icon_stroke_width");
  const iconStyleValue = form.watch("icon_style");
  const modeValue = form.watch("default_mode");
  const mpEnabled = form.watch("mp_accepts_payments");
  const mpAccess = form.watch("mp_access_token");
  const mpPublic = form.watch("mp_public_key");
  const mpReady = Boolean(mpAccess && mpPublic);

  return (
    <Form {...form}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid min-w-0 gap-6"
        >
          {/* Identidad + Marca */}
          <SettingsSection
            step={1}
            icon={<Store className="size-5" strokeWidth={1.75} />}
            eyebrow="Paso 1"
            title="Identidad y marca"
            description="Foto del local, logo, nombre y los colores que definen el estilo del menú."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex h-5 items-baseline justify-between gap-2">
                      <FormLabel>Nombre del negocio</FormLabel>
                    </div>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => {
                  const initialSlug = initial.slug;
                  const currentName = nameValue ?? "";
                  const suggested = slugify(currentName);
                  const canSuggest =
                    suggested.length >= 2 && suggested !== field.value;
                  const changed = field.value !== initialSlug;
                  return (
                    <FormItem>
                      <div className="flex h-5 items-baseline justify-between gap-2">
                        <FormLabel>Slug (URL)</FormLabel>
                        {canSuggest && (
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(suggested, { shouldDirty: true })
                            }
                            className="text-xs font-medium underline-offset-2 hover:underline"
                            style={{ color: "var(--brand)" }}
                          >
                            Usar nombre → {suggested}
                          </button>
                        )}
                      </div>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                            <Hash className="size-3.5" />
                          </span>
                          <Input
                            placeholder="pizzanapoli"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-zinc-500">
                        URL pública:{" "}
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700">
                          /{field.value || "…"}
                        </code>
                      </p>
                      {changed && (
                        <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[0.7rem] leading-snug text-amber-900">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          <span>
                            Al cambiar el slug, la URL vieja deja de funcionar.
                            QRs, bookmarks y links con{" "}
                            <code>/{initialSlug}</code> van a dar 404.
                          </span>
                        </p>
                      )}
                    </FormItem>
                  );
                }}
              />
            </div>

            <Tabs defaultValue="assets">
              <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
                <TabsTrigger value="assets">
                  <Sparkles className="size-3.5" /> Identidad visual
                </TabsTrigger>
                <TabsTrigger value="colors">
                  <Palette className="size-3.5" /> Colores
                </TabsTrigger>
                <TabsTrigger value="style">
                  <Shapes className="size-3.5" /> Estilo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assets" className="grid gap-6 pt-4">
                <IdentityHero
                  coverUrl={coverImageUrl}
                  logoUrl={logoUrl}
                  businessId={businessId}
                  onCoverChange={(url) =>
                    form.setValue("cover_image_url", url, { shouldDirty: true })
                  }
                  onLogoChange={(url) =>
                    form.setValue("logo_url", url, { shouldDirty: true })
                  }
                />
                <LogoVariants
                  markUrl={logoMarkUrl}
                  monoUrl={logoMonoUrl}
                  faviconUrl={faviconUrl}
                  businessId={businessId}
                  onMarkChange={(url) =>
                    form.setValue("logo_mark_url", url, { shouldDirty: true })
                  }
                  onMonoChange={(url) =>
                    form.setValue("logo_mono_url", url, { shouldDirty: true })
                  }
                  onFaviconChange={(url) =>
                    form.setValue("favicon_url", url, { shouldDirty: true })
                  }
                />
              </TabsContent>

              <TabsContent value="colors" className="grid gap-6 pt-4">
                <TabHeader
                  title="Colores de marca"
                  description="El primario se aplica a botones, acentos y CTAs. El texto sobre primario es el color del texto dentro de esos botones."
                />
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color primario</FormLabel>
                          <FormControl>
                            <ColorInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primary_foreground"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Texto sobre primario</FormLabel>
                          <FormControl>
                            <ColorInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <BrandPreview
                    primary={primaryValue}
                    foreground={primaryFgValue}
                  />
                </div>
                <PaletteExtended form={form} />
                <BackgroundColors form={form} />
                <TabHeader
                  title="Modo por defecto"
                  description="Cómo ven el menú tus clientes al entrar. Cada modo usa el fondo de arriba."
                />
                <ModePicker form={form} />
              </TabsContent>

              <TabsContent value="style" className="grid gap-6 pt-4">
                <TabHeader
                  title="Tipografía"
                  description="Elegí una fuente para títulos y otra para el cuerpo de texto. Todas están pre-cargadas y optimizadas."
                />
                <TypographyPicker form={form} />
                <TabHeader
                  title="Íconos"
                  description="El grosor y estilo afectan el feel global del menú."
                />
                <IconStrokePicker form={form} />
                <TabHeader
                  title="Forma"
                  description="Qué tan redondeadas son las esquinas y qué tan marcadas son las sombras."
                />
                <ShapePicker form={form} />
              </TabsContent>
            </Tabs>
          </SettingsSection>

          {/* Contacto */}
          <SettingsSection
            step={2}
            icon={<Phone className="size-5" strokeWidth={1.75} />}
            eyebrow="Paso 2"
            title="Contacto"
            description="Datos visibles en el menú y notificaciones del pedido."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        icon={<Phone className="size-3.5" />}
                        placeholder="+54 11 5555-1234"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <InputWithIcon
                        icon={<Mail className="size-3.5" />}
                        type="email"
                        placeholder="hola@negocio.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      icon={<MapPin className="size-3.5" />}
                      placeholder="Av. Corrientes 1234, CABA"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona horaria</FormLabel>
                  <FormControl>
                    <InputWithIcon
                      icon={<Globe className="size-3.5" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-zinc-500">
                    Formato IANA, ej:{" "}
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-700">
                      America/Argentina/Buenos_Aires
                    </code>
                  </p>
                </FormItem>
              )}
            />
          </SettingsSection>

          {/* Envío */}
          <SettingsSection
            step={3}
            icon={<Truck className="size-5" strokeWidth={1.75} />}
            eyebrow="Paso 3"
            title="Envío"
            description="Retiro en el local es siempre gratis. Delivery cobra un envío único."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="delivery_fee_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo de envío</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="1500"
                        {...field}
                        value={field.value ?? 0}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500">0 = envío gratis.</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_order_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido mínimo</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="0"
                        {...field}
                        value={field.value ?? 0}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500">0 = sin mínimo.</p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimated_delivery_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo estimado</FormLabel>
                    <FormControl>
                      <MinutesInput
                        placeholder="30"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500">Opcional, en min.</p>
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>

          {/* Mercado Pago */}
          <SettingsSection
            step={4}
            icon={<CreditCard className="size-5" strokeWidth={1.75} />}
            eyebrow="Paso 4"
            title="Mercado Pago"
            description="Conectá tu cuenta para cobrar online. Si no lo activás, solo aceptás efectivo."
            aside={<MpStatusPill enabled={mpEnabled} ready={mpReady} />}
          >
            <FormField
              control={form.control}
              name="mp_accepts_payments"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition",
                        field.value
                          ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                          : "border-zinc-200 bg-white hover:border-zinc-300",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          Aceptar Mercado Pago en el checkout
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-xs",
                            field.value ? "text-zinc-400" : "text-zinc-500",
                          )}
                        >
                          Requiere completar Access Token y Public Key abajo.
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className={cn(
                          "relative flex h-6 w-11 shrink-0 items-center rounded-full transition",
                          field.value ? "bg-emerald-400" : "bg-zinc-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute size-5 rounded-full bg-white shadow-sm transition",
                            field.value ? "translate-x-5" : "translate-x-0.5",
                          )}
                        />
                      </span>
                    </button>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="mp_access_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="APP_USR-..."
                        autoComplete="off"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500">
                      Secreto · se usa server-side para crear el pago.
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mp_public_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="APP_USR-..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-zinc-500">
                      Pública · viaja al cliente.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <details className="group rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-900">
                Avanzado · Webhook (opcional)
              </summary>
              <div className="mt-4 space-y-3">
                <p className="text-xs text-zinc-600">
                  Solo hace falta en producción para cubrir pestañas cerradas. Si
                  el cliente vuelve al menú después de pagar, el pedido se
                  actualiza solo.
                </p>
                <FormField
                  control={form.control}
                  name="mp_webhook_secret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Clave secreta del webhook"
                          autoComplete="off"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                      <SectionField label="URL a registrar en MP" hint="Pegá esto en el campo URL del webhook.">
                        <code className="block break-all rounded-lg bg-white px-3 py-2 text-[0.7rem] text-zinc-700 ring-1 ring-zinc-200">
                          {origin}/api/mp/webhook?business_id={businessId}
                        </code>
                      </SectionField>
                    </FormItem>
                  )}
                />
              </div>
            </details>
          </SettingsSection>

          <SaveBar
            dirty={form.formState.isDirty}
            submitting={submitting}
            onDiscard={() => form.reset(initial)}
          />
        </form>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70">
            <header className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Preview
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  En vivo
                </span>
              </div>
              <a
                href={`/${slug}/menu`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[0.65rem] font-semibold text-zinc-50 transition hover:bg-zinc-700"
                title="Abrir el menú público real"
              >
                Abrir menú
                <ExternalLink className="size-3" strokeWidth={2} />
              </a>
            </header>
            <div className="mt-4">
              <MenuPreview
                businessName={nameValue}
                logoUrl={logoUrl}
                coverImageUrl={coverImageUrl}
                primary={primaryValue}
                primaryForeground={primaryFgValue}
                background={
                  modeValue === "dark" ? backgroundDark : backgroundLight
                }
                fontHeading={fontHeadingValue}
                fontBody={fontBodyValue}
                radiusScale={radiusValue}
                shadowScale={shadowValue}
                iconStroke={strokeValue}
                iconStyle={iconStyleValue}
                mode={modeValue}
                products={sampleProducts}
                tagline={form.watch("address")}
                deliveryFeeCents={Math.round(
                  (form.watch("delivery_fee_cents") ?? 0) * 100,
                )}
                minOrderCents={Math.round(
                  (form.watch("min_order_cents") ?? 0) * 100,
                )}
                estimatedMinutes={form.watch("estimated_delivery_minutes")}
              />
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Los cambios se aplican al guardar. Guardá para que los vean los
              clientes.
            </p>
          </div>
        </aside>
      </div>
    </Form>
  );
}

// ——— Identity assets: cover + logo cards ———
function IdentityHero({
  coverUrl,
  logoUrl,
  businessId,
  onCoverChange,
  onLogoChange,
}: {
  coverUrl: string | null;
  logoUrl: string | null;
  businessId: string;
  onCoverChange: (url: string | null) => void;
  onLogoChange: (url: string | null) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60 sm:col-span-2">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Foto del local
            </p>
            <p className="text-xs text-zinc-600">Banner del menú público</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-600 ring-1 ring-zinc-200">
            <Sparkles className="size-2.5" />
            16:9
          </span>
        </header>
        <ImageUploader
          businessId={businessId}
          value={coverUrl}
          onChange={onCoverChange}
          pathPrefix="cover"
          variant="cover"
        />
      </div>

      <div className="flex flex-col rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Logo
            </p>
            <p className="text-xs text-zinc-600">Marca del negocio</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-600 ring-1 ring-zinc-200">
            1:1
          </span>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <ImageUploader
            businessId={businessId}
            value={logoUrl}
            onChange={onLogoChange}
            pathPrefix="logo"
            variant="avatar-circle"
            layout="stacked"
          />
        </div>
      </div>
    </div>
  );
}

// ——— Input with leading icon ———
type InputProps = React.ComponentProps<typeof Input>;
function InputWithIcon({
  icon,
  className,
  ...rest
}: InputProps & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
        {icon}
      </span>
      <Input className={cn("pl-9", className)} {...rest} />
    </div>
  );
}

function CurrencyInput(props: InputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
        $
      </span>
      <Input type="number" min={0} step={1} className="pl-7" {...props} />
    </div>
  );
}

function MinutesInput(props: InputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
        <Clock className="size-3.5" />
      </span>
      <Input type="number" min={0} className="pr-14 pl-9" {...props} />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-medium uppercase tracking-wider text-zinc-400">
        min
      </span>
    </div>
  );
}

// ——— MP status pill ———
function MpStatusPill({
  enabled,
  ready,
}: {
  enabled: boolean;
  ready: boolean;
}) {
  if (enabled && ready) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="size-3" />
        Conectado
      </span>
    );
  }
  if (enabled && !ready) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
        <AlertTriangle className="size-3" />
        Faltan claves
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-600 ring-1 ring-zinc-200">
      Desactivado
    </span>
  );
}

// ——— Brand live preview ———
function BrandPreview({
  primary,
  foreground,
}: {
  primary: string;
  foreground: string;
}) {
  const style = useMemo(
    () =>
      ({
        "--p": /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primary)
          ? primary
          : "#e11d48",
        "--pf": /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(foreground)
          ? foreground
          : "#ffffff",
      }) as React.CSSProperties,
    [primary, foreground],
  );

  return (
    <div
      style={style}
      className="grid gap-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        Preview
      </p>
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-[0_8px_20px_-12px_var(--p)]"
        style={{ background: "var(--p)", color: "var(--pf)" }}
      >
        Confirmar pedido
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider"
          style={{
            background: `color-mix(in srgb, var(--p) 12%, white)`,
            color: "var(--p)",
          }}
        >
          Nuevo
        </span>
        <span
          className="text-xs font-semibold underline-offset-2 hover:underline"
          style={{ color: "var(--p)" }}
        >
          Ver menú completo
        </span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <span
          className="size-6 rounded-full ring-1 ring-black/10"
          style={{ background: "var(--p)" }}
        />
        <span
          className="size-6 rounded-full ring-1 ring-black/10"
          style={{ background: "var(--pf)" }}
        />
        <span className="font-mono text-[0.65rem] uppercase text-zinc-500">
          {primary} · {foreground}
        </span>
      </div>
    </div>
  );
}

// ——— Save bar ———
function SaveBar({
  dirty,
  submitting,
  onDiscard,
}: {
  dirty: boolean;
  submitting: boolean;
  onDiscard: () => void;
}) {
  return (
    <div className="sticky bottom-6 z-10 flex items-center justify-end gap-2 rounded-full bg-white/80 p-2 pl-6 shadow-lg shadow-zinc-900/5 ring-1 ring-zinc-200/70 backdrop-blur">
      <p
        className={cn(
          "mr-auto inline-flex items-center gap-2 text-xs font-medium",
          dirty ? "text-amber-700" : "text-zinc-500",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            dirty ? "bg-amber-500" : "bg-emerald-500",
          )}
        />
        {dirty ? "Cambios sin guardar" : "Todo guardado"}
      </p>
      <Button
        type="button"
        variant="ghost"
        onClick={onDiscard}
        disabled={submitting || !dirty}
        className="rounded-full"
      >
        Descartar
      </Button>
      <button
        type="submit"
        disabled={submitting || !dirty}
        className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-all hover:brightness-95 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
        style={{
          background: "var(--brand)",
          color: "var(--brand-foreground)",
          boxShadow: "0 10px 24px -14px var(--brand)",
        }}
      >
        {submitting ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}

function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const safe = isValid ? value : "#000000";
  return (
    <div className="group relative flex h-11 items-center gap-0 overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 transition focus-within:ring-2 focus-within:ring-zinc-900/20 hover:ring-zinc-300">
      <label
        className="relative grid h-full w-11 shrink-0 cursor-pointer place-items-center"
        style={{ background: safe }}
      >
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label="Elegir color"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10"
        />
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="#E11D48"
        spellCheck={false}
        className="flex-1 bg-transparent px-3 font-mono text-sm uppercase tracking-wide text-zinc-800 outline-none placeholder:text-zinc-300"
      />
    </div>
  );
}

// ─── Tab header (small title + description for each tab block) ─────────
function TabHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {description ? (
        <p className="text-xs text-zinc-500">{description}</p>
      ) : null}
    </div>
  );
}

// ─── Logo variants (isotipo + monocromo + favicon) ──────────────────────
function LogoVariants({
  markUrl,
  monoUrl,
  faviconUrl,
  businessId,
  onMarkChange,
  onMonoChange,
  onFaviconChange,
}: {
  markUrl: string | null;
  monoUrl: string | null;
  faviconUrl: string | null;
  businessId: string;
  onMarkChange: (url: string | null) => void;
  onMonoChange: (url: string | null) => void;
  onFaviconChange: (url: string | null) => void;
}) {
  return (
    <div className="grid gap-4">
      <TabHeader
        title="Variantes de logo"
        description="Opcionales. El isotipo se usa donde hay poco espacio, el monocromo en fondos oscuros, y el favicon en la pestaña del navegador."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniUploadCard
          title="Isotipo"
          hint="Marca sin texto, cuadrada"
          businessId={businessId}
          value={markUrl}
          onChange={onMarkChange}
          pathPrefix="logo-mark"
        />
        <MiniUploadCard
          title="Monocromo"
          hint="Para fondos oscuros"
          businessId={businessId}
          value={monoUrl}
          onChange={onMonoChange}
          pathPrefix="logo-mono"
        />
        <MiniUploadCard
          title="Favicon"
          hint="Icono del navegador (32×32)"
          businessId={businessId}
          value={faviconUrl}
          onChange={onFaviconChange}
          pathPrefix="favicon"
        />
      </div>
    </div>
  );
}

function MiniUploadCard({
  title,
  hint,
  businessId,
  value,
  onChange,
  pathPrefix,
}: {
  title: string;
  hint: string;
  businessId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  pathPrefix: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
      <header className="mb-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </p>
        <p className="text-xs text-zinc-600">{hint}</p>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <ImageUploader
          businessId={businessId}
          value={value}
          onChange={onChange}
          pathPrefix={pathPrefix}
          variant="avatar-circle"
          layout="stacked"
        />
      </div>
    </div>
  );
}

// ─── Extended palette (secondary / accent / semantic) ──────────────────
function PaletteExtended({ form }: { form: UseFormReturn<Values> }) {
  const brand: { name: keyof Values; label: string }[] = [
    { name: "secondary_color", label: "Secundario" },
  ];
  const semantic: { name: keyof Values; label: string }[] = [
    { name: "success_color", label: "Éxito" },
    { name: "warning_color", label: "Aviso" },
    { name: "destructive_color", label: "Error" },
  ];
  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <TabHeader
          title="Color secundario"
          description="Complementa al primario — se usa en superficies neutras y acentos del UI."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {brand.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <ColorInput
                      value={(field.value as string) ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        <TabHeader
          title="Colores semánticos"
          description="Se usan en mensajes de éxito, aviso y error."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {semantic.map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{f.label}</FormLabel>
                  <FormControl>
                    <ColorInput
                      value={(field.value as string) ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Background colors (per mode) ──────────────────────────────────────
function BackgroundColors({ form }: { form: UseFormReturn<Values> }) {
  const fields: { name: keyof Values; label: string; hint: string }[] = [
    {
      name: "background_color",
      label: "Fondo — modo claro",
      hint: "Se aplica cuando el modo por defecto es Claro.",
    },
    {
      name: "background_color_dark",
      label: "Fondo — modo oscuro",
      hint: "Se aplica cuando el modo por defecto es Oscuro.",
    },
  ];
  return (
    <div className="grid gap-4">
      <TabHeader
        title="Color de fondo"
        description="Un color por cada modo. El que se aplica depende del modo por defecto (abajo)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f.label}</FormLabel>
                <FormControl>
                  <ColorInput
                    value={(field.value as string) ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <p className="text-xs text-zinc-500">{f.hint}</p>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Typography ────────────────────────────────────────────────────────
function TypographyPicker({ form }: { form: UseFormReturn<Values> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="font_heading"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Títulos (display)</FormLabel>
            <FormControl>
              <FontSelect value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="font_body"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cuerpo de texto</FormLabel>
            <FormControl>
              <FontSelect value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function FontSelect({
  value,
  onChange,
}: {
  value: FontKey;
  onChange: (v: FontKey) => void;
}) {
  const selected = FONT_OPTIONS.find((o) => o.key === value) ?? FONT_OPTIONS[0]!;
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FontKey)}>
      <SelectTrigger className="h-11">
        <SelectValue>
          <span
            className="truncate text-base"
            style={{ fontFamily: selected.cssVar }}
          >
            {selected.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {FONT_OPTIONS.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            <span className="flex flex-col">
              <span
                className="text-base"
                style={{ fontFamily: o.cssVar }}
              >
                {o.label}
              </span>
              <span
                className="text-[0.65rem] text-zinc-500"
                style={{ fontFamily: o.cssVar }}
              >
                {o.sample}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Shape (radius + shadow) ───────────────────────────────────────────
function ShapePicker({ form }: { form: UseFormReturn<Values> }) {
  return (
    <div className="grid gap-5">
      <FormField
        control={form.control}
        name="radius_scale"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Radio de esquinas</FormLabel>
            <FormControl>
              <RadiusRadio value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="shadow_scale"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sombras</FormLabel>
            <FormControl>
              <ShadowRadio value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function PickerGrid({
  cols,
  children,
}: {
  cols: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  const gridCls =
    cols === 4
      ? "grid-cols-4"
      : cols === 3
        ? "grid-cols-3"
        : "grid-cols-2";
  return <div className={cn("grid gap-2", gridCls)}>{children}</div>;
}

function PickerCard({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border p-3 text-center transition",
        active
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900/10"
          : "border-zinc-200 bg-white hover:border-zinc-300",
      )}
    >
      {children}
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-700">
        {label}
      </span>
    </button>
  );
}

function RadiusRadio({
  value,
  onChange,
}: {
  value: RadiusScale;
  onChange: (v: RadiusScale) => void;
}) {
  const labels: Record<RadiusScale, string> = {
    sharp: "Duro",
    standard: "Estándar",
    soft: "Suave",
    pill: "Pastilla",
  };
  return (
    <PickerGrid cols={4}>
      {RADIUS_SCALE.map((k) => (
        <PickerCard
          key={k}
          active={value === k}
          label={labels[k]}
          onClick={() => onChange(k)}
        >
          <div
            className="h-8 w-12 bg-zinc-900"
            style={{ borderRadius: RADIUS_PX[k] }}
          />
        </PickerCard>
      ))}
    </PickerGrid>
  );
}

function ShadowRadio({
  value,
  onChange,
}: {
  value: ShadowScale;
  onChange: (v: ShadowScale) => void;
}) {
  const labels: Record<ShadowScale, string> = {
    flat: "Plano",
    subtle: "Sutil",
    elevated: "Elevado",
  };
  return (
    <PickerGrid cols={3}>
      {SHADOW_SCALE.map((k) => (
        <PickerCard
          key={k}
          active={value === k}
          label={labels[k]}
          onClick={() => onChange(k)}
        >
          {/* Off-white backdrop so subtle shadows are visible */}
          <div
            className="flex h-16 w-full items-center justify-center rounded-lg bg-zinc-50"
          >
            <div
              className="h-8 w-14 rounded-lg bg-white"
              style={{ boxShadow: SHADOW_VALUE[k] }}
            />
          </div>
        </PickerCard>
      ))}
    </PickerGrid>
  );
}

// ─── Icon stroke + style ──────────────────────────────────────────────
function IconStrokePicker({ form }: { form: UseFormReturn<Values> }) {
  return (
    <div className="grid gap-5">
      <FormField
        control={form.control}
        name="icon_stroke_width"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Peso de íconos</FormLabel>
            <FormControl>
              <StrokeRadio value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="icon_style"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estilo de líneas</FormLabel>
            <FormControl>
              <IconStyleRadio value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StrokeRadio({
  value,
  onChange,
}: {
  value: IconStroke;
  onChange: (v: IconStroke) => void;
}) {
  const labels: Record<IconStroke, string> = {
    thin: "Fino",
    regular: "Regular",
    medium: "Medio",
    bold: "Grueso",
  };
  return (
    <PickerGrid cols={4}>
      {ICON_STROKE_SCALE.map((k) => (
        <PickerCard
          key={k}
          active={value === k}
          label={labels[k]}
          onClick={() => onChange(k)}
        >
          <ShoppingBag
            className="size-6 text-zinc-700"
            style={{ strokeWidth: ICON_STROKE_VALUE[k] }}
          />
        </PickerCard>
      ))}
    </PickerGrid>
  );
}

function IconStyleRadio({
  value,
  onChange,
}: {
  value: IconStyle;
  onChange: (v: IconStyle) => void;
}) {
  const labels: Record<IconStyle, string> = {
    rounded: "Redondeado",
    sharp: "Angular",
  };
  return (
    <PickerGrid cols={2}>
      {ICON_STYLE_SCALE.map((k) => {
        const isRounded = k === "rounded";
        return (
          <PickerCard
            key={k}
            active={value === k}
            label={labels[k]}
            onClick={() => onChange(k)}
          >
            <ShoppingBag
              className="size-6 text-zinc-700"
              style={{
                strokeWidth: 2,
                strokeLinecap: isRounded ? "round" : "butt",
                strokeLinejoin: isRounded ? "round" : "miter",
              }}
            />
          </PickerCard>
        );
      })}
    </PickerGrid>
  );
}

// ─── Mode (light/dark default) ────────────────────────────────────────
function ModePicker({ form }: { form: UseFormReturn<Values> }) {
  const mode = form.watch("default_mode");
  const bgLight = form.watch("background_color");
  const bgDark = form.watch("background_color_dark");
  return (
    <FormField
      control={form.control}
      name="default_mode"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard
                mode="light"
                active={mode === "light"}
                bgValue={bgLight}
                onSelect={() => field.onChange("light" satisfies Mode)}
              />
              <ModeCard
                mode="dark"
                active={mode === "dark"}
                bgValue={bgDark}
                onSelect={() => field.onChange("dark" satisfies Mode)}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ModeCard({
  mode,
  active,
  bgValue,
  onSelect,
}: {
  mode: Mode;
  active: boolean;
  bgValue: string;
  onSelect: () => void;
}) {
  const isLight = mode === "light";
  const safe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(bgValue)
    ? bgValue
    : isLight
      ? "#FFFFFF"
      : "#0B0B0D";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition",
        active
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900/10"
          : "border-zinc-200 hover:border-zinc-300",
      )}
    >
      <div
        className="flex size-12 items-center justify-center rounded-xl"
        style={{
          background: safe,
          color: isLight ? "#18181B" : "#F4F4F5",
          boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.08)",
        }}
      >
        {isLight ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          {isLight ? "Claro" : "Oscuro"}
          {active ? (
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-50">
              Por defecto
            </span>
          ) : null}
        </p>
        <p className="text-xs text-zinc-500">
          {isLight ? "Fondo claro, texto oscuro" : "Fondo oscuro, texto claro"}
        </p>
      </div>
    </button>
  );
}
