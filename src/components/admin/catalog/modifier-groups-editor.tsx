"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductInput } from "@/lib/catalog/schemas";

export function ModifierGroupsEditor() {
  const { control } = useFormContext<ProductInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "modifier_groups",
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Grupos de adicionales</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            append({
              name: "",
              min_selection: 0,
              max_selection: 1,
              is_required: false,
              sort_order: fields.length,
              modifiers: [],
            })
          }
        >
          <Plus className="size-3.5" /> Grupo
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-sm italic">
          Sin grupos. Agregá uno si el producto tiene variantes o extras.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="bg-card space-y-3 rounded-xl border p-4"
          >
            <div className="flex items-start gap-2">
              <FormField
                control={control}
                name={`modifier_groups.${idx}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Nombre del grupo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tamaño, Extras..." {...field} />
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
                aria-label="Eliminar grupo"
                className="mt-6"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={control}
                name={`modifier_groups.${idx}.min_selection`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mín.</FormLabel>
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
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`modifier_groups.${idx}.max_selection`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx.</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`modifier_groups.${idx}.is_required`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Obligatorio</FormLabel>
                    <FormControl>
                      <label className="flex h-9 items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <span className="text-sm">Sí</span>
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <ModifierList groupIdx={idx} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ModifierList({ groupIdx }: { groupIdx: number }) {
  const { control } = useFormContext<ProductInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `modifier_groups.${groupIdx}.modifiers`,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider">Opciones</Label>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() =>
            append({
              name: "",
              price_delta_cents: 0,
              is_available: true,
              sort_order: fields.length,
            })
          }
        >
          <Plus className="size-3" /> Opción
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-muted-foreground text-xs italic">
          Agregá al menos una opción.
        </p>
      )}
      {fields.map((field, mIdx) => (
        <div key={field.id} className="flex items-start gap-2">
          <FormField
            control={control}
            name={`modifier_groups.${groupIdx}.modifiers.${mIdx}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`modifier_groups.${groupIdx}.modifiers.${mIdx}.price_delta_cents`}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="+ $"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={() => remove(mIdx)}
            aria-label="Eliminar opción"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
