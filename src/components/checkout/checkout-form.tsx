"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CartSummary } from "@/components/cart/cart-summary";
import { formatCurrency } from "@/lib/currency";
import type { DeliveryZone } from "@/lib/menu";
import { createOrder } from "@/lib/orders/create-order";
import { cartTotal, useCart } from "@/stores/cart";

const FormSchema = z
  .object({
    delivery_type: z.enum(["delivery", "pickup"]),
    delivery_address: z.string().optional(),
    delivery_zone_id: z.string().optional(),
    delivery_notes: z.string().max(500).optional(),
    customer_name: z
      .string()
      .min(1, "Ingresá tu nombre.")
      .max(100, "Demasiado largo."),
    customer_phone: z
      .string()
      .min(6, "Teléfono inválido.")
      .max(20, "Teléfono inválido."),
    customer_email: z
      .string()
      .max(200)
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "Email inválido.",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_type === "delivery") {
      if (!data.delivery_address?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresá tu dirección.",
          path: ["delivery_address"],
        });
      }
      if (!data.delivery_zone_id) {
        ctx.addIssue({
          code: "custom",
          message: "Elegí una zona.",
          path: ["delivery_zone_id"],
        });
      }
    }
  });

type FormValues = z.infer<typeof FormSchema>;

export function CheckoutForm({
  slug,
  zones,
}: {
  slug: string;
  zones: DeliveryZone[];
}) {
  const router = useRouter();
  const items = useCart(slug, (s) => s.items);
  const clearCart = useCart(slug, (s) => s.clear);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      delivery_type: "delivery",
      delivery_address: "",
      delivery_zone_id: "",
      delivery_notes: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
    },
  });

  const deliveryType = form.watch("delivery_type");
  const selectedZoneId = form.watch("delivery_zone_id");

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId),
    [zones, selectedZoneId],
  );

  const subtotalCents = cartTotal(items);
  const deliveryFeeCents =
    deliveryType === "delivery"
      ? (selectedZone?.delivery_fee_cents ?? null)
      : 0;
  const totalCents =
    subtotalCents + (typeof deliveryFeeCents === "number" ? deliveryFeeCents : 0);

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        business_slug: slug,
        delivery_type: values.delivery_type,
        customer_name: values.customer_name.trim(),
        customer_phone: values.customer_phone.trim(),
        customer_email: values.customer_email?.trim() || undefined,
        delivery_address: values.delivery_address?.trim() || undefined,
        delivery_zone_id: values.delivery_zone_id || undefined,
        delivery_notes: values.delivery_notes?.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          notes: i.notes,
          modifier_ids: i.modifiers.map((m) => m.modifier_id),
        })),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      clearCart();
      router.push(`/${slug}/confirmacion/${result.data.order_id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-20 text-center">
        Tu carrito está vacío.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 pb-28"
      >
        <h1 className="text-2xl font-extrabold">Checkout</h1>

        <FormField
          control={form.control}
          name="delivery_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Cómo lo recibís?</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="delivery-type-delivery"
                    className="bg-card flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 font-medium"
                  >
                    <RadioGroupItem
                      value="delivery"
                      id="delivery-type-delivery"
                    />
                    Delivery
                  </Label>
                  <Label
                    htmlFor="delivery-type-pickup"
                    className="bg-card flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 font-medium"
                  >
                    <RadioGroupItem
                      value="pickup"
                      id="delivery-type-pickup"
                    />
                    Retiro
                  </Label>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        {deliveryType === "delivery" && (
          <>
            <FormField
              control={form.control}
              name="delivery_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Av. Corrientes 1234"
                      autoComplete="street-address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_zone_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegí una zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name} · {formatCurrency(z.delivery_fee_cents)}
                            {z.estimated_minutes
                              ? ` · ${z.estimated_minutes}min`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencias (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Timbre 3, edificio rojo"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        <div className="space-y-4">
          <h2 className="font-bold">Contacto</h2>
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customer_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customer_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="tu@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <h2 className="font-bold">Pago</h2>
          <div className="bg-card rounded-lg border px-4 py-3 text-sm">
            Efectivo al recibir
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-bold">Resumen</h2>
          <CartSummary
            subtotalCents={subtotalCents}
            deliveryFeeCents={
              deliveryType === "pickup" ? 0 : deliveryFeeCents
            }
            deliveryFeeLabel="Elegí una zona"
            totalCents={totalCents}
          />
        </div>

        <div className="bg-background fixed inset-x-0 bottom-0 mx-auto max-w-md border-t px-4 py-3">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting
              ? "Enviando…"
              : `Confirmar pedido · ${formatCurrency(totalCents)}`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
