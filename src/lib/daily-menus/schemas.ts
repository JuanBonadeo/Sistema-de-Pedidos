import { z } from "zod";

export const DailyMenuComponentInput = z.object({
  // id presente cuando se está editando un componente que ya existe.
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Requerido.").max(120),
  description: z.string().max(280).optional().nullable(),
});
export type DailyMenuComponentInput = z.infer<typeof DailyMenuComponentInput>;

export const DailyMenuInput = z.object({
  name: z.string().min(1, "Requerido.").max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Sólo minúsculas, números y guiones."),
  description: z.string().max(500).optional().nullable(),
  price_cents: z.number().int().min(0),
  image_url: z.string().url().nullable().optional(),
  // Al menos 1 día — un menú sin días no tiene sentido. Validación de rango
  // 0..6 duplica el check de DB, pero falla más temprano (en el form).
  available_days: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Elegí al menos un día."),
  is_active: z.boolean(),
  is_available: z.boolean(),
  sort_order: z.number().int().min(0),
  components: z
    .array(DailyMenuComponentInput)
    .min(1, "Agregá al menos un componente."),
});
export type DailyMenuInput = z.infer<typeof DailyMenuInput>;
