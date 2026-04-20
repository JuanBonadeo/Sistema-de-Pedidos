"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
  // Origin resolved after mount to avoid SSR/CSR mismatch on the copy-url hint.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const form = useForm<Values>({
    // zod 4 + `.transform()` / `z.coerce` produce input ≠ output types which
    // the hookform resolver generics don't narrow cleanly. Cast to the
    // expected Resolver<Values> shape — runtime behavior is correct.
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
      // If the slug changed we need to navigate to the new URL, otherwise
      // the current page (/{oldSlug}/admin/configuracion) would 404 on
      // refresh since the record no longer matches that slug.
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

  // Live form values drive the preview. Watching these specific fields keeps
  // re-renders scoped to when branding actually changes.
  const logoUrl = form.watch("logo_url");
  const coverImageUrl = form.watch("cover_image_url");
  const nameValue = form.watch("name");
  const primaryValue = form.watch("primary_color");
  const primaryFgValue = form.watch("primary_foreground");

  return (
    <Form {...form}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
        {/* Identidad */}
        <section className="bg-card grid gap-5 rounded-2xl border p-5">
          <header>
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Identidad
            </h2>
          </header>

          <div>
            <label className="text-sm font-medium">Foto del local</label>
            <div className="mt-2">
              <ImageUploader
                businessId={businessId}
                value={form.watch("cover_image_url")}
                onChange={(url) =>
                  form.setValue("cover_image_url", url, { shouldDirty: true })
                }
                pathPrefix="cover"
                variant="cover"
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Banner grande del menú público. Ideal 16:9, horizontal.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Logo</label>
            <div className="mt-2">
              <ImageUploader
                businessId={businessId}
                value={logoUrl}
                onChange={(url) =>
                  form.setValue("logo_url", url, { shouldDirty: true })
                }
                pathPrefix="logo"
                variant="avatar-circle"
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Marca del negocio. Aparece al lado del nombre en el menú y en el
              panel.
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del negocio</FormLabel>
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
                  <div className="flex items-baseline justify-between gap-2">
                    <FormLabel>Slug (URL)</FormLabel>
                    {canSuggest && (
                      <button
                        type="button"
                        onClick={() =>
                          field.onChange(suggested, { shouldDirty: true })
                        }
                        className="text-primary text-xs font-medium underline-offset-2 hover:underline"
                      >
                        Usar el nombre → {suggested}
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <Input placeholder="pizzanapoli" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    URL pública: <code>/{field.value || "…"}</code>
                  </p>
                  {changed && (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[0.7rem] leading-snug text-amber-900">
                      ⚠️ Al cambiar el slug, la URL vieja deja de funcionar.
                      Links compartidos, bookmarks de clientes y QRs impresos
                      con <code>/{initialSlug}</code> van a dar 404.
                    </p>
                  )}
                </FormItem>
              );
            }}
          />
        </section>

        {/* Contacto */}
        <section className="bg-card grid gap-5 rounded-2xl border p-5">
          <header>
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Contacto
            </h2>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
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
                    <Input
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
                  <Input
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                <p className="text-muted-foreground text-xs">
                  Formato IANA, ej: <code>America/Argentina/Buenos_Aires</code>.
                </p>
              </FormItem>
            )}
          />
        </section>

        {/* Envío */}
        <section className="bg-card grid gap-5 rounded-2xl border p-5">
          <header>
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Envío
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Cobro único de envío para pedidos a domicilio. Retiro en el local
              es siempre gratis.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="delivery_fee_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo de envío ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="1500"
                      {...field}
                      value={field.value ?? 0}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    En pesos. Usá 0 para envío gratis.
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="min_order_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pedido mínimo ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      {...field}
                      value={field.value ?? 0}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    En pesos. 0 = sin mínimo.
                  </p>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estimated_delivery_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiempo estimado de envío (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="30"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-muted-foreground text-xs">
                  Opcional. Se muestra en el menú público junto al costo de
                  envío.
                </p>
              </FormItem>
            )}
          />
        </section>

        {/* Mercado Pago */}
        <section className="bg-card grid gap-5 rounded-2xl border p-5">
          <header>
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Mercado Pago
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Conectá tu cuenta para aceptar pagos online. Las credenciales
              salen del panel de desarrolladores de MP (crear aplicación →
              Credenciales).
            </p>
          </header>

          <FormField
            control={form.control}
            name="mp_accepts_payments"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm font-medium">
                      Aceptar Mercado Pago en el checkout
                    </span>
                  </label>
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Requiere completar los dos campos de abajo.
                </p>
              </FormItem>
            )}
          />

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
                <p className="text-muted-foreground text-xs">
                  Secreto. Se usa server-side para crear el pago en tu cuenta.
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
              </FormItem>
            )}
          />

          <details className="group">
            <summary className="text-muted-foreground cursor-pointer text-xs font-medium hover:text-foreground">
              Avanzado · Webhook (opcional)
            </summary>
            <div className="mt-3 space-y-3 rounded-md border border-dashed p-3">
              <p className="text-muted-foreground text-xs">
                Solo hace falta en producción. Mientras el cliente vuelva al
                menú después de pagar, el pedido se actualiza automáticamente.
                Si querés cubrir casos donde cierran la pestaña, configurá el
                webhook en MP y pegá acá la clave secreta.
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
                    <p className="text-muted-foreground text-xs">
                      URL a registrar:
                    </p>
                    <code className="bg-muted block break-all rounded p-2 text-[0.7rem]">
                      {origin}/api/mp/webhook?business_id={businessId}
                    </code>
                  </FormItem>
                )}
              />
            </div>
          </details>
        </section>

        {/* Marca / tema */}
        <section className="bg-card grid gap-5 rounded-2xl border p-5">
          <header>
            <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Marca
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Los colores afectan botones, enlaces y acentos del menú público.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color primario</FormLabel>
                  <FormControl>
                    <ColorInput value={field.value} onChange={field.onChange} />
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
                    <ColorInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    Usualmente blanco (#FFFFFF) o negro.
                  </p>
                </FormItem>
              )}
            />
          </div>

        </section>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset(initial)}
            disabled={submitting || !form.formState.isDirty}
          >
            Descartar
          </Button>
          <Button
            type="submit"
            disabled={submitting || !form.formState.isDirty}
          >
            {submitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <MenuPreview
          businessName={nameValue}
          logoUrl={logoUrl}
          coverImageUrl={coverImageUrl}
          primary={primaryValue}
          primaryForeground={primaryFgValue}
          products={sampleProducts}
        />
      </aside>
      </div>
    </Form>
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
      <input
        type="color"
        value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-10 w-12 cursor-pointer rounded-md border"
        aria-label="Picker de color"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono uppercase"
        placeholder="#E11D48"
      />
    </div>
  );
}

