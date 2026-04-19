"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color inválido.");

const Schema = z.object({
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
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
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

