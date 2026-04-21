"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Hash,
  Mail,
  MapPin,
  Palette,
  Phone,
  Sparkles,
  Store,
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
import { ImageUploader } from "@/components/admin/catalog/image-uploader";
import {
  MenuPreview,
  type PreviewProduct,
} from "@/components/admin/settings/menu-preview";
import { updateBusinessSettings } from "@/lib/admin/business-actions";
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
  primary_color: HexColor,
  primary_foreground: HexColor,
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
  const coverImageUrl = form.watch("cover_image_url");
  const nameValue = form.watch("name");
  const primaryValue = form.watch("primary_color");
  const primaryFgValue = form.watch("primary_foreground");
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

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200/70" />
              <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <Palette className="size-3" />
                Colores de marca
              </span>
              <span className="h-px flex-1 bg-zinc-200/70" />
            </div>

            <p className="-mt-2 text-xs text-zinc-500">
              Se aplican a botones, enlaces y acentos del menú público y el
              panel del negocio.
            </p>

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
                      <p className="text-xs text-zinc-500">
                        Usualmente blanco o negro.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
              <BrandPreview
                primary={primaryValue}
                foreground={primaryFgValue}
              />
            </div>
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
            <header className="flex items-center justify-between">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Preview · menú público
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                En vivo
              </span>
            </header>
            <div className="mt-4">
              <MenuPreview
                businessName={nameValue}
                logoUrl={logoUrl}
                coverImageUrl={coverImageUrl}
                primary={primaryValue}
                primaryForeground={primaryFgValue}
                products={sampleProducts}
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
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-10 cursor-pointer rounded-xl border-0 bg-transparent ring-1 ring-zinc-200/70"
          aria-label="Picker de color"
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono uppercase"
        placeholder="#E11D48"
      />
    </div>
  );
}
