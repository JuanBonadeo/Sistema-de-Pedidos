"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/catalog/image-uploader";
import { ModifierGroupsEditor } from "@/components/admin/catalog/modifier-groups-editor";
import type { AdminCategory, AdminProduct } from "@/lib/admin/catalog-query";
import {
  createProduct,
  updateProduct,
} from "@/lib/catalog/product-actions";
import { ProductInput } from "@/lib/catalog/schemas";

export function ProductForm({
  slug,
  businessId,
  categories,
  product,
}: {
  slug: string;
  businessId: string;
  categories: AdminCategory[];
  product?: AdminProduct;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProductInput>({
    resolver: zodResolver(ProductInput),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description ?? undefined,
          price_cents: product.price_cents / 100,
          image_url: product.image_url,
          category_id: product.category_id,
          is_available: product.is_available,
          is_active: product.is_active,
          sort_order: product.sort_order,
          modifier_groups: product.modifier_groups.map((g) => ({
            id: g.id,
            name: g.name,
            min_selection: g.min_selection,
            max_selection: g.max_selection,
            is_required: g.is_required,
            sort_order: g.sort_order,
            modifiers: g.modifiers.map((m) => ({
              id: m.id,
              name: m.name,
              price_delta_cents: m.price_delta_cents / 100,
              is_available: m.is_available,
              sort_order: m.sort_order,
            })),
          })),
        }
      : {
          name: "",
          slug: "",
          price_cents: 0,
          is_available: true,
          is_active: true,
          sort_order: 0,
          modifier_groups: [],
        },
  });

  const onSubmit = async (values: ProductInput) => {
    setSubmitting(true);
    try {
      const payload: ProductInput = {
        ...values,
        price_cents: Math.round(values.price_cents * 100),
        modifier_groups: values.modifier_groups.map((g) => ({
          ...g,
          modifiers: g.modifiers.map((m) => ({
            ...m,
            price_delta_cents: Math.round(m.price_delta_cents * 100),
          })),
        })),
      };
      const result = product
        ? await updateProduct(slug, product.id, payload)
        : await createProduct(slug, payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(product ? "Actualizado." : "Creado.");
      router.push(`/${slug}/admin/catalogo`);
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
                  <Input {...field} />
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
                  <Input placeholder="muzzarella" {...field} />
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="price_cents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio base ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Sin adicionales. Los grupos de adicionales se suman sobre
                  este precio.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || null)}
                  >
                    <SelectTrigger>
                      {/*
                        Base UI's SelectValue shows the raw value by default
                        (a UUID in our case). We resolve id → name via the
                        children render function so the trigger shows "Pizzas"
                        instead of "ab23-..."; falls back to null so the
                        placeholder renders for empty/unknown selections.
                      */}
                      <SelectValue placeholder="Elegí">
                        {(value) => {
                          if (!value) return null;
                          return (
                            categories.find((c) => c.id === value)?.name ??
                            null
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

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
                    <span>Activo (visible en el menú)</span>
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <ModifierGroupsEditor />

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : product ? "Guardar" : "Crear"}
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
