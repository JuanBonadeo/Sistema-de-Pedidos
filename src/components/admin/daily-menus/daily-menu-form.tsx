"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/admin/catalog/image-uploader";
import type { AdminDailyMenu } from "@/lib/admin/daily-menu-query";
import {
  createDailyMenu,
  updateDailyMenu,
} from "@/lib/daily-menus/daily-menu-actions";
import { DailyMenuInput } from "@/lib/daily-menus/schemas";

// Orden L..D para que la lectura sea natural (empezar por Lunes).
const DAY_OPTIONS: { dow: number; label: string }[] = [
  { dow: 1, label: "Lun" },
  { dow: 2, label: "Mar" },
  { dow: 3, label: "Mié" },
  { dow: 4, label: "Jue" },
  { dow: 5, label: "Vie" },
  { dow: 6, label: "Sáb" },
  { dow: 0, label: "Dom" },
];

export function DailyMenuForm({
  slug,
  businessId,
  menu,
}: {
  slug: string;
  businessId: string;
  menu?: AdminDailyMenu;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DailyMenuInput>({
    resolver: zodResolver(DailyMenuInput),
    defaultValues: menu
      ? {
          name: menu.name,
          slug: menu.slug,
          description: menu.description ?? undefined,
          price_cents: menu.price_cents / 100,
          image_url: menu.image_url,
          available_days: menu.available_days,
          is_active: menu.is_active,
          is_available: menu.is_available,
          sort_order: menu.sort_order,
          components: menu.components.map((c) => ({
            id: c.id,
            label: c.label,
            description: c.description ?? undefined,
          })),
        }
      : {
          name: "",
          slug: "",
          price_cents: 0,
          available_days: [1, 2, 3, 4, 5], // default L-V, típico menú ejecutivo
          is_active: true,
          is_available: true,
          sort_order: 0,
          components: [{ label: "" }],
        },
  });

  const onSubmit = async (values: DailyMenuInput) => {
    setSubmitting(true);
    try {
      // El input de precio está en unidades de $, persistimos en cents.
      const payload: DailyMenuInput = {
        ...values,
        price_cents: Math.round(values.price_cents * 100),
      };
      const result = menu
        ? await updateDailyMenu(slug, menu.id, payload)
        : await createDailyMenu(slug, payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(menu ? "Actualizado." : "Creado.");
      router.push(`/${slug}/admin/menu-del-dia`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen</FormLabel>
              <FormControl>
                <ImageUploader
                  businessId={businessId}
                  value={field.value ?? null}
                  onChange={(url) => field.onChange(url)}
                  pathPrefix="daily-menu"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Menú Ejecutivo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="menu-ejecutivo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Texto breve que ve el cliente al abrir el menú."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price_cents"
          render={({ field }) => (
            <FormItem className="max-w-[200px]">
              <FormLabel>Precio ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                Precio único del combo. No se suman adicionales.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="available_days"
          render={({ field }) => {
            const selected = new Set(field.value);
            const toggle = (dow: number) => {
              const next = new Set(selected);
              if (next.has(dow)) next.delete(dow);
              else next.add(dow);
              field.onChange([...next].sort((a, b) => a - b));
            };
            return (
              <FormItem>
                <FormLabel>Días disponibles</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((d) => {
                      const on = selected.has(d.dow);
                      return (
                        <button
                          key={d.dow}
                          type="button"
                          onClick={() => toggle(d.dow)}
                          className={
                            on
                              ? "rounded-full border border-primary bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground transition-colors"
                              : "border-border hover:bg-muted rounded-full border px-3 py-1 text-sm font-medium transition-colors"
                          }
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  El menú solo va a aparecer en el catálogo esos días.
                </p>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="is_available"
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
                    <span>Disponible ahora</span>
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
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
                    <span>Activo (publicado)</span>
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <ComponentsEditor />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : menu ? "Guardar" : "Crear"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ComponentsEditor() {
  const { control } = useFormContext<DailyMenuInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Componentes del menú</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Lo que incluye el combo. Ej: “Entrada: Empanadas (2 un.)”, “Principal:
            Milanesa con puré”, “Postre”, “Bebida”. Orden = orden de la lista.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ label: "" })}
        >
          <Plus className="size-3.5" /> Componente
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="bg-card space-y-2 rounded-xl border p-3"
          >
            <div className="flex items-start gap-2">
              <FormField
                control={control}
                name={`components.${idx}.label`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="Milanesa con puré"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => remove(idx)}
                aria-label="Eliminar componente"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <FormField
              control={control}
              name={`components.${idx}.description`}
              render={({ field }) => (
                <FormItem>
                  <Label className="text-muted-foreground text-[0.65rem] font-medium uppercase tracking-wider">
                    Detalle (opcional)
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="200g, con crema de papas"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
