import { z } from "zod";

export const CreateOrderInput = z
  .object({
    business_slug: z.string().min(1),
    delivery_type: z.enum(["delivery", "pickup"]),
    customer_name: z.string().min(1).max(100),
    customer_phone: z.string().min(6).max(20),
    customer_email: z
      .string()
      .email("Email inválido.")
      .max(200)
      .optional(),
    delivery_address: z.string().max(200).optional(),
    delivery_zone_id: z.string().uuid().optional(),
    delivery_notes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().min(1).max(99),
          notes: z.string().max(200).optional(),
          modifier_ids: z.array(z.string().uuid()).default([]),
        }),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_type === "delivery") {
      if (!data.delivery_address) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresá una dirección de entrega.",
          path: ["delivery_address"],
        });
      }
      if (!data.delivery_zone_id) {
        ctx.addIssue({
          code: "custom",
          message: "Elegí una zona de delivery.",
          path: ["delivery_zone_id"],
        });
      }
    }
  });

export type CreateOrderInput = z.infer<typeof CreateOrderInput>;
